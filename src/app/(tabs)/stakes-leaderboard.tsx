import { Redirect } from 'expo-router';

import { OverallLeaderboardPanel } from '../../components/OverallLeaderboardPanel';
import { useAuth } from '../../contexts/AuthContext';
import { useSport } from '../../contexts/SportContext';

export default function StakesLeaderboardTab() {
  const { session, isLoading: authLoading } = useAuth();
  const { sport, isLoading: sportLoading } = useSport();

  if (!authLoading && !session) {
    return <Redirect href="/login" />;
  }

  if (!authLoading && !sportLoading && session && !sport) {
    return <Redirect href="/select-sport" />;
  }

  return <OverallLeaderboardPanel mode="stakes" />;
}
