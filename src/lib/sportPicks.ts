import type { SportId } from '../contexts/SportContext';
import type { PickSide } from '../types/team';
import { toDbPick } from '../types/league';
import { OPEN_POOL_INVITE } from './openPool';
import { getSupabaseClient } from './supabase';

export async function fetchMyLeagueIdsForSport(sport: string): Promise<string[]> {
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

  const leagueIds = (memberships ?? []).map((m) => m.league_id).filter(Boolean) as string[];
  if (leagueIds.length === 0) {
    return [];
  }

  const { data: leagues, error } = await supabase
    .from('leagues')
    .select('id, sport, invite_code')
    .in('id', leagueIds);

  if (error) {
    throw error;
  }

  return (leagues ?? [])
    .filter((l) => (l.sport ?? 'NBA') === sport)
    .map((l) => l.id);
}

function preferredLeagueIdForSport(
  sport: SportId,
  leagueIds: string[],
  leaguesMeta: Array<{ id: string; invite_code: string }>,
): string | null {
  const openCode = OPEN_POOL_INVITE[sport];
  const open = leaguesMeta.find((l) => l.invite_code === openCode);
  if (open && leagueIds.includes(open.id)) {
    return open.id;
  }
  return leagueIds[0] ?? null;
}

export async function fetchPredictionsForSport(
  sport: SportId,
): Promise<Record<string, PickSide>> {
  const leagueIds = await fetchMyLeagueIdsForSport(sport);
  if (leagueIds.length === 0) {
    return {};
  }

  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {};
  }

  const { data: leagues } = await supabase
    .from('leagues')
    .select('id, invite_code')
    .in('id', leagueIds);

  const preferredId = preferredLeagueIdForSport(
    sport,
    leagueIds,
    (leagues ?? []) as Array<{ id: string; invite_code: string }>,
  );

  const { data, error } = await supabase
    .from('team_predictions')
    .select('league_id, team_id, pick')
    .eq('user_id', user.id)
    .in('league_id', leagueIds);

  if (error) {
    throw error;
  }

  const byTeam = new Map<string, PickSide>();
  const rows = data ?? [];

  for (const row of rows) {
    if (row.league_id === preferredId) {
      byTeam.set(row.team_id, row.pick === 'OVER' ? 'over' : 'under');
    }
  }
  for (const row of rows) {
    if (!byTeam.has(row.team_id)) {
      byTeam.set(row.team_id, row.pick === 'OVER' ? 'over' : 'under');
    }
  }

  const map: Record<string, PickSide> = {};
  for (const [teamId, side] of byTeam) {
    map[teamId] = side;
  }
  return map;
}

export async function syncPredictionsToAllSportLeagues(
  sport: SportId,
  picks: Record<string, PickSide>,
): Promise<void> {
  const leagueIds = await fetchMyLeagueIdsForSport(sport);
  if (leagueIds.length === 0) {
    return;
  }

  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return;
  }

  const rows = leagueIds.flatMap((leagueId) =>
    Object.entries(picks).map(([teamId, side]) => ({
      league_id: leagueId,
      user_id: user.id,
      team_id: teamId,
      pick: toDbPick(side),
    })),
  );

  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase.from('team_predictions').upsert(rows, {
    onConflict: 'league_id,user_id,team_id',
  });

  if (error) {
    throw error;
  }
}

export async function upsertPredictionForSport(
  sport: SportId,
  teamId: string,
  side: PickSide,
): Promise<void> {
  const leagueIds = await fetchMyLeagueIdsForSport(sport);
  if (leagueIds.length === 0) {
    throw new Error('Join a league before saving picks.');
  }

  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Sign in to save picks.');
  }

  const rows = leagueIds.map((leagueId) => ({
    league_id: leagueId,
    user_id: user.id,
    team_id: teamId,
    pick: toDbPick(side),
  }));

  const { error } = await supabase.from('team_predictions').upsert(rows, {
    onConflict: 'league_id,user_id,team_id',
  });

  if (error) {
    throw error;
  }
}

export async function deletePredictionForSport(sport: SportId, teamId: string): Promise<void> {
  const leagueIds = await fetchMyLeagueIdsForSport(sport);
  if (leagueIds.length === 0) {
    return;
  }

  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return;
  }

  const { error } = await supabase
    .from('team_predictions')
    .delete()
    .eq('user_id', user.id)
    .eq('team_id', teamId)
    .in('league_id', leagueIds);

  if (error) {
    throw error;
  }
}
