import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  devSetPremiumOverride,
  localDevSubscriptionService,
} from './localDevSubscriptionService';
import { isRevenueCatConfigured, revenueCatSubscriptionService } from './revenueCatSubscriptionService';
import type { PurchaseResult, RestoreResult, SubscriptionService } from './types';

const usingRevenueCat = isRevenueCatConfigured();
const activeService: SubscriptionService = usingRevenueCat
  ? revenueCatSubscriptionService
  : localDevSubscriptionService;

type SubscriptionContextValue = {
  isPremium: boolean;
  loading: boolean;
  usingRevenueCat: boolean;
  purchasePremium: () => Promise<PurchaseResult>;
  restorePurchases: () => Promise<RestoreResult>;
  devSetPremium: (enabled: boolean) => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    activeService
      .isPremium()
      .then(setIsPremium)
      .finally(() => setLoading(false));
  }, []);

  async function purchasePremium(): Promise<PurchaseResult> {
    const result = await activeService.purchasePremium();
    if (result.ok) setIsPremium(true);
    return result;
  }

  async function restorePurchases(): Promise<RestoreResult> {
    const result = await activeService.restorePurchases();
    if (result.ok) setIsPremium(result.isPremium);
    return result;
  }

  async function devSetPremium(enabled: boolean) {
    await devSetPremiumOverride(enabled);
    setIsPremium(enabled);
  }

  return (
    <SubscriptionContext.Provider
      value={{ isPremium, loading, usingRevenueCat, purchasePremium, restorePurchases, devSetPremium }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return ctx;
}
