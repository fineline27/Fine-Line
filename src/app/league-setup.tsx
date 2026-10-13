import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../contexts/AuthContext';
import { useLeague } from '../contexts/LeagueContext';
import { SPORT_OPTIONS, useSport } from '../contexts/SportContext';
import { createLeague, createSoloLeague, joinLeagueByCodeForSport } from '../lib/leagues';
import { colors } from '../theme/colors';

export default function LeagueSetupScreen() {
  const { session, isLoading: authLoading, signOut } = useAuth();
  const { sport, isLoading: sportLoading, setSport, clearSport } = useSport();
  const { activeLeague, leagues, refreshLeagues, setActiveLeagueId, isLoading } = useLeague();
  const [inviteCode, setInviteCode] = useState('');
  const [leagueName, setLeagueName] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [bonusQuestionsEnabled, setBonusQuestionsEnabled] = useState(true);

  if (!authLoading && !session) {
    return <Redirect href="/login" />;
  }

  if (!authLoading && !sportLoading && session && !sport) {
    return <Redirect href="/select-sport" />;
  }

  if (!isLoading && activeLeague && !createdCode) {
    return <Redirect href="/" />;
  }

  async function run(action: () => Promise<void>, label: string) {
    setBusy(label);
    setError(null);
    try {
      await action();
      await refreshLeagues();
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(null);
    }
  }

  async function onSolo() {
    await run(async () => {
      const league = await createSoloLeague(sport ?? 'NBA');
      await setActiveLeagueId(league.id);
    }, 'solo');
  }

  async function onCreate() {
    const name = leagueName.trim() || 'Friends O/U League';
    setBusy('create');
    setError(null);
    try {
      const league = await createLeague(name, sport ?? 'NBA', {
        bonusQuestionsEnabled,
      });
      setCreatedCode(league.invite_code);
      await setActiveLeagueId(league.id);
      await refreshLeagues();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(null);
    }
  }

  async function onJoin() {
    await run(async () => {
      const league = await joinLeagueByCodeForSport(inviteCode, sport ?? 'NBA');
      await setActiveLeagueId(league.id);
    }, 'join');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Choose how to play</Text>
      <Text style={styles.subtitle}>
        {sport} · Solo keeps stats just for you. Leagues share a leaderboard.
      </Text>

      <View style={styles.sportRow}>
        {SPORT_OPTIONS.map((option) => (
          <Pressable
            key={option.id}
            disabled={!option.available}
            onPress={() => void setSport(option.id)}
            style={[
              styles.sportChip,
              sport === option.id && styles.sportChipActive,
              !option.available && styles.sportChipLocked,
            ]}
          >
            <Text
              style={[
                styles.sportChipText,
                sport === option.id && styles.sportChipTextActive,
                !option.available && styles.sportChipTextLocked,
              ]}
            >
              {option.label}
              {!option.available ? ' 🔒' : ''}
            </Text>
          </Pressable>
        ))}
        <Pressable onPress={() => void clearSport().then(() => router.replace('/select-sport'))}>
          <Text style={styles.changeSport}>Change</Text>
        </Pressable>
      </View>

      <Pressable style={styles.primary} onPress={() => void onSolo()} disabled={!!busy}>
        {busy === 'solo' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryText}>Play solo</Text>
        )}
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Create a league</Text>
        <TextInput
          style={styles.input}
          placeholder="League name"
          placeholderTextColor={colors.textMuted}
          value={leagueName}
          onChangeText={setLeagueName}
        />
        <Pressable
          style={styles.toggleRow}
          onPress={() => setBonusQuestionsEnabled((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: bonusQuestionsEnabled }}
        >
          <View style={[styles.checkbox, bonusQuestionsEnabled && styles.checkboxOn]}>
            {bonusQuestionsEnabled ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Bonus tiebreakers</Text>
            <Text style={styles.toggleDetail}>
              NBA MVP, NBA Champion, Rookie of the Year — 1 pt each to break ties.
            </Text>
          </View>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => void onCreate()} disabled={!!busy}>
          <Text style={styles.secondaryText}>Create & get invite code</Text>
        </Pressable>
        {createdCode ? (
          <>
            <Text style={styles.code}>Invite code: {createdCode}</Text>
            <Pressable style={styles.secondary} onPress={() => router.replace('/')}>
              <Text style={styles.secondaryText}>Continue to standings</Text>
            </Pressable>
          </>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Join with code</Text>
        <TextInput
          style={styles.input}
          placeholder="6-character code"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          value={inviteCode}
          onChangeText={setInviteCode}
        />
        <Pressable style={styles.secondary} onPress={() => void onJoin()} disabled={!!busy}>
          <Text style={styles.secondaryText}>Join league</Text>
        </Pressable>
      </View>

      {leagues.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your leagues</Text>
          {leagues.map((l) => (
            <Pressable
              key={l.id}
              style={styles.leagueRow}
              onPress={() => void setActiveLeagueId(l.id).then(() => router.replace('/'))}
            >
              <Text style={styles.leagueRowText}>{l.name}</Text>
              <Text style={styles.leagueCode}>{l.invite_code}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable onPress={() => void signOut()}>
        <Text style={styles.signOut}>Sign out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, padding: 20 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, marginTop: 8, marginBottom: 20 },
  primary: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { color: colors.textPrimary, fontWeight: '700', marginBottom: 10 },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  secondary: {
    backgroundColor: colors.surfaceElevated,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: { color: colors.textPrimary, fontWeight: '700' },
  code: { color: colors.statusOnTrack, marginTop: 12, fontWeight: '700', fontSize: 16 },
  leagueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leagueRowText: { color: colors.textPrimary, fontWeight: '600' },
  leagueCode: { color: colors.textMuted, fontFamily: 'monospace' },
  error: { color: colors.statusNeedsWork, marginTop: 8 },
  signOut: { color: colors.textMuted, textAlign: 'center', marginTop: 24 },
  sportRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sportChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sportChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  sportChipLocked: {
    opacity: 0.5,
  },
  sportChipText: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
  sportChipTextActive: {
    color: '#fff',
  },
  sportChipTextLocked: {
    color: colors.textMuted,
  },
  changeSport: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  toggleCopy: {
    flex: 1,
  },
  toggleTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  toggleDetail: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
});
