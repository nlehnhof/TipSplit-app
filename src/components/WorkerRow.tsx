import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useThemeColors } from '../constants/theme';
import { radius, spacing } from '../constants/themeColors';
import { DEFAULT_ROLE_SUGGESTIONS, type SplitMethod } from '../types/tipSplit';
import type { DraftWorker } from '../types/draft';

type Props = {
  worker: DraftWorker;
  method: SplitMethod;
  showAdjustment: boolean;
  onChange: (id: string, patch: Partial<DraftWorker>) => void;
  onRemove: (id: string) => void;
};

export function WorkerRow({ worker, method, showAdjustment, onChange, onRemove }: Props) {
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
              onPress={() => onChange(worker.id, { role: selected ? '' : role })}
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

      <View style={styles.fieldsRow}>
        {(method === 'hours' || method === 'weightedHours') && (
          <>
            <Field
              label="Hours"
              value={worker.hoursText}
              onChangeText={(hoursText) => onChange(worker.id, { hoursText })}
            />
            <Field
              label="Minutes"
              value={worker.minutesText}
              onChangeText={(minutesText) => onChange(worker.id, { minutesText })}
            />
          </>
        )}
        {method === 'points' && (
          <Field
            label="Points"
            value={worker.pointsText}
            onChangeText={(pointsText) => onChange(worker.id, { pointsText })}
          />
        )}
        {method === 'weightedHours' && (
          <Field
            label="Multiplier"
            value={worker.weightText}
            onChangeText={(weightText) => onChange(worker.id, { weightText })}
            placeholder="1.0"
          />
        )}
        {showAdjustment && (
          <Field
            label="Adjustment ($)"
            value={worker.adjustmentText}
            onChangeText={(adjustmentText) => onChange(worker.id, { adjustmentText })}
            placeholder="0.00"
          />
        )}
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  const colors = useThemeColors();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        style={[styles.fieldInput, { color: colors.text, borderColor: colors.border }]}
        accessibilityLabel={label}
      />
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
  fieldsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  fieldWrap: {
    minWidth: 90,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    fontSize: 16,
  },
});
