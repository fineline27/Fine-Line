import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PickSide } from '../types/team';
import { colors } from '../theme/colors';

type Props = {
  selected: PickSide | undefined;
  onSelect: (side: PickSide) => void;
  disabled?: boolean;
};

function ToggleButton({
  label,
  side,
  selected,
  onSelect,
  disabled,
}: {
  label: string;
  side: PickSide;
  selected: boolean;
  onSelect: (side: PickSide) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => onSelect(side)}
      style={({ pressed }) => [
        styles.button,
        selected ? styles.buttonActive : styles.buttonInactive,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.buttonText, selected && styles.buttonTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function PickToggle({ selected, onSelect, disabled }: Props) {
  return (
    <View style={styles.row}>
      <ToggleButton
        label="OVER"
        side="over"
        selected={selected === 'over'}
        onSelect={onSelect}
        disabled={disabled}
      />
      <ToggleButton
        label="UNDER"
        side="under"
        selected={selected === 'under'}
        onSelect={onSelect}
        disabled={disabled}
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
  buttonDisabled: {
    opacity: 0.45,
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
