-- Four-team O/U line moves (2026–27 win totals). Updates ou_line only; keeps records and picks.
-- *** RUN THIS ON LIVE SUPABASE *** (SQL Editor → New query → paste → Run). Safe to re-run.
-- Or: npm run apply:ou-four-teams (service role in .env). Git alone does not update production.

-- Philadelphia 76ers: 49.5 → 50.5
update public.teams set ou_line = 50.5 where abbreviation = 'PHI';

-- Portland Trail Blazers: 41.5 → 42.5
update public.teams set ou_line = 42.5 where abbreviation = 'POR';

-- Golden State Warriors: 40.5 → 35.5
update public.teams set ou_line = 35.5 where abbreviation = 'GSW';

-- Phoenix Suns: 40.5 → 39.5
update public.teams set ou_line = 39.5 where abbreviation = 'PHX';

select abbreviation, name, ou_line
from public.teams
where abbreviation in ('PHI', 'POR', 'GSW', 'PHX')
order by abbreviation;
