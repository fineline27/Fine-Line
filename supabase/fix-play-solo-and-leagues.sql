-- Run once in Supabase SQL Editor if "Play solo" or "Create league" fails.
-- Safe to re-run (uses IF NOT EXISTS / DROP IF EXISTS).

-- Leagues table columns used by the app
alter table public.leagues
  add column if not exists sport varchar(20) not null default 'NBA';

alter table public.league_members
  add column if not exists display_name varchar(100);

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

-- Members: you can always read your own rows (needed right after creating a league)
drop policy if exists "Members read membership" on public.league_members;
drop policy if exists "Members read league roster" on public.league_members;
create policy "Members read own membership"
  on public.league_members for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users join leagues" on public.league_members;
create policy "Users join leagues"
  on public.league_members for insert to authenticated
  with check (user_id = auth.uid());
