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
  lockedOuLines: Record<string, number>;
};

function parseLockedOuLine(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function fetchPredictionsForSport(sport: SportId): Promise<SportPicksBundle> {
  const leagueIds = await fetchMyLeagueIdsForSport(sport);
  if (leagueIds.length === 0) {
    return { picks: {}, confidence: {}, lockedOuLines: {} };
  }

  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { picks: {}, confidence: {}, lockedOuLines: {} };
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
    locked_ou_line?: number | string | null;
  };

  const full = await supabase
    .from('team_predictions')
    .select('league_id, team_id, pick, confidence_points, locked_ou_line')
    .eq('user_id', user.id)
    .in('league_id', leagueIds);

  let rows: Row[] = full.data ?? [];
  let error = full.error;

  if (error?.message?.includes('confidence_points') || error?.message?.includes('locked_ou_line')) {
    const fallback = await supabase
      .from('team_predictions')
      .select('league_id, team_id, pick, confidence_points')
      .eq('user_id', user.id)
      .in('league_id', leagueIds);
    rows = fallback.data ?? [];
    error = fallback.error;
    if (error?.message?.includes('confidence_points')) {
      const minimal = await supabase
        .from('team_predictions')
        .select('league_id, team_id, pick')
        .eq('user_id', user.id)
        .in('league_id', leagueIds);
      rows = minimal.data ?? [];
      error = minimal.error;
    }
  }

  if (error) {
    throw error;
  }

  const byTeam = new Map<
    string,
    { side: PickSide; confidence: ConfidencePoints; lockedOuLine?: number }
  >();

  function applyRow(row: Row) {
    const side: PickSide = row.pick === 'OVER' ? 'over' : 'under';
    const confidence = clampConfidence(
      typeof row.confidence_points === 'number' ? row.confidence_points : 1,
    );
    const locked = parseLockedOuLine(row.locked_ou_line);
    byTeam.set(row.team_id, {
      side,
      confidence,
      lockedOuLine: locked ?? undefined,
    });
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
  const lockedOuLines: Record<string, number> = {};
  for (const [teamId, { side, confidence: pts, lockedOuLine }] of byTeam) {
    picks[teamId] = side;
    confidence[teamId] = pts;
    if (lockedOuLine != null) {
      lockedOuLines[teamId] = lockedOuLine;
    }
  }
  return { picks, confidence, lockedOuLines };
}

export async function syncPredictionsToAllSportLeagues(
  sport: SportId,
  picks: Record<string, PickSide>,
  confidence: Record<string, ConfidencePoints>,
  lockedOuLines: Record<string, number> = {},
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
      ...(lockedOuLines[teamId] != null ? { locked_ou_line: lockedOuLines[teamId] } : {}),
    })),
  );

  if (rows.length === 0) {
    return;
  }

  let { error } = await supabase.from('team_predictions').upsert(rows, {
    onConflict: 'league_id,user_id,team_id',
  });

  if (error?.message?.includes('confidence_points') || error?.message?.includes('locked_ou_line')) {
    const fallbackRows = rows.map(({ confidence_points: _c, locked_ou_line: _l, ...rest }) => rest);
    ({ error } = await supabase.from('team_predictions').upsert(fallbackRows, {
      onConflict: 'league_id,user_id,team_id',
    }));
  }

  if (error) {
    throw error;
  }
}

export type UpsertPickOptions = {
  confidencePoints?: ConfidencePoints;
  lockedOuLine: number;
};

export async function upsertPredictionForSport(
  sport: SportId,
  teamId: string,
  side: PickSide,
  options: UpsertPickOptions,
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

  const pts = clampConfidence(options.confidencePoints ?? 1);
  const rows = leagueIds.map((leagueId) => ({
    league_id: leagueId,
    user_id: user.id,
    team_id: teamId,
    pick: toDbPick(side),
    confidence_points: pts,
    locked_ou_line: options.lockedOuLine,
  }));

  let { error } = await supabase.from('team_predictions').upsert(rows, {
    onConflict: 'league_id,user_id,team_id',
  });

  if (error?.message?.includes('confidence_points') || error?.message?.includes('locked_ou_line')) {
    const fallbackRows = rows.map(({ confidence_points: _c, locked_ou_line: _l, ...rest }) => rest);
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
  lockedOuLine: number,
): Promise<void> {
  await upsertPredictionForSport(sport, teamId, side, {
    confidencePoints,
    lockedOuLine,
  });
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
