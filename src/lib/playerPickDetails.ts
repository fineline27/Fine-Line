import type { BonusAnswerRow, BonusQuestion } from '../types/bonus';
import type { PickSide, Team } from '../types/team';

export type PlayerOuPick = {
  abbreviation: string;
  ouLine: number;
  pick: PickSide;
};

export type PlayerBonusPick = {
  label: string;
  answer: string;
};

export function buildPlayerOuPicks(
  userId: string,
  teams: Team[],
  predictions: Array<{ user_id: string; team_id: string; pick: 'OVER' | 'UNDER' }>,
): PlayerOuPick[] {
  const byTeam = new Map<string, PickSide>();
  for (const row of predictions) {
    if (row.user_id === userId) {
      byTeam.set(row.team_id, row.pick === 'OVER' ? 'over' : 'under');
    }
  }

  return [...teams]
    .filter((t) => byTeam.has(t.id))
    .sort((a, b) => a.abbreviation.localeCompare(b.abbreviation))
    .map((team) => ({
      abbreviation: team.abbreviation,
      ouLine: team.ou_line,
      pick: byTeam.get(team.id)!,
    }));
}

export function buildPlayerBonusPicks(
  userId: string,
  questions: BonusQuestion[],
  answers: BonusAnswerRow[],
): PlayerBonusPick[] {
  return questions.map((q) => {
    const row = answers.find((a) => a.question_id === q.id && a.user_id === userId);
    return {
      label: q.question_text,
      answer: row?.user_answer ?? '—',
    };
  });
}
