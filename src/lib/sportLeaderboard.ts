import { getSupabaseClient } from './supabase';
import type { BonusAnswerRow, BonusQuestion } from '../types/bonus';

export type SportPlayerMeta = {
  user_id: string;
  display_name: string;
  picks_submitted_at: string | null;
};

export async function fetchSportPlayerMeta(sport: string): Promise<SportPlayerMeta[]> {
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

  const { data, error } = await supabase
    .from('league_members')
    .select('user_id, display_name, picks_submitted_at')
    .in('league_id', leagueIds);

  if (error) {
    throw error;
  }

  const byUser = new Map<string, SportPlayerMeta>();
  for (const row of data ?? []) {
    const existing = byUser.get(row.user_id);
    const name = row.display_name?.trim() || 'Player';
    if (!existing) {
      byUser.set(row.user_id, {
        user_id: row.user_id,
        display_name: name,
        picks_submitted_at: row.picks_submitted_at,
      });
      continue;
    }
    if (!existing.display_name || existing.display_name === 'Player') {
      existing.display_name = name;
    }
    if (row.picks_submitted_at) {
      existing.picks_submitted_at = row.picks_submitted_at;
    }
  }

  return [...byUser.values()];
}

export async function fetchBonusBundleForSport(sport: string): Promise<{
  questions: BonusQuestion[];
  answers: BonusAnswerRow[];
}> {
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
    return { questions: [], answers: [] };
  }

  const { data: questions, error: qError } = await supabase
    .from('bonus_questions')
    .select('id, league_id, question_key, question_text, points_worth, winning_answer')
    .in('league_id', leagueIds);

  if (qError) {
    throw qError;
  }

  const qs = (questions ?? []) as BonusQuestion[];
  const qIds = qs.map((q) => q.id);
  if (qIds.length === 0) {
    return { questions: qs, answers: [] };
  }

  const { data: answers, error: aError } = await supabase
    .from('bonus_answers')
    .select('question_id, user_id, user_answer, is_correct')
    .in('question_id', qIds);

  if (aError) {
    throw aError;
  }

  return { questions: qs, answers: (answers ?? []) as BonusAnswerRow[] };
}
