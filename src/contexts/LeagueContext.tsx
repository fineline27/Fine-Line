import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from './AuthContext';
import { fetchMyLeagues } from '../lib/leagues';
import type { League } from '../types/league';

const ACTIVE_LEAGUE_KEY = '@ou_league/active_league_id';

type LeagueContextValue = {
  leagues: League[];
  activeLeague: League | null;
  isLoading: boolean;
  refreshLeagues: () => Promise<void>;
  setActiveLeagueId: (leagueId: string) => Promise<void>;
};

const LeagueContext = createContext<LeagueContextValue | null>(null);

export function LeagueProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [activeLeagueId, setActiveLeagueIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshLeagues = useCallback(async () => {
    if (!user) {
      setLeagues([]);
      setActiveLeagueIdState(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const list = await fetchMyLeagues();
      setLeagues(list);

      const stored = await AsyncStorage.getItem(ACTIVE_LEAGUE_KEY);
      const storedValid = stored && list.some((l) => l.id === stored);
      const nextId = storedValid ? stored : list[0]?.id ?? null;
      setActiveLeagueIdState(nextId);
      if (nextId && nextId !== stored) {
        await AsyncStorage.setItem(ACTIVE_LEAGUE_KEY, nextId);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshLeagues();
  }, [refreshLeagues]);

  const setActiveLeagueId = useCallback(async (leagueId: string) => {
    setActiveLeagueIdState(leagueId);
    await AsyncStorage.setItem(ACTIVE_LEAGUE_KEY, leagueId);
  }, []);

  const activeLeague = useMemo(
    () => leagues.find((l) => l.id === activeLeagueId) ?? null,
    [leagues, activeLeagueId],
  );

  const value = useMemo(
    () => ({
      leagues,
      activeLeague,
      isLoading,
      refreshLeagues,
      setActiveLeagueId,
    }),
    [leagues, activeLeague, isLoading, refreshLeagues, setActiveLeagueId],
  );

  return <LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>;
}

export function useLeague(): LeagueContextValue {
  const ctx = useContext(LeagueContext);
  if (!ctx) {
    throw new Error('useLeague must be used within LeagueProvider');
  }
  return ctx;
}
