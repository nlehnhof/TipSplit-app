import { Pressable, Text, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';
import { useThemeColors } from '../constants/theme';
import { radius, spacing } from '../constants/themeColors';

type Props = {
  onPress: () => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function Button({ onPress, children, variant = 'primary', disabled, accessibilityLabel }: Props) {
  const colors = useThemeColors();

  const backgroundColor =
    variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.chip : 'transparent';
  const textColor = variant === 'primary' ? colors.primaryText : colors.primary;
  const borderColor = variant === 'ghost' ? colors.border : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor, borderColor, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[styles.label, { color: textColor }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
  },
});
