import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SavedWorker } from '../types/savedWorker';

const KEY = 'tipsplit.savedWorkers.v1';

export async function loadSavedWorkers(): Promise<SavedWorker[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedWorker[];
  } catch {
    return [];
  }
}

async function persist(workers: SavedWorker[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(workers));
}

export async function addSavedWorker(worker: SavedWorker): Promise<SavedWorker[]> {
  const workers = [...(await loadSavedWorkers()), worker];
  await persist(workers);
  return workers;
}

export async function updateSavedWorker(id: string, patch: Partial<SavedWorker>): Promise<SavedWorker[]> {
  const workers = (await loadSavedWorkers()).map((w) => (w.id === id ? { ...w, ...patch } : w));
  await persist(workers);
  return workers;
}

export async function removeSavedWorker(id: string): Promise<SavedWorker[]> {
  const workers = (await loadSavedWorkers()).filter((w) => w.id !== id);
  await persist(workers);
  return workers;
}
