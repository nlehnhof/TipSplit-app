import { useState, type ReactNode } from 'react';
import { ScrollView, Text, View, StyleSheet, Switch, Pressable } from 'react-native';
import { Link, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../constants/theme';
import { spacing, radius } from '../constants/themeColors';
import Constants from 'expo-constants';
import { useSubscription } from '../services/subscription/SubscriptionContext';

export default function SettingsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const { isPremium, loading, usingRevenueCat, restorePurchases, devSetPremium } = useSubscription();
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  async function handleRestore() {
    const result = await restorePurchases();
    setRestoreMessage(
      result.ok
        ? result.isPremium
          ? 'Restored — TipSplit Pro is active.'
          : 'No previous purchase found for this account.'
        : result.message,
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      <Section title="TipSplit Pro">
        <Row label="Status" value={loading ? 'Loading…' : isPremium ? 'Active' : 'Not subscribed'} colors={colors} />
        <RowLink href="/workers" label="Saved Workers" colors={colors} />
        <RowLink href="/teams" label="Saved Teams" colors={colors} />
        <RowLink href="/history" label="History" colors={colors} />
        {!isPremium && <RowLink href="/paywall" label="Upgrade to Pro" colors={colors} accent />}
        <Pressable onPress={handleRestore} style={styles.restoreRow}>
          <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600' }}>Restore Purchases</Text>
        </Pressable>
        {restoreMessage && (
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>{restoreMessage}</Text>
        )}
      </Section>

      <Section title="Currency">
        <Row label="Currency" value="USD ($)" colors={colors} />
      </Section>

      <Section title="About">
        <Row label="Version" value={version} colors={colors} />
      </Section>

      {!usingRevenueCat && (
        <Section title="Developer">
          <View style={styles.row}>
            <Text style={{ color: colors.text, fontSize: 15 }}>Simulate Premium (temporary)</Text>
            <Switch value={isPremium} onValueChange={devSetPremium} />
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: spacing.xs }}>
            Local override — set EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID / _IOS to switch to real
            RevenueCat billing (requires a dev client build, not Expo Go).
          </Text>
        </Section>
      )}

      <View style={[styles.disclaimerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.disclaimerTitle, { color: colors.text }]}>Tip-Pooling Disclaimer</Text>
        <Text style={[styles.disclaimerBody, { color: colors.textMuted }]}>
          TipSplit is a calculation tool and does not provide legal, tax, payroll, or employment
          advice. Tip-pooling and tip-sharing requirements vary by jurisdiction and workplace.
          Verify that your selected method complies with applicable laws and your organization&rsquo;s
          policies.
        </Text>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const colors = useThemeColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function Row({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={styles.row}>
      <Text style={{ color: colors.text, fontSize: 16 }}>{label}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 16 }}>{value}</Text>
    </View>
  );
}

function RowLink({
  href,
  label,
  colors,
  accent,
}: {
  href: Href;
  label: string;
  colors: ReturnType<typeof useThemeColors>;
  accent?: boolean;
}) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.row}>
        <Text style={{ color: accent ? colors.primary : colors.text, fontSize: 16, fontWeight: accent ? '600' : '400' }}>
          {label}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 16 }}>{'>'}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  restoreRow: {
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  disclaimerCard: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  disclaimerBody: {
    fontSize: 13,
    lineHeight: 19,
  },
});
