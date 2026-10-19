import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { getCaptchaSiteKey, isCaptchaConfigured } from '../lib/captcha';
import { colors } from '../theme/colors';

export type AuthCaptchaHandle = {
  reset: () => void;
};

type AuthCaptchaProps = {
  onToken: (token: string | null) => void;
};

export const AuthCaptcha = forwardRef<AuthCaptchaHandle, AuthCaptchaProps>(function AuthCaptcha(
  { onToken },
  ref,
) {
  const turnstileRef = useRef<TurnstileInstance>(null);
  const siteKey = getCaptchaSiteKey();

  useImperativeHandle(ref, () => ({
    reset: () => {
      turnstileRef.current?.reset();
      onToken(null);
    },
  }));

  if (!isCaptchaConfigured()) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        options={{ theme: 'dark', size: 'flexible' }}
        onSuccess={(token) => onToken(token)}
        onExpire={() => onToken(null)}
        onError={() => onToken(null)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 10,
    minHeight: 65,
    width: '100%',
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
