import { dedupeBonusQuestions, findBonusAnswerForUser } from './bonusDedupe';
import { scoreBonusAnswer } from './bonusQuestions';
import type { BonusAnswerRow, BonusQuestion } from '../types/bonus';

export function bonusPointsForUser(
  userId: string,
  questions: BonusQuestion[],
  answers: BonusAnswerRow[],
): number {
  const deduped = dedupeBonusQuestions(questions);
  if (deduped.length === 0) {
    return 0;
  }

  let total = 0;
  for (const q of deduped) {
    const row = findBonusAnswerForUser(userId, q, questions, answers);
    total += scoreBonusAnswer(row?.user_answer, q.winning_answer, q.points_worth);
  }
  return total;
}
