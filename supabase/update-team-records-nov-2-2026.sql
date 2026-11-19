-- NBA regular-season W-L through games of ~2 Nov 2026 (Adelaide). Safe to re-run.
-- Run in Supabase SQL Editor after game nights; users pull to refresh in the app.

update public.teams t
set
  current_wins = v.w,
  current_losses = v.l
from (
  values
    -- Eastern Conference
    ('ATL', 3, 4),
    ('BOS', 5, 1),
    ('BKN', 1, 5),
    ('CHA', 3, 4),
    ('CHI', 1, 5),
    ('CLE', 4, 2),
    ('DET', 5, 1),
    ('IND', 2, 5),
    ('MIA', 2, 4),
    ('MIL', 1, 5),
    ('NYK', 2, 4),
    ('ORL', 2, 4),
    ('PHI', 6, 1),
    ('TOR', 3, 3),
    ('WAS', 3, 3),
    -- Western Conference
    ('DAL', 4, 2),
    ('DEN', 3, 2),
    ('GSW', 4, 3),
    ('HOU', 6, 1),
    ('LAC', 1, 5),
    ('LAL', 5, 2),
    ('MEM', 6, 0),
    ('MIN', 4, 3),
    ('NOP', 2, 4),
    ('OKC', 4, 2),
    ('PHX', 1, 3),
    ('POR', 4, 1),
    ('SAC', 0, 6),
    ('SAS', 4, 2),
    ('UTA', 1, 5)
) as v(abbreviation, w, l)
where t.abbreviation = v.abbreviation;

select abbreviation, name, current_wins, current_losses
from public.teams
where sport = 'NBA'
order by abbreviation;
