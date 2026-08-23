import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HistoryEntry } from '../types/history';

const KEY = 'tipsplit.history.v1';
const MAX_ENTRIES = 100;

export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export async function appendHistoryEntry(entry: HistoryEntry): Promise<void> {
  try {
    const existing = await loadHistory();
    const next = [entry, ...existing].slice(0, MAX_ENTRIES);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Best-effort logging: a failed history write shouldn't block the calculation itself.
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // no-op
  }
}
