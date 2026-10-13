-- Bonus tiebreakers required for every league. Run after 05-bonus-questions.sql.

alter table public.leagues
  alter column bonus_questions_enabled set default true;

update public.leagues
set bonus_questions_enabled = true
where bonus_questions_enabled is distinct from true;

insert into public.bonus_questions (league_id, question_key, question_text, points_worth)
select l.id, v.question_key, v.question_text, v.points_worth
from public.leagues l
cross join (
  values
    ('nba_mvp', 'NBA MVP?', 1),
    ('nba_champion', 'NBA Champion?', 1),
    ('nba_roy', 'Rookie of the Year?', 1)
) as v(question_key, question_text, points_worth)
where not exists (
  select 1
  from public.bonus_questions b
  where b.league_id = l.id
    and b.question_key = v.question_key
);
