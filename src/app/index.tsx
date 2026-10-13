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

import { LeagueHeader } from '../components/LeagueHeader';
import { TeamCard } from '../components/TeamCard';
import { useTeamPicks } from '../hooks/useTeamPicks';
import { useTeams } from '../hooks/useTeams';
import { useUserRank } from '../hooks/useUserRank';
import type { Team } from '../types/team';
import { colors } from '../theme/colors';

export default function StandingsScreen() {
  const { teams, loading, error, refresh } = useTeams();
  const { rank, loading: rankLoading } = useUserRank();
  const { picks, togglePick, hydrated } = useTeamPicks();

  const pickCount = Object.keys(picks).length;
  const showListLoader = loading || !hydrated;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <LeagueHeader rank={rank} rankLoading={rankLoading} pickCount={pickCount} />

      {showListLoader ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading teams…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Could not load standings</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => void refresh()}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : teams.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No teams yet</Text>
          <Text style={styles.emptyBody}>
            Add rows to the Supabase `teams` table to populate the league.
          </Text>
        </View>
      ) : (
        <FlatList<Team>
          data={teams}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => void refresh()}
              tintColor={colors.accent}
            />
          }
          renderItem={({ item }) => (
            <TeamCard
              team={item}
              pick={picks[item.id]}
              onPickChange={togglePick}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 15,
  },
  errorTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorBody: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyBody: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
