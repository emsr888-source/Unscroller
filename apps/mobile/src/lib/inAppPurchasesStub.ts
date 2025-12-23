export enum IAPResponseCode {
  OK = 0,
  USER_CANCELED = 1,
  SERVICE_UNAVAILABLE = 2,
  BILLING_UNAVAILABLE = 3,
  ITEM_UNAVAILABLE = 4,
  DEVELOPER_ERROR = 5,
  ERROR = 6,
  ITEM_ALREADY_OWNED = 7,
  ITEM_NOT_OWNED = 8,
}

export enum IAPErrorCode {
  SERVICE_ERROR = 'E_SERVICE_ERROR',
  USER_CANCELLED = 'E_USER_CANCELLED',
  ITEM_UNAVAILABLE = 'E_ITEM_UNAVAILABLE',
  UNKNOWN = 'E_UNKNOWN',
}

export enum PurchaseState {
  UNKNOWN = 0,
  PURCHASED = 1,
  CANCELED = 2,
  PENDING = 3,
  FAILED = 4,
  RESTORED = 5,
}

export type Product = {
  productId: string;
  price?: string;
  title?: string;
  description?: string;
  subscriptionPeriodUnitIOS?: string;
};

export type Purchase = {
  productId: string;
  purchaseState: PurchaseState;
  orderId?: string;
  purchaseToken?: string;
  receipt?: string | null;
  transactionReceipt?: string | null;
  quantity?: number;
  purchaseTime?: number;
  acknowledged?: boolean;
};

type PurchaseListenerResult = {
  responseCode: IAPResponseCode;
  results?: Purchase[];
  errorCode?: IAPErrorCode;
};

type PurchaseListener = (result: PurchaseListenerResult) => void;

let listener: PurchaseListener | null = null;

export async function connectAsync() {
  return { responseCode: IAPResponseCode.ERROR, results: [] as Purchase[] };
}

export function setPurchaseListener(callback: PurchaseListener) {
  listener = callback;
}

export async function getProductsAsync(_: string[]) {
  return { responseCode: IAPResponseCode.ERROR, results: [] as Product[] };
}

export async function restorePurchasesAsync() {
  return { responseCode: IAPResponseCode.ERROR, results: [] as Purchase[] };
}

export async function purchaseItemAsync(_: string) {
  throw new Error('In-app purchases are disabled in this build.');
}

export async function finishTransactionAsync(_: Purchase, __?: boolean) {
  return;
}

export async function disconnectAsync() {
  listener = null;
}

export async function getPurchaseHistoryAsync() {
  return { responseCode: IAPResponseCode.ERROR, results: [] as Purchase[] };
}

export function __invokePurchaseListener(result: PurchaseListenerResult) {
  listener?.(result);
}
