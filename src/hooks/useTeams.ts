import { useCallback, useEffect, useState } from 'react';

import { getErrorMessage } from '../lib/errors';
import { fetchTeams, isSupabaseConfigured, resetSupabaseClient } from '../lib/supabase';
import type { Team } from '../types/team';

/** Run in Supabase SQL Editor when the app cannot read teams. */
export const TEAMS_RLS_SQL = `-- 1) Allow the API (anon) role to read the table
grant select on public.teams to anon, authenticated;

-- 2) RLS policy (skip if "Public read teams" already exists)
alter table public.teams enable row level security;

drop policy if exists "Public read teams" on public.teams;
create policy "Public read teams"
  on public.teams
  for select
  to anon, authenticated
  using (true);`;

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
    resetSupabaseClient();

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
          'Supabase denied read access on teams. You need both GRANT SELECT for anon and an RLS policy — run the SQL below (safe if the policy already exists), then tap Try again.';
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
