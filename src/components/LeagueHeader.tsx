import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { colors } from '../theme/colors';

type Props = {
  leagueName: string | null;
  rank: number | null;
  rankLoading: boolean;
  totalPlayers: number;
  myScore: number;
  clinched: number;
  pickCount: number;
  teamCount: number;
  supabaseProjectRef: string | null;
};

export function LeagueHeader({
  leagueName,
  rank,
  rankLoading,
  totalPlayers,
  myScore,
  clinched,
  pickCount,
  teamCount,
  supabaseProjectRef,
}: Props) {
  const rankLabel =
    rankLoading || totalPlayers === 0
      ? null
      : rank != null
        ? `#${rank} of ${totalPlayers}`
        : 'Unranked';

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>Fine Line</Text>
          <Text style={styles.tagline}>Season O/U standings</Text>
        </View>
        <Link href="/league-setup" asChild>
          <Pressable>
            <Text style={styles.link}>League</Text>
          </Pressable>
        </Link>
      </View>
      {leagueName ? <Text style={styles.leagueName}>{leagueName}</Text> : null}
      {teamCount > 0 ? (
        <Text style={styles.teamCount}>{teamCount} teams loaded</Text>
      ) : null}
      {supabaseProjectRef ? (
        <Text style={styles.projectRef}>Supabase: {supabaseProjectRef}</Text>
      ) : null}
      <View style={styles.rankRow}>
        <Text style={styles.rankLabel}>Your rank</Text>
        {rankLoading ? (
          <ActivityIndicator color={colors.accent} size="small" />
        ) : (
          <Text style={styles.rankValue}>{rankLabel ?? '—'}</Text>
        )}
      </View>
      <Text style={styles.scoreLine}>
        Score: {myScore} pts · {clinched} clinched · {pickCount} picks submitted
      </Text>
      <Text style={styles.picksHint}>
        Picks update automatically as team records change in Supabase.
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
  teamCount: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  projectRef: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  rankLabel: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  rankValue: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: '800',
  },
  scoreLine: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
    fontWeight: '500',
  },
  picksHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },
});
