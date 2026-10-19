import type { SeasonLockContext } from './leaderboardEligibility';
import { getNbaSeasonLockDate, isNbaPickEditingLocked } from './seasonLock';

/** NBA pick-window context for leaderboard eligibility (extend per sport when NFL/AFL launch). */
export function nbaSeasonLockContext(now = new Date()): SeasonLockContext {
  return {
    picksWindowClosed: isNbaPickEditingLocked(now),
    lockAt: getNbaSeasonLockDate(),
  };
}
