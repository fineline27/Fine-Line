export type LeagueMember = {
  user_id: string;
  league_id: string;
  display_name: string | null;
  picks_submitted_at: string | null;
  joined_at?: string;
};
