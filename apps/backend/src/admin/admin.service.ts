import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Between } from 'typeorm';
import { Subscription } from '../subscription/entities/subscription.entity';
import { Entitlement } from '../subscription/entities/entitlement.entity';
import { supabase } from '../config/supabase';

type OnboardingSummary = {
  total: number;
  completed: number;
  recent: Array<{ user_id?: string; is_completed?: boolean; completed_at?: string | null; current_screen?: string | null }>;
};

type SubscriptionEventsSummary = {
  total: number;
  recent: any[];
};

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Entitlement)
    private readonly entitlementRepository: Repository<Entitlement>,
  ) {}

  async getSubscriptionStats() {
    const now = new Date();

    const windowEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [activeCount, totalCount, expiringSoon, recentSubscriptions, entitlements] = await Promise.all([
      this.subscriptionRepository.count({
        where: {
          status: 'active',
          expiresAt: MoreThan(now),
        },
      }),
      this.subscriptionRepository.count(),
      this.subscriptionRepository.count({
        where: {
          status: 'active',
          expiresAt: Between(now, windowEnd),
        },
      }),
      this.subscriptionRepository.find({
        order: { createdAt: 'DESC' },
        take: 20,
      }),
      this.entitlementRepository.find({
        order: { createdAt: 'DESC' },
        take: 20,
      }),
    ]);

    return {
      activeCount,
      totalCount,
      expiringSoon,
      recentSubscriptions,
      entitlements,
    };
  }

  private async getOnboardingSummary(): Promise<OnboardingSummary> {
    try {
      const [{ count: total = 0 } = {}, recentResult] = await Promise.all([
        supabase.from('onboarding_progress').select('*', { count: 'exact', head: true }),
        supabase
          .from('onboarding_progress')
          .select('user_id,is_completed,completed_at,current_screen')
          .order('updated_at', { ascending: false })
          .limit(25),
      ]);

      const completed = recentResult.data?.filter(item => item.is_completed).length ?? 0;

      return {
        total,
        completed,
        recent: recentResult.data ?? [],
      };
    } catch (error) {
      console.warn('[Admin] Failed to load onboarding summary', error);
      return { total: 0, completed: 0, recent: [] };
    }
  }

  private async getSubscriptionEventsSummary(): Promise<SubscriptionEventsSummary> {
    try {
      const [{ count: total = 0 } = {}, recentResult] = await Promise.all([
        supabase.from('subscription_events').select('*', { count: 'exact', head: true }),
        supabase
          .from('subscription_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(25),
      ]);

      return {
        total,
        recent: recentResult.data ?? [],
      };
    } catch (error) {
      console.warn('[Admin] Failed to load subscription events', error);
      return { total: 0, recent: [] };
    }
  }

  async getDashboardData() {
    const [subscriptions, onboarding, subscriptionEvents] = await Promise.all([
      this.getSubscriptionStats(),
      this.getOnboardingSummary(),
      this.getSubscriptionEventsSummary(),
    ]);

    return {
      subscriptions,
      onboarding,
      subscriptionEvents,
    };
  }
}
