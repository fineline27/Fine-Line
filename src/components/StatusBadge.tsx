import { StyleSheet, Text, View } from 'react-native';

import type { TeamStatus } from '../types/team';
import { colors } from '../theme/colors';

type Props = {
  status: TeamStatus;
};

function statusColors(status: TeamStatus) {
  switch (status) {
    case 'ON TRACK':
      return { bg: colors.statusOnTrackBg, fg: colors.statusOnTrack };
    case 'AROUND MARK':
      return { bg: colors.statusAroundBg, fg: colors.statusAround };
    case 'NEEDS WORK':
      return { bg: colors.statusNeedsWorkBg, fg: colors.statusNeedsWork };
  }
}

export function StatusBadge({ status }: Props) {
  const palette = statusColors(status);

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg, borderColor: palette.fg }]}>
      <View style={[styles.dot, { backgroundColor: palette.fg }]} />
      <Text style={[styles.label, { color: palette.fg }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
