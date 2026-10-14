import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SportId } from '../contexts/SportContext';

const PREFIX = '@fine_line/locked_ou_line';

function key(sport: SportId, teamId: string): string {
  return `${PREFIX}/${sport}/${teamId}`;
}

export async function readStoredLockedOuLine(
  sport: SportId,
  teamId: string,
): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(key(sport, teamId));
    if (raw == null || raw === '') {
      return null;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export async function writeStoredLockedOuLine(
  sport: SportId,
  teamId: string,
  line: number,
): Promise<void> {
  try {
    await AsyncStorage.setItem(key(sport, teamId), String(line));
  } catch {
    // Non-fatal; DB is source of truth when available.
  }
}

export async function clearStoredLockedOuLine(sport: SportId, teamId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key(sport, teamId));
  } catch {
    // ignore
  }
}

export async function mergeLockedOuLinesFromDevice(
  sport: SportId,
  fromDb: Record<string, number>,
  teamIdsWithPicks: string[],
): Promise<Record<string, number>> {
  const merged = { ...fromDb };
  await Promise.all(
    teamIdsWithPicks.map(async (teamId) => {
      if (merged[teamId] != null) {
        return;
      }
      const local = await readStoredLockedOuLine(sport, teamId);
      if (local != null) {
        merged[teamId] = local;
      }
    }),
  );
  return merged;
}
