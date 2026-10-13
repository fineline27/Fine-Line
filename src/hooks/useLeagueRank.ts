import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useLeague } from '../contexts/LeagueContext';
import { fetchLeagueMembers } from '../lib/leagueMembers';
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

export function useLeagueRank(teams: Team[], picksSubmitted: boolean): RankState {
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
      const members = await fetchLeagueMembers(activeLeague.id);
      const submittedCount = members.filter((m) => m.picks_submitted_at).length;

      if (!picksSubmitted) {
        const ownPredictions = await fetchAllPredictionsInLeague(activeLeague.id);
        const mineOnly = ownPredictions.filter((p) => p.user_id === user.id);
        const result = computeStandings(user.id, mineOnly, teams);
        setState({
          rank: null,
          totalPlayers: submittedCount,
          myScore: result.myScore,
          clinched: result.clinched,
          loading: false,
        });
        return;
      }

      const predictions = await fetchAllPredictionsInLeague(activeLeague.id);
      const result = computeStandings(user.id, predictions, teams);
      setState({
        ...result,
        totalPlayers: submittedCount || result.totalPlayers,
        loading: false,
      });
    } catch {
      setState({ rank: null, totalPlayers: 0, myScore: 0, clinched: 0, loading: false });
    }
  }, [user, activeLeague, teams, picksSubmitted]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return state;
}
