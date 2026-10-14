-- Use sign-up username (auth user_metadata) for league display_name in RPCs.
-- Safe to re-run. No change needed if you re-run RUN-THIS-league-and-pool-fix.sql.

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
