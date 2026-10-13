import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { assertSupabaseConfig, getSupabaseProjectRef } from './supabaseConfig';
import type { Team } from '../types/team';

let client: SupabaseClient | null = null;

export function resetSupabaseClient(): void {
  client = null;
}

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    const { url, apiKey } = assertSupabaseConfig();
    client = createClient(url, apiKey, {
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            cache: 'no-store',
          }),
      },
    });
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

const TEAM_COLUMNS =
  'id, sport, name, abbreviation, primary_color, secondary_color, total_season_games, ou_line, current_wins, current_losses';

export async function fetchTeams(): Promise<Team[]> {
  const supabase = getSupabaseClient();
  const projectRef = getSupabaseProjectRef() ?? 'unknown';
  const pageSize = 100;
  const allTeams: Team[] = [];
  let totalCount: number | null = null;
  let page = 0;

  while (true) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await supabase
      .from('teams')
      .select(TEAM_COLUMNS, { count: page === 0 ? 'exact' : undefined })
      .order('name')
      .range(from, to);

    if (error) {
      throw error;
    }

    if (page === 0 && count != null) {
      totalCount = count;
    }

    const batch = (data ?? []) as Team[];
    allTeams.push(...batch);

    if (batch.length < pageSize) {
      break;
    }
    page += 1;
  }

  if (totalCount != null && totalCount > allTeams.length) {
    throw new Error(
      `Project ${projectRef}: Supabase returned ${allTeams.length} of ${totalCount} teams. Check Data API max rows or RLS policies.`,
    );
  }

  if (allTeams.length > 0 && allTeams.length < 30) {
    throw new Error(
      `Project ${projectRef}: only ${allTeams.length} teams returned (expected 30). In Supabase SQL Editor run supabase/add-missing-nba-teams.sql, then refresh.`,
    );
  }

  return allTeams;
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
