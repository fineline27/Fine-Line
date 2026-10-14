import { useCallback, useEffect, useState } from 'react';

import { useSport } from '../contexts/SportContext';
import type { SportId } from '../contexts/SportContext';
import { effectiveLockedOuLine, lineHasMovedFromLock } from '../lib/ouLine';
import {
  deletePredictionForSport,
  fetchPredictionsForSport,
  syncPredictionsToAllSportLeagues,
  updateConfidenceForSport,
  upsertPredictionForSport,
} from '../lib/sportPicks';
import type { ConfidencePoints } from '../types/confidence';
import type { PickSide, Team } from '../types/team';

export type TogglePickOptions = {
  acceptNewLine?: boolean;
};

export function usePredictions(picksLocked: boolean, teams: Team[] = []) {
  const { sport } = useSport();
  const sportId = (sport ?? 'NBA') as SportId;
  const [picks, setPicks] = useState<Record<string, PickSide>>({});
  const [confidence, setConfidence] = useState<Record<string, ConfidencePoints>>({});
  const [lockedOuLines, setLockedOuLines] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [savingTeamId, setSavingTeamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const teamById = useCallback(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const refresh = useCallback(async () => {
    if (!sport) {
      setPicks({});
      setConfidence({});
      setLockedOuLines({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchPredictionsForSport(sportId);
      setPicks(data.picks);
      setConfidence(data.confidence);
      setLockedOuLines(data.lockedOuLines);
      await syncPredictionsToAllSportLeagues(
        sportId,
        data.picks,
        data.confidence,
        data.lockedOuLines,
      ).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load picks');
      setPicks({});
      setConfidence({});
      setLockedOuLines({});
    } finally {
      setLoading(false);
    }
  }, [sport, sportId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const togglePick = useCallback(
    async (teamId: string, side: PickSide, options?: TogglePickOptions) => {
      if (!sport || picksLocked) {
        return { needsLineAcceptance: false as const };
      }

      const team = teamById().get(teamId);
      if (!team) {
        return { needsLineAcceptance: false as const };
      }

      const current = picks[teamId];
      const storedLock = lockedOuLines[teamId];
      const effectiveLock = effectiveLockedOuLine(storedLock, team);
      const lineMoved = current != null && lineHasMovedFromLock(storedLock, team);

      if (
        current != null &&
        current !== side &&
        lineMoved &&
        !options?.acceptNewLine
      ) {
        return { needsLineAcceptance: true as const, teamId, side };
      }

      setSavingTeamId(teamId);
      setError(null);

      try {
        if (current === side && options?.acceptNewLine) {
          const pts = confidence[teamId] ?? 1;
          await upsertPredictionForSport(sportId, teamId, side, {
            confidencePoints: pts,
            lockedOuLine: team.ou_line,
          });
          setLockedOuLines((prev) => ({ ...prev, [teamId]: team.ou_line }));
          return { needsLineAcceptance: false as const };
        }

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
          setLockedOuLines((prev) => {
            const next = { ...prev };
            delete next[teamId];
            return next;
          });
        } else {
          const pts = confidence[teamId] ?? 1;
          const nextLock =
            current == null || options?.acceptNewLine ? team.ou_line : effectiveLock;
          await upsertPredictionForSport(sportId, teamId, side, {
            confidencePoints: pts,
            lockedOuLine: nextLock,
          });
          const nextPicks = { ...picks, [teamId]: side };
          const nextConfidence = { ...confidence, [teamId]: pts };
          const nextLocks = { ...lockedOuLines, [teamId]: nextLock };
          setPicks(nextPicks);
          setConfidence(nextConfidence);
          setLockedOuLines(nextLocks);
        }
        return { needsLineAcceptance: false as const };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save pick');
        return { needsLineAcceptance: false as const };
      } finally {
        setSavingTeamId(null);
      }
    },
    [sport, sportId, picks, confidence, lockedOuLines, picksLocked, teamById],
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

      const team = teamById().get(teamId);
      if (!team) {
        return;
      }

      setSavingTeamId(teamId);
      setError(null);

      try {
        const lock = effectiveLockedOuLine(lockedOuLines[teamId], team);
        await updateConfidenceForSport(sportId, teamId, side, points, lock);
        setConfidence((prev) => ({ ...prev, [teamId]: points }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save confidence');
      } finally {
        setSavingTeamId(null);
      }
    },
    [sport, sportId, picks, lockedOuLines, picksLocked, teamById],
  );

  return {
    picks,
    confidence,
    lockedOuLines,
    togglePick,
    setTeamConfidence,
    loading,
    savingTeamId,
    error,
    refresh,
  };
}
