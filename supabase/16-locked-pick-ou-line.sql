-- Lock each O/U pick to the season line at save time. If the line moves later,
-- grading uses locked_ou_line; changing the pick requires accepting the new line.
-- Safe to re-run.

alter table public.team_predictions
  add column if not exists locked_ou_line decimal(3, 1);

update public.team_predictions tp
set locked_ou_line = t.ou_line
from public.teams t
where tp.team_id = t.id
  and tp.locked_ou_line is null;

alter table public.team_predictions
  drop constraint if exists team_predictions_locked_ou_line_check;

alter table public.team_predictions
  add constraint team_predictions_locked_ou_line_check
  check (locked_ou_line is null or (locked_ou_line >= 0 and locked_ou_line <= 100));
