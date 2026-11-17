-- NBA regular-season W-L through games of ~17 Nov 2026 (Adelaide). Safe to re-run.
-- Run in Supabase SQL Editor after game nights; users pull to refresh in the app.

update public.teams t
set
  current_wins = v.w,
  current_losses = v.l
from (
  values
    -- Eastern Conference
    ('ATL', 8, 6),
    ('BOS', 11, 3),
    ('BKN', 3, 10),
    ('CHA', 4, 9),
    ('CHI', 3, 10),
    ('CLE', 8, 7),
    ('DET', 8, 4),
    ('IND', 5, 9),
    ('MIA', 8, 6),
    ('MIL', 1, 13),
    ('NYK', 7, 6),
    ('ORL', 6, 7),
    ('PHI', 12, 3),
    ('TOR', 5, 8),
    ('WAS', 4, 11),
    -- Western Conference
    ('DAL', 7, 7),
    ('DEN', 7, 5),
    ('GSW', 8, 6),
    ('HOU', 11, 4),
    ('LAC', 4, 8),
    ('LAL', 12, 2),
    ('MEM', 10, 4),
    ('MIN', 10, 4),
    ('NOP', 5, 10),
    ('OKC', 9, 5),
    ('PHX', 6, 7),
    ('POR', 9, 4),
    ('SAC', 1, 12),
    ('SAS', 12, 2),
    ('UTA', 1, 13)
) as v(abbreviation, w, l)
where t.abbreviation = v.abbreviation;

select abbreviation, name, current_wins, current_losses
from public.teams
where sport = 'NBA'
order by abbreviation;