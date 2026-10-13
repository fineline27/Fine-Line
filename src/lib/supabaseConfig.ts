import Constants from 'expo-constants';

type SupabaseExtra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

/** Resolve Supabase URL + key from app config extra and EXPO_PUBLIC_* (inlined on web). */
export function resolveSupabaseConfig(): { url: string; apiKey: string } {
  const extra = Constants.expoConfig?.extra as SupabaseExtra | undefined;

  const url = (
    extra?.supabaseUrl ??
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    ''
  ).trim();

  const apiKey = (
    extra?.supabaseAnonKey ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    ''
  ).trim();

  return { url, apiKey };
}

export function assertSupabaseConfig(): { url: string; apiKey: string } {
  const config = resolveSupabaseConfig();
  if (!config.url || !config.apiKey) {
    throw new Error(
      'Missing Supabase credentials. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to .env, then restart Expo (npx expo start).',
    );
  }
  return config;
}
