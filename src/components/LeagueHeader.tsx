import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';

const PROFILE_HREF = '/profile' as Href;

import { OverallFormatsGuide } from './OverallFormatsGuide';
import { classicFormat, formatColors, stakesFormat } from '../content/overallFormats';
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
  overallStakes: RankBlock;
  overallStakesScore?: number;
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
  overallStakes,
  overallStakesScore = 0,
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
        <View style={styles.headerLinks}>
          <Link href={PROFILE_HREF} asChild>
            <Pressable>
              <Text style={styles.link}>Profile</Text>
            </Pressable>
          </Link>
          <Link href="/league-setup" asChild>
            <Pressable>
              <Text style={styles.link}>Private leagues</Text>
            </Pressable>
          </Link>
        </View>
      </View>
      {leagueName ? <Text style={styles.leagueName}>{leagueName}</Text> : null}

      <Text style={styles.formatsIntro}>
        Two separate overall rankings — same picks, different scoring.
      </Text>

      <View style={styles.rankCards}>
        <Link href="/overall-leaderboard?mode=classic" asChild>
          <Pressable style={[styles.rankCard, styles.rankCardClassic]}>
            <Text style={[styles.rankCardTitle, styles.rankCardTitleClassic]}>
              {classicFormat.title}
            </Text>
            <Text style={styles.rankCardHint}>+1 per win · bonus ties</Text>
            {overall.loading ? (
              <ActivityIndicator color={formatColors.classic} size="small" style={styles.spinner} />
            ) : (
              <Text style={[styles.rankCardValue, styles.rankCardValueClassic]}>
                {formatRank(overall)}
              </Text>
            )}
          </Pressable>
        </Link>
        <Link href="/overall-leaderboard?mode=stakes" asChild>
          <Pressable style={[styles.rankCard, styles.rankCardStakes]}>
            <Text style={[styles.rankCardTitle, styles.rankCardTitleStakes]}>
              {stakesFormat.title}
            </Text>
            <Text style={styles.rankCardHintStakes}>1–3 stake · win or lose all</Text>
            {overallStakes.loading ? (
              <ActivityIndicator color={formatColors.stakes} size="small" style={styles.spinner} />
            ) : (
              <Text style={[styles.rankCardValue, styles.rankCardValueStakes]}>
                {formatRank(overallStakes)}
              </Text>
            )}
          </Pressable>
        </Link>
      </View>

      <OverallFormatsGuide compact />

      <View style={styles.rankCardsSecond}>
        <View style={styles.rankCardFull}>
          <Text style={styles.rankCardTitle}>Your league</Text>
          <Text style={styles.rankCardHint} numberOfLines={1}>
            {leagueName ?? 'Current league'} · Classic scoring
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
        League (Classic): {myScore} pts · {bonusScore} bonus · {clinched} clinched · {pickCount}/
        {teamCount || 30} picks
        {picksSubmitted ? ' · locked in' : ''}
      </Text>
      {!overallStakes.loading ? (
        <Text style={styles.stakesScoreLine}>
          Stakes overall: {overallStakesScore} pts
          {!overall.loading && overallBonusScore > 0
            ? ` · Classic bonus tiebreak: ${overallBonusScore} pt${overallBonusScore === 1 ? '' : 's'}`
            : ''}
        </Text>
      ) : null}
      <Text style={styles.picksHint}>
        {picksSubmitted
          ? 'Tap Classic or Stakes above for full leaderboards. Pull to refresh scores.'
          : 'Pick all 30 teams, set red Stakes (1–3) on each card, then submit to open your league board.'}
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
  headerLinks: {
    alignItems: 'flex-end',
    gap: 6,
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
  formatsIntro: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    lineHeight: 18,
  },
  rankCards: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  rankCardsSecond: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  rankCardFull: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 88,
  },
  rankCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    minHeight: 96,
  },
  rankCardClassic: {
    backgroundColor: formatColors.classicBg,
    borderColor: formatColors.classic,
  },
  rankCardStakes: {
    backgroundColor: formatColors.stakesBg,
    borderColor: formatColors.stakes,
  },
  rankCardTitle: {
    fontWeight: '800',
    fontSize: 15,
  },
  rankCardTitleClassic: {
    color: formatColors.classic,
  },
  rankCardTitleStakes: {
    color: formatColors.stakes,
  },
  rankCardHint: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  rankCardHintStakes: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  rankCardValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  rankCardValueClassic: {
    color: formatColors.classic,
  },
  rankCardValueStakes: {
    color: formatColors.stakes,
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
  stakesScoreLine: {
    color: formatColors.stakes,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '700',
  },
  picksHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },
});
