-- NBA regular-season W-L through games of ~9 Nov 2026 (Adelaide). Safe to re-run.
-- Run in Supabase SQL Editor after game nights; users pull to refresh in the app.

update public.teams t
set
  current_wins = v.w,
  current_losses = v.l
from (
  values
    -- Eastern Conference
    ('ATL', 7, 4),
    ('BOS', 8, 2),
    ('BKN', 2, 8),
    ('CHA', 3, 7),
    ('CHI', 1, 8),
    ('CLE', 5, 5),
    ('DET', 6, 3),
    ('IND', 3, 7),
    ('MIA', 4, 6),
    ('MIL', 1, 9),
    ('NYK', 5, 4),
    ('ORL', 2, 7),
    ('PHI', 9, 2),
    ('TOR', 5, 4),
    ('WAS', 4, 6),
    -- Western Conference
    ('DAL', 6, 4),
    ('DEN', 5, 3),
    ('GSW', 7, 3),
    ('HOU', 7, 3),
    ('LAC', 2, 7),
    ('LAL', 9, 2),
    ('MEM', 6, 3),
    ('MIN', 8, 3),
    ('NOP', 4, 6),
    ('OKC', 8, 2),
    ('PHX', 3, 5),
    ('POR', 6, 3),
    ('SAC', 1, 9),
    ('SAS', 8, 2),
    ('UTA', 1, 9)
) as v(abbreviation, w, l)
where t.abbreviation = v.abbreviation;

select abbreviation, name, current_wins, current_losses
from public.teams
where sport = 'NBA'
order by abbreviation;
