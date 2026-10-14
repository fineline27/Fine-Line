import type { User } from '@supabase/supabase-js';

const USERNAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,23}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim();
}

export function validateUsername(raw: string): string | null {
  const username = normalizeUsername(raw);
  if (username.length < 3) {
    return 'Username must be at least 3 characters.';
  }
  if (username.length > 24) {
    return 'Username must be 24 characters or fewer.';
  }
  if (!USERNAME_PATTERN.test(username)) {
    return 'Use letters, numbers, underscore, or hyphen. Start with a letter or number.';
  }
  return null;
}

export function defaultDisplayNameFromEmail(email: string | undefined): string {
  const local = email?.split('@')[0]?.trim();
  return local && local.length > 0 ? local.slice(0, 100) : 'Player';
}

/** Leaderboard / league name from sign-up username (user metadata), else email prefix. */
export function resolveDisplayName(user: User | null | undefined): string {
  if (!user) {
    return 'Player';
  }
  const meta = user.user_metadata ?? {};
  const fromMeta =
    (typeof meta.display_name === 'string' && meta.display_name.trim()) ||
    (typeof meta.username === 'string' && meta.username.trim()) ||
    '';
  if (fromMeta) {
    return fromMeta.slice(0, 100);
  }
  return defaultDisplayNameFromEmail(user.email);
}
