import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../contexts/AuthContext';
import { SPORT_OPTIONS, type SportId, useSport } from '../contexts/SportContext';
import { colors } from '../theme/colors';

export default function HomeScreen() {
  const { session, isLoading: authLoading } = useAuth();
  const { setSport } = useSport();

  if (!authLoading && !session) {
    return <Redirect href="/login" />;
  }

  async function onSelectSport(sportId: SportId) {
    await setSport(sportId);
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.brand}>Fine Line</Text>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>
        Choose a sport to play. NBA is live now — friend leagues are optional from your pick screen.
      </Text>

      {SPORT_OPTIONS.map((option) => {
        const locked = !option.available;
        return (
          <Pressable
            key={option.id}
            disabled={locked}
            onPress={() => {
              if (option.available) {
                void onSelectSport(option.id);
              }
            }}
            style={({ pressed }) => [
              styles.card,
              option.available && styles.cardActive,
              locked && styles.cardLocked,
              pressed && option.available && styles.cardPressed,
            ]}
          >
            <View style={styles.cardRow}>
              <Text style={[styles.cardTitle, locked && styles.textMuted]}>{option.label}</Text>
              {locked ? (
                <View style={styles.lockBadge}>
                  <Text style={styles.lockText}>Locked</Text>
                </View>
              ) : (
                <Text style={styles.selectHint}>Play</Text>
              )}
            </View>
            <Text style={[styles.cardDesc, locked && styles.textMuted]}>{option.description}</Text>
          </Pressable>
        );
      })}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  brand: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActive: {
    borderColor: colors.accent,
  },
  cardLocked: {
    opacity: 0.55,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  cardDesc: {
    color: colors.textSecondary,
    marginTop: 6,
    fontSize: 14,
  },
  textMuted: {
    color: colors.textMuted,
  },
  selectHint: {
    color: colors.accent,
    fontWeight: '700',
  },
  lockBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lockText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
