import type { League } from '../types/league';
import { getSupabaseClient } from './supabase';

function randomInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    const idx = Math.floor(Math.random() * chars.length);
    code += chars[idx];
  }
  return code;
}

export async function createLeague(name: string, sport = 'NBA'): Promise<League> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You must be signed in to create a league.');
  }

  let inviteCode = randomInviteCode();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await supabase
      .from('leagues')
      .insert({
        name,
        invite_code: inviteCode,
        creator_id: user.id,
        sport,
      })
      .select('*')
      .single();

    if (!error && data) {
      await supabase.from('league_members').insert({
        league_id: data.id,
        user_id: user.id,
      });
      return data as League;
    }
    if (error?.code === '23505') {
      inviteCode = randomInviteCode();
      continue;
    }
    throw error ?? new Error('Failed to create league');
  }
  throw new Error('Could not generate a unique invite code.');
}

export async function createSoloLeague(sport = 'NBA'): Promise<League> {
  const {
    data: { user },
  } = await getSupabaseClient().auth.getUser();
  const label = user?.email?.split('@')[0] ?? 'Player';
  return createLeague(`${label}'s Solo Season`, sport);
}

export async function joinLeagueByCode(code: string): Promise<League> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You must be signed in to join a league.');
  }

  const normalized = code.trim().toUpperCase();
  const { data: league, error: findError } = await supabase
    .from('leagues')
    .select('*')
    .eq('invite_code', normalized)
    .maybeSingle();

  if (findError) {
    throw findError;
  }
  if (!league) {
    throw new Error('No league found with that invite code.');
  }

  const { error: memberError } = await supabase.from('league_members').upsert(
    { league_id: league.id, user_id: user.id },
    { onConflict: 'league_id,user_id', ignoreDuplicates: true },
  );

  if (memberError) {
    throw memberError;
  }

  return league as League;
}

export async function joinLeagueByCodeForSport(
  code: string,
  expectedSport: string,
): Promise<League> {
  const league = await joinLeagueByCode(code);
  if (league.sport !== expectedSport) {
    throw new Error(`That league is for ${league.sport}. Switch sport to join it.`);
  }
  return league;
}

export async function fetchMyLeagues(): Promise<League[]> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const { data: memberships, error: memberError } = await supabase
    .from('league_members')
    .select('league_id')
    .eq('user_id', user.id);

  if (memberError) {
    throw memberError;
  }

  const leagueIds = (memberships ?? []).map((m) => m.league_id);
  if (leagueIds.length === 0) {
    return [];
  }

  const { data: leagues, error } = await supabase.from('leagues').select('*').in('id', leagueIds);

  if (error) {
    throw error;
  }

  return (leagues ?? []) as League[];
}
