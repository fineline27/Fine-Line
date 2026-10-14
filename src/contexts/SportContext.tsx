import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from './AuthContext';

export type SportId = 'NBA' | 'NFL' | 'AFL';

export type SportOption = {
  id: SportId;
  label: string;
  description: string;
  available: boolean;
};

export const SPORT_OPTIONS: SportOption[] = [
  {
    id: 'NBA',
    label: 'NBA',
    description: '30 teams · 82-game season O/U',
    available: true,
  },
  {
    id: 'NFL',
    label: 'NFL',
    description: 'Coming soon',
    available: false,
  },
  {
    id: 'AFL',
    label: 'AFL',
    description: 'Coming soon',
    available: false,
  },
];

const SPORT_STORAGE_KEY = '@fine_line/selected_sport';

type SportContextValue = {
  sport: SportId | null;
  isLoading: boolean;
  setSport: (sport: SportId) => Promise<void>;
  clearSport: () => Promise<void>;
};

const SportContext = createContext<SportContextValue | null>(null);

export function SportProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [sport, setSportState] = useState<SportId | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) {
        if (!cancelled) {
          setSportState(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const stored = await AsyncStorage.getItem(SPORT_STORAGE_KEY);
        if (!cancelled && (stored === 'NBA' || stored === 'AFL')) {
          setSportState(stored);
        }
        // Do not force null when storage is empty — avoids racing home before setItem finishes.
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const setSport = useCallback(async (next: SportId) => {
    const option = SPORT_OPTIONS.find((o) => o.id === next);
    if (!option?.available) {
      return;
    }
    await AsyncStorage.setItem(SPORT_STORAGE_KEY, next);
    setSportState(next);
  }, []);

  const clearSport = useCallback(async () => {
    setSportState(null);
    await AsyncStorage.removeItem(SPORT_STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ sport, isLoading, setSport, clearSport }),
    [sport, isLoading, setSport, clearSport],
  );

  return <SportContext.Provider value={value}>{children}</SportContext.Provider>;
}

export function useSport(): SportContextValue {
  const ctx = useContext(SportContext);
  if (!ctx) {
    throw new Error('useSport must be used within SportProvider');
  }
  return ctx;
}
