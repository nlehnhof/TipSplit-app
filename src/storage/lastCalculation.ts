import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SplitMethod, WorkerInput } from '../types/tipSplit';

const STORAGE_KEY = 'tipsplit.lastCalculation.v1';

export type StoredCalculation = {
  totalTipsCents: number;
  method: SplitMethod;
  workers: WorkerInput[];
};

export async function loadLastCalculation(): Promise<StoredCalculation | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredCalculation;
  } catch {
    return null;
  }
}

export async function saveLastCalculation(calculation: StoredCalculation): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(calculation));
  } catch {
    // Best-effort: the in-progress calculation still works from in-memory state
    // even if persistence fails (e.g. storage full or unavailable).
  }
}

export async function clearLastCalculation(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}
