import { StyleSheet, Text, View } from 'react-native';

import type { PickEvaluation } from '../lib/pickScoring';
import { pickEvaluationLabel } from '../lib/pickScoring';
import { colors } from '../theme/colors';

type Props = {
  evaluation: PickEvaluation;
};

function palette(state: PickEvaluation) {
  switch (state) {
    case 'won':
    case 'ahead':
      return { bg: colors.statusOnTrackBg, fg: colors.statusOnTrack };
    case 'lost':
    case 'behind':
      return { bg: colors.statusNeedsWorkBg, fg: colors.statusNeedsWork };
    default:
      return { bg: colors.statusAroundBg, fg: colors.statusAround };
  }
}

export function PickStatusBadge({ evaluation }: Props) {
  const { bg, fg } = palette(evaluation);

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: fg }]}>
      <Text style={[styles.text, { color: fg }]}>{pickEvaluationLabel(evaluation)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
