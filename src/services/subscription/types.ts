export type PurchaseResult = { ok: true } | { ok: false; message: string };
export type RestoreResult = { ok: true; isPremium: boolean } | { ok: false; message: string };

/**
 * Contract every subscription backend implements, so the app never talks to
 * StoreKit/Play Billing/RevenueCat directly. Swapping `localDevSubscriptionService`
 * for a RevenueCat-backed implementation is a one-file change.
 */
export type SubscriptionService = {
  isPremium(): Promise<boolean>;
  purchasePremium(): Promise<PurchaseResult>;
  restorePurchases(): Promise<RestoreResult>;
};
