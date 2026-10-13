-- Bonus tiebreaker questions (MVP, Champion, ROY) per league.
-- Run after 04-league-submit-and-roster.sql.

alter table public.leagues
  add column if not exists bonus_questions_enabled boolean not null default false;

alter table public.bonus_questions
  add column if not exists question_key varchar(32);

create unique index if not exists bonus_questions_league_key
  on public.bonus_questions (league_id, question_key)
  where question_key is not null;

create unique index if not exists bonus_answers_question_user
  on public.bonus_answers (question_id, user_id);

grant select on public.bonus_questions to authenticated;
grant insert on public.bonus_questions to authenticated;
grant select, insert, update, delete on public.bonus_answers to authenticated;

alter table public.bonus_questions enable row level security;
alter table public.bonus_answers enable row level security;

drop policy if exists "League members read bonus questions" on public.bonus_questions;
create policy "League members read bonus questions"
  on public.bonus_questions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.league_members m
      where m.league_id = bonus_questions.league_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "Creators add bonus questions" on public.bonus_questions;
create policy "Creators add bonus questions"
  on public.bonus_questions
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.leagues l
      where l.id = bonus_questions.league_id
        and l.creator_id = auth.uid()
    )
  );

drop policy if exists "Own bonus answers read" on public.bonus_answers;
create policy "Own bonus answers read"
  on public.bonus_answers
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "League bonus answers read after submit" on public.bonus_answers;
create policy "League bonus answers read after submit"
  on public.bonus_answers
  for select
  to authenticated
  using (
    user_id <> auth.uid()
    and exists (
      select 1
      from public.bonus_questions q
      join public.league_members mine on mine.league_id = q.league_id
      where q.id = bonus_answers.question_id
        and mine.user_id = auth.uid()
        and mine.picks_submitted_at is not null
    )
  );

drop policy if exists "Insert bonus answers before submit" on public.bonus_answers;
create policy "Insert bonus answers before submit"
  on public.bonus_answers
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.bonus_questions q
      join public.league_members m on m.league_id = q.league_id
      where q.id = bonus_answers.question_id
        and m.user_id = auth.uid()
        and m.picks_submitted_at is null
    )
  );

drop policy if exists "Update bonus answers before submit" on public.bonus_answers;
create policy "Update bonus answers before submit"
  on public.bonus_answers
  for update
  to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.bonus_questions q
      join public.league_members m on m.league_id = q.league_id
      where q.id = bonus_answers.question_id
        and m.user_id = auth.uid()
        and m.picks_submitted_at is null
    )
  )
  with check (user_id = auth.uid());

drop policy if exists "Delete bonus answers before submit" on public.bonus_answers;
create policy "Delete bonus answers before submit"
  on public.bonus_answers
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.bonus_questions q
      join public.league_members m on m.league_id = q.league_id
      where q.id = bonus_answers.question_id
        and m.user_id = auth.uid()
        and m.picks_submitted_at is null
    )
  );
