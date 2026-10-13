import { useCallback, useEffect, useState } from 'react';

import { useLeague } from '../contexts/LeagueContext';
import { useSport } from '../contexts/SportContext';
import {
  alignSubmitStateForSport,
  fetchMyLeagueMembership,
  submitPicksForSport,
} from '../lib/leagueMembers';
import type { LeagueMember } from '../types/leagueMember';

export function useLeagueMembership(pickCount: number, requiredPickCount: number) {
  const { activeLeague } = useLeague();
  const { sport } = useSport();
  const [membership, setMembership] = useState<LeagueMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leagueId = activeLeague?.id;
  const picksSubmitted = Boolean(membership?.picks_submitted_at);

  const refresh = useCallback(async () => {
    if (!leagueId || !sport) {
      setMembership(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await alignSubmitStateForSport(sport, requiredPickCount, pickCount);
      const row = await fetchMyLeagueMembership(leagueId);
      setMembership(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load league membership');
      setMembership(null);
    } finally {
      setLoading(false);
    }
  }, [leagueId, sport, requiredPickCount, pickCount]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submitPicks = useCallback(async () => {
    if (!sport) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitPicksForSport(sport, requiredPickCount, pickCount);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit picks');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [sport, requiredPickCount, pickCount, refresh]);

  return {
    membership,
    picksSubmitted,
    loading,
    submitting,
    error,
    refresh,
    submitPicks,
  };
}
