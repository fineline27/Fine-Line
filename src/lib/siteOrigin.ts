import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Canonical web origin for links (auth, native CAPTCHA fallback). */
export function getPublicSiteOrigin(): string | null {
  const fromEnv = Constants.expoConfig?.extra?.siteUrl?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin.replace(/\/$/, '');
  }
  return null;
}
