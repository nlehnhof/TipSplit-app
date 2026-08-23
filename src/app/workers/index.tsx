import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../constants/theme';
import { spacing, radius } from '../../constants/themeColors';
import { PremiumGate } from '../../components/PremiumGate';
import { SavedWorkerRow } from '../../components/SavedWorkerRow';
import { createId } from '../../utils/id';
import {
  addSavedWorker,
  loadSavedWorkers,
  removeSavedWorker,
  updateSavedWorker,
} from '../../storage/savedWorkers';
import type { SavedWorker } from '../../types/savedWorker';

export default function SavedWorkersScreen() {
  return (
    <PremiumGate description="Save your team once, then add everyone to a tip split in a tap instead of retyping names every shift.">
      <SavedWorkersList />
    </PremiumGate>
  );
}

function SavedWorkersList() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [workers, setWorkers] = useState<SavedWorker[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSavedWorkers().then((w) => {
      setWorkers(w);
      setLoaded(true);
    });
  }, []);

  async function handleAdd() {
    const next = await addSavedWorker({ id: createId('savedworker'), name: '', role: undefined });
    setWorkers(next);
  }

  async function handleChange(id: string, patch: Partial<SavedWorker>) {
    setWorkers((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
    await updateSavedWorker(id, patch);
  }

  async function handleRemove(id: string) {
    const next = await removeSavedWorker(id);
    setWorkers(next);
  }

  if (!loaded) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      <Text style={{ color: colors.textMuted, marginBottom: spacing.sm }}>
        Saved workers show up when you tap &ldquo;Load Saved Workers&rdquo; on the calculator.
      </Text>

      <View style={styles.list}>
        {workers.map((worker) => (
          <SavedWorkerRow key={worker.id} worker={worker} onChange={handleChange} onRemove={handleRemove} />
        ))}
      </View>

      {workers.length === 0 && (
        <View style={[styles.empty, { borderColor: colors.border }]}>
          <Text style={{ color: colors.textMuted, textAlign: 'center' }}>
            No saved workers yet. Add your team below.
          </Text>
        </View>
      )}

      <Pressable onPress={handleAdd} style={[styles.addWorker, { borderColor: colors.chipBorder }]}>
        <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>+ Add Worker</Text>
      </Pressable>
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
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  addWorker: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
});
