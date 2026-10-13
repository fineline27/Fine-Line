import Constants from 'expo-constants';

/** Default: 2026–27 NBA opening night (UTC). Override with EXPO_PUBLIC_NBA_SEASON_LOCK_ISO */
const DEFAULT_NBA_LOCK_ISO = '2026-10-22T04:00:00.000Z';

function readLockIso(): string {
  const extra = Constants.expoConfig?.extra as { nbaSeasonLockIso?: string } | undefined;
  const fromExtra = extra?.nbaSeasonLockIso?.trim();
  if (fromExtra) {
    return fromExtra;
  }
  const fromEnv =
    typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_NBA_SEASON_LOCK_ISO?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  return DEFAULT_NBA_LOCK_ISO;
}

export function getNbaSeasonLockDate(): Date {
  const parsed = new Date(readLockIso());
  if (Number.isNaN(parsed.getTime())) {
    return new Date(DEFAULT_NBA_LOCK_ISO);
  }
  return parsed;
}

export function isNbaPickEditingLocked(now = new Date()): boolean {
  return now.getTime() >= getNbaSeasonLockDate().getTime();
}

export function msUntilNbaSeasonLock(now = new Date()): number {
  return Math.max(0, getNbaSeasonLockDate().getTime() - now.getTime());
}

export function formatSeasonLockCountdown(msRemaining: number): string {
  if (msRemaining <= 0) {
    return 'Season started — picks locked';
  }
  const totalSeconds = Math.floor(msRemaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m until picks lock`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m until picks lock`;
  }
  return `${minutes}m until picks lock`;
}

export function formatSeasonLockLocalDate(): string {
  return getNbaSeasonLockDate().toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}
