import { useCallback, useEffect, useState } from 'react';

import { getErrorMessage } from '../lib/errors';
import { fetchTeams, isSupabaseConfigured } from '../lib/supabase';

export const TEAMS_RLS_SQL = `alter table public.teams enable row level security;

create policy "Public read teams"
  on public.teams
  for select
  using (true);`;
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
        'Supabase is not configured. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to .env in the project root, then restart with: npx expo start',
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
      let message = getErrorMessage(err, 'Failed to load teams');
      if (message.toLowerCase().includes('no api key')) {
        message =
          'Supabase API key missing in the app bundle. Ensure EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is in .env and restart Expo (npx expo start).';
      } else if (message.toLowerCase().includes('permission denied')) {
        message =
          'Supabase blocked reads on the teams table (Row Level Security). Run the SQL policy shown below in the Supabase SQL Editor, then tap Try again.';
      }
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
