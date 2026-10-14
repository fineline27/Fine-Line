import { dedupeBonusQuestions, findBonusAnswerForUser } from './bonusDedupe';
import type { SportPredictionRow } from './predictions';
import type { BonusAnswerRow, BonusQuestion } from '../types/bonus';
import { clampConfidence } from '../types/confidence';
import type { PickSide, Team } from '../types/team';

export type PlayerOuPick = {
  abbreviation: string;
  ouLine: number;
  pick: PickSide;
  confidence?: number;
};

export type PlayerBonusPick = {
  label: string;
  answer: string;
  key: string;
};

export function buildPlayerOuPicks(
  userId: string,
  teams: Team[],
  predictions: Array<
    | { user_id: string; team_id: string; pick: 'OVER' | 'UNDER' }
    | SportPredictionRow
  >,
  includeConfidence = false,
): PlayerOuPick[] {
  const byTeam = new Map<string, { pick: PickSide; confidence?: number }>();
  for (const row of predictions) {
    if (row.user_id === userId) {
      const confidence =
        'confidence_points' in row && typeof row.confidence_points === 'number'
          ? clampConfidence(row.confidence_points)
          : undefined;
      byTeam.set(row.team_id, {
        pick: row.pick === 'OVER' ? 'over' : 'under',
        confidence,
      });
    }
  }

  return [...teams]
    .filter((t) => byTeam.has(t.id))
    .sort((a, b) => a.abbreviation.localeCompare(b.abbreviation))
    .map((team) => {
      const entry = byTeam.get(team.id)!;
      return {
        abbreviation: team.abbreviation,
        ouLine: team.ou_line,
        pick: entry.pick,
        confidence: includeConfidence ? (entry.confidence ?? 1) : undefined,
      };
    });
}

export type LeagueBonusQuestionBlock = {
  questionId: string;
  label: string;
  pointsWorth: number;
  winningAnswer: string | null;
  answers: Array<{ userId: string; displayName: string; answer: string; isMe: boolean }>;
};

export function buildLeagueBonusByQuestion(
  members: Array<{
    user_id: string;
    display_name: string | null;
    picks_submitted_at: string | null;
  }>,
  questions: BonusQuestion[],
  allQuestions: BonusQuestion[],
  answers: BonusAnswerRow[],
  currentUserId: string | undefined,
): LeagueBonusQuestionBlock[] {
  const submitted = members.filter((m) => m.picks_submitted_at);
  const deduped = dedupeBonusQuestions(questions);

  return deduped.map((q) => {
    const rows = submitted
      .map((member) => {
        const row = findBonusAnswerForUser(member.user_id, q, allQuestions, answers);
        return {
          userId: member.user_id,
          displayName: member.display_name?.trim() || 'Player',
          answer: row?.user_answer?.trim() || '—',
          isMe: member.user_id === currentUserId,
        };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    return {
      questionId: q.id,
      label: q.question_text,
      pointsWorth: q.points_worth,
      winningAnswer: q.winning_answer,
      answers: rows,
    };
  });
}

export function buildPlayerBonusPicks(
  userId: string,
  questions: BonusQuestion[],
  answers: BonusAnswerRow[],
): PlayerBonusPick[] {
  const deduped = dedupeBonusQuestions(questions);
  return deduped.map((q) => {
    const row = findBonusAnswerForUser(userId, q, questions, answers);
    const key = q.question_key ?? q.id;
    return {
      label: q.question_text,
      answer: row?.user_answer ?? '—',
      key,
    };
  });
}
