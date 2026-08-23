import { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../constants/theme';
import { spacing, radius } from '../../constants/themeColors';
import { Button } from '../../components/Button';
import { PremiumGate } from '../../components/PremiumGate';
import { loadSavedWorkers } from '../../storage/savedWorkers';
import { addTeam, loadTeam, removeTeam, updateTeam } from '../../storage/teams';
import { createId } from '../../utils/id';
import type { SavedWorker } from '../../types/savedWorker';

export default function TeamEditScreen() {
  return (
    <PremiumGate description="Save workers first, then group them into a team here.">
      <TeamEditForm />
    </PremiumGate>
  );
}

function TeamEditForm() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const [name, setName] = useState('');
  const [savedWorkers, setSavedWorkers] = useState<SavedWorker[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([loadSavedWorkers(), isNew ? Promise.resolve(null) : loadTeam(id)]).then(
      ([workers, team]) => {
        setSavedWorkers(workers);
        if (team) {
          setName(team.name);
          setSelectedIds(new Set(team.workerIds));
        }
        setLoaded(true);
      },
    );
  }, [id, isNew]);

  function toggle(workerId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(workerId)) next.delete(workerId);
      else next.add(workerId);
      return next;
    });
  }

  async function handleSave() {
    const workerIds = Array.from(selectedIds);
    if (isNew) {
      await addTeam({ id: createId('team'), name: name.trim() || 'Untitled team', workerIds });
    } else {
      await updateTeam(id, { name: name.trim() || 'Untitled team', workerIds });
    }
    router.back();
  }

  async function handleDelete() {
    await removeTeam(id);
    router.back();
  }

  if (!loaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Team name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Friday Night Crew"
          placeholderTextColor={colors.textMuted}
          style={[styles.nameInput, { color: colors.text, borderColor: colors.border }]}
          accessibilityLabel="Team name"
        />

        <Text style={[styles.label, { color: colors.textMuted, marginTop: spacing.lg }]}>Members</Text>
        {savedWorkers.length === 0 ? (
          <Text style={{ color: colors.textMuted }}>
            You don&rsquo;t have any saved workers yet. Add some from Settings → Saved Workers.
          </Text>
        ) : (
          <View style={styles.list}>
            {savedWorkers.map((worker) => {
              const selected = selectedIds.has(worker.id);
              return (
                <Pressable
                  key={worker.id}
                  onPress={() => toggle(worker.id)}
                  style={[
                    styles.row,
                    {
                      backgroundColor: selected ? colors.chip : colors.surface,
                      borderColor: selected ? colors.chipBorder : colors.border,
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
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected ? colors.primary : 'transparent',
                      },
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        )}

        {!isNew && (
          <Pressable onPress={handleDelete} style={styles.deleteButton}>
            <Text style={{ color: colors.danger, fontSize: 14, fontWeight: '600' }}>Delete Team</Text>
          </Pressable>
        )}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md, borderTopColor: colors.border }]}>
        <Button onPress={handleSave}>Save Team</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 18,
    fontWeight: '600',
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
  deleteButton: {
    alignItems: 'center',
    marginTop: spacing.xl,
    padding: spacing.sm,
  },
  footer: {
    borderTopWidth: 1,
    padding: spacing.md,
  },
});
