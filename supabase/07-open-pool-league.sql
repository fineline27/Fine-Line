-- Shared "overall pool" per sport — every player auto-joins via app (invite OPENNBA).
-- Run after 02-auth-rls.sql and fix-play-solo-and-leagues.sql (members can join).

insert into public.leagues (name, invite_code, sport, creator_id, bonus_questions_enabled)
select 'Fine Line Overall (NBA)', 'OPENNBA', 'NBA', null, true
where not exists (select 1 from public.leagues where invite_code = 'OPENNBA');

insert into public.bonus_questions (league_id, question_key, question_text, points_worth)
select l.id, v.question_key, v.question_text, v.points_worth
from public.leagues l
cross join (
  values
    ('nba_mvp', 'NBA MVP?', 1),
    ('nba_champion', 'NBA Champion?', 1),
    ('nba_roy', 'Rookie of the Year?', 1)
) as v(question_key, question_text, points_worth)
where l.invite_code = 'OPENNBA'
  and not exists (
    select 1 from public.bonus_questions b
    where b.league_id = l.id and b.question_key = v.question_key
  );
