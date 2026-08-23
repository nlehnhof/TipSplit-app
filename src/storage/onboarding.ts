import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'tipsplit.hasSeenOnboarding.v1';

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === 'true';
  } catch {
    return true;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, 'true');
  } catch {
    // no-op: worst case onboarding shows again next launch
  }
}
