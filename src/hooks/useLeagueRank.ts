import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useLeague } from '../contexts/LeagueContext';
import { fetchAllPredictionsInLeague } from '../lib/predictions';
import { scorePick } from '../lib/pickScoring';
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
      const teamById = new Map(teams.map((t) => [t.id, t]));
      const scores = new Map<string, number>();
      const clinched = new Map<string, number>();

      for (const row of predictions) {
        const team = teamById.get(row.team_id);
        if (!team) {
          continue;
        }
        const side = row.pick === 'OVER' ? 'over' : 'under';
        const pts = scorePick(team, side);
        scores.set(row.user_id, (scores.get(row.user_id) ?? 0) + pts);
        if (pts === 1) {
          clinched.set(row.user_id, (clinched.get(row.user_id) ?? 0) + 1);
        }
      }

      const myScore = scores.get(user.id) ?? 0;
      const myClinched = clinched.get(user.id) ?? 0;
      const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
      const rankIndex = sorted.findIndex(([id]) => id === user.id);
      const rank = rankIndex >= 0 ? rankIndex + 1 : null;

      setState({
        rank,
        totalPlayers: sorted.length,
        myScore,
        clinched: myClinched,
        loading: false,
      });
    } catch {
      setState({ rank: null, totalPlayers: 0, myScore: 0, clinched: 0, loading: false });
    }
  }, [user, activeLeague, teams]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return state;
}
