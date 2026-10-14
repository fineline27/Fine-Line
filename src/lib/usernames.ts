import type { User } from '@supabase/supabase-js';

import { normalizeUsername, resolveDisplayName, validateUsername } from './displayName';
import { getErrorMessage } from './errors';
import { syncDisplayNameAcrossLeagues } from './leagueMembers';
import { getSupabaseClient } from './supabase';

export const USERNAME_TAKEN_MESSAGE = 'Username is already taken';

export async function isUsernameAvailable(rawUsername: string): Promise<boolean> {
  const validationError = validateUsername(rawUsername);
  if (validationError) {
    return false;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('is_username_available', {
    p_username: normalizeUsername(rawUsername),
  });

  if (error) {
    const message = getErrorMessage(error, 'Could not check username');
    if (message.toLowerCase().includes('could not find the function')) {
      return true;
    }
    throw new Error(message);
  }

  return data === true;
}

export async function assertUsernameAvailable(rawUsername: string): Promise<void> {
  const available = await isUsernameAvailable(rawUsername);
  if (!available) {
    throw new Error(USERNAME_TAKEN_MESSAGE);
  }
}

export async function claimMyUsername(rawUsername: string): Promise<void> {
  const validationError = validateUsername(rawUsername);
  if (validationError) {
    throw new Error(validationError);
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('claim_my_username', {
    p_username: normalizeUsername(rawUsername),
  });

  if (error) {
    throw new Error(getErrorMessage(error, 'Could not update username'));
  }
}

/** Reserves the sign-up username after auth succeeds (never runs on auth.users insert). */
export async function ensureUsernameClaimedFromMetadata(user: User | null | undefined): Promise<void> {
  if (!user) {
    return;
  }

  const raw = resolveDisplayName(user);
  if (validateUsername(raw)) {
    return;
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('claim_my_username', {
    p_username: normalizeUsername(raw),
  });

  if (error) {
    const message = getErrorMessage(error, '');
    if (message.toLowerCase().includes('could not find the function')) {
      return;
    }
    return;
  }

  await syncDisplayNameAcrossLeagues().catch(() => undefined);
}
