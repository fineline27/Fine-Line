-- Allows authenticated users to read predictions across leagues (same sport)
-- so Fine Line can show an overall NBA leaderboard.

drop policy if exists "Sport leaderboard read predictions" on public.team_predictions;
create policy "Sport leaderboard read predictions"
  on public.team_predictions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.leagues l
      where l.id = team_predictions.league_id
    )
  );
