import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
};

export function MaintenanceScreen({ message, onRetry, retrying }: Props) {
  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.badge}>Maintenance</Text>
        <Text style={styles.title}>We&apos;ll be right back</Text>
        <Text style={styles.body}>{message}</Text>
        {onRetry ? (
          <Pressable
            accessibilityRole="button"
            disabled={retrying}
            onPress={onRetry}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            {retrying ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.buttonLabel}>Check again</Text>
            )}
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 28,
    maxWidth: 520,
    alignSelf: 'center',
    width: '100%',
  },
  badge: {
    alignSelf: 'flex-start',
    color: colors.lineUpdate,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  title: { color: colors.textPrimary, fontSize: 30, fontWeight: '800' },
  body: { color: colors.textSecondary, fontSize: 16, lineHeight: 24, marginTop: 16 },
  button: {
    marginTop: 28,
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 140,
    alignItems: 'center',
  },
  buttonPressed: { opacity: 0.85 },
  buttonLabel: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
});
