-- =============================================================================
-- RUN THIS ONE FILE in Supabase SQL Editor if you cannot join the overall pool
-- or create a private league. Safe to re-run.
-- =============================================================================

-- Columns
alter table public.leagues
  add column if not exists sport varchar(20) not null default 'NBA';

alter table public.leagues
  add column if not exists bonus_questions_enabled boolean not null default true;

alter table public.league_members
  add column if not exists display_name varchar(100),
  add column if not exists picks_submitted_at timestamp with time zone;

-- Permissions
grant usage on schema public to anon, authenticated;
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

-- Avoid RLS recursion when reading league rosters (used by leaderboards)
create or replace function public.is_league_member(p_league_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.league_members m
    where m.league_id = p_league_id
      and m.user_id = auth.uid()
  );
$$;

revoke all on function public.is_league_member(uuid) from public;
grant execute on function public.is_league_member(uuid) to authenticated;

drop policy if exists "Members read own membership" on public.league_members;
drop policy if exists "Members read membership" on public.league_members;
drop policy if exists "Members read league roster" on public.league_members;
drop policy if exists "League members select" on public.league_members;

create policy "League members select"
  on public.league_members for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_league_member(league_id)
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

-- Shared overall pool (invite OPENNBA)
insert into public.leagues (name, invite_code, sport, creator_id, bonus_questions_enabled)
select 'Fine Line Overall (NBA)', 'OPENNBA', 'NBA', null, true
where not exists (select 1 from public.leagues where upper(invite_code) = 'OPENNBA');

-- Bonus questions on open pool (optional — needs 05-bonus-questions.sql)
do $bonus$
begin
  insert into public.bonus_questions (league_id, question_key, question_text, points_worth)
  select l.id, v.question_key, v.question_text, v.points_worth
  from public.leagues l
  cross join (
    values
      ('nba_mvp', 'NBA MVP?', 1),
      ('nba_champion', 'NBA Champion?', 1),
      ('nba_roy', 'Rookie of the Year?', 1)
  ) as v(question_key, question_text, points_worth)
  where upper(l.invite_code) = 'OPENNBA'
    and not exists (
      select 1 from public.bonus_questions b
      where b.league_id = l.id and b.question_key = v.question_key
    );
exception
  when undefined_table then null;
  when undefined_column then null;
end;
$bonus$;

create or replace function public.auth_user_display_name(uid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(trim(u.raw_user_meta_data->>'display_name'), ''),
    nullif(trim(u.raw_user_meta_data->>'username'), ''),
    nullif(split_part(u.email, '@', 1), ''),
    'Player'
  )
  from auth.users u
  where u.id = uid;
$$;

revoke all on function public.auth_user_display_name(uuid) from public;
grant execute on function public.auth_user_display_name(uuid) to authenticated;

-- Reliable auto-join overall pool (bypasses RLS edge cases)
create or replace function public.join_open_nba_pool()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  lid uuid;
  uid uuid := auth.uid();
  dname text;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  select id into lid from public.leagues where upper(invite_code) = 'OPENNBA' limit 1;

  if lid is null then
    insert into public.leagues (name, invite_code, sport, creator_id, bonus_questions_enabled)
    values ('Fine Line Overall (NBA)', 'OPENNBA', 'NBA', uid, true)
    returning id into lid;
  end if;

  dname := public.auth_user_display_name(uid);

  insert into public.league_members (league_id, user_id, display_name)
  values (lid, uid, coalesce(dname, 'Player'))
  on conflict (league_id, user_id) do update
    set display_name = excluded.display_name;

  return lid;
end;
$$;

revoke all on function public.join_open_nba_pool() from public;
grant execute on function public.join_open_nba_pool() to authenticated;

-- Reliable private league create (bypasses RLS edge cases)
create or replace function public.create_private_league(
  p_name text,
  p_sport text default 'NBA'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  code text;
  attempt int := 0;
  row public.leagues%rowtype;
  dname text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  loop
    attempt := attempt + 1;
    code := '';
    for i in 1..6 loop
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;

    begin
      insert into public.leagues (name, invite_code, creator_id, sport, bonus_questions_enabled)
      values (
        coalesce(nullif(trim(p_name), ''), 'Friends O/U League'),
        code,
        uid,
        coalesce(nullif(trim(p_sport), ''), 'NBA'),
        true
      )
      returning * into row;
      exit;
    exception
      when unique_violation then
        if attempt >= 10 then
          raise exception 'Could not generate a unique invite code';
        end if;
    end;
  end loop;

  dname := public.auth_user_display_name(uid);

  insert into public.league_members (league_id, user_id, display_name)
  values (row.id, uid, coalesce(dname, 'Player'))
  on conflict (league_id, user_id) do update
    set display_name = excluded.display_name;

  return to_jsonb(row);
end;
$$;

revoke all on function public.create_private_league(text, text) from public;
grant execute on function public.create_private_league(text, text) to authenticated;

-- League owners can delete private leagues (not the overall pool)
update public.leagues l
set creator_id = sub.user_id
from (
  select distinct on (league_id) league_id, user_id
  from public.league_members
  order by league_id, joined_at asc nulls last, user_id
) sub
where l.id = sub.league_id
  and l.creator_id is null
  and upper(l.invite_code) not in ('OPENNBA', 'OPENAFL');

grant delete on public.leagues to authenticated;

drop policy if exists "Creators delete own leagues" on public.leagues;
create policy "Creators delete own leagues"
  on public.leagues for delete to authenticated
  using (
    auth.uid() = creator_id
    and upper(invite_code) not in ('OPENNBA', 'OPENAFL')
  );

create or replace function public.delete_private_league(p_league_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  code text;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  select upper(invite_code) into code
  from public.leagues
  where id = p_league_id;

  if code is null then
    raise exception 'League not found';
  end if;

  if code in ('OPENNBA', 'OPENAFL') then
    raise exception 'You cannot delete the overall pool';
  end if;

  if not exists (
    select 1 from public.leagues
    where id = p_league_id and creator_id = uid
  ) then
    raise exception 'Only the league owner can delete this league';
  end if;

  delete from public.leagues where id = p_league_id;
end;
$$;

revoke all on function public.delete_private_league(uuid) from public;
grant execute on function public.delete_private_league(uuid) to authenticated;
