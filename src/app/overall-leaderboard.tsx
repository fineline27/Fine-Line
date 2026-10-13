import { Link, Redirect } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LeaderboardPlayerRow } from '../components/LeaderboardPlayerRow';
import { useAuth } from '../contexts/AuthContext';
import { useSport } from '../contexts/SportContext';
import { useOverallLeaderboard } from '../hooks/useOverallLeaderboard';
import { useTeams } from '../hooks/useTeams';
import {
  buildPlayerBonusPicks,
  buildPlayerOuPicks,
} from '../lib/playerPickDetails';
import { colors } from '../theme/colors';

export default function OverallLeaderboardScreen() {
  const { session, isLoading: authLoading } = useAuth();
  const { sport, isLoading: sportLoading } = useSport();
  const { teams, loading: teamsLoading, refresh: refreshTeams } = useTeams();
  const {
    leaderboard,
    predictions,
    bonusQuestions,
    bonusAnswers,
    showBonus,
    loading,
    error,
    refresh,
  } = useOverallLeaderboard(teams);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  if (!authLoading && !session) {
    return <Redirect href="/login" />;
  }

  if (!authLoading && !sportLoading && session && !sport) {
    return <Redirect href="/select-sport" />;
  }

  const busy = teamsLoading || loading;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Link href="/" asChild>
          <Pressable>
            <Text style={styles.back}>← Back</Text>
          </Pressable>
        </Link>
        <Text style={styles.title}>Overall {sport ?? ''}</Text>
        <Text style={styles.subtitle}>All Fine Line players · best unique O/U picks</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {busy && leaderboard.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={busy}
              onRefresh={() => void Promise.all([refreshTeams(), refresh()])}
              tintColor={colors.accent}
            />
          }
          ListHeaderComponent={
            <Text style={styles.listHint}>
              Ties on O/U points break on bonus picks (MVP, champion, ROY) where leagues use
              them. Tap a player to see their selections.
            </Text>
          }
          renderItem={({ item }) => (
            <LeaderboardPlayerRow
              entry={item}
              expanded={expandedUserId === item.userId}
              onToggle={() =>
                setExpandedUserId((id) => (id === item.userId ? null : item.userId))
              }
              ouPicks={buildPlayerOuPicks(item.userId, teams, predictions)}
              bonusPicks={buildPlayerBonusPicks(item.userId, bonusQuestions, bonusAnswers)}
              showBonus={showBonus}
              canExpand={item.picksSubmitted}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { color: colors.accent, fontWeight: '700', marginBottom: 8 },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, marginTop: 4, fontSize: 14 },
  error: { color: colors.statusNeedsWork, padding: 16, fontSize: 13 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, paddingBottom: 32 },
  listHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 17,
  },
});
