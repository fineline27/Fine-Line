-- Run after 00-schema.sql. Enables auth-backed leagues and predictions.

grant select on public.leagues to anon, authenticated;
grant select, insert, update, delete on public.league_members to authenticated;
grant select, insert, update, delete on public.team_predictions to authenticated;
grant insert on public.leagues to authenticated;

alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.team_predictions enable row level security;

drop policy if exists "Authenticated read leagues" on public.leagues;
create policy "Authenticated read leagues"
  on public.leagues for select to authenticated using (true);

drop policy if exists "Users create leagues" on public.leagues;
create policy "Users create leagues"
  on public.leagues for insert to authenticated
  with check (auth.uid() = creator_id);

drop policy if exists "Members read membership" on public.league_members;
create policy "Members read membership"
  on public.league_members for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users join leagues" on public.league_members;
create policy "Users join leagues"
  on public.league_members for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "League predictions read" on public.team_predictions;
create policy "League predictions read"
  on public.team_predictions for select to authenticated
  using (
    exists (
      select 1 from public.league_members m
      where m.league_id = team_predictions.league_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "Users insert predictions" on public.team_predictions;
create policy "Users insert predictions"
  on public.team_predictions for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users update predictions" on public.team_predictions;
create policy "Users update predictions"
  on public.team_predictions for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users delete predictions" on public.team_predictions;
create policy "Users delete predictions"
  on public.team_predictions for delete to authenticated
  using (user_id = auth.uid());
