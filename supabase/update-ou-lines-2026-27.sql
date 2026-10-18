-- 2026-27 NBA regular-season win totals (O/U lines). Updates ou_line only; keeps records.
-- Source: market consensus ~Oct 2026 (BetMGM / major books).

update public.teams set ou_line = 43.5 where abbreviation = 'ATL';
update public.teams set ou_line = 51.5 where abbreviation = 'BOS';
update public.teams set ou_line = 24.5 where abbreviation = 'BKN';
update public.teams set ou_line = 39.5 where abbreviation = 'CHA';
update public.teams set ou_line = 29.5 where abbreviation = 'CHI';
update public.teams set ou_line = 47.5 where abbreviation = 'CLE';
update public.teams set ou_line = 34.5 where abbreviation = 'DAL';
update public.teams set ou_line = 49.5 where abbreviation = 'DEN';
update public.teams set ou_line = 49.5 where abbreviation = 'DET';
update public.teams set ou_line = 36.5 where abbreviation = 'GSW';
update public.teams set ou_line = 48.5 where abbreviation = 'HOU';
update public.teams set ou_line = 43.5 where abbreviation = 'IND';
update public.teams set ou_line = 28.5 where abbreviation = 'LAC';
update public.teams set ou_line = 46.5 where abbreviation = 'LAL';
update public.teams set ou_line = 29.5 where abbreviation = 'MEM';
update public.teams set ou_line = 46.5 where abbreviation = 'MIA';
update public.teams set ou_line = 25.5 where abbreviation = 'MIL';
update public.teams set ou_line = 48.5 where abbreviation = 'MIN';
update public.teams set ou_line = 27.5 where abbreviation = 'NOP';
update public.teams set ou_line = 52.5 where abbreviation = 'NYK';
update public.teams set ou_line = 61.5 where abbreviation = 'OKC';
update public.teams set ou_line = 43.5 where abbreviation = 'ORL';
update public.teams set ou_line = 50.5 where abbreviation = 'PHI';
update public.teams set ou_line = 38.5 where abbreviation = 'PHX';
update public.teams set ou_line = 42.5 where abbreviation = 'POR';
update public.teams set ou_line = 60.5 where abbreviation = 'SAS';
update public.teams set ou_line = 21.5 where abbreviation = 'SAC';
update public.teams set ou_line = 46.5 where abbreviation = 'TOR';
update public.teams set ou_line = 37.5 where abbreviation = 'UTA';
update public.teams set ou_line = 34.5 where abbreviation = 'WAS';

select abbreviation, ou_line from public.teams where sport = 'NBA' order by abbreviation;
