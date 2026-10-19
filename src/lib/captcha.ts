import Constants from 'expo-constants';

/** Public Turnstile site key (set when Supabase Auth CAPTCHA is enabled). */
export function getCaptchaSiteKey(): string {
  const extra = Constants.expoConfig?.extra as { captchaSiteKey?: string } | undefined;
  return extra?.captchaSiteKey?.trim() ?? '';
}

export function isCaptchaConfigured(): boolean {
  return getCaptchaSiteKey().length > 0;
}
