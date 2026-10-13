import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import type { PickSide } from '../types/team';

const STORAGE_KEY = '@ou_league/picks';

type PicksMap = Record<string, PickSide>;

export function useTeamPicks() {
  const [picks, setPicks] = useState<PicksMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) {
          setPicks(JSON.parse(raw) as PicksMap);
        }
      } catch {
        // Ignore corrupt storage; start fresh.
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const togglePick = useCallback((teamId: string, side: PickSide) => {
    setPicks((current) => {
      const next = { ...current };
      if (current[teamId] === side) {
        delete next[teamId];
      } else {
        next[teamId] = side;
      }
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { picks, togglePick, hydrated };
}
