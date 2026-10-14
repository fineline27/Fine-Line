import { Pressable, StyleSheet, Text, View } from 'react-native';

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
        <Text style={styles.label}>Confidence</Text>
        <Text style={styles.hint}>Win +{value} · lose −{value}</Text>
      </View>
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
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  segmentInactive: {
    backgroundColor: colors.pickInactive,
    borderColor: colors.border,
  },
  segmentActive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.accent,
  },
  segmentPressed: {
    opacity: 0.85,
  },
  segmentDisabled: {
    opacity: 0.45,
  },
  segmentText: {
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  segmentTextActive: {
    color: colors.accent,
  },
});
