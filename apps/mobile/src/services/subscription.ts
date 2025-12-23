import { Platform } from 'react-native';
import * as InAppPurchases from '@/lib/inAppPurchasesStub';

type PurchaseListenerResult = {
  responseCode: InAppPurchases.IAPResponseCode;
  results?: InAppPurchases.Purchase[];
  errorCode?: InAppPurchases.IAPErrorCode;
};
import { CONFIG } from '../config/environment';
import { getAccessToken, isSupabaseConfigured } from './supabase';

export type SubscriptionPlanId = 'annual' | 'monthly';

export type SubscriptionProduct = InAppPurchases.Product;

type PendingPurchase = {
  resolve: (purchase: InAppPurchases.Purchase) => void;
  reject: (error: Error) => void;
};

const PLAN_PRODUCT_IDS: Record<SubscriptionPlanId, { ios?: string; android?: string }> = {
  annual: {
    ios: CONFIG.IOS_IAP_ANNUAL_PRODUCT_ID || undefined,
    android: CONFIG.ANDROID_IAP_ANNUAL_PRODUCT_ID || undefined,
  },
  monthly: {
    ios: CONFIG.IOS_IAP_MONTHLY_PRODUCT_ID || undefined,
    android: CONFIG.ANDROID_IAP_MONTHLY_PRODUCT_ID || undefined,
  },
};

let isConnected = false;
let listenerAttached = false;

const pendingPurchases = new Map<string, PendingPurchase[]>();

const getPlatformProductId = (plan: SubscriptionPlanId): string | undefined =>
  Platform.OS === 'ios' ? PLAN_PRODUCT_IDS[plan].ios : PLAN_PRODUCT_IDS[plan].android;

const getConfiguredProductIds = (): string[] =>
  (Object.values(PLAN_PRODUCT_IDS)
    .map(map => (Platform.OS === 'ios' ? map.ios : map.android))
    .filter((id): id is string => !!id));

const enqueuePending = (productId: string, pending: PendingPurchase) => {
  const current = pendingPurchases.get(productId) ?? [];
  current.push(pending);
  pendingPurchases.set(productId, current);
};

const shiftPending = (productId: string): PendingPurchase | undefined => {
  const current = pendingPurchases.get(productId);
  if (!current || current.length === 0) {
    return undefined;
  }
  const next = current.shift();
  if (!current.length) {
    pendingPurchases.delete(productId);
  } else {
    pendingPurchases.set(productId, current);
  }
  return next;
};

const rejectAllPending = (error: Error) => {
  pendingPurchases.forEach(queue => {
    queue.forEach(pending => pending.reject(error));
  });
  pendingPurchases.clear();
};

const ensureListener = () => {
  if (listenerAttached) {
    return;
  }

  InAppPurchases.setPurchaseListener(async ({ responseCode, results, errorCode }: PurchaseListenerResult) => {
    if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
      await Promise.all(
        results.map(async (result: InAppPurchases.Purchase) => {
          const plan = mapProductIdToPlan(result.productId);

          const pending = shiftPending(result.productId);

          if (result.purchaseState === InAppPurchases.PurchaseState.PURCHASED || result.purchaseState === InAppPurchases.PurchaseState.RESTORED) {
            try {
              await finishAndVerify(result);
              pending?.resolve(result);
            } catch (error) {
              pending?.reject(error as Error);
            }
          } else if (result.purchaseState === InAppPurchases.PurchaseState.CANCELED) {
            pending?.reject(new Error('Purchase cancelled'));
          } else if (result.purchaseState === InAppPurchases.PurchaseState.FAILED) {
            pending?.reject(new Error('Purchase failed'));
          } else if (plan && !pending) {
            // Finish stray purchases to keep queues clean
            await InAppPurchases.finishTransactionAsync(result, false).catch(() => undefined);
          }
        }),
      );
    } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
      rejectAllPending(new Error('Purchase cancelled'));
    } else if (responseCode !== InAppPurchases.IAPResponseCode.OK) {
      const message = errorCode ? `Purchase failed with code ${errorCode}` : 'Purchase failed';
      rejectAllPending(new Error(message));
    }
  });

  listenerAttached = true;
};

const ensureConnected = async (): Promise<void> => {
  if (isConnected) {
    return;
  }

  if (!getConfiguredProductIds().length) {
    throw new Error('In-app purchases are not configured.');
  }

  await InAppPurchases.connectAsync();
  ensureListener();
  isConnected = true;
};

const verifyPurchaseWithBackend = async (purchase: InAppPurchases.Purchase): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return;
  }

  const token = await getAccessToken();
  if (!token) {
    return;
  }

  try {
    const response = await fetch(`${CONFIG.API_URL}/api/receipt/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        platform: Platform.OS,
        purchase: {
          productId: purchase.productId,
          orderId: purchase.orderId,
          transactionId: purchase.orderId ?? purchase.purchaseToken ?? purchase.transactionReceipt,
          purchaseState: purchase.purchaseState,
          purchaseToken: purchase.purchaseToken,
          quantity: purchase.quantity,
          timestamp: purchase.purchaseTime,
          acknowledged: purchase.acknowledged,
          receipt: purchase.receipt ?? purchase.transactionReceipt ?? null,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend verification failed with status ${response.status}`);
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unknown verification error');
  }
};

const mapProductIdToPlan = (productId: string): SubscriptionPlanId | null => {
  const entries = Object.entries(PLAN_PRODUCT_IDS) as [SubscriptionPlanId, { ios?: string; android?: string }][];
  for (const [plan, ids] of entries) {
    const configuredId = Platform.OS === 'ios' ? ids.ios : ids.android;
    if (configuredId === productId) {
      return plan;
    }
  }

  return null;
};

const finishAndVerify = async (purchase: InAppPurchases.Purchase): Promise<void> => {
  try {
    await verifyPurchaseWithBackend(purchase);
  } catch (error) {
    console.warn('[IAP] Receipt verification failed:', error);
  }

  try {
    await InAppPurchases.finishTransactionAsync(purchase, false);
  } catch (error) {
    console.warn('[IAP] Failed to finish transaction:', error);
  }
};

const requestSubscriptionPurchase = async (productId: string): Promise<InAppPurchases.Purchase> => {
  await ensureConnected();

  return new Promise<InAppPurchases.Purchase>((resolve, reject) => {
    enqueuePending(productId, { resolve, reject });

    InAppPurchases.purchaseItemAsync(productId).catch((error: unknown) => {
      const pending = shiftPending(productId);
      if (pending) {
        pending.reject(error instanceof Error ? error : new Error('Purchase request failed'));
      }
    });
  });
};

export const SubscriptionService = {
  isConfigured(): boolean {
    return getConfiguredProductIds().length > 0;
  },

  async initialize(): Promise<void> {
    await ensureConnected();
  },

  async endConnection(): Promise<void> {
    if (!isConnected) {
      return;
    }

    try {
      await InAppPurchases.disconnectAsync();
    } catch (error) {
      console.warn('[IAP] Failed to disconnect from billing service:', error);
    }

    isConnected = false;
    pendingPurchases.clear();
  },

  async getAvailableProducts(): Promise<SubscriptionProduct[]> {
    await ensureConnected();
    const productIds = getConfiguredProductIds();
    if (!productIds.length) {
      return [];
    }

    try {
      const { responseCode, results } = await InAppPurchases.getProductsAsync(productIds);
      if (responseCode !== InAppPurchases.IAPResponseCode.OK || !results) {
        return [];
      }

      return results;
    } catch (error) {
      console.warn('[IAP] Failed to fetch subscriptions:', error);
      return [];
    }
  },

  async purchasePlan(plan: SubscriptionPlanId): Promise<SubscriptionPlanId> {
    const productId = getPlatformProductId(plan);
    if (!productId) {
      throw new Error('Selected plan is not configured.');
    }

    const purchase = await requestSubscriptionPurchase(productId);
    await finishAndVerify(purchase);
    return plan;
  },

  async restorePurchases(): Promise<SubscriptionPlanId[]> {
    await ensureConnected();

    try {
      const { responseCode, results } = await InAppPurchases.restorePurchasesAsync();
      if (responseCode !== InAppPurchases.IAPResponseCode.OK || !results) {
        return [];
      }

      const plans = new Set<SubscriptionPlanId>();

      await Promise.all(
        results.map(async (purchase: InAppPurchases.Purchase) => {
          const plan = mapProductIdToPlan(purchase.productId);
          if (plan) {
            plans.add(plan);
            await finishAndVerify(purchase);
          }
        }),
      );

      return Array.from(plans);
    } catch (error) {
      console.warn('[IAP] Failed to restore purchases:', error);
      return [];
    }
  },

  getPlanForProduct(productId: string): SubscriptionPlanId | null {
    return mapProductIdToPlan(productId);
  },

  getProductId(plan: SubscriptionPlanId): string | undefined {
    return getPlatformProductId(plan);
  },
};

export default SubscriptionService;
