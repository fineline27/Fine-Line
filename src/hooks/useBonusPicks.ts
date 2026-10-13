import { useCallback, useEffect, useState } from 'react';

import { useLeague } from '../contexts/LeagueContext';
import { useSport } from '../contexts/SportContext';
import type { SportId } from '../contexts/SportContext';
import {
  ensureBonusQuestionsForLeague,
  fetchBonusQuestionsRawForLeague,
  fetchMyBonusAnswers,
  upsertBonusAnswerForSport,
} from '../lib/bonusQuestions';
import { dedupeBonusQuestions, mapAnswersToDedupedQuestions } from '../lib/bonusDedupe';
import { BONUS_SETUP_SQL_HINT, isBonusSetupError } from '../lib/bonusSchema';
import type { BonusQuestion } from '../types/bonus';

export function useBonusPicks(picksLocked: boolean) {
  const { activeLeague } = useLeague();
  const { sport } = useSport();
  const sportId = (sport ?? 'NBA') as SportId;
  const leagueId = activeLeague?.id;

  const [questions, setQuestions] = useState<BonusQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);

  const refresh = useCallback(async () => {
    if (!leagueId) {
      setQuestions([]);
      setAnswers({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSetupRequired(false);
    try {
      let qsRaw = await fetchBonusQuestionsRawForLeague(leagueId);
      if (dedupeBonusQuestions(qsRaw).length < 3) {
        try {
          await ensureBonusQuestionsForLeague(leagueId);
          qsRaw = await fetchBonusQuestionsRawForLeague(leagueId);
        } catch {
          // Non-creators rely on supabase/06-mandatory-bonus-questions.sql for backfill.
        }
      }
      const qsDeduped = dedupeBonusQuestions(qsRaw);
      setQuestions(qsDeduped);
      const mineRaw = await fetchMyBonusAnswers(qsRaw.map((q) => q.id));
      setAnswers(mapAnswersToDedupedQuestions(qsRaw, qsDeduped, mineRaw));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load bonus questions';
      if (isBonusSetupError(message)) {
        setSetupRequired(true);
        setError(BONUS_SETUP_SQL_HINT);
      } else {
        setError(message);
      }
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
      const question = questions.find((q) => q.id === questionId);
      const questionKey = question?.question_key;
      if (!questionKey) {
        setError('Could not save bonus pick for this question.');
        return;
      }
      setSavingQuestionId(questionId);
      setError(null);
      try {
        await upsertBonusAnswerForSport(sportId, questionKey, value);
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
    [picksLocked, questions, sportId],
  );

  const allAnswered =
    setupRequired ||
    (questions.length >= 3 &&
      questions.every((q) => Boolean(answers[q.id]?.trim())));

  return {
    enabled: questions.length > 0,
    setupRequired,
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
