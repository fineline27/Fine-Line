import { Redirect } from 'expo-router';
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

import { LeagueHeader } from '../../components/LeagueHeader';
import { TeamCard } from '../../components/TeamCard';
import { useAuth } from '../../contexts/AuthContext';
import { useLeague } from '../../contexts/LeagueContext';
import { useSport } from '../../contexts/SportContext';
import { useLeagueMembership } from '../../hooks/useLeagueMembership';
import { useLeagueRank } from '../../hooks/useLeagueRank';
import { useOverallRank } from '../../hooks/useOverallRank';
import { usePredictions } from '../../hooks/usePredictions';
import { TEAMS_RLS_SQL, useTeams } from '../../hooks/useTeams';
import type { Team } from '../../types/team';
import { getSupabaseProjectRef } from '../../lib/supabaseConfig';
import { colors } from '../../theme/colors';

export default function StandingsScreen() {
  const { session, isLoading: authLoading } = useAuth();
  const { sport, isLoading: sportLoading } = useSport();
  const { activeLeague, isLoading: leagueLoading } = useLeague();
  const { teams, loading, error, refresh } = useTeams();
  const {
    picksSubmitted,
    submitting,
    submitPicks,
    error: membershipError,
    refresh: refreshMembership,
  } = useLeagueMembership();
  const {
    picks,
    togglePick,
    loading: picksLoading,
    savingTeamId,
    error: picksError,
    refresh: refreshPicks,
  } = usePredictions(picksSubmitted);
  const overallRank = useOverallRank(teams);
  const leagueRank = useLeagueRank(teams, picksSubmitted);
  const myScore = leagueRank.myScore;
  const clinched = leagueRank.clinched;

  const pickCount = Object.keys(picks).length;
  const requiredPicks = teams.length;
  const canSubmit = !picksSubmitted && requiredPicks > 0 && pickCount >= requiredPicks;
  const showListLoader = loading || picksLoading || leagueLoading;
  const supabaseProjectRef = getSupabaseProjectRef();

  if (!authLoading && !session) {
    return <Redirect href="/login" />;
  }

  if (!authLoading && !sportLoading && session && !sport) {
    return <Redirect href="/select-sport" />;
  }

  if (!authLoading && !leagueLoading && session && !activeLeague) {
    return <Redirect href="/league-setup" />;
  }

  async function onRefresh() {
    await Promise.all([refresh(), refreshPicks(), refreshMembership()]);
  }

  async function onSubmitPicks() {
    try {
      await submitPicks(requiredPicks, pickCount);
      await refreshPicks();
    } catch {
      // error surfaced via membershipError / submit hook
    }
  }

  const leagueRankDisplay = picksSubmitted
    ? leagueRank
    : { ...leagueRank, rank: null as number | null };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <LeagueHeader
        leagueName={activeLeague?.name ?? null}
        sport={sport}
        overall={{
          rank: overallRank.rank,
          totalPlayers: overallRank.totalPlayers,
          loading: overallRank.loading,
        }}
        league={{
          rank: leagueRankDisplay.rank,
          totalPlayers: leagueRank.totalPlayers,
          loading: leagueRank.loading,
        }}
        myScore={myScore}
        clinched={clinched}
        pickCount={pickCount}
        teamCount={teams.length}
        picksSubmitted={picksSubmitted}
        supabaseProjectRef={supabaseProjectRef}
      />

      {picksError ? <Text style={styles.pickError}>{picksError}</Text> : null}
      {membershipError ? <Text style={styles.pickError}>{membershipError}</Text> : null}

      {showListLoader ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading teams…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Could not load standings</Text>
          <Text style={styles.errorBody}>{error}</Text>
          {error.toLowerCase().includes('row level security') ||
          error.toLowerCase().includes('permission denied') ? (
            <View style={styles.sqlBox}>
              <Text style={styles.sqlLabel}>Supabase SQL Editor</Text>
              <Text style={styles.sqlText} selectable>
                {TEAMS_RLS_SQL}
              </Text>
            </View>
          ) : null}
          <Pressable style={styles.retryButton} onPress={() => void onRefresh()}>
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
          style={styles.list}
          data={teams}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          initialNumToRender={30}
          refreshControl={
            <RefreshControl
              refreshing={loading || picksLoading}
              onRefresh={() => void onRefresh()}
              tintColor={colors.accent}
            />
          }
          renderItem={({ item }) => (
            <TeamCard
              team={item}
              pick={picks[item.id]}
              saving={savingTeamId === item.id}
              picksLocked={picksSubmitted}
              onPickChange={(teamId, side) => void togglePick(teamId, side)}
            />
          )}
          ListHeaderComponent={
            !picksSubmitted ? (
              <View style={styles.submitBanner}>
                <Text style={styles.submitTitle}>Finish your card</Text>
                <Text style={styles.submitBody}>
                  Pick OVER or UNDER on every team ({pickCount}/{requiredPicks}), then submit to
                  open the league board.
                </Text>
                <Pressable
                  style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
                  disabled={!canSubmit || submitting}
                  onPress={() => void onSubmitPicks()}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text
                      style={[
                        styles.submitButtonText,
                        canSubmit && styles.submitButtonTextActive,
                      ]}
                    >
                      {canSubmit ? 'Submit picks' : `${requiredPicks - pickCount} picks left`}
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <View style={styles.lockedBanner}>
                <Text style={styles.lockedText}>Picks locked · view the League tab for the board</Text>
              </View>
            )
          }
          ListFooterComponent={
            teams.length > 0 ? (
              <Text style={styles.footerHint}>
                End of list · {teams.length} teams · pull to refresh scores
              </Text>
            ) : null
          }
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
  pickError: {
    color: colors.statusNeedsWork,
    paddingHorizontal: 20,
    paddingBottom: 8,
    fontSize: 13,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  submitBanner: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  submitTitle: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 16,
  },
  submitBody: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  submitButton: {
    marginTop: 12,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitButtonText: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 15,
  },
  lockedBanner: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lockedText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
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
  sqlBox: {
    marginTop: 16,
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  sqlLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sqlText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
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
  footerHint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
