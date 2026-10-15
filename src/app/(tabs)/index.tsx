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

import { BonusPicksSection } from '../../components/BonusPicksSection';
import { CollapsiblePanel } from '../../components/CollapsiblePanel';
import { LeagueHeader } from '../../components/LeagueHeader';
import { OverallFormatsGuide } from '../../components/OverallFormatsGuide';
import { TeamCard } from '../../components/TeamCard';
import { useAuth } from '../../contexts/AuthContext';
import { useLeague } from '../../contexts/LeagueContext';
import { useSport } from '../../contexts/SportContext';
import { useBonusPicks } from '../../hooks/useBonusPicks';
import { useLeagueMembership } from '../../hooks/useLeagueMembership';
import { useLeagueRank } from '../../hooks/useLeagueRank';
import { useOverallConfidenceRank } from '../../hooks/useOverallConfidenceRank';
import { useOverallRank } from '../../hooks/useOverallRank';
import { usePredictions } from '../../hooks/usePredictions';
import { useSeasonLock } from '../../hooks/useSeasonLock';
import { TEAMS_RLS_SQL, useTeams } from '../../hooks/useTeams';
import type { Team } from '../../types/team';
import { colors } from '../../theme/colors';

export default function StandingsScreen() {
  const { session, isLoading: authLoading } = useAuth();
  const { sport, isLoading: sportLoading } = useSport();
  const { activeLeague, isLoading: leagueLoading, poolError, refreshLeagues } = useLeague();
  const { teams, loading, error, refresh } = useTeams();
  const { locked: seasonLocked, countdownLabel, lockAtLabel } = useSeasonLock();
  const {
    picks,
    confidence,
    lockedOuLines,
    togglePick,
    setTeamConfidence,
    isLineChangeOfferVisible,
    dismissLineChangeOffer,
    reopenLineChangeOffer,
    loading: picksLoading,
    savingTeamId,
    error: picksError,
    refresh: refreshPicks,
  } = usePredictions(seasonLocked, teams);
  const pickCount = Object.keys(picks).length;
  const requiredPicks = teams.length;
  const {
    picksSubmitted,
    submitting,
    submitPicks,
    error: membershipError,
    refresh: refreshMembership,
  } = useLeagueMembership(pickCount, requiredPicks);
  const {
    questions: bonusQuestions,
    answers: bonusAnswers,
    loading: bonusLoading,
    savingQuestionId: bonusSavingId,
    error: bonusError,
    setupRequired: bonusSetupRequired,
    allAnswered: bonusAllAnswered,
    refresh: refreshBonus,
    setAnswer: setBonusAnswer,
  } = useBonusPicks(seasonLocked);
  const overallRank = useOverallRank(teams);
  const overallConfidenceRank = useOverallConfidenceRank(teams);
  const leagueRank = useLeagueRank(teams, picksSubmitted);
  const myScore = leagueRank.myScore;
  const clinched = leagueRank.clinched;
  const canSubmit =
    !seasonLocked &&
    !picksSubmitted &&
    requiredPicks > 0 &&
    pickCount >= requiredPicks &&
    bonusAllAnswered;
  const lockedOffBoardCount = teams.filter((t) => isLineChangeOfferVisible(t.id)).length;
  const showListLoader = loading || picksLoading || leagueLoading;
  if (!authLoading && !session) {
    return <Redirect href="/login" />;
  }

  if (!authLoading && !sportLoading && session && !sport) {
    return <Redirect href="/home" />;
  }

  async function onRefresh() {
    await Promise.all([
      refresh(),
      refreshPicks(),
      refreshMembership(),
      refreshBonus(),
      refreshLeagues(),
    ]);
  }

  async function onSubmitPicks() {
    try {
      await submitPicks();
      await refreshPicks();
      await refreshMembership();
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
        overallStakes={{
          rank: overallConfidenceRank.rank,
          totalPlayers: overallConfidenceRank.totalPlayers,
          loading: overallConfidenceRank.loading,
        }}
        overallStakesScore={overallConfidenceRank.myScore}
        overallClassicScore={overallRank.myScore}
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
        bonusScore={leagueRank.bonusScore}
        overallBonusScore={overallRank.bonusScore}
      />

      {picksError ? <Text style={styles.pickError}>{picksError}</Text> : null}
      {bonusError && !bonusSetupRequired ? (
        <Text style={styles.pickError}>{bonusError}</Text>
      ) : null}
      {membershipError ? <Text style={styles.pickError}>{membershipError}</Text> : null}

      {poolError ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Overall pool setup</Text>
          <Text style={styles.errorBody}>{poolError}</Text>
          <Pressable style={styles.retryButton} onPress={() => void refreshLeagues()}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : !activeLeague && !leagueLoading ? (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Joining overall pool…</Text>
          <Text style={styles.errorBody}>
            In Supabase SQL Editor, run supabase/RUN-THIS-league-and-pool-fix.sql once, then tap Try again.
          </Text>
          <Pressable style={styles.retryButton} onPress={() => void refreshLeagues()}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : showListLoader ? (
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
              confidence={confidence[item.id] ?? 1}
              lockedOuLine={lockedOuLines[item.id]}
              saving={savingTeamId === item.id}
              picksLocked={seasonLocked}
              onPickChange={(teamId, side, options) => togglePick(teamId, side, options)}
              onConfidenceChange={(teamId, pts) => void setTeamConfidence(teamId, pts)}
              lineChangeOfferVisible={isLineChangeOfferVisible(item.id)}
              onDismissLineChangeOffer={() => void dismissLineChangeOffer(item.id)}
              onReopenLineChangeOffer={() => void reopenLineChangeOffer(item.id)}
            />
          )}
          ListHeaderComponent={
            <>
              <OverallFormatsGuide compact defaultExpanded={false} />
              <CollapsiblePanel
                title={seasonLocked ? 'Picks locked for the season' : countdownLabel}
                hintCollapsed="Tap for how pick locking works"
                hintExpanded="Tap to hide"
                defaultExpanded={false}
                wrapStyle={styles.seasonLockBanner}
                toggleStyle={styles.seasonLockToggle}
              >
                <Text style={styles.seasonLockBody}>
                  {seasonLocked
                    ? 'The first NBA games have started. Your O/U and bonus picks can no longer be changed.'
                    : `One pick card for all your ${sport ?? 'NBA'} leagues. Each pick locks the O/U line at save time — if the line moves later, you keep your locked number until you change the pick (and accept the new line). Classic and Stakes share picks; set a 1–3 stake per team for Stakes. Edit until the first game (${lockAtLabel}).`}
                </Text>
              </CollapsiblePanel>
              {lockedOffBoardCount > 0 ? (
                <CollapsiblePanel
                  title={`${lockedOffBoardCount} pick${lockedOffBoardCount === 1 ? '' : 's'} with a locked line off the board`}
                  hintCollapsed="Tap for what the LOCK badge means"
                  hintExpanded="Tap to hide"
                  defaultExpanded={false}
                  wrapStyle={styles.offBoardLockBanner}
                  toggleStyle={styles.offBoardLockToggle}
                >
                  <Text style={styles.offBoardLockBody}>
                    Those cards show a LOCK badge — you&apos;re graded at your locked line, not the
                    current line. League and overall views show the same when you expand picks.
                  </Text>
                </CollapsiblePanel>
              ) : null}
            </>
          }
          ListFooterComponent={
            <>
              <View style={styles.listFooterBlock}>
                {!bonusLoading && (bonusSetupRequired || bonusQuestions.length === 0) ? (
                  <View style={styles.bonusMissing}>
                    <Text style={styles.bonusMissingText}>
                      {bonusSetupRequired
                        ? bonusError ??
                          'Bonus tiebreakers need a one-time Supabase setup. Run supabase/05-bonus-questions.sql then supabase/06-mandatory-bonus-questions.sql in the SQL Editor, then pull to refresh. You can still pick O/U and submit without bonus until then.'
                        : 'Bonus questions are missing for this league. Run supabase/06-mandatory-bonus-questions.sql in the Supabase SQL Editor, then refresh.'}
                    </Text>
                  </View>
                ) : null}
                {bonusQuestions.length > 0 ? (
                  <BonusPicksSection
                    questions={bonusQuestions}
                    answers={bonusAnswers}
                    teamNames={teams.map((t) => t.name)}
                    loading={bonusLoading}
                    locked={seasonLocked}
                    savingQuestionId={bonusSavingId}
                    onChangeAnswer={(id, value) => void setBonusAnswer(id, value)}
                  />
                ) : null}
                {seasonLocked ? (
                  <View style={styles.lockedBanner}>
                    <Text style={styles.lockedText}>
                      Season locked · view the League tab for standings
                    </Text>
                  </View>
                ) : !picksSubmitted ? (
                  <View style={styles.submitBanner}>
                    <Text style={styles.submitTitle}>Finish your card</Text>
                    <Text style={styles.submitBody}>
                      Pick OVER or UNDER on every team ({pickCount}/{requiredPicks})
                      {bonusSetupRequired
                        ? ', then submit to open the league board (bonus tiebreakers unlock after Supabase setup below).'
                        : ', answer the bonus tiebreakers below, then submit to open the league board.'}
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
                          {canSubmit
                            ? 'Submit picks'
                            : pickCount < requiredPicks
                              ? `${requiredPicks - pickCount} picks left`
                              : !bonusAllAnswered
                                ? 'Answer bonus tiebreakers'
                                : 'Submit picks'}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.lockedBanner}>
                    <Text style={styles.lockedText}>
                      Submitted · you can still edit until the first game ({countdownLabel})
                    </Text>
                  </View>
                )}
              </View>
              {teams.length > 0 ? (
                <Text style={styles.footerHint}>
                  End of list · {teams.length} teams · pull to refresh scores
                </Text>
              ) : null}
            </>
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
  listFooterBlock: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bonusMissing: {
    backgroundColor: colors.statusNeedsWorkBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.statusNeedsWork,
    padding: 12,
    marginBottom: 12,
  },
  bonusMissingText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  offBoardLockBanner: {
    backgroundColor: colors.lineUpdateBg,
    borderColor: colors.lineUpdateBorder,
  },
  offBoardLockToggle: {
    paddingVertical: 0,
  },
  offBoardLockBody: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  seasonLockBanner: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
  },
  seasonLockToggle: {
    paddingVertical: 0,
  },
  seasonLockBody: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
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
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: 15,
  },
  submitButtonTextActive: {
    color: '#fff',
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
