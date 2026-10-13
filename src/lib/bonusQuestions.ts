import {
  NBA_BONUS_QUESTION_TEMPLATES,
  type BonusAnswerRow,
  type BonusQuestion,
} from '../types/bonus';
import { getSupabaseClient } from './supabase';

export async function seedBonusQuestionsForLeague(leagueId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const rows = NBA_BONUS_QUESTION_TEMPLATES.map((t) => ({
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

export async function fetchBonusQuestionsForLeague(leagueId: string): Promise<BonusQuestion[]> {
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
  const questions = await fetchBonusQuestionsForLeague(leagueId);
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
