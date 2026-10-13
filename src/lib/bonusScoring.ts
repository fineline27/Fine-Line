import { scoreBonusAnswer } from './bonusQuestions';
import type { BonusAnswerRow, BonusQuestion } from '../types/bonus';

export function bonusPointsForUser(
  userId: string,
  questions: BonusQuestion[],
  answers: BonusAnswerRow[],
): number {
  if (questions.length === 0) {
    return 0;
  }

  const answerByQuestion = new Map<string, string>();
  for (const row of answers) {
    if (row.user_id === userId) {
      answerByQuestion.set(row.question_id, row.user_answer);
    }
  }

  let total = 0;
  for (const q of questions) {
    total += scoreBonusAnswer(answerByQuestion.get(q.id), q.winning_answer, q.points_worth);
  }
  return total;
}
