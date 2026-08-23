import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Team } from '../types/team';

const KEY = 'tipsplit.teams.v1';

export async function loadTeams(): Promise<Team[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Team[];
  } catch {
    return [];
  }
}

async function persist(teams: Team[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(teams));
}

export async function loadTeam(id: string): Promise<Team | null> {
  const teams = await loadTeams();
  return teams.find((t) => t.id === id) ?? null;
}

export async function addTeam(team: Team): Promise<Team[]> {
  const teams = [...(await loadTeams()), team];
  await persist(teams);
  return teams;
}

export async function updateTeam(id: string, patch: Partial<Team>): Promise<Team[]> {
  const teams = (await loadTeams()).map((t) => (t.id === id ? { ...t, ...patch } : t));
  await persist(teams);
  return teams;
}

export async function removeTeam(id: string): Promise<Team[]> {
  const teams = (await loadTeams()).filter((t) => t.id !== id);
  await persist(teams);
  return teams;
}
