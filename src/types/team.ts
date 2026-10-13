export type Team = {
  id: string;
  name: string;
  abbreviation: string;
  primary_color: string;
  total_season_games: number;
  ou_line: number;
  current_wins: number;
  current_losses: number;
};

export type TeamStatus = 'ON TRACK' | 'AROUND MARK' | 'NEEDS WORK';

export type PickSide = 'over' | 'under';

export type TeamPick = {
  teamId: string;
  side: PickSide;
};
