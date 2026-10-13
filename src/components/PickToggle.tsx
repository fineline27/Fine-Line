import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PickSide } from '../types/team';
import { colors } from '../theme/colors';

type Props = {
  selected: PickSide | undefined;
  onSelect: (side: PickSide) => void;
};

function ToggleButton({
  label,
  side,
  selected,
  onSelect,
}: {
  label: string;
  side: PickSide;
  selected: boolean;
  onSelect: (side: PickSide) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onSelect(side)}
      style={({ pressed }) => [
        styles.button,
        selected ? styles.buttonActive : styles.buttonInactive,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.buttonText, selected && styles.buttonTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function PickToggle({ selected, onSelect }: Props) {
  return (
    <View style={styles.row}>
      <ToggleButton
        label="OVER"
        side="over"
        selected={selected === 'over'}
        onSelect={onSelect}
      />
      <ToggleButton
        label="UNDER"
        side="under"
        selected={selected === 'under'}
        onSelect={onSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonInactive: {
    backgroundColor: colors.pickInactive,
    borderColor: colors.border,
  },
  buttonActive: {
    backgroundColor: colors.pickActive,
    borderColor: '#60a5fa',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.6,
  },
  buttonTextActive: {
    color: '#fff',
  },
});
