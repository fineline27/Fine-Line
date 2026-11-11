-- NBA regular-season W-L through games of ~12 Nov 2026 (Adelaide). Safe to re-run.
-- Run in Supabase SQL Editor after game nights; users pull to refresh in the app.

update public.teams t
set
  current_wins = v.w,
  current_losses = v.l
from (
  values
    -- Eastern Conference
    ('ATL', 7, 5),
    ('BOS', 9, 2),
    ('BKN', 2, 8),
    ('CHA', 4, 7),
    ('CHI', 1, 8),
    ('CLE', 5, 6),
    ('DET', 7, 3),
    ('IND', 3, 8),
    ('MIA', 5, 6),
    ('MIL', 1, 10),
    ('NYK', 6, 4),
    ('ORL', 3, 7),
    ('PHI', 9, 3),
    ('TOR', 5, 5),
    ('WAS', 4, 7),
    -- Western Conference
    ('DAL', 7, 4),
    ('DEN', 5, 4),
    ('GSW', 8, 3),
    ('HOU', 8, 3),
    ('LAC', 2, 8),
    ('LAL', 10, 2),
    ('MEM', 7, 3),
    ('MIN', 8, 3),
    ('NOP', 4, 7),
    ('OKC', 8, 3),
    ('PHX', 4, 6),
    ('POR', 7, 3),
    ('SAC', 1, 10),
    ('SAS', 9, 2),
    ('UTA', 1, 10)
) as v(abbreviation, w, l)
where t.abbreviation = v.abbreviation;

select abbreviation, name, current_wins, current_losses
from public.teams
where sport = 'NBA'
order by abbreviation;
