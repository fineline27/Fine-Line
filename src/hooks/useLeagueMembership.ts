import { useCallback, useEffect, useState } from 'react';

import { useLeague } from '../contexts/LeagueContext';
import { fetchMyLeagueMembership, submitLeaguePicks } from '../lib/leagueMembers';
import type { LeagueMember } from '../types/leagueMember';

export function useLeagueMembership() {
  const { activeLeague } = useLeague();
  const [membership, setMembership] = useState<LeagueMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leagueId = activeLeague?.id;
  const picksSubmitted = Boolean(membership?.picks_submitted_at);

  const refresh = useCallback(async () => {
    if (!leagueId) {
      setMembership(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const row = await fetchMyLeagueMembership(leagueId);
      setMembership(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load league membership');
      setMembership(null);
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submitPicks = useCallback(
    async (requiredPickCount: number, currentPickCount: number) => {
      if (!leagueId) {
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        await submitLeaguePicks(leagueId, requiredPickCount, currentPickCount);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit picks');
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [leagueId, refresh],
  );

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
