import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatColors } from '../content/overallFormats';
import type { ConfidencePoints } from '../types/confidence';
import { colors } from '../theme/colors';

type Props = {
  value: ConfidencePoints;
  disabled?: boolean;
  onChange: (points: ConfidencePoints) => void;
};

const OPTIONS: ConfidencePoints[] = [1, 2, 3];

export function ConfidenceSelector({ value, disabled, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Stakes</Text>
        </View>
        <Text style={styles.hint}>
          Right +{value} · wrong −{value}
        </Text>
      </View>
      <Text style={styles.subhint}>Choose how many points this pick is worth on the Stakes board.</Text>
      <View style={styles.row}>
        {OPTIONS.map((pts) => {
          const selected = value === pts;
          return (
            <Pressable
              key={pts}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: !!disabled }}
              disabled={disabled}
              onPress={() => onChange(pts)}
              style={({ pressed }) => [
                styles.segment,
                selected ? styles.segmentActive : styles.segmentInactive,
                disabled && styles.segmentDisabled,
                pressed && !disabled && styles.segmentPressed,
              ]}
            >
              <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{pts}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: formatColors.stakesBorder,
    backgroundColor: formatColors.stakesBg,
    borderRadius: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badge: {
    backgroundColor: formatColors.stakesStrong,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  hint: {
    color: formatColors.stakes,
    fontSize: 12,
    fontWeight: '800',
  },
  subhint: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
  },
  segmentInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(248, 113, 113, 0.55)',
  },
  segmentActive: {
    backgroundColor: formatColors.stakesStrong,
    borderColor: '#fca5a5',
  },
  segmentPressed: {
    opacity: 0.88,
  },
  segmentDisabled: {
    opacity: 0.45,
  },
  segmentText: {
    color: formatColors.stakes,
    fontWeight: '900',
    fontSize: 18,
  },
  segmentTextActive: {
    color: '#fff',
  },
});
