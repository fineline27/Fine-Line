import type { Team, TeamStatus } from '../types/team';

export function calculateWinPace(team: Team): number {
  const gamesPlayed = team.current_wins + team.current_losses;
  if (gamesPlayed === 0) {
    return 0;
  }
  return (team.current_wins / gamesPlayed) * team.total_season_games;
}

export function getTeamStatus(team: Team): TeamStatus {
  const winPace = calculateWinPace(team);
  const { ou_line: line } = team;

  return winPace >= line ? 'ON TRACK' : 'NEEDS WORK';
}

export function formatRecord(wins: number, losses: number): string {
  return `${wins}-${losses}`;
}

export function formatWinPace(team: Team): string {
  return calculateWinPace(team).toFixed(1);
}
