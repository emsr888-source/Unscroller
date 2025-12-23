import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { supabase } from '../config/supabase';
import { User } from '../auth/entities/user.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { Entitlement } from '../subscription/entities/entitlement.entity';

interface OrCondition {
  column: string;
  operator: 'eq';
}

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Entitlement)
    private readonly entitlementRepository: Repository<Entitlement>,
  ) {}

  async deleteAccount(user: User): Promise<void> {
    if (!user?.supabaseId) {
      this.logger.warn('Attempted to delete account without a Supabase ID');
      return;
    }

    const supabaseId = user.supabaseId;

    await this.deleteSupabaseUserData(supabaseId);

    try {
      await this.entitlementRepository.delete({ userId: user.id });
      await this.subscriptionRepository.delete({ userId: user.id });
      await this.userRepository.delete({ id: user.id });
    } catch (error) {
      this.logger.error(`Failed to delete relational data for user ${user.id}`, error as Error);
    }

    try {
      await supabase.auth.admin.deleteUser(supabaseId);
    } catch (error) {
      this.logger.error(`Failed to delete Supabase auth user ${supabaseId}`, error as Error);
    }
  }

  private async deleteSupabaseUserData(supabaseId: string): Promise<void> {
    await this.deleteCommunityData(supabaseId);

    const simpleUserTables = [
      'journal_entries',
      'todos',
      'calendar_events',
      'meditation_sessions',
      'user_resource_progress',
      'user_goals',
      'user_challenges',
      'user_achievements',
      'user_xp',
      'subscription_events',
      'onboarding_progress',
      'quiz_responses',
      'user_profiles',
      'symptom_assessments',
      'referral_sources',
      'app_ratings',
      'custom_plans',
      'user_streaks',
      'onboarding_analytics',
      'screen_time_shields',
    ];

    for (const table of simpleUserTables) {
      await this.deleteByUserId(table, supabaseId);
    }

    await this.deleteWithOrCondition('user_follows', supabaseId, [
      { column: 'follower_id', operator: 'eq' },
      { column: 'following_id', operator: 'eq' },
    ]);

    await this.deleteWithOrCondition('direct_messages', supabaseId, [
      { column: 'sender_id', operator: 'eq' },
      { column: 'receiver_id', operator: 'eq' },
    ]);
  }

  private async deleteCommunityData(supabaseId: string): Promise<void> {
    const { data: userPosts, error: postsError } = await supabase
      .from('community_posts')
      .select('id')
      .eq('user_id', supabaseId);

    if (postsError) {
      this.logger.warn(`Failed to fetch community posts for ${supabaseId}: ${postsError.message}`);
    }

    const postIds = userPosts?.map(post => post.id) ?? [];

    if (postIds.length) {
      await this.deleteByColumnValues('post_likes', 'post_id', postIds);
      await this.deleteByColumnValues('post_comments', 'post_id', postIds);
    }

    await this.deleteByUserId('post_likes', supabaseId);
    await this.deleteByUserId('post_comments', supabaseId);
    await this.deleteByUserId('community_posts', supabaseId);
  }

  private async deleteByUserId(table: string, supabaseId: string): Promise<void> {
    const { error } = await supabase.from(table).delete().eq('user_id', supabaseId);
    if (error) {
      this.logger.warn(`Failed to delete from ${table} for user ${supabaseId}: ${error.message}`);
    }
  }

  private async deleteWithOrCondition(table: string, supabaseId: string, conditions: OrCondition[]): Promise<void> {
    const orFilters = conditions.map(condition => `${condition.column}.${condition.operator}.${supabaseId}`).join(',');
    const { error } = await supabase.from(table).delete().or(orFilters);
    if (error) {
      this.logger.warn(`Failed to delete from ${table} for user ${supabaseId}: ${error.message}`);
    }
  }

  private async deleteByColumnValues(table: string, column: string, values: string[]): Promise<void> {
    const { error } = await supabase.from(table).delete().in(column, values);
    if (error) {
      this.logger.warn(`Failed to delete from ${table} for ${column} in [${values.join(', ')}]: ${error.message}`);
    }
  }
}
