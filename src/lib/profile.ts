import type { User } from '@supabase/supabase-js';

import { resolveDisplayName } from './displayName';
import { getErrorMessage } from './errors';
import { syncDisplayNameAcrossLeagues } from './leagueMembers';
import { getLegalContactEmail } from './legalContact';
import { getSupabaseClient } from './supabase';
import { claimMyUsername } from './usernames';

export function profileUsername(user: User | null | undefined): string {
  return resolveDisplayName(user);
}

export async function updateProfileUsername(rawUsername: string): Promise<void> {
  await claimMyUsername(rawUsername);

  const supabase = getSupabaseClient();
  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    throw new Error(getErrorMessage(refreshError, 'Could not refresh profile'));
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
