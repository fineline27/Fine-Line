-- Allow pick edits until NBA season lock time (not when you tap Submit).
-- Same picks sync across leagues in the app; this removes the old
-- "picks_submitted_at blocks edits" rule for O/U and bonus answers.
-- Safe to re-run.

create table if not exists public.app_settings (
  key text primary key,
  value timestamptz not null
);

insert into public.app_settings (key, value)
values ('nba_season_pick_lock_at', '2026-10-20 19:00:00+00')
on conflict (key) do update set value = excluded.value;

create or replace function public.picks_editing_locked()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select now() >= coalesce(
    (select value from public.app_settings where key = 'nba_season_pick_lock_at'),
    'infinity'::timestamptz
  );
$$;

revoke all on function public.picks_editing_locked() from public;
grant execute on function public.picks_editing_locked() to authenticated;

-- O/U predictions: edit until season lock (submit only affects league board visibility)
drop policy if exists "Users update predictions before submit" on public.team_predictions;
drop policy if exists "Users insert predictions before submit" on public.team_predictions;
drop policy if exists "Users delete predictions before submit" on public.team_predictions;
drop policy if exists "Users update predictions until season lock" on public.team_predictions;
drop policy if exists "Users insert predictions until season lock" on public.team_predictions;
drop policy if exists "Users delete predictions until season lock" on public.team_predictions;

create policy "Users insert predictions until season lock"
  on public.team_predictions
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and not public.picks_editing_locked()
    and exists (
      select 1 from public.league_members m
      where m.league_id = team_predictions.league_id
        and m.user_id = auth.uid()
    )
  );

create policy "Users update predictions until season lock"
  on public.team_predictions
  for update
  to authenticated
  using (
    user_id = auth.uid()
    and not public.picks_editing_locked()
  )
  with check (user_id = auth.uid());

create policy "Users delete predictions until season lock"
  on public.team_predictions
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    and not public.picks_editing_locked()
  );

-- Bonus answers: same season lock
drop policy if exists "Insert bonus answers before submit" on public.bonus_answers;
drop policy if exists "Update bonus answers before submit" on public.bonus_answers;
drop policy if exists "Delete bonus answers before submit" on public.bonus_answers;
drop policy if exists "Insert bonus answers until season lock" on public.bonus_answers;
drop policy if exists "Update bonus answers until season lock" on public.bonus_answers;
drop policy if exists "Delete bonus answers until season lock" on public.bonus_answers;

create policy "Insert bonus answers until season lock"
  on public.bonus_answers
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and not public.picks_editing_locked()
    and exists (
      select 1
      from public.bonus_questions q
      join public.league_members m on m.league_id = q.league_id
      where q.id = bonus_answers.question_id
        and m.user_id = auth.uid()
    )
  );

create policy "Update bonus answers until season lock"
  on public.bonus_answers
  for update
  to authenticated
  using (
    user_id = auth.uid()
    and not public.picks_editing_locked()
  )
  with check (user_id = auth.uid());

create policy "Delete bonus answers until season lock"
  on public.bonus_answers
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    and not public.picks_editing_locked()
  );
