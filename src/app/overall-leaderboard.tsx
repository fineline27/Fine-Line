import { Redirect, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

function parseStakesMode(raw: string | string[] | undefined): boolean {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === 'stakes' || value === 'confidence';
}

/** Deep links from older builds → matching leaderboard tab. */
export default function OverallLeaderboardRedirect() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const isStakes = useMemo(() => parseStakesMode(params.mode), [params.mode]);

  if (isStakes) {
    return <Redirect href="/stakes-leaderboard" />;
  }
  return <Redirect href="/classic-leaderboard" />;
}
