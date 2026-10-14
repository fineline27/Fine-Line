-- Globally unique usernames (case-insensitive). Safe to re-run.

create table if not exists public.usernames (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  username_norm text generated always as (lower(trim(username))) stored,
  created_at timestamptz not null default now(),
  constraint usernames_username_len check (char_length(trim(username)) between 3 and 24)
);

create unique index if not exists usernames_username_norm_key on public.usernames (username_norm);

alter table public.usernames enable row level security;

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
        where u.username_norm = lower(trim(p_username))
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

  insert into public.usernames (user_id, username)
  values (uid, uname)
  on conflict (user_id) do update
    set username = excluded.username;

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
set search_path = public, auth
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

  begin
    insert into public.usernames (user_id, username)
    values (new.id, uname);
  exception
    when unique_violation then
      raise exception 'Username is already taken';
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_username on auth.users;
create trigger on_auth_user_created_username
  after insert on auth.users
  for each row
  execute function public.handle_new_user_username();

-- Backfill from existing auth metadata (skips norms already claimed).
insert into public.usernames (user_id, username)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'username'), ''),
    nullif(trim(u.raw_user_meta_data->>'display_name'), ''),
    nullif(split_part(u.email, '@', 1), '')
  ) as username
from auth.users u
where coalesce(
    nullif(trim(u.raw_user_meta_data->>'username'), ''),
    nullif(trim(u.raw_user_meta_data->>'display_name'), ''),
    nullif(split_part(u.email, '@', 1), '')
  ) is not null
  and not exists (select 1 from public.usernames un where un.user_id = u.id)
on conflict (username_norm) do nothing;
