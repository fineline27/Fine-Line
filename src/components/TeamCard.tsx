import { StyleSheet, Text, View } from 'react-native';

import { evaluatePick } from '../lib/pickScoring';
import { formatRecord, formatWinPace, getTeamStatus } from '../lib/teamStatus';
import type { PickSide, Team } from '../types/team';
import { colors } from '../theme/colors';
import type { ConfidencePoints } from '../types/confidence';
import { ConfidenceSelector } from './ConfidenceSelector';
import { PickStatusBadge } from './PickStatusBadge';
import { PickToggle } from './PickToggle';
import { StatusBadge } from './StatusBadge';
import { TeamColorBadge } from './TeamColorBadge';

type Props = {
  team: Team;
  pick?: PickSide;
  confidence?: ConfidencePoints;
  saving?: boolean;
  picksLocked?: boolean;
  onPickChange: (teamId: string, side: PickSide) => void;
  onConfidenceChange?: (teamId: string, points: ConfidencePoints) => void;
};

export function TeamCard({
  team,
  pick,
  confidence = 1,
  saving,
  picksLocked,
  onPickChange,
  onConfidenceChange,
}: Props) {
  const status = getTeamStatus(team);
  const pickEval = pick ? evaluatePick(team, pick) : null;
  const record = formatRecord(team.current_wins, team.current_losses);
  const gamesPlayed = team.current_wins + team.current_losses;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <TeamColorBadge abbreviation={team.abbreviation} primaryColor={team.primary_color} />
        <View style={styles.nameBlock}>
          <Text style={styles.name}>{team.name}</Text>
          <Text style={styles.record}>
            {record}
            {gamesPlayed > 0 ? (
              <Text style={styles.recordMeta}> · Win pace {formatWinPace(team)}</Text>
            ) : (
              <Text style={styles.recordMeta}> · Season not started</Text>
            )}
          </Text>
        </View>
      </View>

      <View style={styles.ouCenter}>
        <Text style={styles.ouValue}>{team.ou_line.toFixed(1)}</Text>
        <Text style={styles.ouLabel}>Season O/U</Text>
      </View>

      <View style={styles.badgeRow}>
        <StatusBadge status={status} />
        {pickEval ? <PickStatusBadge evaluation={pickEval} /> : null}
      </View>

      <PickToggle
        selected={pick}
        disabled={picksLocked}
        onSelect={(side) => onPickChange(team.id, side)}
      />
      {pick && onConfidenceChange ? (
        <ConfidenceSelector
          value={confidence}
          disabled={picksLocked || saving}
          onChange={(pts) => onConfidenceChange(team.id, pts)}
        />
      ) : null}
      {saving ? <Text style={styles.saving}>Saving…</Text> : null}
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
  record: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  recordMeta: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  ouCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ouValue: {
    color: colors.textPrimary,
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 60,
  },
  ouLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'center',
  },
  saving: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
});
