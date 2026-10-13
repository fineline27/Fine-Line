import { useCallback, useEffect, useState } from 'react';

import { useLeague } from '../contexts/LeagueContext';
import { deletePrediction, fetchPredictionsForLeague, upsertPrediction } from '../lib/predictions';
import type { PickSide } from '../types/team';

export function usePredictions() {
  const { activeLeague } = useLeague();
  const [picks, setPicks] = useState<Record<string, PickSide>>({});
  const [loading, setLoading] = useState(true);
  const [savingTeamId, setSavingTeamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const leagueId = activeLeague?.id;

  const refresh = useCallback(async () => {
    if (!leagueId) {
      setPicks({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchPredictionsForLeague(leagueId);
      setPicks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load picks');
      setPicks({});
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const togglePick = useCallback(
    async (teamId: string, side: PickSide) => {
      if (!leagueId) {
        return;
      }

      const current = picks[teamId];
      setSavingTeamId(teamId);
      setError(null);

      try {
        if (current === side) {
          await deletePrediction(leagueId, teamId);
          setPicks((prev) => {
            const next = { ...prev };
            delete next[teamId];
            return next;
          });
        } else {
          await upsertPrediction(leagueId, teamId, side);
          setPicks((prev) => ({ ...prev, [teamId]: side }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save pick');
      } finally {
        setSavingTeamId(null);
      }
    },
    [leagueId, picks],
  );

  return {
    picks,
    togglePick,
    loading,
    savingTeamId,
    error,
    refresh,
    leagueId,
  };
}
