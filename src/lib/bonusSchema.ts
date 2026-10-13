export const BONUS_SETUP_SQL_HINT =
  'Bonus tables are not set up yet. In Supabase SQL Editor, run supabase/05-bonus-questions.sql then supabase/06-mandatory-bonus-questions.sql, and refresh.';

export function isBonusSetupError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('bonus_questions') ||
    lower.includes('bonus_answers') ||
    lower.includes('bonus_questions_enabled') ||
    lower.includes('permission denied for table bonus') ||
    (lower.includes('does not exist') && lower.includes('bonus'))
  );
}
