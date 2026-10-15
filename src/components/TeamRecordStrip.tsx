import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { formatRecord, formatWinPace } from '../lib/teamStatus';
import type { Team } from '../types/team';
import { colors } from '../theme/colors';

type Props = {
  team: Team;
  style?: StyleProp<ViewStyle>;
};

export function TeamRecordStrip({ team, style }: Props) {
  const gamesPlayed = team.current_wins + team.current_losses;
  const seasonStarted = gamesPlayed > 0;
  const recordLabel = formatRecord(team.current_wins, team.current_losses);

  return (
    <View style={[styles.strip, style]} accessibilityRole="summary">
      <View style={styles.mainBlock}>
        <Text style={styles.label}>Season record</Text>
        {seasonStarted ? (
          <View style={styles.recordRow} accessibilityLabel={`Record ${recordLabel}`}>
            <Text style={styles.wins}>{team.current_wins}</Text>
            <Text style={styles.recordDash}>–</Text>
            <Text style={styles.losses}>{team.current_losses}</Text>
          </View>
        ) : (
          <Text style={styles.notStartedRecord}>0–0</Text>
        )}
        <Text style={styles.gamesMeta}>
          {seasonStarted ? `${gamesPlayed} games played` : 'Season not started'}
        </Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.paceBlock}>
        <Text style={styles.paceLabel}>{seasonStarted ? 'Win pace' : 'Projected wins'}</Text>
        <Text style={styles.paceValue}>{seasonStarted ? formatWinPace(team) : '—'}</Text>
        <Text style={styles.paceHint}>
          {seasonStarted ? 'At current rate' : 'Updated weekly'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mainBlock: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  wins: {
    color: colors.statusOnTrack,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  recordDash: {
    color: colors.textSecondary,
    fontSize: 22,
    fontWeight: '700',
    marginHorizontal: 4,
    lineHeight: 32,
  },
  losses: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  notStartedRecord: {
    color: colors.textSecondary,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
    lineHeight: 32,
  },
  gamesMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 14,
  },
  paceBlock: {
    width: 108,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  paceLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  paceValue: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 4,
    lineHeight: 30,
    textAlign: 'right',
  },
  paceHint: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'right',
  },
});
