import type { PickSide } from '../types/team';
import { toDbPick } from '../types/league';
import { getSupabaseClient } from './supabase';

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
): Promise<Array<{ user_id: string; team_id: string; pick: 'OVER' | 'UNDER' }>> {
  const { data, error } = await getSupabaseClient()
    .from('team_predictions')
    .select('user_id, team_id, pick')
    .eq('league_id', leagueId);

  if (error) {
    throw error;
  }
  return data ?? [];
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
