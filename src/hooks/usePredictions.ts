import { useCallback, useEffect, useState } from 'react';

import { useSport } from '../contexts/SportContext';
import type { SportId } from '../contexts/SportContext';
import {
  deletePredictionForSport,
  fetchPredictionsForSport,
  syncPredictionsToAllSportLeagues,
  upsertPredictionForSport,
} from '../lib/sportPicks';
import type { PickSide } from '../types/team';

export function usePredictions(picksLocked: boolean) {
  const { sport } = useSport();
  const sportId = (sport ?? 'NBA') as SportId;
  const [picks, setPicks] = useState<Record<string, PickSide>>({});
  const [loading, setLoading] = useState(true);
  const [savingTeamId, setSavingTeamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!sport) {
      setPicks({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchPredictionsForSport(sportId);
      setPicks(data);
      await syncPredictionsToAllSportLeagues(sportId, data).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load picks');
      setPicks({});
    } finally {
      setLoading(false);
    }
  }, [sport, sportId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const togglePick = useCallback(
    async (teamId: string, side: PickSide) => {
      if (!sport || picksLocked) {
        return;
      }

      const current = picks[teamId];
      setSavingTeamId(teamId);
      setError(null);

      try {
        if (current === side) {
          await deletePredictionForSport(sportId, teamId);
          setPicks((prev) => {
            const next = { ...prev };
            delete next[teamId];
            return next;
          });
        } else {
          await upsertPredictionForSport(sportId, teamId, side);
          const nextPicks = { ...picks, [teamId]: side };
          setPicks(nextPicks);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save pick');
      } finally {
        setSavingTeamId(null);
      }
    },
    [sport, sportId, picks, picksLocked],
  );

  return {
    picks,
    togglePick,
    loading,
    savingTeamId,
    error,
    refresh,
  };
}
