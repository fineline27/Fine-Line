import { normalizeUsername, validateUsername } from './displayName';
import { getErrorMessage } from './errors';
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
    throw new Error(getErrorMessage(error, 'Could not check username'));
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
