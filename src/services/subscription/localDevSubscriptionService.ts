import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PurchaseResult, RestoreResult, SubscriptionService } from './types';

const KEY = 'tipsplit.devPremium.v1';

/**
 * TEMPORARY implementation of SubscriptionService, used until a real RevenueCat-backed
 * implementation is wired up (EXECUTION_PLAN.md Phase 8). It stores a local on-device flag
 * instead of talking to StoreKit/Play Billing, so premium-gated features (Saved Workers,
 * History) can be built and tested end-to-end before store billing infrastructure exists.
 * `purchasePremium` always "succeeds" — there is no real payment here.
 */
export const localDevSubscriptionService: SubscriptionService = {
  async isPremium() {
    return (await AsyncStorage.getItem(KEY)) === 'true';
  },

  async purchasePremium(): Promise<PurchaseResult> {
    await AsyncStorage.setItem(KEY, 'true');
    return { ok: true };
  },

  async restorePurchases(): Promise<RestoreResult> {
    const isPremium = (await AsyncStorage.getItem(KEY)) === 'true';
    return { ok: true, isPremium };
  },
};

/** Dev-only escape hatch to simulate turning premium back off. Not part of SubscriptionService. */
export async function devSetPremiumOverride(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY, enabled ? 'true' : 'false');
}
