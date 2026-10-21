import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useSport } from '../contexts/SportContext';
import { fetchBonusBundleForSport, fetchSportPlayerMeta } from '../lib/sportLeaderboard';
import { computeStandings } from '../lib/rankings';
import { fetchAllPredictionsForSport } from '../lib/predictions';
import { nbaSeasonLockContext } from '../lib/seasonLockContext';
import type { Team } from '../types/team';

type RankState = {
  rank: number | null;
  totalPlayers: number;
  myScore: number;
  clinched: number;
  bonusScore: number;
  loading: boolean;
};

export function useOverallRank(teams: Team[]): RankState {
  const { user } = useAuth();
  const { sport } = useSport();
  const [state, setState] = useState<RankState>({
    rank: null,
    totalPlayers: 0,
    myScore: 0,
    clinched: 0,
    bonusScore: 0,
    loading: true,
  });

  const refresh = useCallback(async () => {
    if (!user || !sport || teams.length === 0) {
      setState({
        rank: null,
        totalPlayers: 0,
        myScore: 0,
        clinched: 0,
        bonusScore: 0,
        loading: false,
      });
      return;
    }

    setState((s) => ({ ...s, loading: true }));

    try {
      const season = nbaSeasonLockContext();
      const [predictions, bonusBundle, playerMeta] = await Promise.all([
        fetchAllPredictionsForSport(sport),
        fetchBonusBundleForSport(sport),
        fetchSportPlayerMeta(sport),
      ]);
      const members = playerMeta.map((m) => ({
        user_id: m.user_id,
        display_name: m.display_name,
        picks_submitted_at: m.picks_submitted_at,
        joined_at: m.joined_at,
      }));
      const bonus =
        bonusBundle.questions.length > 0
          ? { questions: bonusBundle.questions, answers: bonusBundle.answers }
          : undefined;
      const result = computeStandings(user.id, predictions, teams, bonus, members, season);
      setState({ ...result, loading: false });
    } catch {
      setState({
        rank: null,
        totalPlayers: 0,
        myScore: 0,
        clinched: 0,
        bonusScore: 0,
        loading: false,
      });
    }
  }, [user, sport, teams]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return state;
}
