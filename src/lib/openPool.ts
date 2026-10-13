import type { SportId } from '../contexts/SportContext';
import { getErrorMessage } from './errors';
import { isMissingRpcError, LEAGUE_POOL_FIX_HINT } from './leagueFixHint';
import { joinLeagueByCodeForSport } from './leagues';
import { getSupabaseClient } from './supabase';

/** Fixed invite codes for shared overall pools. */
export const OPEN_POOL_INVITE: Record<SportId, string> = {
  NBA: 'OPENNBA',
  AFL: 'OPENAFL',
};

export function isOpenPoolInviteCode(code: string | undefined | null): boolean {
  if (!code) {
    return false;
  }
  const upper = code.trim().toUpperCase();
  return upper === OPEN_POOL_INVITE.NBA || upper === OPEN_POOL_INVITE.AFL;
}

/** Join the sport-wide overall pool so picks and overall rank work without creating a league. */
export async function ensureOpenPoolMembership(sport: SportId): Promise<void> {
  if (sport !== 'NBA') {
    return;
  }

  const supabase = getSupabaseClient();

  const { error: rpcError } = await supabase.rpc('join_open_nba_pool');
  if (!rpcError) {
    return;
  }

  const rpcMessage = getErrorMessage(rpcError, 'Could not join overall pool');
  if (!isMissingRpcError(rpcMessage)) {
    throw new Error(`${rpcMessage} ${LEAGUE_POOL_FIX_HINT}`);
  }

  try {
    await joinLeagueByCodeForSport(OPEN_POOL_INVITE.NBA, sport);
  } catch (err) {
    const message = getErrorMessage(err, 'Could not join overall pool');
    if (message.includes('No league found')) {
      throw new Error(`Overall pool is not set up yet. ${LEAGUE_POOL_FIX_HINT}`);
    }
    if (message.includes('duplicate') || message.includes('23505')) {
      return;
    }
    throw new Error(`${message} ${LEAGUE_POOL_FIX_HINT}`);
  }
}
