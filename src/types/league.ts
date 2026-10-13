export type League = {
  id: string;
  name: string;
  invite_code: string;
  creator_id: string | null;
  sport: string;
  bonus_questions_enabled?: boolean;
  created_at?: string;
};

export type DbPick = 'OVER' | 'UNDER';

export function toDbPick(side: 'over' | 'under'): DbPick {
  return side === 'over' ? 'OVER' : 'UNDER';
}

export function fromDbPick(pick: DbPick): 'over' | 'under' {
  return pick === 'OVER' ? 'over' : 'under';
}
