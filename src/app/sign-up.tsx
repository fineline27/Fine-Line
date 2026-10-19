import { Link, Redirect, router, type Href } from 'expo-router';

const TERMS_HREF = '/terms' as Href;
const PRIVACY_HREF = '/privacy' as Href;
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthCaptcha, type AuthCaptchaHandle } from '../components/AuthCaptcha';
import { LegalFooterLinks } from '../components/LegalFooterLinks';
import { useAuth } from '../contexts/AuthContext';
import { isCaptchaConfigured } from '../lib/captcha';
import { mapSignUpError } from '../lib/authErrors';
import { validateUsername } from '../lib/displayName';
import { colors } from '../theme/colors';

export default function SignUpScreen() {
  const { session, isLoading, signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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
    if (!acceptedLegal) {
      setError('Please agree to the Terms and Privacy Policy to create an account.');
      return;
    }
    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    if (nativeCaptchaBlock) {
      setError('Create your account on the Fine Line website in your browser (Cloudflare verification).');
      return;
    }
    if (captchaRequired && !captchaToken) {
      setError('Complete the security check below, then try again.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await signUp(email.trim(), password, username.trim(), captchaToken);
      setMessage('Account created. You can sign in and start picking.');
      router.replace('/login');
    } catch (err) {
      setError(mapSignUpError(err));
      captchaRef.current?.reset();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.hint}>Username is shown on leaderboards (not your email).</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
        />
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
          placeholder="Password (6+ characters)"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <AuthCaptcha ref={captchaRef} onToken={setCaptchaToken} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Pressable
          style={styles.consentRow}
          onPress={() => setAcceptedLegal((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedLegal }}
        >
          <View style={[styles.checkbox, acceptedLegal && styles.checkboxOn]}>
            {acceptedLegal ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <View style={styles.consentTextWrap}>
            <Text style={styles.consentText}>I am at least 13 and agree to the </Text>
            <Link href={TERMS_HREF} style={styles.consentLink}>
              Terms
            </Link>
            <Text style={styles.consentText}> and </Text>
            <Link href={PRIVACY_HREF} style={styles.consentLink}>
              Privacy Policy
            </Link>
            <Text style={styles.consentText}>.</Text>
          </View>
        </Pressable>
        <Pressable
          style={[
            styles.button,
            (!acceptedLegal || !captchaReady || nativeCaptchaBlock) && styles.buttonDisabled,
          ]}
          onPress={() => void onSubmit()}
          disabled={submitting || !acceptedLegal || !captchaReady || nativeCaptchaBlock}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign up</Text>
          )}
        </Pressable>
        <Link href="/login" style={styles.link}>
          Back to sign in
        </Link>
        <LegalFooterLinks compact />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: '800', marginBottom: 8 },
  hint: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 14 },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
    marginBottom: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  checkmark: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  consentTextWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  consentText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  consentLink: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 19,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  error: { color: colors.statusNeedsWork, marginBottom: 8 },
  message: { color: colors.statusOnTrack, marginBottom: 8 },
  link: { color: colors.accent, marginTop: 16, textAlign: 'center', fontWeight: '600' },
});
