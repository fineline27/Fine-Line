import { scorePick } from './pickScoring';
import type { Team } from '../types/team';

export type PredictionRow = {
  user_id: string;
  team_id: string;
  pick: 'OVER' | 'UNDER';
};

export type StandingsResult = {
  rank: number | null;
  totalPlayers: number;
  myScore: number;
  clinched: number;
};

/** One pick per team per user (latest row wins if duplicates exist). */
export function computeStandings(
  userId: string,
  predictions: PredictionRow[],
  teams: Team[],
): StandingsResult {
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const picksByUser = new Map<string, Map<string, 'over' | 'under'>>();

  for (const row of predictions) {
    if (!picksByUser.has(row.user_id)) {
      picksByUser.set(row.user_id, new Map());
    }
    picksByUser.get(row.user_id)!.set(row.team_id, row.pick === 'OVER' ? 'over' : 'under');
  }

  const scores = new Map<string, number>();
  const clinched = new Map<string, number>();

  for (const [uid, teamPicks] of picksByUser) {
    let total = 0;
    let clinchedCount = 0;
    for (const [teamId, side] of teamPicks) {
      const team = teamById.get(teamId);
      if (!team) {
        continue;
      }
      const pts = scorePick(team, side);
      total += pts;
      if (pts === 1) {
        clinchedCount += 1;
      }
    }
    scores.set(uid, total);
    clinched.set(uid, clinchedCount);
  }

  const myScore = scores.get(userId) ?? 0;
  const myClinched = clinched.get(userId) ?? 0;
  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const rankIndex = sorted.findIndex(([id]) => id === userId);
  const rank = rankIndex >= 0 ? rankIndex + 1 : null;

  return {
    rank,
    totalPlayers: sorted.length,
    myScore,
    clinched: myClinched,
  };
}
