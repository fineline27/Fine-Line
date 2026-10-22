-- NBA win/loss records after opening-night slate (2026–27). Updates records only; keeps O/U lines and picks.
-- Run in Supabase SQL Editor when the board should reflect this snapshot (safe to re-run).

update public.teams as t
set
  current_wins = v.w,
  current_losses = v.l
from (
  values
    ('ATL', 1, 0),
    ('BOS', 0, 1),
    ('BKN', 0, 1),
    ('CHA', 1, 0),
    ('CHI', 0, 1),
    ('CLE', 0, 0),
    ('DET', 1, 0),
    ('IND', 1, 0),
    ('MIA', 0, 1),
    ('MIL', 0, 1),
    ('NYK', 0, 1),
    ('ORL', 0, 1),
    ('PHI', 1, 0),
    ('TOR', 1, 0),
    ('WAS', 1, 0),
    ('DAL', 0, 1),
    ('DEN', 0, 0),
    ('GSW', 0, 1),
    ('HOU', 1, 0),
    ('LAC', 1, 0),
    ('LAL', 1, 0),
    ('MEM', 1, 0),
    ('MIN', 1, 0),
    ('NOP', 0, 1),
    ('OKC', 1, 0),
    ('PHX', 0, 1),
    ('POR', 1, 0),
    ('SAC', 0, 1),
    ('SAS', 0, 1),
    ('UTA', 0, 1)
) as v(abbreviation, w, l)
where t.abbreviation = v.abbreviation;

select abbreviation, name, current_wins, current_losses
from public.teams
where sport = 'NBA'
order by abbreviation;
