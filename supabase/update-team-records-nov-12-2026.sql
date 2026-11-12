-- NBA regular-season W-L through games of ~12 Nov 2026 evening (Adelaide). Safe to re-run.
-- Run in Supabase SQL Editor after game nights; users pull to refresh in the app.

update public.teams t
set
  current_wins = v.w,
  current_losses = v.l
from (
  values
    -- Eastern Conference
    ('ATL', 7, 5),
    ('BOS', 10, 2),
    ('BKN', 3, 8),
    ('CHA', 4, 7),
    ('CHI', 1, 9),
    ('CLE', 6, 6),
    ('DET', 7, 3),
    ('IND', 4, 8),
    ('MIA', 5, 6),
    ('MIL', 1, 11),
    ('NYK', 6, 5),
    ('ORL', 4, 7),
    ('PHI', 9, 3),
    ('TOR', 5, 6),
    ('WAS', 4, 8),
    -- Western Conference
    ('DAL', 7, 4),
    ('DEN', 6, 4),
    ('GSW', 8, 4),
    ('HOU', 9, 3),
    ('LAC', 2, 8),
    ('LAL', 11, 2),
    ('MEM', 7, 4),
    ('MIN', 8, 3),
    ('NOP', 4, 8),
    ('OKC', 8, 4),
    ('PHX', 4, 6),
    ('POR', 8, 3),
    ('SAC', 1, 10),
    ('SAS', 10, 2),
    ('UTA', 1, 11)
) as v(abbreviation, w, l)
where t.abbreviation = v.abbreviation;

select abbreviation, name, current_wins, current_losses
from public.teams
where sport = 'NBA'
order by abbreviation;
