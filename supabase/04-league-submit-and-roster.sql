-- Pick submission, league roster, and gated prediction visibility.
-- Run in Supabase SQL Editor after 02-auth-rls.sql.

alter table public.league_members
  add column if not exists display_name varchar(100),
  add column if not exists picks_submitted_at timestamp with time zone;

grant update on public.league_members to authenticated;

drop policy if exists "Members read membership" on public.league_members;
create policy "Members read league roster"
  on public.league_members
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.league_members mine
      where mine.league_id = league_members.league_id
        and mine.user_id = auth.uid()
    )
  );

drop policy if exists "Users update own membership" on public.league_members;
create policy "Users update own membership"
  on public.league_members
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "League predictions read" on public.team_predictions;

create policy "Own league predictions read"
  on public.team_predictions
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "League predictions read after submit"
  on public.team_predictions
  for select
  to authenticated
  using (
    user_id <> auth.uid()
    and exists (
      select 1
      from public.league_members mine
      where mine.league_id = team_predictions.league_id
        and mine.user_id = auth.uid()
        and mine.picks_submitted_at is not null
    )
    and exists (
      select 1
      from public.league_members peer
      where peer.league_id = team_predictions.league_id
        and peer.user_id = team_predictions.user_id
    )
  );

drop policy if exists "Users update predictions" on public.team_predictions;
create policy "Users update predictions before submit"
  on public.team_predictions
  for update
  to authenticated
  using (
    user_id = auth.uid()
    and not exists (
      select 1
      from public.league_members m
      where m.league_id = team_predictions.league_id
        and m.user_id = auth.uid()
        and m.picks_submitted_at is not null
    )
  )
  with check (user_id = auth.uid());

drop policy if exists "Users insert predictions" on public.team_predictions;
create policy "Users insert predictions before submit"
  on public.team_predictions
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and not exists (
      select 1
      from public.league_members m
      where m.league_id = team_predictions.league_id
        and m.user_id = auth.uid()
        and m.picks_submitted_at is not null
    )
  );

drop policy if exists "Users delete predictions" on public.team_predictions;
create policy "Users delete predictions before submit"
  on public.team_predictions
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    and not exists (
      select 1
      from public.league_members m
      where m.league_id = team_predictions.league_id
        and m.user_id = auth.uid()
        and m.picks_submitted_at is not null
    )
  );
