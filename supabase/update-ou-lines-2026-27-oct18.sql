-- O/U line adjustments (Oct 2026). Safe to re-run; updates ou_line only.

update public.teams set ou_line = 36.5 where abbreviation = 'GSW';
update public.teams set ou_line = 61.5 where abbreviation = 'OKC';
update public.teams set ou_line = 38.5 where abbreviation = 'PHX';
update public.teams set ou_line = 60.5 where abbreviation = 'SAS';

select abbreviation, ou_line from public.teams where abbreviation in ('GSW', 'OKC', 'PHX', 'SAS') order by abbreviation;
