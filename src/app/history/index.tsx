import { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../constants/theme';
import { spacing, radius } from '../../constants/themeColors';
import { PremiumGate } from '../../components/PremiumGate';
import { formatCurrency } from '../../calculations/money';
import { SPLIT_METHOD_LABELS } from '../../types/tipSplit';
import { clearHistory, loadHistory } from '../../storage/history';
import type { HistoryEntry } from '../../types/history';

export default function HistoryScreen() {
  return (
    <PremiumGate description="Every tip split you calculate is logged here automatically, so you can look one up later.">
      <HistoryList />
    </PremiumGate>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function HistoryList() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadHistory().then((h) => {
        setEntries(h);
        setLoaded(true);
      });
    }, []),
  );

  async function handleClear() {
    await clearHistory();
    setEntries([]);
  }

  if (!loaded) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      {entries.length === 0 ? (
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl }}>
          No calculations yet. Your history will show up here after you calculate a tip split.
        </Text>
      ) : (
        <>
          <View style={styles.list}>
            {entries.map((entry) => (
              <View
                key={entry.id}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.cardHeader}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>
                    {formatDate(entry.createdAt)}
                  </Text>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>
                    {formatCurrency(entry.totalTipsCents)}
                  </Text>
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                  {entry.workerCount} worker{entry.workerCount === 1 ? '' : 's'} · Split{' '}
                  {SPLIT_METHOD_LABELS[entry.method]}
                </Text>
              </View>
            ))}
          </View>
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <Text style={{ color: colors.danger, fontSize: 14, fontWeight: '600' }}>Clear History</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clearButton: {
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
});
