import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useSport } from '../contexts/SportContext';
import { fetchBonusBundleForSport, fetchSportPlayerMeta } from '../lib/sportLeaderboard';
import { fetchAllPredictionsForSport, type SportPredictionRow } from '../lib/predictions';
import {
  computeConfidenceLeaderboard,
  computeLeaderboard,
  type LeaderboardEntry,
} from '../lib/rankings';
import type { BonusAnswerRow, BonusQuestion } from '../types/bonus';
import type { Team } from '../types/team';

export type OverallLeaderboardMode = 'classic' | 'stakes';

type State = {
  classicLeaderboard: LeaderboardEntry[];
  stakesLeaderboard: LeaderboardEntry[];
  predictions: SportPredictionRow[];
  bonusQuestions: BonusQuestion[];
  bonusAnswers: BonusAnswerRow[];
  loading: boolean;
  error: string | null;
};

export function useOverallLeaderboard(teams: Team[]) {
  const { user } = useAuth();
  const { sport } = useSport();
  const [state, setState] = useState<State>({
    classicLeaderboard: [],
    stakesLeaderboard: [],
    predictions: [],
    bonusQuestions: [],
    bonusAnswers: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!user || !sport || teams.length === 0) {
      setState({
        classicLeaderboard: [],
        stakesLeaderboard: [],
        predictions: [],
        bonusQuestions: [],
        bonusAnswers: [],
        loading: false,
        error: null,
      });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const [predictions, playerMeta, bonusBundle] = await Promise.all([
        fetchAllPredictionsForSport(sport),
        fetchSportPlayerMeta(sport),
        fetchBonusBundleForSport(sport),
      ]);

      const userIds = new Set(predictions.map((p) => p.user_id));
      const members = [...userIds].map((uid) => {
        const meta = playerMeta.find((m) => m.user_id === uid);
        return {
          user_id: uid,
          display_name: meta?.display_name ?? 'Player',
          picks_submitted_at: meta?.picks_submitted_at ?? null,
        };
      });

      const bonus =
        bonusBundle.questions.length > 0
          ? { questions: bonusBundle.questions, answers: bonusBundle.answers }
          : undefined;

      const classicLeaderboard = computeLeaderboard(user.id, predictions, teams, members, bonus);
      const stakesLeaderboard = computeConfidenceLeaderboard(
        user.id,
        predictions,
        teams,
        members,
      );

      setState({
        classicLeaderboard,
        stakesLeaderboard,
        predictions,
        bonusQuestions: bonusBundle.questions,
        bonusAnswers: bonusBundle.answers,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        classicLeaderboard: [],
        stakesLeaderboard: [],
        predictions: [],
        bonusQuestions: [],
        bonusAnswers: [],
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load overall leaderboard',
      });
    }
  }, [user, sport, teams]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
    showBonus: state.bonusQuestions.length > 0,
  };
}
