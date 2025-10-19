import { Platform } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { getAccessToken } from './supabase';
import { CONFIG } from '../config/environment';

export class SubscriptionService {
  static async initialize(userId: string) {
    const apiKey = Platform.OS === 'ios' ? CONFIG.REVENUECAT_API_KEY_IOS : CONFIG.REVENUECAT_API_KEY_ANDROID;
    await Purchases.configure({ apiKey, appUserID: userId });
  }

  /**
   * Get available packages
   */
  static async getOfferings(): Promise<PurchasesPackage[]> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current?.availablePackages || [];
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return [];
    }
  }

  /**
   * Purchase subscription
   */
  static async purchase(pkg: PurchasesPackage): Promise<boolean> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      
      // Verify with backend
      await this.verifyPurchase(customerInfo);
      
      return customerInfo.entitlements.active['creator_mode'] !== undefined;
    } catch (error) {
      console.error('Purchase failed:', error);
      return false;
    }
  }

  /**
   * Restore purchases
   */
  static async restore(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      
      // Verify with backend
      await this.verifyPurchase(customerInfo);
      
      return customerInfo.entitlements.active['creator_mode'] !== undefined;
    } catch (error) {
      console.error('Restore failed:', error);
      return false;
    }
  }

  /**
   * Check subscription status
   */
  static async checkStatus(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo.entitlements.active['creator_mode'] !== undefined;
    } catch (error) {
      console.error('Status check failed:', error);
      return false;
    }
  }

  /**
   * Verify purchase with backend
   */
  private static async verifyPurchase(customerInfo: any): Promise<void> {
    try {
      const token = await getAccessToken();
      const response = await fetch(`${CONFIG.API_URL}/api/receipt/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          platform: Platform.OS,
          customerInfo,
        }),
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }
    } catch (error) {
      console.error('Backend verification failed:', error);
    }
  }
}
