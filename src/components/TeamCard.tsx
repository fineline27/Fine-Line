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
  onPickChange: (teamId: string, side: PickSide) => void;
};

export function TeamCard({ team, pick, saving, onPickChange }: Props) {
  const status = getTeamStatus(team);
  const pickEval = pick ? evaluatePick(team, pick) : null;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <TeamColorBadge abbreviation={team.abbreviation} primaryColor={team.primary_color} />
        <View style={styles.meta}>
          <Text style={styles.name}>{team.name}</Text>
          <Text style={styles.subline}>
            O/U {team.ou_line.toFixed(1)} · Record {formatRecord(team.current_wins, team.current_losses)}
          </Text>
          <Text style={styles.pace}>Win pace: {formatWinPace(team)}</Text>
        </View>
      </View>

      <StatusBadge status={status} />

      {pickEval ? <PickStatusBadge evaluation={pickEval} /> : null}

      <PickToggle
        selected={pick}
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
  topRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },
  meta: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subline: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  pace: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  saving: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 8,
  },
});
