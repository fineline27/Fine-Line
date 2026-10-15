import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SportId } from '../contexts/SportContext';

const PREFIX = '@fine_line/locked_ou_line';
const IGNORED_MARKET_PREFIX = '@fine_line/ignored_market_line';

function key(sport: SportId, teamId: string): string {
  return `${PREFIX}/${sport}/${teamId}`;
}

function ignoredMarketKey(sport: SportId, teamId: string): string {
  return `${IGNORED_MARKET_PREFIX}/${sport}/${teamId}`;
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

/** Market line the user chose to ignore (keep lock, no prompt) until the board moves again. */
export async function readIgnoredMarketLine(
  sport: SportId,
  teamId: string,
): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(ignoredMarketKey(sport, teamId));
    if (raw == null || raw === '') {
      return null;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export async function writeIgnoredMarketLine(
  sport: SportId,
  teamId: string,
  marketLine: number,
): Promise<void> {
  try {
    await AsyncStorage.setItem(ignoredMarketKey(sport, teamId), String(marketLine));
  } catch {
    // ignore
  }
}

export async function clearIgnoredMarketLine(sport: SportId, teamId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(ignoredMarketKey(sport, teamId));
  } catch {
    // ignore
  }
}

export async function loadIgnoredMarketLinesForTeams(
  sport: SportId,
  teamIds: string[],
): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  await Promise.all(
    teamIds.map(async (teamId) => {
      const line = await readIgnoredMarketLine(sport, teamId);
      if (line != null) {
        out[teamId] = line;
      }
    }),
  );
  return out;
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
