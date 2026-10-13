import type { SportId } from '../contexts/SportContext';
import { joinLeagueByCodeForSport } from './leagues';

/** Fixed invite codes for shared overall pools (seeded in supabase/07-open-pool-league.sql). */
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
  const code = OPEN_POOL_INVITE[sport];
  if (!code) {
    return;
  }
  try {
    await joinLeagueByCodeForSport(code, sport);
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('No league found')) {
      throw new Error(
        'Overall pool is not set up in Supabase yet. Run supabase/07-open-pool-league.sql in the SQL Editor, then refresh.',
      );
    }
    if (message.includes('duplicate') || message.includes('23505')) {
      return;
    }
    throw err;
  }
}
