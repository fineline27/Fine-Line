import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { colors } from '../theme/colors';

type RankBlock = {
  rank: number | null;
  totalPlayers: number;
  loading: boolean;
};

type Props = {
  leagueName: string | null;
  sport: string | null;
  overall: RankBlock;
  league: RankBlock;
  myScore: number;
  clinched: number;
  pickCount: number;
  teamCount: number;
  picksSubmitted: boolean;
  bonusScore?: number;
  overallBonusScore?: number;
  supabaseProjectRef: string | null;
};

function formatRank({ rank, totalPlayers, loading }: RankBlock): string {
  if (loading) {
    return '…';
  }
  if (totalPlayers === 0 || rank == null) {
    return '—';
  }
  return `#${rank} of ${totalPlayers}`;
}

export function LeagueHeader({
  leagueName,
  sport,
  overall,
  league,
  myScore,
  clinched,
  pickCount,
  teamCount,
  picksSubmitted,
  bonusScore = 0,
  overallBonusScore = 0,
  supabaseProjectRef,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>Fine Line</Text>
          <Text style={styles.tagline}>
            {sport ? `${sport} season O/U` : 'Season O/U standings'}
          </Text>
        </View>
        <Link href="/league-setup" asChild>
          <Pressable>
            <Text style={styles.link}>League</Text>
          </Pressable>
        </Link>
      </View>
      {leagueName ? <Text style={styles.leagueName}>{leagueName}</Text> : null}

      <View style={styles.rankCards}>
        <Link href="/overall-leaderboard" asChild>
          <Pressable style={styles.rankCard}>
            <Text style={styles.rankCardTitle}>Overall</Text>
            <Text style={styles.rankCardHint}>All {sport ?? ''} players · tap list</Text>
            {overall.loading ? (
              <ActivityIndicator color={colors.accent} size="small" style={styles.spinner} />
            ) : (
              <Text style={styles.rankCardValue}>{formatRank(overall)}</Text>
            )}
          </Pressable>
        </Link>
        <View style={styles.rankCard}>
          <Text style={styles.rankCardTitle}>Your league</Text>
          <Text style={styles.rankCardHint} numberOfLines={1}>
            {leagueName ?? 'Current league'}
          </Text>
          {league.loading ? (
            <ActivityIndicator color={colors.accent} size="small" style={styles.spinner} />
          ) : (
            <Text style={styles.rankCardValue}>
              {!picksSubmitted ? 'Locked' : formatRank(league)}
            </Text>
          )}
        </View>
      </View>

      {teamCount > 0 ? (
        <Text style={styles.teamCount}>{teamCount} teams loaded</Text>
      ) : null}
      {supabaseProjectRef ? (
        <Text style={styles.projectRef}>Supabase: {supabaseProjectRef}</Text>
      ) : null}
      <Text style={styles.scoreLine}>
        League: {myScore} pts · {bonusScore} bonus · {clinched} clinched · {pickCount}/
        {teamCount || 30} picks
        {picksSubmitted ? ' · locked in' : ''}
      </Text>
      {!overall.loading && overallBonusScore > 0 ? (
        <Text style={styles.overallScoreLine}>
          Overall bonus tiebreak: {overallBonusScore} pt{overallBonusScore === 1 ? '' : 's'}
        </Text>
      ) : null}
      <Text style={styles.picksHint}>
        {picksSubmitted
          ? 'Overall and league ties break on bonus picks when results are set. Pull to refresh.'
          : 'Submit all picks to unlock the league board and see everyone’s selections.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.headerGradientStart,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  link: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 15,
  },
  leagueName: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  rankCards: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  rankCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 88,
  },
  rankCardTitle: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 14,
  },
  rankCardHint: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  rankCardValue: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  spinner: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  teamCount: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
  projectRef: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  scoreLine: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
    fontWeight: '500',
  },
  overallScoreLine: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  picksHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },
});
