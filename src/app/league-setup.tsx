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
  const { leagues, refreshLeagues, setActiveLeagueId } = useLeague();
  const [inviteCode, setInviteCode] = useState('');
  const [leagueName, setLeagueName] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  if (!authLoading && !session) {
    return <Redirect href="/login" />;
  }

  if (!authLoading && !sportLoading && session && !sport) {
    return <Redirect href="/select-sport" />;
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
    setCreatedCode(null);
    try {
      const league = await createLeague(name, sport ?? 'NBA');
      const code = league.invite_code?.trim();
      if (!code) {
        throw new Error('League was created but no invite code came back. Check Supabase leagues table.');
      }
      setCreatedCode(code);
      await setActiveLeagueId(league.id);
      await refreshLeagues();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      if (message.toLowerCase().includes('permission denied') || message.includes('row-level security')) {
        setError(
          `${message} — In Supabase SQL Editor, run supabase/02-auth-rls.sql (leagues + league_members), then try again.`,
        );
      } else {
        setError(message);
      }
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
        <Text style={styles.bonusNote}>
          Every league includes bonus tiebreakers: NBA MVP, NBA Champion, and Rookie of the Year (1
          pt each when results are set).
        </Text>
        <Pressable style={styles.secondary} onPress={() => void onCreate()} disabled={!!busy}>
          {busy === 'create' ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={styles.secondaryText}>Create & get invite code</Text>
          )}
        </Pressable>
        {createdCode ? (
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Share this invite code</Text>
            <Text style={styles.code} selectable>
              {createdCode}
            </Text>
            <Text style={styles.codeHint}>Friends enter this on Join with code (6 characters).</Text>
            <Pressable style={styles.secondary} onPress={() => router.replace('/')}>
              <Text style={styles.secondaryText}>Continue to standings</Text>
            </Pressable>
          </View>
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
  codeBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.statusOnTrackBg,
    borderWidth: 1,
    borderColor: colors.statusOnTrack,
  },
  codeLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  code: {
    color: colors.statusOnTrack,
    marginTop: 8,
    fontWeight: '800',
    fontSize: 28,
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  codeHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 12,
    lineHeight: 17,
  },
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
  bonusNote: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
});
