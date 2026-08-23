import { Platform } from 'react-native';
import type { PurchaseResult, RestoreResult, SubscriptionService } from './types';

const ENTITLEMENT_ID = 'pro';

function getApiKey(): string | undefined {
  return Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS
    : process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;
}

/**
 * Whether a RevenueCat API key is present for this platform. react-native-purchases is a
 * native module and is unavailable in Expo Go, so callers should only use
 * revenueCatSubscriptionService when this returns true (i.e. running in a dev client or
 * production build with the key configured) -- see SubscriptionContext.
 */
export function isRevenueCatConfigured(): boolean {
  return Boolean(getApiKey());
}

let configured = false;

async function ensureConfigured() {
  if (configured) return;
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('RevenueCat API key is not configured for this platform.');
  const Purchases = (await import('react-native-purchases')).default;
  Purchases.configure({ apiKey });
  configured = true;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export const revenueCatSubscriptionService: SubscriptionService = {
  async isPremium() {
    await ensureConfigured();
    const Purchases = (await import('react-native-purchases')).default;
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
  },

  async purchasePremium(): Promise<PurchaseResult> {
    try {
      await ensureConfigured();
      const Purchases = (await import('react-native-purchases')).default;
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages[0];
      if (!pkg) {
        return { ok: false, message: 'No subscription is available right now. Try again later.' };
      }
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined) {
        return { ok: true };
      }
      return { ok: false, message: 'Purchase completed, but Pro access was not granted.' };
    } catch (error) {
      return { ok: false, message: errorMessage(error, 'Purchase failed.') };
    }
  },

  async restorePurchases(): Promise<RestoreResult> {
    try {
      await ensureConfigured();
      const Purchases = (await import('react-native-purchases')).default;
      const info = await Purchases.restorePurchases();
      return { ok: true, isPremium: info.entitlements.active[ENTITLEMENT_ID] !== undefined };
    } catch (error) {
      return { ok: false, message: errorMessage(error, 'Restore failed.') };
    }
  },
};
