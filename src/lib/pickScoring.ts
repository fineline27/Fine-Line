import { teamForPickLine } from './ouLine';
import { calculateWinPace, WIN_PACE_STATUS_MARGIN } from './teamStatus';
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

function paceEvaluationForPick(pick: PickSide, pace: number, line: number): PickEvaluation {
  const margin = WIN_PACE_STATUS_MARGIN;
  if (pick === 'over') {
    if (pace >= line + margin) {
      return 'ahead';
    }
    if (pace <= line - margin) {
      return 'behind';
    }
    return 'pending';
  }
  if (pace <= line - margin) {
    return 'ahead';
  }
  if (pace >= line + margin) {
    return 'behind';
  }
  return 'pending';
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
  const gamesPlayed = gradedTeam.current_wins + gradedTeam.current_losses;

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
    if (gamesPlayed === 0) {
      return 'pending';
    }
    const pace = calculateWinPace(gradedTeam);
    return paceEvaluationForPick('over', pace, line);
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
  if (gamesPlayed === 0) {
    return 'pending';
  }
  const pace = calculateWinPace(gradedTeam);
  return paceEvaluationForPick('under', pace, line);
}

export function pickIsClinched(evaluation: PickEvaluation): boolean {
  return evaluation === 'won';
}

export type PickTrackBand = 'on-track' | 'unsure' | 'off-track';

export function pickTrackBand(evaluation: PickEvaluation): PickTrackBand {
  switch (evaluation) {
    case 'ahead':
    case 'won':
      return 'on-track';
    case 'pending':
      return 'unsure';
    case 'behind':
    case 'lost':
      return 'off-track';
  }
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
      return 'Unsure';
  }
}

export function classicPointsForEvaluation(evaluation: PickEvaluation): number {
  if (evaluation === 'won' || evaluation === 'ahead') {
    return 1;
  }
  return 0;
}

export function stakesPointsForEvaluation(
  evaluation: PickEvaluation,
  confidence: number,
): number {
  const pts = Math.min(3, Math.max(1, Math.round(confidence)));
  if (evaluation === 'won' || evaluation === 'ahead') {
    return pts;
  }
  if (evaluation === 'lost' || evaluation === 'behind') {
    return -pts;
  }
  return 0;
}

/** Classic: +1 on track or pick won; 0 if unsure, off track, or pick lost. */
export function scorePick(team: Team, pick: PickSide, lockedOuLine?: number | null): number {
  return classicPointsForEvaluation(evaluatePick(team, pick, lockedOuLine));
}

/** Stakes: +stake on track or won; −stake off track or lost; 0 while unsure. */
export function scoreConfidencePick(
  team: Team,
  pick: PickSide,
  confidence: number,
  lockedOuLine?: number | null,
): number {
  return stakesPointsForEvaluation(
    evaluatePick(team, pick, lockedOuLine),
    confidence,
  );
}
