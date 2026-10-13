import type { BonusAnswerRow, BonusQuestion } from '../types/bonus';

const KEY_ORDER = ['nba_mvp', 'nba_champion', 'nba_roy'];

function sortKey(a: BonusQuestion, b: BonusQuestion): number {
  const ai = KEY_ORDER.indexOf(a.question_key ?? '');
  const bi = KEY_ORDER.indexOf(b.question_key ?? '');
  if (ai !== -1 && bi !== -1) {
    return ai - bi;
  }
  if (ai !== -1) {
    return -1;
  }
  if (bi !== -1) {
    return 1;
  }
  return a.question_text.localeCompare(b.question_text);
}

/** One row per tiebreaker (MVP / champion / ROY), even if seeded twice or merged across leagues. */
export function dedupeBonusQuestions(questions: BonusQuestion[]): BonusQuestion[] {
  const byKey = new Map<string, BonusQuestion>();
  const noKey: BonusQuestion[] = [];

  for (const q of questions) {
    const key = q.question_key?.trim();
    if (key) {
      if (!byKey.has(key)) {
        byKey.set(key, q);
      }
      continue;
    }
    const textKey = q.question_text.trim().toLowerCase();
    if (!byKey.has(textKey)) {
      byKey.set(textKey, q);
    }
  }

  for (const q of questions) {
    if (!q.question_key?.trim()) {
      const textKey = q.question_text.trim().toLowerCase();
      if (byKey.get(textKey)?.id === q.id) {
        noKey.push(q);
      }
    }
  }

  const merged = [...byKey.values()];
  return merged.sort(sortKey);
}

export function questionIdsForKey(questions: BonusQuestion[], questionKey: string): string[] {
  return questions.filter((q) => q.question_key === questionKey).map((q) => q.id);
}

export function findBonusAnswerForUser(
  userId: string,
  question: BonusQuestion,
  allQuestions: BonusQuestion[],
  answers: BonusAnswerRow[],
): BonusAnswerRow | undefined {
  const key = question.question_key?.trim();
  const ids = key
    ? questionIdsForKey(allQuestions, key)
    : allQuestions
        .filter((q) => q.question_text.trim().toLowerCase() === question.question_text.trim().toLowerCase())
        .map((q) => q.id);

  const idSet = new Set(ids.length > 0 ? ids : [question.id]);
  return answers.find((a) => a.user_id === userId && idSet.has(a.question_id));
}

/** Map fetched answers onto deduped question ids for the pick form. */
export function mapAnswersToDedupedQuestions(
  allQuestions: BonusQuestion[],
  deduped: BonusQuestion[],
  answersByQuestionId: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const q of deduped) {
    const key = q.question_key?.trim();
    const ids = key
      ? questionIdsForKey(allQuestions, key)
      : allQuestions
          .filter(
            (x) =>
              x.question_text.trim().toLowerCase() === q.question_text.trim().toLowerCase(),
          )
          .map((x) => x.id);
    const idSet = new Set(ids.length > 0 ? ids : [q.id]);
    const answer = Object.entries(answersByQuestionId).find(([id]) => idSet.has(id))?.[1];
    if (answer) {
      out[q.id] = answer;
    }
  }
  return out;
}
