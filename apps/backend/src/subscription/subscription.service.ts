import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { Entitlement } from './entities/entitlement.entity';
import Stripe from 'stripe';
import { Auth, google } from 'googleapis';

type ReceiptPlatform = 'ios' | 'android';

type PurchasePayload = {
  productId: string;
  orderId?: string;
  purchaseToken?: string;
  transactionId?: string;
  purchaseState?: number;
  purchaseTime?: number;
  quantity?: number;
  acknowledged?: boolean;
  receipt?: string | null;
  transactionReceipt?: string | null;
};

type VerifyReceiptRequest = {
  userId: string;
  platform: ReceiptPlatform;
  purchase: PurchasePayload;
};

type VerificationResult = {
  expiresAt: Date;
  externalId?: string;
  status: 'active' | 'expired' | 'cancelled';
};

const DEFAULT_SUBSCRIPTION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class SubscriptionService {
  private stripe: Stripe;
  private googleAuth?: Auth.GoogleAuth;

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

  async verifyReceipt({ userId, platform, purchase }: VerifyReceiptRequest): Promise<Subscription> {
    if (!purchase?.productId) {
      throw new BadRequestException('Purchase payload missing productId');
    }

    let verification: VerificationResult | null = null;

    if (platform === 'ios') {
      verification = await this.verifyIOSReceipt(purchase);
    } else if (platform === 'android') {
      verification = await this.verifyAndroidReceipt(purchase);
    }

    if (!verification) {
      throw new BadRequestException('Invalid platform');
    }

    const subscription = await this.upsertSubscription({
      userId,
      platform,
      externalId: verification.externalId ?? purchase.transactionId ?? purchase.orderId ?? purchase.purchaseToken ?? purchase.productId,
      expiresAt: verification.expiresAt,
      status: verification.status,
    });

    await this.updateEntitlements(userId, verification.expiresAt, verification.status);

    return subscription;
  }

  private async verifyIOSReceipt(purchase: PurchasePayload): Promise<VerificationResult> {
    const receiptData = purchase.receipt || purchase.transactionReceipt;
    const sharedSecret = process.env.APPLE_SHARED_SECRET;

    if (!receiptData || !sharedSecret) {
      if (!sharedSecret) {
        console.warn('[Subscription] APPLE_SHARED_SECRET not set; skipping Apple receipt validation.');
      }
      return {
        expiresAt: new Date(Date.now() + DEFAULT_SUBSCRIPTION_DURATION_MS),
        externalId: purchase.transactionId ?? purchase.orderId,
        status: 'active',
      };
    }

    const verifyAgainst = async (url: string) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'receipt-data': receiptData,
          password: sharedSecret,
          'exclude-old-transactions': true,
        }),
      });
      return response.json() as Promise<any>;
    };

    let result = await verifyAgainst('https://buy.itunes.apple.com/verifyReceipt');
    if (result?.status === 21007) {
      result = await verifyAgainst('https://sandbox.itunes.apple.com/verifyReceipt');
    }

    if (!result || result.status !== 0) {
      throw new Error(`Apple receipt validation failed (status ${result?.status ?? 'unknown'})`);
    }

    const items: any[] = result.latest_receipt_info || result.receipt?.in_app || [];
    const relevant = purchase.productId ? items.filter(item => item.product_id === purchase.productId) : items;
    const latest = relevant.sort((a, b) => Number(a.expires_date_ms || 0) - Number(b.expires_date_ms || 0)).pop();

    const expiresMs = Number(latest?.expires_date_ms ?? latest?.expires_date) || Date.now() + DEFAULT_SUBSCRIPTION_DURATION_MS;
    const status: 'active' | 'expired' = expiresMs > Date.now() ? 'active' : 'expired';

    return {
      expiresAt: new Date(expiresMs),
      externalId: latest?.original_transaction_id ?? latest?.transaction_id ?? purchase.transactionId ?? purchase.orderId,
      status,
    };
  }

  private getGoogleCredentials(): Auth.Credentials | undefined {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT;
    if (!raw) {
      return undefined;
    }

    try {
      const json = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf-8');
      return JSON.parse(json);
    } catch (error) {
      console.warn('[Subscription] Failed to parse Google service account JSON');
      return undefined;
    }
  }

  private buildGoogleAuth(): Auth.GoogleAuth {
    return new google.auth.GoogleAuth({
      credentials: this.getGoogleCredentials(),
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });
  }

  private async verifyAndroidReceipt(purchase: PurchasePayload): Promise<VerificationResult> {
    const packageName = process.env.ANDROID_PACKAGE_NAME;
    if (!purchase.purchaseToken || !packageName) {
      if (!purchase.purchaseToken) {
        console.warn('[Subscription] Missing purchaseToken; granting temporary entitlement without Google validation.');
      }
      if (!packageName) {
        console.warn('[Subscription] ANDROID_PACKAGE_NAME not set; skipping Google Play validation.');
      }
      return {
        expiresAt: new Date(Date.now() + DEFAULT_SUBSCRIPTION_DURATION_MS),
        externalId: purchase.orderId ?? purchase.purchaseToken ?? purchase.transactionId ?? purchase.productId,
        status: 'active',
      };
    }

    try {
      const auth = this.googleAuth ?? this.buildGoogleAuth();
      this.googleAuth = auth;
      const client = await auth.getClient();
      const androidPublisher = google.androidpublisher({ version: 'v3', auth: client });
      const { data } = await androidPublisher.purchases.subscriptionsv2.get({
        packageName,
        token: purchase.purchaseToken,
      });

      const lineItem = data?.lineItems?.[0] as any;
      const expiry = lineItem?.expiryTime ?? lineItem?.expiryTimeMillis;
      const expiresMs = expiry ? Number(expiry) : Date.now() + DEFAULT_SUBSCRIPTION_DURATION_MS;
      const status: 'active' | 'expired' = expiresMs > Date.now() ? 'active' : 'expired';

      return {
        expiresAt: new Date(expiresMs),
        externalId: data?.subscriptionId ?? purchase.orderId ?? purchase.purchaseToken ?? purchase.transactionId,
        status,
      };
    } catch (error) {
      console.error('[Subscription] Android receipt validation failed', error);
      throw new Error('Android receipt validation failed');
    }
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
    await this.updateEntitlements(userId, subscription.expiresAt, subscription.status);
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const dbSubscription = await this.subscriptionRepository.findOne({
      where: { externalId: subscription.id },
    });

    if (dbSubscription) {
      dbSubscription.status = subscription.status === 'active' ? 'active' : 'expired';
      await this.subscriptionRepository.save(dbSubscription);
      await this.updateEntitlements(dbSubscription.userId, dbSubscription.expiresAt, dbSubscription.status);
    }
  }

  private async upsertSubscription(params: {
    userId: string;
    platform: ReceiptPlatform | 'stripe';
    externalId?: string;
    expiresAt: Date;
    status: 'active' | 'expired' | 'cancelled';
  }): Promise<Subscription> {
    const { userId, platform, externalId, expiresAt, status } = params;
    const existing = externalId
      ? await this.subscriptionRepository.findOne({
          where: { userId, platform, externalId },
        })
      : await this.subscriptionRepository.findOne({
          where: { userId, platform },
        });

    if (existing) {
      existing.expiresAt = expiresAt;
      existing.status = status;
      existing.externalId = externalId;
      return this.subscriptionRepository.save(existing);
    }

    const subscription = this.subscriptionRepository.create({
      userId,
      platform,
      status,
      externalId,
      expiresAt,
    });

    return this.subscriptionRepository.save(subscription);
  }

  private async updateEntitlements(
    userId: string,
    expiresAt?: Date,
    status?: Subscription['status'],
  ): Promise<void> {
    const currentEntitlement = await this.entitlementRepository.findOne({
      where: { userId, feature: 'creator_mode' },
      order: { createdAt: 'DESC' },
    });

    let effectiveExpiry = expiresAt;

    if (!effectiveExpiry) {
      const activeSubscription = await this.subscriptionRepository.findOne({
        where: { userId, status: 'active' },
        order: { expiresAt: 'DESC' },
      });
      if (!activeSubscription) {
        return;
      }
      effectiveExpiry = activeSubscription.expiresAt;
    }

    if (status && status !== 'active' && effectiveExpiry <= new Date()) {
      if (currentEntitlement) {
        currentEntitlement.expiresAt = effectiveExpiry;
        await this.entitlementRepository.save(currentEntitlement);
      }
      return;
    }

    if (currentEntitlement) {
      currentEntitlement.expiresAt = effectiveExpiry;
      await this.entitlementRepository.save(currentEntitlement);
    } else {
      const entitlement = this.entitlementRepository.create({
        userId,
        feature: 'creator_mode',
        expiresAt: effectiveExpiry,
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
