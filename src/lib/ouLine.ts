import type { Team } from '../types/team';

const LINE_EPSILON = 0.05;

export function ouLinesEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < LINE_EPSILON;
}

export function effectiveLockedOuLine(locked: number | null | undefined, team: Team): number {
  if (typeof locked === 'number' && Number.isFinite(locked)) {
    return locked;
  }
  return team.ou_line;
}

export function lineHasMovedFromLock(
  locked: number | null | undefined,
  team: Team,
): boolean {
  if (locked == null || !Number.isFinite(locked)) {
    return false;
  }
  return !ouLinesEqual(locked, team.ou_line);
}

/** Team record with the O/U line used to grade this pick. */
export function teamForPickLine(team: Team, lockedOuLine: number | null | undefined): Team {
  const line = effectiveLockedOuLine(lockedOuLine, team);
  if (ouLinesEqual(line, team.ou_line)) {
    return team;
  }
  return { ...team, ou_line: line };
}
