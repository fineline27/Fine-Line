-- NBA team W–L records as of 19 Nov 2026. Updates current_wins / current_losses only; keeps O/U lines and picks.
-- Run in Supabase SQL Editor (safe to re-run). Users pull to refresh on My picks to see new records and colors.

-- Eastern Conference
update public.teams set current_wins = 13, current_losses = 3 where abbreviation = 'PHI';
update public.teams set current_wins = 11, current_losses = 4 where abbreviation = 'BOS';
update public.teams set current_wins = 10, current_losses = 4 where abbreviation = 'DET';
update public.teams set current_wins = 9, current_losses = 6 where abbreviation = 'MIA';
update public.teams set current_wins = 9, current_losses = 6 where abbreviation = 'ATL';
update public.teams set current_wins = 8, current_losses = 6 where abbreviation = 'NYK';
update public.teams set current_wins = 8, current_losses = 8 where abbreviation = 'CLE';
update public.teams set current_wins = 6, current_losses = 8 where abbreviation = 'ORL';
update public.teams set current_wins = 5, current_losses = 10 where abbreviation = 'TOR';
update public.teams set current_wins = 5, current_losses = 10 where abbreviation = 'IND';
update public.teams set current_wins = 5, current_losses = 11 where abbreviation = 'WAS';
update public.teams set current_wins = 4, current_losses = 10 where abbreviation = 'CHA';
update public.teams set current_wins = 4, current_losses = 10 where abbreviation = 'CHI';
update public.teams set current_wins = 3, current_losses = 11 where abbreviation = 'BKN';
update public.teams set current_wins = 1, current_losses = 14 where abbreviation = 'MIL';

-- Western Conference
update public.teams set current_wins = 13, current_losses = 2 where abbreviation = 'LAL';
update public.teams set current_wins = 12, current_losses = 3 where abbreviation = 'SAS';
update public.teams set current_wins = 12, current_losses = 4 where abbreviation = 'HOU';
update public.teams set current_wins = 11, current_losses = 4 where abbreviation = 'MIN';
update public.teams set current_wins = 11, current_losses = 4 where abbreviation = 'MEM';
update public.teams set current_wins = 9, current_losses = 5 where abbreviation = 'POR';
update public.teams set current_wins = 8, current_losses = 5 where abbreviation = 'DEN';
update public.teams set current_wins = 9, current_losses = 6 where abbreviation = 'OKC';
update public.teams set current_wins = 8, current_losses = 7 where abbreviation = 'DAL';
update public.teams set current_wins = 8, current_losses = 7 where abbreviation = 'GSW';
update public.teams set current_wins = 6, current_losses = 7 where abbreviation = 'PHX';
update public.teams set current_wins = 5, current_losses = 11 where abbreviation = 'NOP';
update public.teams set current_wins = 4, current_losses = 9 where abbreviation = 'LAC';
update public.teams set current_wins = 2, current_losses = 13 where abbreviation = 'UTA';
update public.teams set current_wins = 1, current_losses = 12 where abbreviation = 'SAC';

select abbreviation, name, current_wins, current_losses
from public.teams
where sport = 'NBA'
order by abbreviation;