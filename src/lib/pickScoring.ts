import { teamForPickLine } from './ouLine';
import { calculateWinPace } from './teamStatus';
import type { PickSide, Team } from '../types/team';

export type PickEvaluation = 'ahead' | 'behind' | 'won' | 'lost' | 'pending';

/** Integer wins needed for OVER to win vs a .5 line (e.g. 54.5 → 55). */
export function winsNeededForOver(line: number): number {
  return Math.floor(line) + 1;
}

export function maxPossibleWins(team: Team): number {
  const played = team.current_wins + team.current_losses;
  const remaining = Math.max(0, team.total_season_games - played);
  return team.current_wins + remaining;
}

export function seasonComplete(team: Team): boolean {
  return team.current_wins + team.current_losses >= team.total_season_games;
}

export function overWinsAtEnd(wins: number, line: number): boolean {
  return wins >= winsNeededForOver(line);
}

export function underWinsAtEnd(wins: number, line: number): boolean {
  return wins < winsNeededForOver(line);
}

export function evaluatePick(
  team: Team,
  pick: PickSide,
  lockedOuLine?: number | null,
): PickEvaluation {
  const gradedTeam = teamForPickLine(team, lockedOuLine);
  const line = gradedTeam.ou_line;
  const { current_wins: wins } = gradedTeam;
  const overNeed = winsNeededForOver(line);

  if (pick === 'over') {
    if (seasonComplete(gradedTeam)) {
      return overWinsAtEnd(wins, line) ? 'won' : 'lost';
    }
    if (wins >= overNeed) {
      return 'won';
    }
    if (maxPossibleWins(gradedTeam) < overNeed) {
      return 'lost';
    }
    if (maxPossibleWins(gradedTeam) < overNeed) {
      return 'lost';
    }
    const pace = calculateWinPace(gradedTeam);
    return pace >= line ? 'ahead' : 'behind';
  }

  if (seasonComplete(gradedTeam)) {
    return underWinsAtEnd(wins, line) ? 'won' : 'lost';
  }
  if (maxPossibleWins(gradedTeam) < overNeed) {
    return 'won';
  }
  if (wins >= overNeed) {
    return 'lost';
  }
  const pace = calculateWinPace(gradedTeam);
  return pace <= line ? 'ahead' : 'behind';
}

export function pickEvaluationLabel(state: PickEvaluation): string {
  switch (state) {
    case 'ahead':
      return 'On track';
    case 'behind':
      return 'Off track';
    case 'won':
      return 'Pick won';
    case 'lost':
      return 'Pick lost';
    case 'pending':
      return 'Pending';
  }
}

export function scorePick(team: Team, pick: PickSide, lockedOuLine?: number | null): number {
  const result = evaluatePick(team, pick, lockedOuLine);
  if (result === 'won') {
    return 1;
  }
  if (result === 'lost') {
    return 0;
  }
  return 0;
}

/** Stakes format: +stake if pick won, −stake if lost, 0 while still live. */
export function scoreConfidencePick(
  team: Team,
  pick: PickSide,
  confidence: number,
  lockedOuLine?: number | null,
): number {
  const pts = Math.min(3, Math.max(1, Math.round(confidence)));
  const result = evaluatePick(team, pick, lockedOuLine);
  if (result === 'won') {
    return pts;
  }
  if (result === 'lost') {
    return -pts;
  }
  return 0;
}
