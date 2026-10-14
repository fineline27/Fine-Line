import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { marketLineDiffersFromPickLock } from '../lib/ouLine';
import { evaluatePick } from '../lib/pickScoring';
import { formatRecord, formatWinPace, getTeamStatus } from '../lib/teamStatus';
import type { PickSide, Team } from '../types/team';
import { colors } from '../theme/colors';
import type { ConfidencePoints } from '../types/confidence';
import type { TogglePickResult } from '../hooks/usePredictions';
import { ConfidenceSelector } from './ConfidenceSelector';
import { PickLineChangeModal } from './PickLineChangeModal';
import { PickStatusBadge } from './PickStatusBadge';
import { PickToggle } from './PickToggle';
import { StatusBadge } from './StatusBadge';
import { TeamColorBadge } from './TeamColorBadge';

type Props = {
  team: Team;
  pick?: PickSide;
  confidence?: ConfidencePoints;
  lockedOuLine?: number;
  saving?: boolean;
  picksLocked?: boolean;
  onPickChange: (
    teamId: string,
    side: PickSide,
    options?: { acceptNewLine?: boolean; retainLockedLine?: boolean },
  ) => Promise<TogglePickResult> | TogglePickResult;
  onConfidenceChange?: (teamId: string, points: ConfidencePoints) => void;
};

export function TeamCard({
  team,
  pick,
  confidence = 1,
  lockedOuLine,
  saving,
  picksLocked,
  onPickChange,
  onConfidenceChange,
}: Props) {
  const [lineChangePrompt, setLineChangePrompt] = useState<{
    side: PickSide;
    lockedLine: number;
    marketLine: number;
  } | null>(null);

  const status = getTeamStatus(team);
  const pickEval = pick ? evaluatePick(team, pick, lockedOuLine) : null;
  const record = formatRecord(team.current_wins, team.current_losses);
  const gamesPlayed = team.current_wins + team.current_losses;
  const lineMoved = pick != null && marketLineDiffersFromPickLock(lockedOuLine, team, true);
  const displayLine =
    lineMoved && lockedOuLine != null ? lockedOuLine : team.ou_line;

  async function requestPick(side: PickSide) {
    if (picksLocked) {
      return;
    }

    const result = await onPickChange(team.id, side);
    if (result.needsLineAcceptance) {
      setLineChangePrompt({
        side: result.side,
        lockedLine: result.lockedLine,
        marketLine: result.marketLine,
      });
    }
  }

  return (
    <View style={styles.card}>
      <PickLineChangeModal
        visible={lineChangePrompt != null}
        teamName={team.name}
        lockedLine={lineChangePrompt?.lockedLine ?? lockedOuLine ?? team.ou_line}
        marketLine={lineChangePrompt?.marketLine ?? team.ou_line}
        targetSide={lineChangePrompt?.side ?? 'over'}
        onKeepPick={() => setLineChangePrompt(null)}
        onChangeKeepLock={() => {
          const side = lineChangePrompt!.side;
          setLineChangePrompt(null);
          void onPickChange(team.id, side, { retainLockedLine: true });
        }}
        onChangeAcceptNewLine={() => {
          const side = lineChangePrompt!.side;
          setLineChangePrompt(null);
          void onPickChange(team.id, side, { acceptNewLine: true });
        }}
      />

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
        <Text style={styles.ouValue}>{displayLine.toFixed(1)}</Text>
        <Text style={styles.ouLabel}>{lineMoved ? 'Your locked O/U' : 'Season O/U'}</Text>
        {lineMoved ? (
          <Text style={styles.ouMoved}>
            Current line {team.ou_line.toFixed(1)} · switch sides only after choosing to keep your
            lock or accept the new line
          </Text>
        ) : pick ? (
          <Text style={styles.ouLockedHint}>Locked at this line for your pick</Text>
        ) : null}
      </View>

      {lineMoved ? (
        <Pressable
          style={styles.acceptLineButton}
          disabled={picksLocked || saving}
          onPress={() => void onPickChange(team.id, pick!, { acceptNewLine: true })}
        >
          <Text style={styles.acceptLineText}>
            Accept new line ({team.ou_line.toFixed(1)}) — keep {pick?.toUpperCase()}
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.badgeRow}>
        <StatusBadge status={status} />
        {pickEval ? <PickStatusBadge evaluation={pickEval} /> : null}
      </View>

      <PickToggle selected={pick} disabled={picksLocked} onSelect={(side) => void requestPick(side)} />
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
  ouLockedHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 8,
  },
  ouMoved: {
    color: colors.statusAround,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 4,
    fontWeight: '600',
  },
  acceptLineButton: {
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.statusAroundBg,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.45)',
  },
  acceptLineText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
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
