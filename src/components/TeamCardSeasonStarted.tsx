import { StyleSheet, Text, View } from 'react-native';

import { effectiveLockedOuLine } from '../lib/ouLine';
import { getTeamStatus } from '../lib/teamStatus';
import type { PickSide, Team } from '../types/team';
import { colors } from '../theme/colors';
import type { ConfidencePoints } from '../types/confidence';
import { StatusBadge } from './StatusBadge';
import { TeamColorBadge } from './TeamColorBadge';
import { TeamRecordStrip } from './TeamRecordStrip';

type Props = {
  team: Team;
  pick?: PickSide;
  confidence?: ConfidencePoints;
  lockedOuLine?: number;
};

export function TeamCardSeasonStarted({
  team,
  pick,
  confidence = 1,
  lockedOuLine,
}: Props) {
  const gradedLine = pick != null ? effectiveLockedOuLine(lockedOuLine, team) : null;
  const status = getTeamStatus(
    gradedLine != null ? { ...team, ou_line: gradedLine } : team,
  );

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <TeamColorBadge abbreviation={team.abbreviation} primaryColor={team.primary_color} />
        <View style={styles.nameBlock}>
          <Text style={styles.name}>{team.name}</Text>
        </View>
      </View>

      {pick && gradedLine != null ? (
        <View style={styles.pickBlock}>
          <Text style={styles.lineValue}>{gradedLine.toFixed(1)}</Text>
          <Text style={styles.lineLabel}>Your O/U line</Text>
          <View style={styles.pickMetaRow}>
            <View style={[styles.sidePill, pick === 'over' ? styles.sidePillOver : styles.sidePillUnder]}>
              <Text style={styles.sidePillText}>{pick.toUpperCase()}</Text>
            </View>
            <View style={styles.stakePill}>
              <Text style={styles.stakeLabel}>Stake</Text>
              <Text style={styles.stakeValue}>{confidence}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.noPickBlock}>
          <Text style={styles.noPickTitle}>No pick</Text>
          <Text style={styles.noPickHint}>You did not submit an O/U pick for this team.</Text>
        </View>
      )}

      <TeamRecordStrip team={team} style={styles.recordStrip} />

      <View style={styles.trackRow}>
        <StatusBadge status={status} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  nameBlock: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  pickBlock: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  lineValue: {
    color: '#60a5fa',
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 52,
  },
  lineLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  sidePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  sidePillOver: {
    backgroundColor: colors.pickActive,
    borderColor: '#60a5fa',
  },
  sidePillUnder: {
    backgroundColor: colors.pickActive,
    borderColor: '#60a5fa',
  },
  sidePillText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  stakePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stakeLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  stakeValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  noPickBlock: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  noPickTitle: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  noPickHint: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  recordStrip: {
    marginTop: 0,
  },
  trackRow: {
    marginTop: 12,
    alignItems: 'center',
  },
});
