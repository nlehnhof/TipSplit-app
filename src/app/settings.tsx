import type { ReactNode } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../constants/theme';
import { spacing, radius } from '../constants/themeColors';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      <Section title="Currency">
        <Row label="Currency" value="USD ($)" colors={colors} />
      </Section>

      <Section title="Subscription">
        <Row label="TipSplit Pro" value="Not subscribed" colors={colors} />
      </Section>

      <Section title="About">
        <Row label="Version" value={version} colors={colors} />
      </Section>

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
    paddingVertical: spacing.xs,
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
