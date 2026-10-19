import { forwardRef, useImperativeHandle } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { isCaptchaConfigured } from '../lib/captcha';
import { getPublicSiteOrigin } from '../lib/siteOrigin';
import { colors } from '../theme/colors';

export type AuthCaptchaHandle = {
  reset: () => void;
};

type AuthCaptchaProps = {
  onToken: (token: string | null) => void;
};

/** Native: Turnstile runs on web only; point users at the deployed site when CAPTCHA is required. */
export const AuthCaptcha = forwardRef<AuthCaptchaHandle, AuthCaptchaProps>(function AuthCaptcha(
  _props,
  ref,
) {
  useImperativeHandle(ref, () => ({
    reset: () => {},
  }));

  if (Platform.OS === 'web' || !isCaptchaConfigured()) {
    return null;
  }

  const site = getPublicSiteOrigin();
  const loginUrl = site ? `${site}/login` : null;

  return (
    <View style={styles.box}>
      <Text style={styles.text}>
        Sign-in verification (Cloudflare) runs in the browser. Open the Fine Line website to sign in,
        or use Expo web on your computer.
      </Text>
      {loginUrl ? (
        <Text
          style={styles.link}
          accessibilityRole="link"
          onPress={() => void Linking.openURL(loginUrl)}
        >
          {loginUrl}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  box: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  link: {
    marginTop: 8,
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
});
