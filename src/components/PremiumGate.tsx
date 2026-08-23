import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useThemeColors } from '../constants/theme';
import { spacing } from '../constants/themeColors';
import { Button } from './Button';
import { useSubscription } from '../services/subscription/SubscriptionContext';

export function PremiumGate({ children, description }: { children: ReactNode; description: string }) {
  const colors = useThemeColors();
  const { isPremium, loading } = useSubscription();

  if (loading) return null;

  if (!isPremium) {
    return (
      <View style={styles.locked}>
        <Text style={[styles.title, { color: colors.text }]}>TipSplit Pro</Text>
        <Text style={{ color: colors.textMuted, textAlign: 'center' }}>{description}</Text>
        <Button onPress={() => router.push('/paywall')}>Unlock TipSplit Pro</Button>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  locked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
});
