import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  rank: number | null;
  rankLoading: boolean;
  pickCount: number;
  teamCount: number;
  supabaseProjectRef: string | null;
};

export function LeagueHeader({
  rank,
  rankLoading,
  pickCount,
  teamCount,
  supabaseProjectRef,
}: Props) {
  const rankLabel = rankLoading
    ? null
    : rank != null
      ? `#${rank}`
      : 'Unranked';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>League Standings</Text>
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
          <Text style={styles.rankValue}>{rankLabel}</Text>
        )}
      </View>
      <Text style={styles.picksHint}>
        {pickCount === 0
          ? 'Tap OVER or UNDER on each team to lock in your picks.'
          : `${pickCount} pick${pickCount === 1 ? '' : 's'} selected`}
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
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
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
  picksHint: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
});
