import { Link, Redirect, router } from 'expo-router';
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
import { colors } from '../theme/colors';

export default function LoginScreen() {
  const { session, isLoading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && session) {
    return <Redirect href="/" />;
  }

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      router.replace('/select-sport');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <Text style={styles.brand}>Fine Line</Text>
        <Text style={styles.blurb}>
          Predict results and play against your mates. Who knows more sport??
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.formTitle}>Sign in</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.button} onPress={() => void onSubmit()} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </Pressable>
        <Link href="/sign-up" style={styles.link}>
          Create an account
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24,
  },
  hero: {
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  brand: {
    color: colors.textPrimary,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  blurb: {
    color: colors.textSecondary,
    fontSize: 17,
    lineHeight: 24,
    marginTop: 12,
    fontWeight: '500',
    maxWidth: 340,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  error: { color: colors.statusNeedsWork, marginBottom: 8 },
  link: { color: colors.accent, marginTop: 16, textAlign: 'center', fontWeight: '600' },
});
