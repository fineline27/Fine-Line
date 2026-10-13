import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useLeague } from '../contexts/LeagueContext';
import { computeStandings } from '../lib/rankings';
import { fetchAllPredictionsInLeague } from '../lib/predictions';
import type { Team } from '../types/team';

type RankState = {
  rank: number | null;
  totalPlayers: number;
  myScore: number;
  clinched: number;
  loading: boolean;
};

export function useLeagueRank(teams: Team[]): RankState {
  const { user } = useAuth();
  const { activeLeague } = useLeague();
  const [state, setState] = useState<RankState>({
    rank: null,
    totalPlayers: 0,
    myScore: 0,
    clinched: 0,
    loading: true,
  });

  const refresh = useCallback(async () => {
    if (!user || !activeLeague || teams.length === 0) {
      setState({ rank: null, totalPlayers: 0, myScore: 0, clinched: 0, loading: false });
      return;
    }

    setState((s) => ({ ...s, loading: true }));

    try {
      const predictions = await fetchAllPredictionsInLeague(activeLeague.id);
      const result = computeStandings(user.id, predictions, teams);
      setState({ ...result, loading: false });
    } catch {
      setState({ rank: null, totalPlayers: 0, myScore: 0, clinched: 0, loading: false });
    }
  }, [user, activeLeague, teams]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return state;
}
