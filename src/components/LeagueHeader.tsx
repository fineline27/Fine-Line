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

      <View style={styles.scorePanels}>
        <View style={styles.classicPanel}>
          <Text style={styles.classicPanelLabel}>Your league · Classic</Text>
          <Text style={styles.classicPanelValue}>{myScore} pts</Text>
          <Text style={styles.classicPanelMeta}>
            {bonusScore} bonus · {clinched} clinched · {pickCount}/{teamCount || 30} picks
            {picksSubmitted ? ' · submitted' : ''}
          </Text>
        </View>
        <View style={styles.stakesPanel}>
          <Text style={styles.stakesPanelLabel}>Stakes overall</Text>
          {overallStakes.loading ? (
            <ActivityIndicator color={formatColors.stakesStrong} size="small" style={styles.stakesSpinner} />
          ) : (
            <Text style={styles.stakesPanelValue}>{overallStakesScore} pts</Text>
          )}
          <Text style={styles.stakesPanelMeta}>Red stakes on each team card</Text>
        </View>
      </View>
      {!picksSubmitted ? (
        <Text style={styles.picksHint}>
          Pick all teams, then set the red Stakes (1–3) on every card before you submit.
        </Text>
      ) : null}
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
    borderColor: formatColors.stakesBorder,
  },
  rankCardTitle: {
    fontWeight: '800',
    fontSize: 15,
  },
  rankCardTitleClassic: {
    color: formatColors.classic,
  },
  rankCardTitleStakes: {
    color: formatColors.stakesStrong,
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
    color: formatColors.stakesStrong,
  },
  spinner: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  scorePanels: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  classicPanel: {
    flex: 1,
    backgroundColor: formatColors.classicBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: formatColors.classic,
    padding: 12,
  },
  classicPanelLabel: {
    color: formatColors.classic,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  classicPanelValue: {
    color: formatColors.classic,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  classicPanelMeta: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 4,
    lineHeight: 14,
  },
  stakesPanel: {
    flex: 1,
    backgroundColor: formatColors.stakesBg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: formatColors.stakesBorder,
    padding: 12,
  },
  stakesPanelLabel: {
    color: formatColors.stakesStrong,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stakesPanelValue: {
    color: formatColors.stakesStrong,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 2,
  },
  stakesPanelMeta: {
    color: formatColors.stakes,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  stakesSpinner: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  picksHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 10,
    lineHeight: 17,
  },
});
