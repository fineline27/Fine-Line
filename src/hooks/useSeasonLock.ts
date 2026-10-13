import { useEffect, useState } from 'react';

import {
  formatSeasonLockCountdown,
  formatSeasonLockLocalDate,
  getNbaSeasonLockDate,
  isNbaPickEditingLocked,
  msUntilNbaSeasonLock,
} from '../lib/seasonLock';

export function useSeasonLock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const locked = isNbaPickEditingLocked(now);
  const msRemaining = msUntilNbaSeasonLock(now);

  return {
    locked,
    lockAt: getNbaSeasonLockDate(),
    lockAtLabel: formatSeasonLockLocalDate(),
    countdownLabel: formatSeasonLockCountdown(msRemaining),
    msRemaining,
  };
}
