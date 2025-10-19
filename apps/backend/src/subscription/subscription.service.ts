import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { Entitlement } from './entities/entitlement.entity';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Entitlement)
    private entitlementRepository: Repository<Entitlement>,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16',
    });
  }

  async verifyIOSReceipt(userId: string, receiptData: any): Promise<Subscription> {
    // In production, verify with Apple's servers
    // For now, create a mock subscription
    const subscription = this.subscriptionRepository.create({
      userId,
      platform: 'ios',
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await this.subscriptionRepository.save(subscription);
    await this.updateEntitlements(userId);

    return subscription;
  }

  async verifyAndroidReceipt(userId: string, receiptData: any): Promise<Subscription> {
    // In production, verify with Google Play
    const subscription = this.subscriptionRepository.create({
      userId,
      platform: 'android',
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await this.subscriptionRepository.save(subscription);
    await this.updateEntitlements(userId);

    return subscription;
  }

  async createStripeCheckout(userId: string, email: string): Promise<string> {
    const session = await this.stripe.checkout.sessions.create({
      customer_email: email,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
      },
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    return session.url!;
  }

  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
    }
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    if (!userId) return;

    const subscription = this.subscriptionRepository.create({
      userId,
      platform: 'stripe',
      status: 'active',
      externalId: session.subscription as string,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await this.subscriptionRepository.save(subscription);
    await this.updateEntitlements(userId);
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const dbSubscription = await this.subscriptionRepository.findOne({
      where: { externalId: subscription.id },
    });

    if (dbSubscription) {
      dbSubscription.status = subscription.status === 'active' ? 'active' : 'expired';
      await this.subscriptionRepository.save(dbSubscription);
      await this.updateEntitlements(dbSubscription.userId);
    }
  }

  private async updateEntitlements(userId: string): Promise<void> {
    const activeSubscription = await this.subscriptionRepository.findOne({
      where: { userId, status: 'active' },
    });

    if (activeSubscription) {
      const entitlement = this.entitlementRepository.create({
        userId,
        feature: 'creator_mode',
        expiresAt: activeSubscription.expiresAt,
      });

      await this.entitlementRepository.save(entitlement);
    }
  }

  async getEntitlement(userId: string): Promise<Entitlement | null> {
    return this.entitlementRepository.findOne({
      where: { userId, feature: 'creator_mode' },
      order: { createdAt: 'DESC' },
    });
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    const entitlement = await this.getEntitlement(userId);
    return entitlement ? new Date(entitlement.expiresAt) > new Date() : false;
  }
}
