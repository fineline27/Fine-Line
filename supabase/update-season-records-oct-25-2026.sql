-- NBA season W-L through early Oct 2026 (matches ESPN standings). Safe to re-run.
-- Run in Supabase SQL Editor after game nights; users pull to refresh in the app.

update public.teams set current_wins = 2, current_losses = 1 where abbreviation = 'ATL';
update public.teams set current_wins = 1, current_losses = 1 where abbreviation = 'BOS';
update public.teams set current_wins = 0, current_losses = 2 where abbreviation = 'BKN';
update public.teams set current_wins = 2, current_losses = 1 where abbreviation = 'CHA';
update public.teams set current_wins = 1, current_losses = 2 where abbreviation = 'CHI';
update public.teams set current_wins = 1, current_losses = 1 where abbreviation = 'CLE';
update public.teams set current_wins = 1, current_losses = 2 where abbreviation = 'DAL';
update public.teams set current_wins = 1, current_losses = 1 where abbreviation = 'DEN';
update public.teams set current_wins = 2, current_losses = 0 where abbreviation = 'DET';
update public.teams set current_wins = 0, current_losses = 3 where abbreviation = 'GSW';
update public.teams set current_wins = 3, current_losses = 0 where abbreviation = 'HOU';
update public.teams set current_wins = 1, current_losses = 1 where abbreviation = 'IND';
update public.teams set current_wins = 1, current_losses = 1 where abbreviation = 'LAC';
update public.teams set current_wins = 2, current_losses = 0 where abbreviation = 'LAL';
update public.teams set current_wins = 2, current_losses = 0 where abbreviation = 'MEM';
update public.teams set current_wins = 0, current_losses = 3 where abbreviation = 'MIA';
update public.teams set current_wins = 0, current_losses = 3 where abbreviation = 'MIL';
update public.teams set current_wins = 2, current_losses = 0 where abbreviation = 'MIN';
update public.teams set current_wins = 0, current_losses = 2 where abbreviation = 'NYK';
update public.teams set current_wins = 0, current_losses = 3 where abbreviation = 'NOP';
update public.teams set current_wins = 2, current_losses = 0 where abbreviation = 'OKC';
update public.teams set current_wins = 0, current_losses = 2 where abbreviation = 'ORL';
update public.teams set current_wins = 3, current_losses = 0 where abbreviation = 'PHI';
update public.teams set current_wins = 1, current_losses = 1 where abbreviation = 'PHX';
update public.teams set current_wins = 2, current_losses = 0 where abbreviation = 'POR';
update public.teams set current_wins = 0, current_losses = 2 where abbreviation = 'SAC';
update public.teams set current_wins = 1, current_losses = 2 where abbreviation = 'SAS';
update public.teams set current_wins = 2, current_losses = 0 where abbreviation = 'TOR';
update public.teams set current_wins = 1, current_losses = 1 where abbreviation = 'UTA';
update public.teams set current_wins = 2, current_losses = 1 where abbreviation = 'WAS';

select abbreviation, name, current_wins, current_losses
from public.teams
where sport = 'NBA'
order by abbreviation;
