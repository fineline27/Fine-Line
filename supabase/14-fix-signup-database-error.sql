-- Fix "Database error saving new user" on sign-up (broken unique-username trigger / RLS).
-- Run this in Supabase SQL Editor if new accounts fail immediately. Safe to re-run.
--
-- Same content as 13-unique-usernames.sql — paste/run that file, or run this copy.

create table if not exists public.usernames (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now(),
  constraint usernames_username_len check (char_length(trim(username)) between 3 and 24)
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'usernames'
      and column_name = 'username_norm'
  ) then
    alter table public.usernames drop column if exists username_norm;
  end if;
end $$;

drop index if exists public.usernames_username_norm_key;

create unique index if not exists usernames_lower_username_key
  on public.usernames (lower(trim(username)));

grant usage on schema public to postgres, anon, authenticated, service_role;
grant select, insert, update, delete on table public.usernames to postgres, service_role;

alter table public.usernames enable row level security;

drop policy if exists usernames_service_role_all on public.usernames;
create policy usernames_service_role_all
  on public.usernames
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists usernames_select_own on public.usernames;
create policy usernames_select_own
  on public.usernames
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.is_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    length(trim(p_username)) >= 3
      and length(trim(p_username)) <= 24
      and trim(p_username) ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{2,23}$'
      and not exists (
        select 1
        from public.usernames u
        where lower(trim(u.username)) = lower(trim(p_username))
          and (auth.uid() is null or u.user_id <> auth.uid())
      ),
    false
  );
$$;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;

create or replace function public.claim_my_username(p_username text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  uname text := trim(p_username);
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  if length(uname) < 3 or length(uname) > 24 then
    raise exception 'Username must be 3–24 characters.';
  end if;

  if uname !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{2,23}$' then
    raise exception 'Use letters, numbers, underscore, or hyphen. Start with a letter or number.';
  end if;

  if not public.is_username_available(uname) then
    raise exception 'Username is already taken';
  end if;

  begin
    insert into public.usernames (user_id, username)
    values (uid, uname)
    on conflict (user_id) do update
      set username = excluded.username;
  exception
    when unique_violation then
      raise exception 'Username is already taken';
  end;

  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('username', uname, 'display_name', uname)
  where id = uid;
end;
$$;

revoke all on function public.claim_my_username(text) from public;
grant execute on function public.claim_my_username(text) to authenticated;

create or replace function public.handle_new_user_username()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
begin
  uname := nullif(trim(new.raw_user_meta_data->>'username'), '');
  if uname is null then
    uname := nullif(trim(new.raw_user_meta_data->>'display_name'), '');
  end if;

  if uname is null or length(uname) < 3 or length(uname) > 24 then
    return new;
  end if;

  if uname !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{2,23}$' then
    return new;
  end if;

  if exists (
    select 1
    from public.usernames u
    where lower(trim(u.username)) = lower(trim(uname))
  ) then
    raise exception 'Username is already taken';
  end if;

  insert into public.usernames (user_id, username)
  values (new.id, uname);

  return new;
exception
  when unique_violation then
    raise exception 'Username is already taken';
end;
$$;

alter function public.handle_new_user_username() owner to postgres;
alter function public.is_username_available(text) owner to postgres;
alter function public.claim_my_username(text) owner to postgres;

drop trigger if exists on_auth_user_created_username on auth.users;
create trigger on_auth_user_created_username
  after insert on auth.users
  for each row
  execute function public.handle_new_user_username();
