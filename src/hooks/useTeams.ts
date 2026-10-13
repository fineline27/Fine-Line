import { useCallback, useEffect, useState } from 'react';

import { fetchTeams, isSupabaseConfigured } from '../lib/supabase';
import type { Team } from '../types/team';

type TeamsState = {
  teams: Team[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useTeams(): TeamsState {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setTeams([]);
      setError(
        'Supabase is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to your environment.',
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchTeams();
      setTeams(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load teams';
      setError(message);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { teams, loading, error, refresh };
}
