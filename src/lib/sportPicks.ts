import type { SportId } from '../contexts/SportContext';
import type { ConfidencePoints } from '../types/confidence';
import { clampConfidence } from '../types/confidence';
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

export type SportPicksBundle = {
  picks: Record<string, PickSide>;
  confidence: Record<string, ConfidencePoints>;
};

export async function fetchPredictionsForSport(sport: SportId): Promise<SportPicksBundle> {
  const leagueIds = await fetchMyLeagueIdsForSport(sport);
  if (leagueIds.length === 0) {
    return { picks: {}, confidence: {} };
  }

  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { picks: {}, confidence: {} };
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

  type Row = {
    league_id: string;
    team_id: string;
    pick: string;
    confidence_points?: number;
  };

  const full = await supabase
    .from('team_predictions')
    .select('league_id, team_id, pick, confidence_points')
    .eq('user_id', user.id)
    .in('league_id', leagueIds);

  let rows: Row[] = full.data ?? [];
  let error = full.error;

  if (error?.message?.includes('confidence_points')) {
    const fallback = await supabase
      .from('team_predictions')
      .select('league_id, team_id, pick')
      .eq('user_id', user.id)
      .in('league_id', leagueIds);
    rows = fallback.data ?? [];
    error = fallback.error;
  }

  if (error) {
    throw error;
  }

  const byTeam = new Map<string, { side: PickSide; confidence: ConfidencePoints }>();

  function applyRow(row: Row) {
    const side: PickSide = row.pick === 'OVER' ? 'over' : 'under';
    const confidence = clampConfidence(
      typeof row.confidence_points === 'number' ? row.confidence_points : 1,
    );
    byTeam.set(row.team_id, { side, confidence });
  }

  for (const row of rows) {
    if (row.league_id === preferredId) {
      applyRow(row);
    }
  }
  for (const row of rows) {
    if (!byTeam.has(row.team_id)) {
      applyRow(row);
    }
  }

  const picks: Record<string, PickSide> = {};
  const confidence: Record<string, ConfidencePoints> = {};
  for (const [teamId, { side, confidence: pts }] of byTeam) {
    picks[teamId] = side;
    confidence[teamId] = pts;
  }
  return { picks, confidence };
}

export async function syncPredictionsToAllSportLeagues(
  sport: SportId,
  picks: Record<string, PickSide>,
  confidence: Record<string, ConfidencePoints>,
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
      confidence_points: clampConfidence(confidence[teamId] ?? 1),
    })),
  );

  if (rows.length === 0) {
    return;
  }

  let { error } = await supabase.from('team_predictions').upsert(rows, {
    onConflict: 'league_id,user_id,team_id',
  });

  if (error?.message?.includes('confidence_points')) {
    const fallbackRows = rows.map(({ confidence_points: _c, ...rest }) => rest);
    ({ error } = await supabase.from('team_predictions').upsert(fallbackRows, {
      onConflict: 'league_id,user_id,team_id',
    }));
  }

  if (error) {
    throw error;
  }
}

export async function upsertPredictionForSport(
  sport: SportId,
  teamId: string,
  side: PickSide,
  confidencePoints: ConfidencePoints = 1,
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

  const pts = clampConfidence(confidencePoints);
  const rows = leagueIds.map((leagueId) => ({
    league_id: leagueId,
    user_id: user.id,
    team_id: teamId,
    pick: toDbPick(side),
    confidence_points: pts,
  }));

  let { error } = await supabase.from('team_predictions').upsert(rows, {
    onConflict: 'league_id,user_id,team_id',
  });

  if (error?.message?.includes('confidence_points')) {
    const fallbackRows = rows.map(({ confidence_points: _c, ...rest }) => rest);
    ({ error } = await supabase.from('team_predictions').upsert(fallbackRows, {
      onConflict: 'league_id,user_id,team_id',
    }));
  }

  if (error) {
    throw error;
  }
}

export async function updateConfidenceForSport(
  sport: SportId,
  teamId: string,
  side: PickSide,
  confidencePoints: ConfidencePoints,
): Promise<void> {
  await upsertPredictionForSport(sport, teamId, side, confidencePoints);
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
