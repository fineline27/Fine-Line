-- Run this in SQL Editor when tables already exist (you already ran 00-schema.sql).
-- Gives the app read access, then loads all 30 NBA teams.
-- O/U lines: 2026-27 season win totals (see update-ou-lines-2026-27.sql to refresh live DB only).

grant select on public.teams to anon, authenticated;

alter table public.teams enable row level security;

drop policy if exists "Public read teams" on public.teams;
create policy "Public read teams"
  on public.teams
  for select
  to anon, authenticated
  using (true);

delete from public.teams;

insert into public.teams (
  sport,
  name,
  abbreviation,
  primary_color,
  secondary_color,
  total_season_games,
  ou_line,
  current_wins,
  current_losses
) values
('NBA', 'Atlanta Hawks', 'ATL', '#E03A3E', '#C1D32F', 82, 43.5, 0, 0),
('NBA', 'Boston Celtics', 'BOS', '#007A33', '#BA9653', 82, 51.5, 0, 0),
('NBA', 'Brooklyn Nets', 'BKN', '#000000', '#FFFFFF', 82, 24.5, 0, 0),
('NBA', 'Charlotte Hornets', 'CHA', '#1D1160', '#00788C', 82, 39.5, 0, 0),
('NBA', 'Chicago Bulls', 'CHI', '#CE1141', '#000000', 82, 29.5, 0, 0),
('NBA', 'Cleveland Cavaliers', 'CLE', '#860038', '#FDBB30', 82, 47.5, 0, 0),
('NBA', 'Detroit Pistons', 'DET', '#C8102E', '#1D42BA', 82, 49.5, 0, 0),
('NBA', 'Indiana Pacers', 'IND', '#002D62', '#FDBB30', 82, 43.5, 0, 0),
('NBA', 'Miami Heat', 'MIA', '#98002E', '#F9A01B', 82, 46.5, 0, 0),
('NBA', 'Milwaukee Bucks', 'MIL', '#00471B', '#EEE1C6', 82, 25.5, 0, 0),
('NBA', 'New York Knicks', 'NYK', '#006BB6', '#F58426', 82, 52.5, 0, 0),
('NBA', 'Orlando Magic', 'ORL', '#0077C0', '#000000', 82, 43.5, 0, 0),
('NBA', 'Philadelphia 76ers', 'PHI', '#006BB6', '#ED174C', 82, 50.5, 0, 0),
('NBA', 'Toronto Raptors', 'TOR', '#CE1141', '#000000', 82, 46.5, 0, 0),
('NBA', 'Washington Wizards', 'WAS', '#002B5C', '#E31837', 82, 34.5, 0, 0),
('NBA', 'Dallas Mavericks', 'DAL', '#00538C', '#002B5E', 82, 34.5, 0, 0),
('NBA', 'Denver Nuggets', 'DEN', '#0E2240', '#FEC524', 82, 49.5, 0, 0),
('NBA', 'Golden State Warriors', 'GSW', '#1D428A', '#FFC72C', 82, 36.5, 0, 0),
('NBA', 'Houston Rockets', 'HOU', '#CE1141', '#000000', 82, 48.5, 0, 0),
('NBA', 'Los Angeles Clippers', 'LAC', '#C8102E', '#1D428A', 82, 28.5, 0, 0),
('NBA', 'Los Angeles Lakers', 'LAL', '#552583', '#FDB927', 82, 46.5, 0, 0),
('NBA', 'Memphis Grizzlies', 'MEM', '#5D76A9', '#12173F', 82, 29.5, 0, 0),
('NBA', 'Minnesota Timberwolves', 'MIN', '#0C2340', '#236192', 82, 48.5, 0, 0),
('NBA', 'New Orleans Pelicans', 'NOP', '#0C2340', '#C8102E', 82, 27.5, 0, 0),
('NBA', 'Oklahoma City Thunder', 'OKC', '#007AC1', '#EF3B24', 82, 62.5, 0, 0),
('NBA', 'Phoenix Suns', 'PHX', '#1D1160', '#E56020', 82, 38.5, 0, 0),
('NBA', 'Portland Trail Blazers', 'POR', '#E03A3E', '#000000', 82, 42.5, 0, 0),
('NBA', 'Sacramento Kings', 'SAC', '#5A2D81', '#63727A', 82, 21.5, 0, 0),
('NBA', 'San Antonio Spurs', 'SAS', '#C4CED4', '#000000', 82, 59.5, 0, 0),
('NBA', 'Utah Jazz', 'UTA', '#002B5C', '#F9A01B', 82, 37.5, 0, 0);

select count(*) as team_count from public.teams;
