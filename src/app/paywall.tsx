import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../constants/theme';
import { spacing, radius } from '../constants/themeColors';
import { Button } from '../components/Button';
import { useSubscription } from '../services/subscription/SubscriptionContext';

const FEATURES = [
  'Saved workers — stop retyping the same names every shift',
  'Saved teams — load a whole roster in one tap',
  'Calculation history — see past tip splits at a glance',
];

export default function PaywallScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { isPremium, usingRevenueCat, purchasePremium } = useSubscription();
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  async function handleUpgrade() {
    setError(null);
    setPurchasing(true);
    const result = await purchasePremium();
    setPurchasing(false);
    if (result.ok) {
      router.back();
    } else {
      setError(result.message);
    }
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingBottom: insets.bottom + spacing.lg },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>TipSplit Pro</Text>
      <Text style={{ color: colors.textMuted, marginBottom: spacing.lg }}>
        Try free for 7 days. Everything in the free calculator, plus:
      </Text>

      <View style={styles.featureList}>
        {FEATURES.map((feature) => (
          <View
            key={feature}
            style={[styles.featureCard, { backgroundColor: colors.chip, borderColor: colors.chipBorder }]}
          >
            <Text style={{ color: colors.text, fontSize: 15 }}>{feature}</Text>
          </View>
        ))}
      </View>

      {isPremium ? (
        <Text style={{ color: colors.primary, fontWeight: '600', marginTop: spacing.lg }}>
          You&rsquo;re already on TipSplit Pro.
        </Text>
      ) : (
        <View style={styles.actions}>
          {error && (
            <Text style={{ color: colors.danger, fontSize: 14, textAlign: 'center' }}>{error}</Text>
          )}
          <Button onPress={handleUpgrade} disabled={purchasing}>
            {purchasing ? 'Processing…' : 'Start free trial'}
          </Button>
          <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
            7 days free, then $4.99/month. Cancel anytime before the trial ends and you
            won&rsquo;t be charged.
          </Text>
          {!usingRevenueCat && (
            <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
              Development build: this simulates a purchase locally. Real App Store / Play Store
              billing via RevenueCat lands before release.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  featureList: {
    gap: spacing.sm,
  },
  featureCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
  },
});
