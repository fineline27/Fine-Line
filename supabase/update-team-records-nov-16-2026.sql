-- NBA regular-season W-L through games of ~16 Nov 2026 (Adelaide). Safe to re-run.
-- Run in Supabase SQL Editor after game nights; users pull to refresh in the app.

update public.teams t
set
  current_wins = v.w,
  current_losses = v.l
from (
  values
    -- Eastern Conference
    ('ATL', 8, 6),
    ('BOS', 11, 2),
    ('BKN', 3, 9),
    ('CHA', 4, 9),
    ('CHI', 3, 9),
    ('CLE', 7, 7),
    ('DET', 8, 4),
    ('IND', 5, 9),
    ('MIA', 7, 6),
    ('MIL', 1, 13),
    ('NYK', 7, 6),
    ('ORL', 5, 7),
    ('PHI', 11, 3),
    ('TOR', 5, 8),
    ('WAS', 4, 10),
    -- Western Conference
    ('DAL', 7, 7),
    ('DEN', 7, 4),
    ('GSW', 8, 5),
    ('HOU', 11, 3),
    ('LAC', 4, 8),
    ('LAL', 12, 2),
    ('MEM', 9, 4),
    ('MIN', 9, 4),
    ('NOP', 4, 10),
    ('OKC', 8, 5),
    ('PHX', 5, 7),
    ('POR', 9, 3),
    ('SAC', 1, 11),
    ('SAS', 12, 2),
    ('UTA', 1, 13)
) as v(abbreviation, w, l)
where t.abbreviation = v.abbreviation;

select abbreviation, name, current_wins, current_losses
from public.teams
where sport = 'NBA'
order by abbreviation;