import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from './AuthContext';
import { useSport } from './SportContext';
import { fetchMyLeagues } from '../lib/leagues';
import { ensureOpenPoolMembership, OPEN_POOL_INVITE } from '../lib/openPool';
import type { SportId } from './SportContext';
import type { League } from '../types/league';

const ACTIVE_LEAGUE_KEY = '@fine_line/active_league_id';

type LeagueContextValue = {
  leagues: League[];
  activeLeague: League | null;
  isLoading: boolean;
  poolError: string | null;
  refreshLeagues: () => Promise<void>;
  setActiveLeagueId: (leagueId: string) => Promise<void>;
};

const LeagueContext = createContext<LeagueContextValue | null>(null);

export function LeagueProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { sport } = useSport();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [activeLeagueId, setActiveLeagueIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [poolError, setPoolError] = useState<string | null>(null);

  const refreshLeagues = useCallback(async () => {
    if (!user) {
      setLeagues([]);
      setActiveLeagueIdState(null);
      setPoolError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setPoolError(null);
    try {
      if (sport) {
        try {
          await ensureOpenPoolMembership(sport as SportId);
        } catch (err) {
          setPoolError(err instanceof Error ? err.message : 'Could not join overall pool');
        }
      }

      const list = await fetchMyLeagues();
      const forSport = sport ? list.filter((l) => (l.sport ?? 'NBA') === sport) : list;
      setLeagues(forSport);

      const openPool = sport
        ? forSport.find((l) => l.invite_code === OPEN_POOL_INVITE[sport as SportId])
        : undefined;

      const stored = await AsyncStorage.getItem(ACTIVE_LEAGUE_KEY);
      const storedValid = stored && forSport.some((l) => l.id === stored);
      const nextId = storedValid ? stored : openPool?.id ?? forSport[0]?.id ?? null;
      setActiveLeagueIdState(nextId);
      if (nextId && nextId !== stored) {
        await AsyncStorage.setItem(ACTIVE_LEAGUE_KEY, nextId);
      }
    } catch {
      // Keep going — create/join may succeed even if listing leagues fails (RLS).
    } finally {
      setIsLoading(false);
    }
  }, [user, sport]);

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
      poolError,
      refreshLeagues,
      setActiveLeagueId,
    }),
    [leagues, activeLeague, isLoading, poolError, refreshLeagues, setActiveLeagueId],
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
