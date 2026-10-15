import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { effectiveLockedOuLine, marketLineDiffersFromPickLock } from '../lib/ouLine';
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
  const gradedLine = pick != null ? effectiveLockedOuLine(lockedOuLine, team) : team.ou_line;
  const boardLine = team.ou_line;

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

      <View style={[styles.ouCenter, pick && lineMoved && styles.ouCenterLocked]}>
        {lineMoved ? (
          <View style={styles.lockBadgeRow}>
            <Text style={styles.lockBadgeText}>LOCK</Text>
          </View>
        ) : null}
        <View style={styles.dualLineRow}>
          <View style={[styles.lineCol, styles.lineColLocked]}>
            <Text style={[styles.lineColLabel, styles.lineColLabelLocked]}>
              Your locked line
            </Text>
            {pick ? (
              <Text style={[styles.lineColValue, styles.lineColValueLocked]}>
                {gradedLine.toFixed(1)}
              </Text>
            ) : (
              <Text style={styles.lineColEmpty}>—</Text>
            )}
            <Text style={styles.lineColHint}>
              {pick ? 'Used for scoring' : 'Pick OVER or UNDER to lock'}
            </Text>
          </View>
          <View style={styles.lineColGap} />
          <View style={[styles.lineCol, styles.lineColCurrent]}>
            <Text style={[styles.lineColLabel, styles.lineColLabelCurrent]}>Current line</Text>
            <Text
              style={[
                styles.lineColValue,
                styles.lineColValueCurrent,
                pick && lineMoved && styles.lineColValueCurrentMoved,
              ]}
            >
              {boardLine.toFixed(1)}
            </Text>
            <Text style={styles.lineColHint}>Live season O/U</Text>
          </View>
        </View>
        {pick ? (
          lineMoved ? (
            <Text style={styles.ouMoved}>
              Switch sides only after choosing to keep your locked line or accept the current line
            </Text>
          ) : (
            <Text style={styles.ouLockedHint}>
              Your locked line matches the current line
            </Text>
          )
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
  ouCenterLocked: {
    backgroundColor: colors.statusAroundBg,
    borderColor: 'rgba(234, 179, 8, 0.45)',
  },
  lockBadgeRow: {
    backgroundColor: colors.statusAroundBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.45)',
    marginBottom: 10,
  },
  lockBadgeText: {
    color: colors.statusAround,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  dualLineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
  },
  lineCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  lineColLocked: {
    backgroundColor: 'rgba(59, 130, 246, 0.14)',
    borderColor: 'rgba(96, 165, 250, 0.45)',
  },
  lineColCurrent: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  lineColGap: {
    width: 10,
  },
  lineColLabel: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  lineColLabelLocked: {
    color: '#93c5fd',
  },
  lineColLabelCurrent: {
    color: '#cbd5e1',
  },
  lineColValue: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 48,
    marginTop: 6,
  },
  lineColValueLocked: {
    color: '#60a5fa',
  },
  lineColValueCurrent: {
    color: '#f1f5f9',
  },
  lineColValueCurrentMoved: {
    color: colors.statusAround,
  },
  lineColEmpty: {
    color: colors.textMuted,
    fontSize: 44,
    fontWeight: '300',
    lineHeight: 48,
    marginTop: 6,
  },
  lineColHint: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
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
