import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { assertSupabaseConfig } from './supabaseConfig';
import type { Team } from '../types/team';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    const { url, apiKey } = assertSupabaseConfig();
    client = createClient(url, apiKey);
  }
  return client;
}

export function isSupabaseConfigured(): boolean {
  try {
    assertSupabaseConfig();
    return true;
  } catch {
    return false;
  }
}

export async function fetchTeams(): Promise<Team[]> {
  const supabase = getSupabaseClient();
  const { data, error, count } = await supabase
    .from('teams')
    .select(
      'id, sport, name, abbreviation, primary_color, secondary_color, total_season_games, ou_line, current_wins, current_losses',
      { count: 'exact' },
    )
    .order('name')
    .range(0, 999);

  if (error) {
    throw error;
  }

  const teams = (data ?? []) as Team[];
  if (count != null && count > teams.length) {
    throw new Error(
      `Supabase returned ${teams.length} of ${count} teams. In Dashboard go to Project Settings → Data API → increase "Max rows" (e.g. 1000), then refresh the app.`,
    );
  }

  return teams;
}

export async function fetchUserRank(): Promise<number | null> {
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const { data, error } = await supabase
    .from('league_members')
    .select('rank')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error) {
    // Table may not exist yet in early setups — treat as unranked.
    if (error.code === 'PGRST205' || error.code === '42P01') {
      return null;
    }
    throw error;
  }

  if (data?.rank == null) {
    return null;
  }

  return Number(data.rank);
}
