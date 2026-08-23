import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  devSetPremiumOverride,
  localDevSubscriptionService,
} from './localDevSubscriptionService';

type SubscriptionContextValue = {
  isPremium: boolean;
  loading: boolean;
  purchasePremium: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  devSetPremium: (enabled: boolean) => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localDevSubscriptionService.isPremium().then((value) => {
      setIsPremium(value);
      setLoading(false);
    });
  }, []);

  async function purchasePremium() {
    const result = await localDevSubscriptionService.purchasePremium();
    if (result.ok) setIsPremium(true);
  }

  async function restorePurchases() {
    const result = await localDevSubscriptionService.restorePurchases();
    if (result.ok) setIsPremium(result.isPremium);
  }

  async function devSetPremium(enabled: boolean) {
    await devSetPremiumOverride(enabled);
    setIsPremium(enabled);
  }

  return (
    <SubscriptionContext.Provider
      value={{ isPremium, loading, purchasePremium, restorePurchases, devSetPremium }}
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
