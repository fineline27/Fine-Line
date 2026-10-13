import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../contexts/AuthContext';
import { getSupabaseClient } from '../../lib/supabase';
import { colors } from '../../theme/colors';

type Status = 'working' | 'success' | 'already' | 'error';

export default function AuthCallbackScreen() {
  const { session } = useAuth();
  const [status, setStatus] = useState<Status>('working');
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseClient();

    async function resolveSession() {
      try {
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const code = params.get('code');
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              throw error;
            }
          }
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }
        if (cancelled) {
          return;
        }
        if (data.session) {
          setStatus(session ? 'already' : 'success');
          if (typeof window !== 'undefined' && (window.location.hash || window.location.search)) {
            window.history.replaceState({}, '', '/auth/callback');
          }
          return;
        }

        const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
          if (cancelled || !nextSession) {
            return;
          }
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setStatus('success');
            if (typeof window !== 'undefined' && (window.location.hash || window.location.search)) {
              window.history.replaceState({}, '', '/auth/callback');
            }
          }
        });

        await new Promise((r) => setTimeout(r, 2500));
        const { data: retry } = await supabase.auth.getSession();
        if (cancelled) {
          sub.subscription.unsubscribe();
          return;
        }
        if (retry.session) {
          setStatus('success');
        } else {
          setStatus('error');
          setDetail('We could not read a session from this link. It may have expired — try signing in.');
        }
        sub.subscription.unsubscribe();
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setDetail(err instanceof Error ? err.message : 'Confirmation failed');
        }
      }
    }

    void resolveSession();

    return () => {
      cancelled = true;
    };
  }, [session]);

  function onContinue() {
    if (session) {
      router.replace('/select-sport');
    } else {
      router.replace('/login');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        {status === 'working' ? (
          <>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.title}>Confirming your email…</Text>
            <Text style={styles.body}>One moment while we finish verification.</Text>
          </>
        ) : null}

        {status === 'success' || status === 'already' ? (
          <>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.title}>Email confirmed</Text>
            <Text style={styles.body}>
              {status === 'success'
                ? 'Your account is verified. You can sign in and start picking O/U lines.'
                : 'You’re already signed in. Head to your picks when you’re ready.'}
            </Text>
            <Pressable style={styles.button} onPress={onContinue}>
              <Text style={styles.buttonText}>
                {session ? 'Continue to app' : 'Sign in'}
              </Text>
            </Pressable>
            {!session ? (
              <Link href="/login" style={styles.link}>
                Go to sign in
              </Link>
            ) : null}
          </>
        ) : null}

        {status === 'error' ? (
          <>
            <Text style={styles.title}>Link issue</Text>
            <Text style={styles.body}>{detail ?? 'This confirmation link may be expired or already used.'}</Text>
            <Text style={styles.hint}>
              If you already confirmed, try signing in — it often works even when this page looks wrong.
            </Text>
            <Pressable style={styles.button} onPress={() => router.replace('/login')}>
              <Text style={styles.buttonText}>Sign in</Text>
            </Pressable>
          </>
        ) : null}
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 28,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  check: {
    fontSize: 48,
    color: colors.statusOnTrack,
    marginBottom: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },
  body: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 12,
  },
  button: {
    marginTop: 20,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  link: {
    color: colors.accent,
    fontWeight: '700',
    marginTop: 16,
  },
});
