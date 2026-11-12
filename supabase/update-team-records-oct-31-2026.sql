-- NBA regular-season W-L through games of ~31 Oct 2026 (Adelaide). Safe to re-run.
-- Run in Supabase SQL Editor after game nights; users pull to refresh in the app.

update public.teams t
set
  current_wins = v.w,
  current_losses = v.l
from (
  values
    -- Eastern Conference
    ('ATL', 3, 3),
    ('BOS', 4, 1),
    ('BKN', 0, 5),
    ('CHA', 3, 3),
    ('CHI', 1, 5),
    ('CLE', 3, 2),
    ('DET', 5, 1),
    ('IND', 2, 4),
    ('MIA', 2, 4),
    ('MIL', 1, 4),
    ('NYK', 2, 4),
    ('ORL', 2, 3),
    ('PHI', 5, 1),
    ('TOR', 3, 2),
    ('WAS', 3, 3),
    -- Western Conference
    ('DAL', 4, 2),
    ('DEN', 3, 2),
    ('GSW', 3, 3),
    ('HOU', 5, 1),
    ('LAC', 1, 4),
    ('LAL', 4, 2),
    ('MEM', 5, 0),
    ('MIN', 4, 2),
    ('NOP', 1, 4),
    ('OKC', 4, 1),
    ('PHX', 1, 3),
    ('POR', 3, 1),
    ('SAC', 0, 5),
    ('SAS', 3, 2),
    ('UTA', 1, 4)
) as v(abbreviation, w, l)
where t.abbreviation = v.abbreviation;

select abbreviation, name, current_wins, current_losses
from public.teams
where sport = 'NBA'
order by abbreviation;
