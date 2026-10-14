import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { PickSide } from '../types/team';
import { colors } from '../theme/colors';

type Props = {
  visible: boolean;
  teamName: string;
  lockedLine: number;
  marketLine: number;
  targetSide: PickSide;
  onKeepPick: () => void;
  onChangeKeepLock: () => void;
  onChangeAcceptNewLine: () => void;
};

export function PickLineChangeModal({
  visible,
  teamName,
  lockedLine,
  marketLine,
  targetSide,
  onKeepPick,
  onChangeKeepLock,
  onChangeAcceptNewLine,
}: Props) {
  const sideLabel = targetSide.toUpperCase();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onKeepPick}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Line updated</Text>
          <Text style={styles.body}>
            {teamName} is listed at {marketLine.toFixed(1)} wins now. Your pick is locked at{' '}
            {lockedLine.toFixed(1)} for scoring.
          </Text>
          <Text style={styles.body}>
            Switch to {sideLabel} and keep {lockedLine.toFixed(1)}, or accept {marketLine.toFixed(1)}{' '}
            as your new locked line.
          </Text>

          <Pressable style={[styles.button, styles.primary]} onPress={onChangeKeepLock}>
            <Text style={styles.primaryText}>
              Switch to {sideLabel} · keep {lockedLine.toFixed(1)}
            </Text>
          </Pressable>

          <Pressable style={[styles.button, styles.secondary]} onPress={onChangeAcceptNewLine}>
            <Text style={styles.secondaryText}>
              Switch to {sideLabel} · lock {marketLine.toFixed(1)}
            </Text>
          </Pressable>

          <Pressable style={styles.cancel} onPress={onKeepPick}>
            <Text style={styles.cancelText}>Keep my current pick</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  body: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 8,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: colors.accent,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
  },
  secondary: {
    backgroundColor: colors.statusAroundBg,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.45)',
  },
  secondaryText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  cancel: {
    marginTop: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
});
