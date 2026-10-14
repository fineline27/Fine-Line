import type { PickSide } from '../types/team';
import { toDbPick } from '../types/league';
import { getSupabaseClient } from './supabase';

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

export async function fetchPredictionsForLeague(
  leagueId: string,
): Promise<Record<string, PickSide>> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {};
  }

  const { data, error } = await supabase
    .from('team_predictions')
    .select('team_id, pick')
    .eq('league_id', leagueId)
    .eq('user_id', user.id);

  if (error) {
    throw error;
  }

  const map: Record<string, PickSide> = {};
  for (const row of data ?? []) {
    map[row.team_id] = row.pick === 'OVER' ? 'over' : 'under';
  }
  return map;
}

export async function fetchAllPredictionsInLeague(
  leagueId: string,
): Promise<
  Array<{
    user_id: string;
    team_id: string;
    pick: 'OVER' | 'UNDER';
    locked_ou_line?: number | null;
  }>
> {
  const supabase = getSupabaseClient();
  const full = await supabase
    .from('team_predictions')
    .select('user_id, team_id, pick, locked_ou_line')
    .eq('league_id', leagueId);

  let rows: Array<{
    user_id: string;
    team_id: string;
    pick: string;
    locked_ou_line?: number | string | null;
  }> = full.data ?? [];
  let error = full.error;

  if (error?.message?.includes('locked_ou_line')) {
    const fallback = await supabase
      .from('team_predictions')
      .select('user_id, team_id, pick')
      .eq('league_id', leagueId);
    rows = (fallback.data ?? []) as typeof rows;
    error = fallback.error;
  }

  if (error) {
    throw error;
  }
  return (rows ?? []).map((row) => ({
    user_id: row.user_id,
    team_id: row.team_id,
    pick: row.pick as 'OVER' | 'UNDER',
    locked_ou_line: parseLockedOuLine(
      'locked_ou_line' in row ? row.locked_ou_line : undefined,
    ),
  }));
}

export type SportPredictionRow = {
  user_id: string;
  team_id: string;
  pick: 'OVER' | 'UNDER';
  confidence_points: number;
  locked_ou_line?: number | null;
};

export async function fetchAllPredictionsForSport(sport: string): Promise<SportPredictionRow[]> {
  const supabase = getSupabaseClient();
  const { data: leagues, error: leagueError } = await supabase
    .from('leagues')
    .select('id')
    .eq('sport', sport);

  if (leagueError) {
    throw leagueError;
  }

  const leagueIds = (leagues ?? []).map((l) => l.id);
  if (leagueIds.length === 0) {
    return [];
  }

  const full = await supabase
    .from('team_predictions')
    .select('user_id, team_id, pick, confidence_points, locked_ou_line')
    .in('league_id', leagueIds);

  let rows: Array<{
    user_id: string;
    team_id: string;
    pick: string;
    confidence_points?: number;
    locked_ou_line?: number | string | null;
  }> = full.data ?? [];
  let error = full.error;

  if (error?.message?.includes('confidence_points') || error?.message?.includes('locked_ou_line')) {
    const fallback = await supabase
      .from('team_predictions')
      .select('user_id, team_id, pick, confidence_points')
      .in('league_id', leagueIds);
    rows = fallback.data ?? [];
    error = fallback.error;
    if (error?.message?.includes('confidence_points')) {
      const minimal = await supabase
        .from('team_predictions')
        .select('user_id, team_id, pick')
        .in('league_id', leagueIds);
      rows = minimal.data ?? [];
      error = minimal.error;
    }
  }

  if (error) {
    throw error;
  }

  return rows.map((row) => ({
    user_id: row.user_id,
    team_id: row.team_id,
    pick: row.pick as 'OVER' | 'UNDER',
    confidence_points:
      typeof row.confidence_points === 'number' ? row.confidence_points : 1,
    locked_ou_line: parseLockedOuLine(row.locked_ou_line),
  }));
}

export async function upsertPrediction(
  leagueId: string,
  teamId: string,
  side: PickSide,
): Promise<void> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Sign in to save picks.');
  }

  const { error } = await supabase.from('team_predictions').upsert(
    {
      league_id: leagueId,
      user_id: user.id,
      team_id: teamId,
      pick: toDbPick(side),
    },
    { onConflict: 'league_id,user_id,team_id' },
  );

  if (error) {
    throw error;
  }
}

export async function deletePrediction(leagueId: string, teamId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return;
  }

  await supabase
    .from('team_predictions')
    .delete()
    .eq('league_id', leagueId)
    .eq('user_id', user.id)
    .eq('team_id', teamId);
}
