-- NBA regular-season W-L through games of ~6 Nov 2026 (Adelaide). Safe to re-run.
-- Run in Supabase SQL Editor after game nights; users pull to refresh in the app.

update public.teams t
set
  current_wins = v.w,
  current_losses = v.l
from (
  values
    -- Eastern Conference
    ('ATL', 5, 4),
    ('BOS', 6, 2),
    ('BKN', 2, 6),
    ('CHA', 3, 6),
    ('CHI', 1, 7),
    ('CLE', 4, 4),
    ('DET', 6, 2),
    ('IND', 3, 6),
    ('MIA', 3, 5),
    ('MIL', 1, 7),
    ('NYK', 4, 4),
    ('ORL', 2, 5),
    ('PHI', 8, 1),
    ('TOR', 4, 4),
    ('WAS', 4, 4),
    -- Western Conference
    ('DAL', 4, 4),
    ('DEN', 4, 3),
    ('GSW', 5, 3),
    ('HOU', 7, 2),
    ('LAC', 1, 7),
    ('LAL', 7, 2),
    ('MEM', 6, 2),
    ('MIN', 6, 3),
    ('NOP', 4, 4),
    ('OKC', 6, 2),
    ('PHX', 1, 5),
    ('POR', 6, 1),
    ('SAC', 1, 7),
    ('SAS', 6, 2),
    ('UTA', 1, 7)
) as v(abbreviation, w, l)
where t.abbreviation = v.abbreviation;

select abbreviation, name, current_wins, current_losses
from public.teams
where sport = 'NBA'
order by abbreviation;
