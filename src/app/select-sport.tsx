import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../contexts/AuthContext';
import { SPORT_OPTIONS, useSport } from '../contexts/SportContext';
import { colors } from '../theme/colors';

export default function SelectSportScreen() {
  const { session, isLoading: authLoading } = useAuth();
  const { sport, isLoading: sportLoading, setSport } = useSport();

  if (!authLoading && !session) {
    return <Redirect href="/login" />;
  }

  async function onSelectSport(id: (typeof SPORT_OPTIONS)[number]['id']) {
    if (sport === id) {
      router.replace('/');
      return;
    }
    await setSport(id);
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.brand}>Fine Line</Text>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.heading}>Choose a sport</Text>
      <Text style={styles.subtitle}>
        Pick a sport — you&apos;ll join the overall pool automatically. Friend leagues are optional later.
      </Text>

      {SPORT_OPTIONS.map((option) => {
        const locked = !option.available;
        const isCurrent = sport === option.id;
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
              isCurrent && styles.cardActive,
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
                <Text style={styles.selectHint}>{isCurrent ? 'Continue' : 'Select'}</Text>
              )}
            </View>
            <Text style={[styles.cardDesc, locked && styles.textMuted]}>{option.description}</Text>
          </Pressable>
        );
      })}

      {sport ? (
        <Pressable onPress={() => router.replace('/')} style={styles.backToPicks}>
          <Text style={styles.backToPicksText}>Back to My picks</Text>
        </Pressable>
      ) : null}
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
  heading: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
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
  backToPicks: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backToPicksText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
});
