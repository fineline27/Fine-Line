import type { SportId } from '../contexts/SportContext';
import { dedupeBonusQuestions } from './bonusDedupe';
import {
  NBA_BONUS_QUESTION_TEMPLATES,
  type BonusAnswerRow,
  type BonusQuestion,
} from '../types/bonus';
import { fetchMyLeagueIdsForSport } from './sportPicks';
import { getSupabaseClient } from './supabase';

export async function seedBonusQuestionsForLeague(leagueId: string): Promise<void> {
  const existing = await fetchBonusQuestionsForLeague(leagueId);
  const have = new Set(existing.map((q) => q.question_key).filter(Boolean));
  const missing = NBA_BONUS_QUESTION_TEMPLATES.filter((t) => !have.has(t.key));
  if (missing.length === 0) {
    return;
  }

  const supabase = getSupabaseClient();
  const rows = missing.map((t) => ({
    league_id: leagueId,
    question_key: t.key,
    question_text: t.question_text,
    points_worth: t.points_worth,
  }));

  const { error } = await supabase.from('bonus_questions').insert(rows);
  if (error) {
    throw error;
  }
}

/** Ensures MVP / champion / ROY questions exist (creator-only insert via RLS). */
export async function ensureBonusQuestionsForLeague(leagueId: string): Promise<void> {
  await seedBonusQuestionsForLeague(leagueId);
}

export async function fetchBonusQuestionsRawForLeague(leagueId: string): Promise<BonusQuestion[]> {
  const { data, error } = await getSupabaseClient()
    .from('bonus_questions')
    .select('id, league_id, question_key, question_text, points_worth, winning_answer')
    .eq('league_id', leagueId)
    .order('question_key');

  if (error) {
    throw error;
  }
  return (data ?? []) as BonusQuestion[];
}

export async function fetchBonusQuestionsForLeague(leagueId: string): Promise<BonusQuestion[]> {
  return dedupeBonusQuestions(await fetchBonusQuestionsRawForLeague(leagueId));
}

export async function fetchMyBonusAnswers(
  questionIds: string[],
): Promise<Record<string, string>> {
  if (questionIds.length === 0) {
    return {};
  }

  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {};
  }

  const { data, error } = await supabase
    .from('bonus_answers')
    .select('question_id, user_answer')
    .eq('user_id', user.id)
    .in('question_id', questionIds);

  if (error) {
    throw error;
  }

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.question_id] = row.user_answer;
  }
  return map;
}

export async function fetchBonusAnswersForLeague(
  leagueId: string,
): Promise<BonusAnswerRow[]> {
  const questions = await fetchBonusQuestionsRawForLeague(leagueId);
  const ids = questions.map((q) => q.id);
  if (ids.length === 0) {
    return [];
  }

  const { data, error } = await getSupabaseClient()
    .from('bonus_answers')
    .select('question_id, user_id, user_answer, is_correct')
    .in('question_id', ids);

  if (error) {
    throw error;
  }
  return (data ?? []) as BonusAnswerRow[];
}

export async function upsertBonusAnswerForSport(
  sport: SportId,
  questionKey: string,
  answer: string,
): Promise<void> {
  const leagueIds = await fetchMyLeagueIdsForSport(sport);
  if (leagueIds.length === 0) {
    throw new Error('Join a league before saving bonus picks.');
  }

  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Sign in to save bonus picks.');
  }

  const { data: questions, error: qError } = await supabase
    .from('bonus_questions')
    .select('id')
    .in('league_id', leagueIds)
    .eq('question_key', questionKey);

  if (qError) {
    throw qError;
  }

  const questionIds = (questions ?? []).map((q) => q.id);
  if (questionIds.length === 0) {
    throw new Error('Bonus questions are not set up for your leagues yet.');
  }

  const trimmed = answer.trim();
  if (!trimmed) {
    await supabase.from('bonus_answers').delete().eq('user_id', user.id).in('question_id', questionIds);
    return;
  }

  const rows = questionIds.map((questionId) => ({
    question_id: questionId,
    user_id: user.id,
    user_answer: trimmed,
  }));

  const { error } = await supabase.from('bonus_answers').upsert(rows, {
    onConflict: 'question_id,user_id',
  });

  if (error) {
    throw error;
  }
}

export async function upsertBonusAnswer(questionId: string, answer: string): Promise<void> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Sign in to save bonus picks.');
  }

  const trimmed = answer.trim();
  if (!trimmed) {
    await supabase
      .from('bonus_answers')
      .delete()
      .eq('question_id', questionId)
      .eq('user_id', user.id);
    return;
  }

  const { error } = await supabase.from('bonus_answers').upsert(
    {
      question_id: questionId,
      user_id: user.id,
      user_answer: trimmed,
    },
    { onConflict: 'question_id,user_id' },
  );

  if (error) {
    throw error;
  }
}

export function normalizeBonusAnswer(value: string): string {
  return value.trim().toLowerCase();
}

export function scoreBonusAnswer(
  userAnswer: string | undefined,
  winningAnswer: string | null | undefined,
  pointsWorth: number,
): number {
  if (!userAnswer?.trim() || !winningAnswer?.trim()) {
    return 0;
  }
  return normalizeBonusAnswer(userAnswer) === normalizeBonusAnswer(winningAnswer) ? pointsWorth : 0;
}
