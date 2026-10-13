import Constants from 'expo-constants';

type SupabaseExtra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

function firstNonEmpty(...values: (string | undefined)[]): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return '';
}

/** Resolve Supabase URL + key (.env first so restarts pick up changes). */
export function resolveSupabaseConfig(): { url: string; apiKey: string } {
  const extra = Constants.expoConfig?.extra as SupabaseExtra | undefined;

  const url = firstNonEmpty(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
    extra?.supabaseUrl,
  );

  const apiKey = firstNonEmpty(
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_ANON_KEY,
    extra?.supabaseAnonKey,
  );

  return { url, apiKey };
}

export function getSupabaseProjectRef(): string | null {
  const { url } = resolveSupabaseConfig();
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
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
