import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { AppTopMenu } from '../components/AppTopMenu';
import { LegalFooterLinks } from '../components/LegalFooterLinks';
import { useAuth } from '../contexts/AuthContext';
import { profileUsername, updateProfileUsername, deleteMyAccount } from '../lib/profile';
import { getLegalContactEmail } from '../lib/legalContact';
import { colors } from '../theme/colors';

export default function ProfileScreen() {
  const { session, user, isLoading, signOut } = useAuth();
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const legalEmail = getLegalContactEmail();

  useEffect(() => {
    if (user) {
      setUsername(profileUsername(user));
    }
  }, [user]);

  if (!isLoading && !session) {
    return <Redirect href="/login" />;
  }

  async function onSaveUsername() {
    setBusy('save');
    setError(null);
    setSuccess(null);
    try {
      await updateProfileUsername(username);
      setSuccess('Username updated on all your leagues.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save username');
    } finally {
      setBusy(null);
    }
  }

  async function onDeleteAccount() {
    setBusy('delete');
    setError(null);
    setSuccess(null);
    try {
      await deleteMyAccount();
      router.replace('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete account');
    } finally {
      setBusy(null);
      setConfirmDelete(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <AppTopMenu active="profile" />
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>
          Your username is shown on leaderboards. Your email stays private and is only used to sign
          in.
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.email}>{user?.email ?? '—'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Username"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.hint}>3–24 characters: letters, numbers, underscore, hyphen.</Text>
          <Pressable
            style={[styles.primaryBtn, busy === 'save' && styles.btnDisabled]}
            onPress={() => void onSaveUsername()}
            disabled={!!busy}
          >
            {busy === 'save' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Save username</Text>
            )}
          </Pressable>
        </View>

        {success ? <Text style={styles.success}>{success}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Delete account</Text>
          <Text style={styles.dangerBody}>
            Permanently removes your account, picks, bonus answers, and league memberships. Private
            leagues you created are deleted. This cannot be undone.
          </Text>
          {legalEmail ? (
            <Text style={styles.dangerBody}>
              You can also request deletion at {legalEmail}.
            </Text>
          ) : null}
          {confirmDelete ? (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>Delete your account permanently?</Text>
              <View style={styles.confirmRow}>
                <Pressable onPress={() => setConfirmDelete(false)} disabled={!!busy}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={() => void onDeleteAccount()} disabled={!!busy}>
                  {busy === 'delete' ? (
                    <ActivityIndicator color={colors.statusNeedsWork} />
                  ) : (
                    <Text style={styles.deleteText}>Delete my account</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable onPress={() => setConfirmDelete(true)} disabled={!!busy}>
              <Text style={styles.deleteLink}>Delete account…</Text>
            </Pressable>
          )}
        </View>

        <Pressable style={styles.signOutBtn} onPress={() => void signOut().then(() => router.replace('/login'))}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <LegalFooterLinks compact />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  back: { marginBottom: 8 },
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
  label: { color: colors.textSecondary, fontWeight: '700', fontSize: 12, marginBottom: 6 },
  email: { color: colors.textPrimary, fontSize: 16 },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 16,
  },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: 8, lineHeight: 17 },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontWeight: '800' },
  success: { color: colors.statusOnTrack, marginBottom: 12, fontWeight: '600' },
  error: { color: colors.statusNeedsWork, marginBottom: 12, lineHeight: 19 },
  dangerSection: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dangerTitle: { color: colors.textPrimary, fontWeight: '800', fontSize: 16 },
  dangerBody: { color: colors.textSecondary, marginTop: 8, fontSize: 13, lineHeight: 19 },
  deleteLink: {
    marginTop: 14,
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  confirmBox: { marginTop: 12 },
  confirmText: { color: colors.textPrimary, fontWeight: '600' },
  confirmRow: { flexDirection: 'row', gap: 20, marginTop: 12, alignItems: 'center' },
  cancelText: { color: colors.textSecondary, fontWeight: '700' },
  deleteText: { color: colors.statusNeedsWork, fontWeight: '800' },
  signOutBtn: { marginTop: 24, alignItems: 'center' },
  signOutText: { color: colors.textMuted, fontWeight: '600' },
});
