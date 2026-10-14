import type { User } from '@supabase/supabase-js';

import {
  normalizeUsername,
  resolveDisplayName,
  validateUsername,
} from './displayName';
import { getErrorMessage } from './errors';
import { syncDisplayNameAcrossLeagues } from './leagueMembers';
import { getLegalContactEmail } from './legalContact';
import { getSupabaseClient } from './supabase';

export function profileUsername(user: User | null | undefined): string {
  return resolveDisplayName(user);
}

export async function updateProfileUsername(rawUsername: string): Promise<void> {
  const validationError = validateUsername(rawUsername);
  if (validationError) {
    throw new Error(validationError);
  }
  const username = normalizeUsername(rawUsername);

  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.updateUser({
    data: {
      username,
      display_name: username,
    },
  });

  if (error) {
    throw new Error(getErrorMessage(error, 'Could not update username'));
  }

  await syncDisplayNameAcrossLeagues();
}

export async function deleteMyAccount(): Promise<void> {
  const supabase = getSupabaseClient();
  const { error: rpcError } = await supabase.rpc('delete_my_account');

  if (rpcError) {
    const message = getErrorMessage(rpcError, 'Could not delete account');
    if (
      message.toLowerCase().includes('could not find the function') ||
      message.toLowerCase().includes('delete_my_account')
    ) {
      const contact = getLegalContactEmail();
      throw new Error(
        `Account deletion is not enabled yet. Run supabase/11-profile-delete-account.sql in Supabase SQL Editor.${
          contact ? ` Or email ${contact} to request deletion.` : ''
        }`,
      );
    }
    throw new Error(message);
  }

  await supabase.auth.signOut();
}
