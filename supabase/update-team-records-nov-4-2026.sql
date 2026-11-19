-- NBA regular-season W-L through games of ~4 Nov 2026 (Adelaide). Safe to re-run.
-- Run in Supabase SQL Editor after game nights; users pull to refresh in the app.

update public.teams t
set
  current_wins = v.w,
  current_losses = v.l
from (
  values
    -- Eastern Conference
    ('ATL', 4, 4),
    ('BOS', 5, 2),
    ('BKN', 1, 6),
    ('CHA', 3, 5),
    ('CHI', 1, 6),
    ('CLE', 4, 3),
    ('DET', 6, 1),
    ('IND', 2, 6),
    ('MIA', 2, 5),
    ('MIL', 1, 6),
    ('NYK', 3, 4),
    ('ORL', 2, 5),
    ('PHI', 7, 1),
    ('TOR', 4, 3),
    ('WAS', 4, 3),
    -- Western Conference
    ('DAL', 4, 3),
    ('DEN', 3, 3),
    ('GSW', 5, 3),
    ('HOU', 7, 1),
    ('LAC', 1, 6),
    ('LAL', 6, 2),
    ('MEM', 6, 1),
    ('MIN', 5, 3),
    ('NOP', 3, 4),
    ('OKC', 5, 2),
    ('PHX', 1, 4),
    ('POR', 5, 1),
    ('SAC', 1, 6),
    ('SAS', 5, 2),
    ('UTA', 1, 6)
) as v(abbreviation, w, l)
where t.abbreviation = v.abbreviation;

select abbreviation, name, current_wins, current_losses
from public.teams
where sport = 'NBA'
order by abbreviation;
