import 'dotenv/config';

import { ExpoConfig, ConfigContext } from 'expo/config';

function envFirst(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return '';
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Fine Line',
  slug: 'fine-line',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  scheme: 'fine-line',
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#0f1419',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
    description:
      'Season-long sports picks. Predict NBA win totals, play in leagues with mates, and climb the live standings.',
    themeColor: '#0b0f14',
  },
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: envFirst('SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_URL'),
    supabaseAnonKey: envFirst(
      'SUPABASE_PUBLISHABLE_KEY',
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      'SUPABASE_ANON_KEY',
      'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    ),
    legalContactEmail:
      envFirst('EXPO_PUBLIC_LEGAL_CONTACT_EMAIL', 'LEGAL_CONTACT_EMAIL') ||
      'finelinesport@gmail.com',
    siteUrl: envFirst('EXPO_PUBLIC_SITE_URL', 'SITE_URL'),
    nbaSeasonLockIso: envFirst('EXPO_PUBLIC_NBA_SEASON_LOCK_ISO', 'NBA_SEASON_LOCK_ISO'),
  },
});
