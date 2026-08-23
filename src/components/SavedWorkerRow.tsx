import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useThemeColors } from '../constants/theme';
import { radius, spacing } from '../constants/themeColors';
import { DEFAULT_ROLE_SUGGESTIONS } from '../types/tipSplit';
import type { SavedWorker } from '../types/savedWorker';

type Props = {
  worker: SavedWorker;
  onChange: (id: string, patch: Partial<SavedWorker>) => void;
  onRemove: (id: string) => void;
};

export function SavedWorkerRow({ worker, onChange, onRemove }: Props) {
  const colors = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <TextInput
          value={worker.name}
          onChangeText={(name) => onChange(worker.id, { name })}
          placeholder="Worker name"
          placeholderTextColor={colors.textMuted}
          style={[styles.nameInput, { color: colors.text }]}
          accessibilityLabel="Worker name"
        />
        <Pressable
          onPress={() => onRemove(worker.id)}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${worker.name || 'worker'}`}
          hitSlop={8}
        >
          <Text style={[styles.remove, { color: colors.danger }]}>Remove</Text>
        </Pressable>
      </View>
      <View style={styles.roleRow}>
        {DEFAULT_ROLE_SUGGESTIONS.map((role) => {
          const selected = worker.role === role;
          return (
            <Pressable
              key={role}
              onPress={() => onChange(worker.id, { role: selected ? undefined : role })}
              style={[
                styles.roleChip,
                {
                  backgroundColor: selected ? colors.chip : 'transparent',
                  borderColor: selected ? colors.chipBorder : colors.border,
                },
              ]}
            >
              <Text style={{ color: colors.text, fontSize: 13 }}>{role}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  remove: {
    fontSize: 14,
    fontWeight: '500',
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  roleChip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
});
