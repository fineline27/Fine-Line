-- Stake points (1–3) per O/U pick for the Stakes overall format (Classic is unchanged).
-- Safe to re-run.

alter table public.team_predictions
  add column if not exists confidence_points smallint not null default 1;

alter table public.team_predictions
  drop constraint if exists team_predictions_confidence_points_check;

alter table public.team_predictions
  add constraint team_predictions_confidence_points_check
  check (confidence_points >= 1 and confidence_points <= 3);
