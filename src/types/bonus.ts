export type BonusQuestionKey = 'nba_mvp' | 'nba_champion' | 'nba_roy';

export type BonusQuestion = {
  id: string;
  league_id: string;
  question_key: BonusQuestionKey | null;
  question_text: string;
  points_worth: number;
  winning_answer: string | null;
};

export type BonusAnswerRow = {
  question_id: string;
  user_id: string;
  user_answer: string;
  is_correct: boolean | null;
};

export const NBA_BONUS_QUESTION_TEMPLATES: Array<{
  key: BonusQuestionKey;
  question_text: string;
  points_worth: number;
}> = [
  { key: 'nba_mvp', question_text: 'NBA MVP?', points_worth: 1 },
  { key: 'nba_champion', question_text: 'NBA Champion?', points_worth: 1 },
  { key: 'nba_roy', question_text: 'Rookie of the Year?', points_worth: 1 },
];
