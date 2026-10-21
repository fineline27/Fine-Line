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
import { nbaSeasonLockContext } from '../lib/seasonLockContext';
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

      const members = playerMeta.map((m) => ({
        user_id: m.user_id,
        display_name: m.display_name,
        picks_submitted_at: m.picks_submitted_at,
        joined_at: m.joined_at,
      }));

      const season = nbaSeasonLockContext();

      const bonus =
        bonusBundle.questions.length > 0
          ? { questions: bonusBundle.questions, answers: bonusBundle.answers }
          : undefined;

      const classicLeaderboard = computeLeaderboard(
        user.id,
        predictions,
        teams,
        members,
        bonus,
        season,
      );
      const stakesLeaderboard = computeConfidenceLeaderboard(
        user.id,
        predictions,
        teams,
        members,
        season,
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
