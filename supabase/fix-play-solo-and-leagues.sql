-- Run once in Supabase SQL Editor if "Play solo" or "Create league" fails.
-- Safe to re-run. Run BEFORE or AFTER 04/05/06 if create/join breaks.

-- Columns the app expects
alter table public.leagues
  add column if not exists sport varchar(20) not null default 'NBA';

alter table public.leagues
  add column if not exists bonus_questions_enabled boolean not null default true;

alter table public.league_members
  add column if not exists display_name varchar(100),
  add column if not exists picks_submitted_at timestamp with time zone;

-- Permissions
grant select on public.leagues to anon, authenticated;
grant insert on public.leagues to authenticated;
grant select, insert, update, delete on public.league_members to authenticated;

alter table public.leagues enable row level security;
alter table public.league_members enable row level security;

-- Leagues
drop policy if exists "Authenticated read leagues" on public.leagues;
create policy "Authenticated read leagues"
  on public.leagues for select to authenticated using (true);

drop policy if exists "Users create leagues" on public.leagues;
create policy "Users create leagues"
  on public.leagues for insert to authenticated
  with check (auth.uid() = creator_id);

-- Members: read your own row (needed immediately after create)
drop policy if exists "Members read own membership" on public.league_members;
create policy "Members read own membership"
  on public.league_members for select to authenticated
  using (user_id = auth.uid());

-- Members: read everyone in leagues you belong to (leaderboard / board)
drop policy if exists "Members read membership" on public.league_members;
drop policy if exists "Members read league roster" on public.league_members;
create policy "Members read league roster"
  on public.league_members for select to authenticated
  using (
    exists (
      select 1 from public.league_members mine
      where mine.league_id = league_members.league_id
        and mine.user_id = auth.uid()
    )
  );

drop policy if exists "Users join leagues" on public.league_members;
create policy "Users join leagues"
  on public.league_members for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users update own membership" on public.league_members;
create policy "Users update own membership"
  on public.league_members for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
