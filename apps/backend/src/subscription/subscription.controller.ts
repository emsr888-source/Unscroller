import { Controller, Post, Get, Body, UseGuards, Req, Headers, RawBodyRequest } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import Stripe from 'stripe';

@Controller('api')
export class SubscriptionController {
  private stripe: Stripe;

  constructor(private subscriptionService: SubscriptionService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16',
    });
  }

  @Post('receipt/verify')
  @UseGuards(JwtAuthGuard)
  async verifyReceipt(@Req() req, @Body() body: any) {
    const userId = req.user.id;
    const { platform, customerInfo } = body;

    if (platform === 'ios') {
      const subscription = await this.subscriptionService.verifyIOSReceipt(userId, customerInfo);
      return { success: true, subscription };
    } else if (platform === 'android') {
      const subscription = await this.subscriptionService.verifyAndroidReceipt(userId, customerInfo);
      return { success: true, subscription };
    }

    return { success: false, error: 'Invalid platform' };
  }

  @Post('subscription/checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckout(@Req() req) {
    const userId = req.user.id;
    const email = req.user.email;

    const url = await this.subscriptionService.createStripeCheckout(userId, email);
    return { url };
  }

  @Get('entitlement')
  @UseGuards(JwtAuthGuard)
  async getEntitlement(@Req() req) {
    const userId = req.user.id;
    const hasSubscription = await this.subscriptionService.hasActiveSubscription(userId);
    const entitlement = await this.subscriptionService.getEntitlement(userId);

    return {
      hasSubscription,
      entitlement,
    };
  }

  @Post('webhooks/stripe')
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    try {
      // Verify webhook signature
      const event = this.stripe.webhooks.constructEvent(
        req.rawBody!,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );

      // Handle the verified event
      await this.subscriptionService.handleStripeWebhook(event);
      return { received: true };
    } catch (err) {
      // Signature verification failed
      console.error('⚠️ Stripe webhook signature verification failed:', err.message);
      throw new Error(`Webhook Error: ${err.message}`);
    }
  }
}
