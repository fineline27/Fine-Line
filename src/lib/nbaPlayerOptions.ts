import playerNames from '../data/nba-players.json';

/** Current NBA player names (ESPN roster snapshot in repo). Run `npm run refresh:nba-players` to update. */
export const NBA_PLAYER_OPTIONS: string[] = playerNames as string[];

export function filterOptions(options: string[], query: string, limit = 12): string[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return options.slice(0, limit);
  }
  return options.filter((name) => name.toLowerCase().includes(q)).slice(0, limit);
}

export function canonicalOption(options: string[], value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const found = options.find((o) => o.toLowerCase() === trimmed.toLowerCase());
  return found ?? null;
}
