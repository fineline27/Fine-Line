-- Six-team W-L update after opening games (2026–27). Sets current_wins / current_losses only; keeps O/U lines and picks.
-- Run in Supabase SQL Editor when the board should reflect this batch (safe to re-run).

-- Oklahoma City Thunder: 1-0
update public.teams set current_wins = 1, current_losses = 0 where abbreviation = 'OKC';

-- San Antonio Spurs: 0-1
update public.teams set current_wins = 0, current_losses = 1 where abbreviation = 'SAS';

-- Philadelphia 76ers: 1-0
update public.teams set current_wins = 1, current_losses = 0 where abbreviation = 'PHI';

-- New York Knicks: 0-1
update public.teams set current_wins = 0, current_losses = 1 where abbreviation = 'NYK';

-- Detroit Pistons: 1-0
update public.teams set current_wins = 1, current_losses = 0 where abbreviation = 'DET';

-- Boston Celtics: 0-1
update public.teams set current_wins = 0, current_losses = 1 where abbreviation = 'BOS';

select abbreviation, name, current_wins, current_losses
from public.teams
where abbreviation in ('OKC', 'SAS', 'PHI', 'NYK', 'DET', 'BOS')
order by abbreviation;
