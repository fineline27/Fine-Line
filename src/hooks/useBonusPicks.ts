import { useCallback, useEffect, useState } from 'react';

import { useLeague } from '../contexts/LeagueContext';
import {
  ensureBonusQuestionsForLeague,
  fetchBonusQuestionsForLeague,
  fetchMyBonusAnswers,
  upsertBonusAnswer,
} from '../lib/bonusQuestions';
import type { BonusQuestion } from '../types/bonus';

export function useBonusPicks(picksLocked: boolean) {
  const { activeLeague } = useLeague();
  const leagueId = activeLeague?.id;

  const [questions, setQuestions] = useState<BonusQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!leagueId) {
      setQuestions([]);
      setAnswers({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let qs = await fetchBonusQuestionsForLeague(leagueId);
      if (qs.length < 3) {
        try {
          await ensureBonusQuestionsForLeague(leagueId);
          qs = await fetchBonusQuestionsForLeague(leagueId);
        } catch {
          // Non-creators rely on supabase/06-mandatory-bonus-questions.sql for backfill.
        }
      }
      setQuestions(qs);
      const mine = await fetchMyBonusAnswers(qs.map((q) => q.id));
      setAnswers(mine);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bonus questions');
      setQuestions([]);
      setAnswers({});
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setAnswer = useCallback(
    async (questionId: string, value: string) => {
      if (picksLocked) {
        return;
      }
      setSavingQuestionId(questionId);
      setError(null);
      try {
        await upsertBonusAnswer(questionId, value);
        setAnswers((prev) => {
          const next = { ...prev };
          const trimmed = value.trim();
          if (trimmed) {
            next[questionId] = trimmed;
          } else {
            delete next[questionId];
          }
          return next;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save bonus pick');
      } finally {
        setSavingQuestionId(null);
      }
    },
    [picksLocked],
  );

  const allAnswered = questions.length >= 3 && questions.every((q) => Boolean(answers[q.id]?.trim()));

  return {
    enabled: questions.length > 0,
    questions,
    answers,
    loading,
    savingQuestionId,
    error,
    allAnswered,
    refresh,
    setAnswer,
  };
}
