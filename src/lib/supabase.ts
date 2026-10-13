import Constants from 'expo-constants';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import type { Team } from '../types/team';

type SupabaseExtra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

function getSupabaseConfig(): { url: string; anonKey: string } {
  const extra = Constants.expoConfig?.extra as SupabaseExtra | undefined;
  const url = extra?.supabaseUrl?.trim() ?? '';
  const anonKey = extra?.supabaseAnonKey?.trim() ?? '';

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_ANON_KEY (or EXPO_PUBLIC_* equivalents) in your environment.',
    );
  }

  return { url, anonKey };
}

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    const { url, anonKey } = getSupabaseConfig();
    client = createClient(url, anonKey);
  }
  return client;
}

export function isSupabaseConfigured(): boolean {
  try {
    getSupabaseConfig();
    return true;
  } catch {
    return false;
  }
}

export async function fetchTeams(): Promise<Team[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('teams')
    .select(
      'id, name, abbreviation, primary_color, total_season_games, ou_line, current_wins, current_losses',
    )
    .order('name');

  if (error) {
    throw error;
  }

  return (data ?? []) as Team[];
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
