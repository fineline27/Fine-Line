import { Link, Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthCaptcha, type AuthCaptchaHandle } from '../components/AuthCaptcha';
import { AuthLandingHero } from '../components/AuthLandingHero';
import { LegalFooterLinks } from '../components/LegalFooterLinks';
import { useAuth } from '../contexts/AuthContext';
import { mapSignInError } from '../lib/authErrors';
import { isCaptchaConfigured } from '../lib/captcha';
import { colors } from '../theme/colors';

export default function LoginScreen() {
  const { session, isLoading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<AuthCaptchaHandle>(null);
  const captchaRequired = isCaptchaConfigured();
  const captchaReady = !captchaRequired || Boolean(captchaToken);
  const nativeCaptchaBlock = captchaRequired && Platform.OS !== 'web';

  if (!isLoading && session) {
    return <Redirect href="/" />;
  }

  async function onSubmit() {
    if (nativeCaptchaBlock) {
      setError('Use the Fine Line website in your browser to sign in (Cloudflare verification).');
      return;
    }
    if (captchaRequired && !captchaToken) {
      setError('Complete the security check below, then try again.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await signIn(email.trim(), password, captchaToken);
      router.replace('/');
    } catch (err) {
      setError(mapSignInError(err));
      captchaRef.current?.reset();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthLandingHero />

          <View style={styles.formBlock}>
            <Text style={styles.formTitle}>Sign in</Text>
            <Text style={styles.formHint}>Free to play · NBA season O/U · mates optional</Text>

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
            <AuthCaptcha ref={captchaRef} onToken={setCaptchaToken} />
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                (!captchaReady || nativeCaptchaBlock) && styles.buttonDisabled,
              ]}
              onPress={() => void onSubmit()}
              disabled={submitting || !captchaReady || nativeCaptchaBlock}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign in & pick sides</Text>
              )}
            </Pressable>

            <Link href="/sign-up" asChild>
              <Pressable style={styles.secondaryLink}>
                <Text style={styles.secondaryLinkText}>
                  New here? <Text style={styles.secondaryLinkAccent}>Create an account</Text>
                </Text>
              </Pressable>
            </Link>
          </View>

          <LegalFooterLinks />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  formBlock: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
  },
  formHint: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    color: colors.textPrimary,
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
  },
  error: {
    color: colors.statusNeedsWork,
    marginBottom: 8,
    fontSize: 13,
  },
  secondaryLink: {
    marginTop: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  secondaryLinkText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  secondaryLinkAccent: {
    color: colors.accent,
    fontWeight: '800',
  },
});
