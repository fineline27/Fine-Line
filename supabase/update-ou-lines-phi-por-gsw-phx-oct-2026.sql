-- Four-team O/U line moves (2026–27 win totals). Updates ou_line only; keeps records and picks.
-- Run in Supabase SQL Editor when the board should reflect this batch (safe to re-run).

-- Philadelphia 76ers: 45.5 → 50.5
update public.teams set ou_line = 50.5 where abbreviation = 'PHI';

-- Portland Trail Blazers: 34.5 → 42.5
update public.teams set ou_line = 42.5 where abbreviation = 'POR';

-- Golden State Warriors: 40.5 → 35.5
update public.teams set ou_line = 35.5 where abbreviation = 'GSW';

-- Phoenix Suns: 40.5 → 39.5
update public.teams set ou_line = 39.5 where abbreviation = 'PHX';

select abbreviation, name, ou_line
from public.teams
where abbreviation in ('PHI', 'POR', 'GSW', 'PHX')
order by abbreviation;
