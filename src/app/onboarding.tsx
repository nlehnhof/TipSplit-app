import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../constants/theme';
import { spacing } from '../constants/themeColors';
import { Button } from '../components/Button';
import { markOnboardingSeen } from '../storage/onboarding';

export default function OnboardingScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  async function handleGetStarted() {
    await markOnboardingSeen();
    router.replace('/');
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>TipSplit</Text>
        <Text style={[styles.tagline, { color: colors.textMuted }]}>
          Split tips fairly.{'\n'}In seconds.
        </Text>
      </View>
      <Button onPress={handleGetStarted}>Get Started</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontSize: 44,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
  },
});
