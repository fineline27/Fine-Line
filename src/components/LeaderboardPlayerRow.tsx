import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PlayerBonusPick, PlayerOuPick } from '../lib/playerPickDetails';
import { LockedLineIndicator } from './LockedLineIndicator';
import { formatColors } from '../content/overallFormats';
import { useSeasonLock } from '../hooks/useSeasonLock';
import type { LeaderboardEntry } from '../lib/rankings';
import { colors } from '../theme/colors';

type Props = {
  entry: LeaderboardEntry;
  expanded: boolean;
  onToggle: () => void;
  ouPicks: PlayerOuPick[];
  bonusPicks: PlayerBonusPick[];
  showBonus: boolean;
  canExpand: boolean;
};

export function LeaderboardPlayerRow({
  entry,
  expanded,
  onToggle,
  ouPicks,
  bonusPicks,
  showBonus,
  canExpand,
}: Props) {
  const { locked: seasonLocked } = useSeasonLock();

  return (
    <View style={[styles.wrap, entry.isMe && styles.wrapMe]}>
      <Pressable
        style={styles.header}
        onPress={canExpand ? onToggle : undefined}
        disabled={!canExpand}
      >
        <View style={styles.rankCol}>
          <Text style={styles.rankText}>{entry.picksSubmitted ? `#${entry.rank}` : '—'}</Text>
        </View>
        <View style={styles.nameCol}>
          <Text style={styles.nameText}>
            {entry.displayName}
            {entry.isMe ? ' (you)' : ''}
          </Text>
          {!entry.picksSubmitted ? (
            <Text style={styles.pendingText}>Hasn’t submitted yet</Text>
          ) : (
            <Text style={styles.metaText}>
              {entry.clinched} clinched
              {showBonus ? ` · ${entry.bonusScore} bonus` : ''}
              {canExpand ? (expanded ? ' · hide picks' : ' · tap for picks') : ''}
            </Text>
          )}
        </View>
        <Text style={styles.chevron}>{canExpand ? (expanded ? '▾' : '▸') : ''}</Text>
        <Text style={styles.scoreText}>{entry.picksSubmitted ? entry.score : '—'}</Text>
      </Pressable>

      {expanded && canExpand && entry.picksSubmitted ? (
        <View style={styles.detail}>
          {showBonus && bonusPicks.length > 0 ? (
            <View style={styles.bonusBlock}>
              <Text style={styles.detailTitle}>Bonus tiebreakers</Text>
              {bonusPicks.map((b) => (
                <View key={b.key} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{b.label}</Text>
                  <Text style={styles.detailValue}>{b.answer}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <Text style={styles.detailTitle}>O/U picks</Text>
          {seasonLocked && ouPicks.some((p) => p.lockedLineDiffers) ? (
            <Text style={styles.lockHint}>
              Highlighted picks were saved at a line different from the final board number (LOCK =
              graded at your saved line).
            </Text>
          ) : null}
          {!seasonLocked && ouPicks.some((p) => p.lockedLineDiffers) ? (
            <Text style={styles.lockHint}>
              LOCK = graded at your saved line when it differs from today&apos;s board number.
            </Text>
          ) : null}
          <View style={styles.ouGrid}>
            {ouPicks.map((p) => (
              <View
                key={p.abbreviation}
                style={[styles.ouChip, p.lockedLineDiffers && styles.ouChipLocked]}
              >
                <Text style={styles.ouAbbr}>{p.abbreviation}</Text>
                <Text style={[styles.ouSide, p.pick === 'over' ? styles.over : styles.under]}>
                  {p.pick === 'over' ? 'O' : 'U'}
                </Text>
                {p.confidence != null ? (
                  <Text style={styles.ouConf}>×{p.confidence}</Text>
                ) : null}
                <LockedLineIndicator
                  lockedLine={p.ouLine}
                  marketLine={p.marketLine}
                  compact
                  variant={seasonLocked ? 'board-reference' : 'pick-lock'}
                  boardLineLabel={seasonLocked ? 'Final' : 'Current'}
                />
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    overflow: 'hidden',
  },
  wrapMe: {
    borderColor: colors.accent,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  rankCol: {
    width: 44,
  },
  rankText: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 18,
  },
  nameCol: {
    flex: 1,
  },
  nameText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  pendingText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 16,
    width: 20,
    textAlign: 'center',
    marginRight: 4,
  },
  scoreText: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 20,
    minWidth: 36,
    textAlign: 'right',
  },
  detail: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 12,
    backgroundColor: colors.surfaceElevated,
  },
  detailTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bonusBlock: {
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 13,
    flex: 1,
  },
  detailValue: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
    maxWidth: '50%',
    textAlign: 'right',
  },
  ouGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lockHint: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 8,
  },
  ouChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  ouChipLocked: {
    borderColor: colors.lineUpdateBorder,
    backgroundColor: colors.lineUpdateBg,
  },
  ouAbbr: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 12,
  },
  ouSide: {
    fontWeight: '900',
    fontSize: 11,
  },
  over: {
    color: '#4ade80',
  },
  under: {
    color: '#f87171',
  },
  ouConf: {
    color: formatColors.stakesStrong,
    fontWeight: '800',
    fontSize: 10,
  },
});
