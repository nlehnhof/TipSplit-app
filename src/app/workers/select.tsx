import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../constants/theme';
import { spacing, radius } from '../../constants/themeColors';
import { Button } from '../../components/Button';
import { PremiumGate } from '../../components/PremiumGate';
import { loadSavedWorkers } from '../../storage/savedWorkers';
import type { SavedWorker } from '../../types/savedWorker';

export default function SelectSavedWorkersScreen() {
  return (
    <PremiumGate description="Save workers first, then load them into a split from here in one tap.">
      <SelectSavedWorkersList />
    </PremiumGate>
  );
}

function SelectSavedWorkersList() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [workers, setWorkers] = useState<SavedWorker[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSavedWorkers().then((w) => {
      setWorkers(w);
      setLoaded(true);
    });
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    router.navigate({ pathname: '/', params: { loadWorkerIds: Array.from(selected).join(',') } });
  }

  if (!loaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        {workers.length === 0 ? (
          <Text style={{ color: colors.textMuted }}>
            You don&rsquo;t have any saved workers yet. Add some from Settings → Saved Workers.
          </Text>
        ) : (
          <View style={styles.list}>
            {workers.map((worker) => {
              const isSelected = selected.has(worker.id);
              return (
                <Pressable
                  key={worker.id}
                  onPress={() => toggle(worker.id)}
                  style={[
                    styles.row,
                    {
                      backgroundColor: isSelected ? colors.chip : colors.surface,
                      borderColor: isSelected ? colors.chipBorder : colors.border,
                    },
                  ]}
                >
                  <View>
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                      {worker.name || 'Unnamed worker'}
                    </Text>
                    {worker.role ? (
                      <Text style={{ color: colors.textMuted, fontSize: 13 }}>{worker.role}</Text>
                    ) : null}
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                      },
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md, borderTopColor: colors.border }]}>
        <Button onPress={handleConfirm} disabled={selected.size === 0}>
          Add {selected.size > 0 ? selected.size : ''} to Split
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 2,
  },
  footer: {
    borderTopWidth: 1,
    padding: spacing.md,
  },
});
