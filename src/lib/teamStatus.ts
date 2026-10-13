import type { Team, TeamStatus } from '../types/team';

const STATUS_MARGIN = 1.5;

export function calculateWinPace(team: Team): number {
  const gamesPlayed = team.current_wins + team.current_losses;
  if (gamesPlayed === 0) {
    return 0;
  }
  return (team.current_wins / gamesPlayed) * team.total_season_games;
}

export function getTeamStatus(team: Team): TeamStatus {
  const gamesPlayed = team.current_wins + team.current_losses;
  if (gamesPlayed === 0) {
    return 'AROUND MARK';
  }

  const winPace = calculateWinPace(team);
  const { ou_line: line } = team;

  if (winPace >= line + STATUS_MARGIN) {
    return 'ON TRACK';
  }
  if (winPace <= line - STATUS_MARGIN) {
    return 'NEEDS WORK';
  }
  return 'AROUND MARK';
}

export function formatRecord(wins: number, losses: number): string {
  return `${wins}-${losses}`;
}

export function formatWinPace(team: Team): string {
  return calculateWinPace(team).toFixed(1);
}
