import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../contexts/AuthContext';
import { useLeague } from '../contexts/LeagueContext';
import { SPORT_OPTIONS, useSport } from '../contexts/SportContext';
import { getErrorMessage } from '../lib/errors';
import { LEAGUE_POOL_FIX_HINT } from '../lib/leagueFixHint';
import { DeleteLeagueSection } from '../components/DeleteLeagueSection';
import { canDeleteLeague, createLeague, joinLeagueByCodeForSport } from '../lib/leagues';
import { isOpenPoolInviteCode } from '../lib/openPool';
import { colors } from '../theme/colors';

export default function LeagueSetupScreen() {
  const { session, user, isLoading: authLoading, signOut } = useAuth();
  const { sport, isLoading: sportLoading, setSport, clearSport } = useSport();
  const { leagues, activeLeague, refreshLeagues, setActiveLeagueId } = useLeague();
  const [inviteCode, setInviteCode] = useState('');
  const [leagueName, setLeagueName] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const privateLeagues = leagues.filter((l) => !isOpenPoolInviteCode(l.invite_code));
  const ownsAnyPrivateLeague = privateLeagues.some((l) => canDeleteLeague(l, user?.id));

  if (!authLoading && !session) {
    return <Redirect href="/login" />;
  }

  if (!authLoading && !sportLoading && session && !sport) {
    return <Redirect href="/select-sport" />;
  }

  function formatLeagueError(err: unknown): string {
    const message = getErrorMessage(err, 'Something went wrong');
    const lower = message.toLowerCase();
    if (lower.includes('permission denied') || lower.includes('row-level security')) {
      return `${message} ${LEAGUE_POOL_FIX_HINT}`;
    }
    return message;
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
        throw new Error('League was created but no invite code came back.');
      }
      setCreatedCode(code);
      await setActiveLeagueId(league.id);
      await refreshLeagues().catch(() => undefined);
    } catch (err) {
      setError(formatLeagueError(err));
    } finally {
      setBusy(null);
    }
  }

  async function onJoin() {
    setBusy('join');
    setError(null);
    try {
      const league = await joinLeagueByCodeForSport(inviteCode, sport ?? 'NBA');
      if (isOpenPoolInviteCode(league.invite_code)) {
        throw new Error('You are already in the overall pool. Enter a friend league code.');
      }
      await setActiveLeagueId(league.id);
      await refreshLeagues().catch(() => undefined);
      router.replace('/');
    } catch (err) {
      setError(formatLeagueError(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => router.replace('/')} style={styles.backRow}>
        <Text style={styles.backText}>← Back to picks</Text>
      </Pressable>

      <Text style={styles.title}>Private leagues</Text>
      <Text style={styles.subtitle}>
        You&apos;re already in the overall {sport ?? 'NBA'} pool for worldwide rankings. Create or join a
        friends league here if you want a smaller leaderboard.
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
            </Text>
          </Pressable>
        ))}
        <Pressable onPress={() => void clearSport().then(() => router.replace('/select-sport'))}>
          <Text style={styles.changeSport}>Change sport</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Create a friends league</Text>
        <TextInput
          style={styles.input}
          placeholder="League name"
          placeholderTextColor={colors.textMuted}
          value={leagueName}
          onChangeText={setLeagueName}
        />
        <Pressable style={styles.secondary} onPress={() => void onCreate()} disabled={!!busy}>
          {busy === 'create' ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={styles.secondaryText}>Create & get invite code</Text>
          )}
        </Pressable>
        {createdCode ? (
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Invite code</Text>
            <Text style={styles.code} selectable>
              {createdCode}
            </Text>
            <Pressable style={styles.secondary} onPress={() => router.replace('/')}>
              <Text style={styles.secondaryText}>Use this league for picks</Text>
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
          {busy === 'join' ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={styles.secondaryText}>Join league</Text>
          )}
        </Pressable>
      </View>

      {privateLeagues.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your private leagues</Text>
          <Text style={styles.sectionHint}>Tap a league to use it for picks. Owners can delete a league permanently.</Text>
          {privateLeagues.map((l) => {
            const owner = canDeleteLeague(l, user?.id);
            return (
              <View key={l.id} style={styles.leagueRowWrap}>
                <Pressable
                  style={styles.leagueRow}
                  onPress={() => void setActiveLeagueId(l.id).then(() => router.replace('/'))}
                  disabled={!!busy || deleteBusy}
                >
                  <View style={styles.leagueRowMain}>
                    <Text style={styles.leagueRowText}>{l.name}</Text>
                    {owner ? <Text style={styles.ownerBadge}>Owner</Text> : null}
                  </View>
                  <Text style={styles.leagueCode}>{l.invite_code}</Text>
                </Pressable>
                {owner ? (
                  <DeleteLeagueSection
                    league={l}
                    userId={user?.id}
                    busy={deleteBusy}
                    onBusyChange={setDeleteBusy}
                    onDeleted={async () => {
                      if (activeLeague?.id === l.id) {
                        await refreshLeagues();
                        router.replace('/');
                        return;
                      }
                      await refreshLeagues();
                    }}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Could not continue</Text>
          <Text style={styles.errorBody}>{error}</Text>
        </View>
      ) : null}

      <Pressable onPress={() => void signOut()}>
        <Text style={styles.signOut}>Sign out</Text>
      </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20, paddingBottom: 40 },
  backRow: { marginBottom: 8 },
  backText: { color: colors.accent, fontWeight: '700', fontSize: 15 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, marginTop: 8, marginBottom: 20, lineHeight: 20 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { color: colors.textPrimary, fontWeight: '700', marginBottom: 10 },
  sectionHint: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 12 },
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
  },
  code: {
    color: colors.statusOnTrack,
    marginTop: 8,
    fontWeight: '800',
    fontSize: 28,
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  leagueRowWrap: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
    marginBottom: 4,
  },
  leagueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  leagueRowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  leagueRowText: { color: colors.textPrimary, fontWeight: '600', flexShrink: 1 },
  ownerBadge: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  leagueCode: { color: colors.textMuted, fontFamily: 'monospace' },
  errorBox: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.statusNeedsWorkBg,
    borderWidth: 1,
    borderColor: colors.statusNeedsWork,
  },
  errorTitle: { color: colors.statusNeedsWork, fontWeight: '800', marginBottom: 6 },
  errorBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
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
  sportChipLocked: { opacity: 0.5 },
  sportChipText: { color: colors.textSecondary, fontWeight: '700' },
  sportChipTextActive: { color: '#fff' },
  sportChipTextLocked: { color: colors.textMuted },
  changeSport: { color: colors.accent, fontWeight: '600', fontSize: 13, marginLeft: 4 },
});
