import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useThemeColors } from '../constants/theme';
import { radius, spacing } from '../constants/themeColors';
import { SPLIT_METHOD_LABELS, type SplitMethod } from '../types/tipSplit';

const METHODS: SplitMethod[] = ['equal', 'hours', 'points', 'weightedHours'];

type Props = {
  value: SplitMethod;
  onChange: (method: SplitMethod) => void;
};

export function MethodSelector({ value, onChange }: Props) {
  const colors = useThemeColors();

  return (
    <View style={styles.grid}>
      {METHODS.map((method) => {
        const selected = method === value;
        return (
          <Pressable
            key={method}
            onPress={() => onChange(method)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`Split ${SPLIT_METHOD_LABELS[method]}`}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? colors.primary : colors.chip,
                borderColor: selected ? colors.primary : colors.chipBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.chipLabel,
                { color: selected ? colors.primaryText : colors.text },
              ]}
            >
              {SPLIT_METHOD_LABELS[method]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
