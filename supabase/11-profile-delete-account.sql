-- Lets a signed-in user permanently delete their account and game data.
-- Safe to re-run.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  delete from public.bonus_answers where user_id = uid;
  delete from public.team_predictions where user_id = uid;
  delete from public.league_members where user_id = uid;
  delete from public.usernames where user_id = uid;

  delete from public.leagues
  where creator_id = uid
    and upper(invite_code) not in ('OPENNBA', 'OPENAFL');

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
