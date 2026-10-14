import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useSport } from '../contexts/SportContext';
import { computeConfidenceStandings } from '../lib/rankings';
import { fetchAllPredictionsForSport } from '../lib/predictions';
import type { Team } from '../types/team';

type RankState = {
  rank: number | null;
  totalPlayers: number;
  myScore: number;
  clinched: number;
  loading: boolean;
};

export function useOverallConfidenceRank(teams: Team[]): RankState {
  const { user } = useAuth();
  const { sport } = useSport();
  const [state, setState] = useState<RankState>({
    rank: null,
    totalPlayers: 0,
    myScore: 0,
    clinched: 0,
    loading: true,
  });

  const refresh = useCallback(async () => {
    if (!user || !sport || teams.length === 0) {
      setState({
        rank: null,
        totalPlayers: 0,
        myScore: 0,
        clinched: 0,
        loading: false,
      });
      return;
    }

    setState((s) => ({ ...s, loading: true }));

    try {
      const predictions = await fetchAllPredictionsForSport(sport);
      const result = computeConfidenceStandings(user.id, predictions, teams);
      setState({
        rank: result.rank,
        totalPlayers: result.totalPlayers,
        myScore: result.myScore,
        clinched: result.clinched,
        loading: false,
      });
    } catch {
      setState({
        rank: null,
        totalPlayers: 0,
        myScore: 0,
        clinched: 0,
        loading: false,
      });
    }
  }, [user, sport, teams]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return state;
}
