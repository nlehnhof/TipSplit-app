import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { ThemeProvider, useThemeColors } from '../constants/theme';
import { SubscriptionProvider } from '../services/subscription/SubscriptionContext';

function RootStack() {
  const colors = useThemeColors();
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'TipSplit' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="paywall" options={{ title: 'TipSplit Pro', presentation: 'modal' }} />
        <Stack.Screen name="workers/index" options={{ title: 'Saved Workers' }} />
        <Stack.Screen name="workers/select" options={{ title: 'Load Workers', presentation: 'modal' }} />
        <Stack.Screen name="history/index" options={{ title: 'History' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider key={scheme}>
          <SubscriptionProvider>
            <RootStack />
          </SubscriptionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
