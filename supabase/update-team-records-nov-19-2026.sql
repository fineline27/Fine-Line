-- NBA regular-season W-L through games of ~19 Nov 2026. Safe to re-run.
-- Run in Supabase SQL Editor after game nights; users pull to refresh in the app.

update public.teams t
set
  current_wins = v.w,
  current_losses = v.l
from (
  values
    -- Eastern Conference
    ('ATL', 9, 6),
    ('BOS', 11, 4),
    ('BKN', 3, 11),
    ('CHA', 4, 10),
    ('CHI', 4, 10),
    ('CLE', 8, 8),
    ('DET', 10, 4),
    ('IND', 5, 10),
    ('MIA', 9, 6),
    ('MIL', 1, 14),
    ('NYK', 8, 6),
    ('ORL', 6, 8),
    ('PHI', 13, 3),
    ('TOR', 5, 10),
    ('WAS', 5, 11),
    -- Western Conference
    ('DAL', 8, 7),
    ('DEN', 8, 5),
    ('GSW', 8, 7),
    ('HOU', 12, 4),
    ('LAC', 4, 9),
    ('LAL', 13, 3),
    ('MEM', 11, 4),
    ('MIN', 11, 4),
    ('NOP', 5, 11),
    ('OKC', 9, 6),
    ('PHX', 7, 7),
    ('POR', 9, 5),
    ('SAC', 1, 13),
    ('SAS', 12, 3),
    ('UTA', 3, 13)
) as v(abbreviation, w, l)
where t.abbreviation = v.abbreviation;

select abbreviation, name, current_wins, current_losses
from public.teams
where sport = 'NBA'
order by abbreviation;