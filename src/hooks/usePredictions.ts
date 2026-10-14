import { useCallback, useEffect, useState } from 'react';

import { useSport } from '../contexts/SportContext';
import type { SportId } from '../contexts/SportContext';
import {
  deletePredictionForSport,
  fetchPredictionsForSport,
  syncPredictionsToAllSportLeagues,
  updateConfidenceForSport,
  upsertPredictionForSport,
} from '../lib/sportPicks';
import type { ConfidencePoints } from '../types/confidence';
import type { PickSide } from '../types/team';

export function usePredictions(picksLocked: boolean) {
  const { sport } = useSport();
  const sportId = (sport ?? 'NBA') as SportId;
  const [picks, setPicks] = useState<Record<string, PickSide>>({});
  const [confidence, setConfidence] = useState<Record<string, ConfidencePoints>>({});
  const [loading, setLoading] = useState(true);
  const [savingTeamId, setSavingTeamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!sport) {
      setPicks({});
      setConfidence({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchPredictionsForSport(sportId);
      setPicks(data.picks);
      setConfidence(data.confidence);
      await syncPredictionsToAllSportLeagues(sportId, data.picks, data.confidence).catch(
        () => undefined,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load picks');
      setPicks({});
      setConfidence({});
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
          setConfidence((prev) => {
            const next = { ...prev };
            delete next[teamId];
            return next;
          });
        } else {
          const pts = confidence[teamId] ?? 1;
          await upsertPredictionForSport(sportId, teamId, side, pts);
          const nextPicks = { ...picks, [teamId]: side };
          const nextConfidence = { ...confidence, [teamId]: pts };
          setPicks(nextPicks);
          setConfidence(nextConfidence);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save pick');
      } finally {
        setSavingTeamId(null);
      }
    },
    [sport, sportId, picks, confidence, picksLocked],
  );

  const setTeamConfidence = useCallback(
    async (teamId: string, points: ConfidencePoints) => {
      if (!sport || picksLocked) {
        return;
      }

      const side = picks[teamId];
      if (!side) {
        return;
      }

      setSavingTeamId(teamId);
      setError(null);

      try {
        await updateConfidenceForSport(sportId, teamId, side, points);
        setConfidence((prev) => ({ ...prev, [teamId]: points }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save confidence');
      } finally {
        setSavingTeamId(null);
      }
    },
    [sport, sportId, picks, picksLocked],
  );

  return {
    picks,
    confidence,
    togglePick,
    setTeamConfidence,
    loading,
    savingTeamId,
    error,
    refresh,
  };
}
