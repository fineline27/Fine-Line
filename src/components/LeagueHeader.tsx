import { router, type Href } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

const HOME_HREF = '/home' as Href;
const PROFILE_HREF = '/profile' as Href;

import { formatColors } from '../content/overallFormats';
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
  overallClassicScore?: number;
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
  overallClassicScore = 0,
  league,
  myScore,
  clinched: _clinched,
  pickCount,
  teamCount,
  picksSubmitted,
  bonusScore = 0,
}: Props) {
  const leagueRankText = !picksSubmitted ? 'Locked' : formatRank(league);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Fine Line</Text>
          <Text style={styles.tagline}>
            {sport ? `${sport} season O/U` : 'Season O/U standings'}
          </Text>

          <View style={styles.statsStrip}>
            <Pressable
              style={styles.statCellClassic}
              onPress={() => router.push('/overall-leaderboard?mode=classic')}
            >
              <Text style={styles.statLabelClassic}>Classic</Text>
              {overall.loading ? (
                <ActivityIndicator color={formatColors.classic} size="small" />
              ) : (
                <Text style={styles.statRankClassic}>{formatRank(overall)}</Text>
              )}
              <Text style={styles.statMeta}>{overallClassicScore} pts overall</Text>
            </Pressable>

            <Pressable
              style={styles.statCellStakes}
              onPress={() => router.push('/overall-leaderboard?mode=stakes')}
            >
              <Text style={styles.statLabelStakes}>Stakes</Text>
              {overallStakes.loading ? (
                <ActivityIndicator color={formatColors.stakes} size="small" />
              ) : (
                <Text style={styles.statRankStakes}>{formatRank(overallStakes)}</Text>
              )}
              <Text style={styles.statMetaStakes}>{overallStakesScore} pts overall</Text>
            </Pressable>

            <View style={styles.statCellLeague}>
              <Text style={styles.statLabelLeague}>Your league</Text>
              {league.loading ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <Text style={styles.statRankLeague}>{leagueRankText}</Text>
              )}
              <Text style={styles.statMeta} numberOfLines={2}>
                {myScore} pts · {leagueName ?? 'League'}
                {' · '}
                {pickCount}/{teamCount || 30}
                {picksSubmitted ? ' ✓' : ''}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerLinks}>
          <Pressable onPress={() => router.push(HOME_HREF)}>
            <Text style={styles.link}>Home</Text>
          </Pressable>
          <Pressable onPress={() => router.push(PROFILE_HREF)}>
            <Text style={styles.link}>Profile</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/league-setup')}>
            <Text style={styles.link}>Private leagues</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const statCellBase = {
  flex: 1,
  borderRadius: 10,
  paddingVertical: 8,
  paddingHorizontal: 8,
  minWidth: 0,
  borderWidth: 1,
} as const;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.headerGradientStart,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  statsStrip: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  statCellClassic: {
    ...statCellBase,
    backgroundColor: formatColors.classicBg,
    borderColor: formatColors.classic,
  },
  statCellStakes: {
    ...statCellBase,
    backgroundColor: formatColors.stakesBg,
    borderColor: formatColors.stakesBorder,
  },
  statCellLeague: {
    ...statCellBase,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  statLabelClassic: {
    color: formatColors.classic,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statLabelStakes: {
    color: formatColors.stakes,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statLabelLeague: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statRankClassic: {
    color: formatColors.classic,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  statRankStakes: {
    color: formatColors.stakes,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  statRankLeague: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  statMeta: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 3,
    lineHeight: 12,
  },
  statMetaStakes: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 3,
  },
  headerLinks: {
    alignItems: 'flex-end',
    gap: 6,
    paddingTop: 2,
  },
  link: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
});
