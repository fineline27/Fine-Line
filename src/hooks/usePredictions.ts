import { useCallback, useEffect, useState } from 'react';

import { useSport } from '../contexts/SportContext';
import type { SportId } from '../contexts/SportContext';
import {
  clearIgnoredMarketLine,
  clearStoredLockedOuLine,
  loadIgnoredMarketLinesForTeams,
  mergeLockedOuLinesFromDevice,
  writeIgnoredMarketLine,
  writeStoredLockedOuLine,
} from '../lib/lockedOuLineStorage';
import { marketLineDiffersFromPickLock, shouldShowLineChangeOffer } from '../lib/ouLine';
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
  retainLockedLine?: boolean;
};

export type TogglePickResult =
  | { needsLineAcceptance: false }
  | {
      needsLineAcceptance: true;
      teamId: string;
      side: PickSide;
      lockedLine: number;
      marketLine: number;
    };

export function usePredictions(picksLocked: boolean, teams: Team[] = []) {
  const { sport } = useSport();
  const sportId = (sport ?? 'NBA') as SportId;
  const [picks, setPicks] = useState<Record<string, PickSide>>({});
  const [confidence, setConfidence] = useState<Record<string, ConfidencePoints>>({});
  const [lockedOuLines, setLockedOuLines] = useState<Record<string, number>>({});
  const [ignoredMarketLines, setIgnoredMarketLines] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [savingTeamId, setSavingTeamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const teamById = useCallback(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const persistLock = useCallback(
    async (teamId: string, line: number) => {
      await writeStoredLockedOuLine(sportId, teamId, line);
      setLockedOuLines((prev) => ({ ...prev, [teamId]: line }));
    },
    [sportId],
  );

  const refresh = useCallback(async () => {
    if (!sport) {
      setPicks({});
      setConfidence({});
      setLockedOuLines({});
      setIgnoredMarketLines({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchPredictionsForSport(sportId);
      const mergedLocks = await mergeLockedOuLinesFromDevice(
        sportId,
        data.lockedOuLines,
        Object.keys(data.picks),
      );
      setPicks(data.picks);
      setConfidence(data.confidence);
      setLockedOuLines(mergedLocks);
      const ignored = await loadIgnoredMarketLinesForTeams(sportId, Object.keys(data.picks));
      setIgnoredMarketLines(ignored);
      await syncPredictionsToAllSportLeagues(
        sportId,
        data.picks,
        data.confidence,
        mergedLocks,
      ).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load picks');
      setPicks({});
      setConfidence({});
      setLockedOuLines({});
      setIgnoredMarketLines({});
    } finally {
      setLoading(false);
    }
  }, [sport, sportId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const togglePick = useCallback(
    async (teamId: string, side: PickSide, options?: TogglePickOptions): Promise<TogglePickResult> => {
      if (!sport || picksLocked) {
        return { needsLineAcceptance: false };
      }

      const team = teamById().get(teamId);
      if (!team) {
        return { needsLineAcceptance: false };
      }

      const current = picks[teamId];
      const storedLock = lockedOuLines[teamId];
      const lineMoved =
        current != null &&
        marketLineDiffersFromPickLock(storedLock, team, true);

      if (
        current != null &&
        current !== side &&
        lineMoved &&
        !options?.acceptNewLine &&
        !options?.retainLockedLine
      ) {
        return {
          needsLineAcceptance: true,
          teamId,
          side,
          lockedLine: storedLock!,
          marketLine: team.ou_line,
        };
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
          await persistLock(teamId, team.ou_line);
          await clearIgnoredMarketLine(sportId, teamId);
          setIgnoredMarketLines((prev) => {
            const next = { ...prev };
            delete next[teamId];
            return next;
          });
          return { needsLineAcceptance: false };
        }

        if (current === side) {
          await deletePredictionForSport(sportId, teamId);
          await clearStoredLockedOuLine(sportId, teamId);
          await clearIgnoredMarketLine(sportId, teamId);
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
          setIgnoredMarketLines((prev) => {
            const next = { ...prev };
            delete next[teamId];
            return next;
          });
        } else {
          const pts = confidence[teamId] ?? 1;
          let nextLock: number;
          if (current == null) {
            nextLock = team.ou_line;
          } else if (options?.acceptNewLine) {
            nextLock = team.ou_line;
          } else if (storedLock != null) {
            nextLock = storedLock;
          } else {
            nextLock = team.ou_line;
          }

          await upsertPredictionForSport(sportId, teamId, side, {
            confidencePoints: pts,
            lockedOuLine: nextLock,
          });
          await persistLock(teamId, nextLock);
          if (options?.acceptNewLine) {
            await clearIgnoredMarketLine(sportId, teamId);
            setIgnoredMarketLines((prev) => {
              const next = { ...prev };
              delete next[teamId];
              return next;
            });
          }
          setPicks((prev) => ({ ...prev, [teamId]: side }));
          setConfidence((prev) => ({ ...prev, [teamId]: pts }));
        }
        return { needsLineAcceptance: false };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save pick');
        return { needsLineAcceptance: false };
      } finally {
        setSavingTeamId(null);
      }
    },
    [sport, sportId, picks, confidence, lockedOuLines, picksLocked, teamById, persistLock],
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
        const lock = lockedOuLines[teamId] ?? team.ou_line;
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

  const isLineChangeOfferVisible = useCallback(
    (teamId: string) => {
      const team = teamById().get(teamId);
      if (!team || !picks[teamId]) {
        return false;
      }
      return shouldShowLineChangeOffer(
        lockedOuLines[teamId],
        team,
        true,
        ignoredMarketLines[teamId],
      );
    },
    [teamById, picks, lockedOuLines, ignoredMarketLines],
  );

  const dismissLineChangeOffer = useCallback(
    async (teamId: string) => {
      const team = teamById().get(teamId);
      if (!team) {
        return;
      }
      await writeIgnoredMarketLine(sportId, teamId, team.ou_line);
      setIgnoredMarketLines((prev) => ({ ...prev, [teamId]: team.ou_line }));
    },
    [sportId, teamById],
  );

  const reopenLineChangeOffer = useCallback(
    async (teamId: string) => {
      await clearIgnoredMarketLine(sportId, teamId);
      setIgnoredMarketLines((prev) => {
        const next = { ...prev };
        delete next[teamId];
        return next;
      });
    },
    [sportId],
  );

  return {
    picks,
    confidence,
    lockedOuLines,
    togglePick,
    setTeamConfidence,
    isLineChangeOfferVisible,
    dismissLineChangeOffer,
    reopenLineChangeOffer,
    loading,
    savingTeamId,
    error,
    refresh,
  };
}
