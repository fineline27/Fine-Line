import { Redirect } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LeaderboardPlayerRow } from '../../components/LeaderboardPlayerRow';
import { useAuth } from '../../contexts/AuthContext';
import { useLeague } from '../../contexts/LeagueContext';
import { useSport } from '../../contexts/SportContext';
import { useLeagueBoard } from '../../hooks/useLeagueBoard';
import { useLeagueMembership } from '../../hooks/useLeagueMembership';
import { useTeams } from '../../hooks/useTeams';
import {
  buildPlayerBonusPicks,
  buildPlayerOuPicks,
} from '../../lib/playerPickDetails';
import { colors } from '../../theme/colors';

type Segment = 'leaderboard' | 'picks' | 'bonus';

export default function LeagueBoardScreen() {
  const { session, isLoading: authLoading } = useAuth();
  const { sport, isLoading: sportLoading } = useSport();
  const { activeLeague, isLoading: leagueLoading } = useLeague();
  const { teams, loading: teamsLoading, refresh: refreshTeams } = useTeams();
  const { picksSubmitted, loading: membershipLoading, refresh: refreshMembership } =
    useLeagueMembership();
  const {
    leaderboard,
    predictions,
    teamPicks,
    bonusQuestions,
    bonusAnswers,
    members,
    loading,
    error,
    refresh,
  } = useLeagueBoard(teams, picksSubmitted);
  const [segment, setSegment] = useState<Segment>('leaderboard');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const showBonus = Boolean(activeLeague?.bonus_questions_enabled && bonusQuestions.length > 0);

  if (!authLoading && !session) {
    return <Redirect href="/login" />;
  }

  if (!authLoading && !sportLoading && session && !sport) {
    return <Redirect href="/select-sport" />;
  }

  if (!authLoading && !leagueLoading && session && !activeLeague) {
    return <Redirect href="/league-setup" />;
  }

  const busy = teamsLoading || membershipLoading || loading;

  async function onRefresh() {
    await Promise.all([refreshTeams(), refreshMembership(), refresh()]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>League board</Text>
        <Text style={styles.subtitle}>{activeLeague?.name ?? 'Your league'}</Text>
      </View>

      {!picksSubmitted ? (
        <View style={styles.lockedWrap}>
          <Text style={styles.lockedTitle}>Board locked</Text>
          <Text style={styles.lockedBody}>
            Submit your full pick card on the My picks tab first. Then you can see everyone’s
            selections and live league standings here.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.segmentRow}>
            <Pressable
              style={[styles.segment, segment === 'leaderboard' && styles.segmentActive]}
              onPress={() => setSegment('leaderboard')}
            >
              <Text
                style={[
                  styles.segmentText,
                  segment === 'leaderboard' && styles.segmentTextActive,
                ]}
              >
                Leaderboard
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segment, segment === 'picks' && styles.segmentActive]}
              onPress={() => setSegment('picks')}
            >
              <Text
                style={[styles.segmentText, segment === 'picks' && styles.segmentTextActive]}
              >
                O/U picks
              </Text>
            </Pressable>
            {showBonus ? (
              <Pressable
                style={[styles.segment, segment === 'bonus' && styles.segmentActive]}
                onPress={() => setSegment('bonus')}
              >
                <Text
                  style={[styles.segmentText, segment === 'bonus' && styles.segmentTextActive]}
                >
                  Bonus
                </Text>
              </Pressable>
            ) : null}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {busy && leaderboard.length === 0 ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : segment === 'leaderboard' ? (
            <FlatList
              data={leaderboard}
              keyExtractor={(item) => item.userId}
              refreshControl={
                <RefreshControl refreshing={busy} onRefresh={() => void onRefresh()} tintColor={colors.accent} />
              }
              contentContainerStyle={styles.listContent}
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
              ListHeaderComponent={
                <Text style={styles.listHint}>
                  Rankings update when you refresh after NBA wins and losses change team records.
                  {showBonus ? ' Ties break on bonus points (MVP, champion, ROY).' : ''}
                </Text>
              }
            />
          ) : segment === 'picks' ? (
            <ScrollView
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={busy} onRefresh={() => void onRefresh()} tintColor={colors.accent} />
              }
            >
              <Text style={styles.listHint}>
                Only members who submitted picks are shown. OVER / UNDER per team.
              </Text>
              {teamPicks.map(({ team, entries }) => (
                <View key={team.id} style={styles.teamBlock}>
                  <Text style={styles.teamTitle}>
                    {team.abbreviation} · O/U {team.ou_line.toFixed(1)}
                  </Text>
                  {entries.length === 0 ? (
                    <Text style={styles.emptyPicks}>No submitted picks yet</Text>
                  ) : (
                    entries.map((entry) => (
                      <View key={`${team.id}-${entry.userId}`} style={styles.pickRow}>
                        <Text style={styles.pickName}>{entry.displayName}</Text>
                        <Text
                          style={[
                            styles.pickSide,
                            entry.pick === 'over' ? styles.pickOver : styles.pickUnder,
                          ]}
                        >
                          {entry.pick === 'over' ? 'OVER' : 'UNDER'}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              ))}
            </ScrollView>
          ) : (
            <ScrollView
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={busy} onRefresh={() => void onRefresh()} tintColor={colors.accent} />
              }
            >
              <Text style={styles.listHint}>
                Bonus answers from members who submitted. Points count once official results are
                set on each question.
              </Text>
              {members
                .filter((m) => m.picks_submitted_at)
                .map((member) => {
                  const name = member.display_name?.trim() || 'Player';
                  return (
                    <View key={member.user_id} style={styles.teamBlock}>
                      <Text style={styles.teamTitle}>{name}</Text>
                      {bonusQuestions.map((q) => {
                        const ans = bonusAnswers.find(
                          (a) =>
                            a.question_id === q.id && a.user_id === member.user_id,
                        );
                        return (
                          <View key={q.id} style={styles.pickRow}>
                            <Text style={styles.pickName}>{q.question_text}</Text>
                            <Text style={styles.pickSide}>{ans?.user_answer ?? '—'}</Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
            </ScrollView>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 15,
  },
  lockedWrap: {
    margin: 20,
    padding: 20,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lockedTitle: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 18,
  },
  lockedBody: {
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
    fontSize: 14,
  },
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentActive: {
    backgroundColor: colors.pickActive,
    borderColor: '#60a5fa',
  },
  segmentText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  segmentTextActive: {
    color: '#fff',
  },
  error: {
    color: colors.statusNeedsWork,
    paddingHorizontal: 20,
    paddingTop: 8,
    fontSize: 13,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  listHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 17,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  rowMe: {
    borderColor: colors.accent,
  },
  rankCol: {
    width: 44,
  },
  rankText: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 18,
  },
  nameCol: {
    flex: 1,
  },
  nameText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  pendingText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  scoreText: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 20,
    minWidth: 36,
    textAlign: 'right',
  },
  teamBlock: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  teamTitle: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 8,
  },
  emptyPicks: {
    color: colors.textMuted,
    fontSize: 12,
  },
  pickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  pickName: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  pickSide: {
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  pickOver: {
    color: '#4ade80',
  },
  pickUnder: {
    color: '#f87171',
  },
});
