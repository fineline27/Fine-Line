import { StyleSheet, Text, View } from 'react-native';

import { ouLinesEqual } from '../lib/ouLine';
import { colors } from '../theme/colors';

type Props = {
  lockedLine: number;
  marketLine: number;
  /** Smaller chip layout for league board grids */
  compact?: boolean;
  /** Large display for pick cards on My picks */
  prominent?: boolean;
};

export function LockedLineIndicator({
  lockedLine,
  marketLine,
  compact = false,
  prominent = false,
}: Props) {
  if (ouLinesEqual(lockedLine, marketLine)) {
    return (
      <Text
        style={[
          styles.line,
          compact && styles.lineCompact,
          prominent && styles.lineProminent,
        ]}
      >
        {lockedLine.toFixed(1)}
      </Text>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.lockBadge, compact && styles.lockBadgeCompact]}>
        <Text style={[styles.lockBadgeText, compact && styles.lockBadgeTextCompact]}>LOCK</Text>
      </View>
      <Text
        style={[
          styles.lockedLine,
          compact && styles.lockedLineCompact,
          prominent && styles.lockedLineProminent,
        ]}
      >
        {lockedLine.toFixed(1)}
      </Text>
      <Text
        style={[
          styles.marketLine,
          compact && styles.marketLineCompact,
          prominent && styles.marketLineProminent,
        ]}
      >
        Current {marketLine.toFixed(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  line: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  lineCompact: {
    fontSize: 10,
  },
  lineProminent: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1.5,
    lineHeight: 60,
  },
  lockBadge: {
    backgroundColor: colors.statusAroundBg,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.45)',
    marginBottom: 2,
  },
  lockBadgeCompact: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginBottom: 1,
  },
  lockBadgeText: {
    color: colors.statusAround,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  lockBadgeTextCompact: {
    fontSize: 8,
  },
  lockedLine: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  lockedLineCompact: {
    fontSize: 10,
  },
  lockedLineProminent: {
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 60,
  },
  marketLine: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  marketLineCompact: {
    fontSize: 9,
  },
  marketLineProminent: {
    fontSize: 13,
    marginTop: 6,
  },
});
