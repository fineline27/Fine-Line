import type { LeagueMember } from '../types/leagueMember';
import { getSupabaseClient } from './supabase';

export function defaultDisplayName(email: string | undefined): string {
  const local = email?.split('@')[0]?.trim();
  return local && local.length > 0 ? local : 'Player';
}

export async function fetchLeagueMembers(leagueId: string): Promise<LeagueMember[]> {
  const { data, error } = await getSupabaseClient()
    .from('league_members')
    .select('user_id, league_id, display_name, picks_submitted_at, joined_at')
    .eq('league_id', leagueId)
    .order('joined_at', { ascending: true });

  if (error) {
    throw error;
  }
  return (data ?? []) as LeagueMember[];
}

export async function fetchMyLeagueMembership(leagueId: string): Promise<LeagueMember | null> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('league_members')
    .select('user_id, league_id, display_name, picks_submitted_at, joined_at')
    .eq('league_id', leagueId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return (data as LeagueMember | null) ?? null;
}

export async function submitLeaguePicks(
  leagueId: string,
  requiredPickCount: number,
  currentPickCount: number,
): Promise<void> {
  if (currentPickCount < requiredPickCount) {
    throw new Error(`Pick all ${requiredPickCount} teams before submitting.`);
  }

  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Sign in to submit picks.');
  }

  const { error } = await supabase
    .from('league_members')
    .update({ picks_submitted_at: new Date().toISOString() })
    .eq('league_id', leagueId)
    .eq('user_id', user.id)
    .is('picks_submitted_at', null);

  if (error) {
    throw error;
  }
}
