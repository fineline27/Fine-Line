export const LEAGUE_POOL_FIX_HINT =
  'In Supabase: open SQL Editor → New query → paste the entire file supabase/RUN-THIS-league-and-pool-fix.sql from this repo → Run. Then refresh the app.';

export function isMissingRpcError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('could not find the function') ||
    lower.includes('schema cache') ||
    lower.includes('join_open_nba_pool') ||
    lower.includes('create_private_league')
  );
}
