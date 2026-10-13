import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Where Supabase sends users after they tap the confirm-email link. */
export function getEmailConfirmRedirectUrl(): string | undefined {
  const fromEnv = Constants.expoConfig?.extra?.siteUrl?.trim();
  if (fromEnv) {
    return `${fromEnv.replace(/\/$/, '')}/auth/callback`;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin.replace(/\/$/, '')}/auth/callback`;
  }
  return undefined;
}
