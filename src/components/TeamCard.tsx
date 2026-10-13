import { StyleSheet, Text, View } from 'react-native';

import { evaluatePick } from '../lib/pickScoring';
import { formatRecord, formatWinPace, getTeamStatus } from '../lib/teamStatus';
import type { PickSide, Team } from '../types/team';
import { colors } from '../theme/colors';
import { PickStatusBadge } from './PickStatusBadge';
import { PickToggle } from './PickToggle';
import { StatusBadge } from './StatusBadge';
import { TeamColorBadge } from './TeamColorBadge';

type Props = {
  team: Team;
  pick?: PickSide;
  saving?: boolean;
  picksLocked?: boolean;
  onPickChange: (teamId: string, side: PickSide) => void;
};

export function TeamCard({ team, pick, saving, picksLocked, onPickChange }: Props) {
  const status = getTeamStatus(team);
  const pickEval = pick ? evaluatePick(team, pick) : null;
  const isPreseason = team.current_wins + team.current_losses === 0;
  const record = formatRecord(team.current_wins, team.current_losses);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <TeamColorBadge abbreviation={team.abbreviation} primaryColor={team.primary_color} />
        <View style={styles.nameBlock}>
          <Text style={styles.name}>{team.name}</Text>
          <Text style={[styles.record, isPreseason && styles.recordPreseason]}>
            {record}
            {!isPreseason ? (
              <Text style={styles.recordMeta}> · Win pace {formatWinPace(team)}</Text>
            ) : null}
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
  recordPreseason: {
    color: colors.statusAround,
  },
  recordMeta: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  ouCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  ouValue: {
    color: colors.textPrimary,
    fontSize: 40,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    lineHeight: 44,
  },
  ouLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 4,
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
