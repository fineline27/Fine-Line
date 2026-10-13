-- League owners can delete their private leagues. Run after 02-auth-rls.sql (or re-run RUN-THIS-league-and-pool-fix.sql).

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
