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

/** Marks picks submitted on every league you are in for this sport (same card everywhere). */
export async function submitPicksForSport(
  sport: string,
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

  const { data: memberships, error: memberError } = await supabase
    .from('league_members')
    .select('league_id')
    .eq('user_id', user.id);

  if (memberError) {
    throw memberError;
  }

  const leagueIds = (memberships ?? []).map((m) => m.league_id).filter(Boolean) as string[];
  if (leagueIds.length === 0) {
    throw new Error('Join a league before submitting.');
  }

  const { data: leagues, error: leagueError } = await supabase
    .from('leagues')
    .select('id')
    .in('id', leagueIds)
    .eq('sport', sport);

  if (leagueError) {
    throw leagueError;
  }

  const sportLeagueIds = (leagues ?? []).map((l) => l.id);
  if (sportLeagueIds.length === 0) {
    throw new Error('No leagues found for this sport.');
  }

  const submittedAt = new Date().toISOString();
  const { error } = await supabase
    .from('league_members')
    .update({ picks_submitted_at: submittedAt })
    .eq('user_id', user.id)
    .in('league_id', sportLeagueIds)
    .is('picks_submitted_at', null);

  if (error) {
    throw error;
  }
}

/** After joining a new league, match submit state if you already submitted elsewhere in this sport. */
export async function alignSubmitStateForSport(
  sport: string,
  requiredPickCount: number,
  currentPickCount: number,
): Promise<void> {
  if (currentPickCount < requiredPickCount) {
    return;
  }

  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return;
  }

  const { data: memberships, error: memberError } = await supabase
    .from('league_members')
    .select('league_id, picks_submitted_at')
    .eq('user_id', user.id);

  if (memberError) {
    return;
  }

  const leagueIds = (memberships ?? []).map((m) => m.league_id).filter(Boolean) as string[];
  if (leagueIds.length === 0) {
    return;
  }

  const { data: leagues } = await supabase
    .from('leagues')
    .select('id')
    .in('id', leagueIds)
    .eq('sport', sport);

  const sportLeagueIds = new Set((leagues ?? []).map((l) => l.id));
  const sportMemberships = (memberships ?? []).filter((m) => sportLeagueIds.has(m.league_id));

  const anySubmitted = sportMemberships.some((m) => m.picks_submitted_at);
  if (!anySubmitted) {
    return;
  }

  const submittedAt = new Date().toISOString();
  await supabase
    .from('league_members')
    .update({ picks_submitted_at: submittedAt })
    .eq('user_id', user.id)
    .in('league_id', [...sportLeagueIds])
    .is('picks_submitted_at', null);
}
