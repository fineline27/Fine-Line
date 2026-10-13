import { bonusPointsForUser } from './bonusScoring';
import { scorePick } from './pickScoring';
import type { BonusAnswerRow, BonusQuestion } from '../types/bonus';
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
  bonusScore: number;
};

export type LeaderboardEntry = {
  userId: string;
  displayName: string;
  score: number;
  bonusScore: number;
  clinched: number;
  rank: number;
  picksSubmitted: boolean;
  isMe: boolean;
};

/** One pick per team per user (latest row wins if duplicates exist). */
export function computeStandings(
  userId: string,
  predictions: PredictionRow[],
  teams: Team[],
  bonus?: { questions: BonusQuestion[]; answers: BonusAnswerRow[] },
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

  const bonusQuestions = bonus?.questions ?? [];
  const bonusAnswers = bonus?.answers ?? [];
  const bonusByUser = new Map<string, number>();
  for (const uid of scores.keys()) {
    bonusByUser.set(uid, bonusPointsForUser(uid, bonusQuestions, bonusAnswers));
  }

  const myScore = scores.get(userId) ?? 0;
  const myClinched = clinched.get(userId) ?? 0;
  const myBonus = bonusByUser.get(userId) ?? 0;
  const sorted = [...scores.entries()].sort(
    (a, b) =>
      b[1] - a[1] ||
      (bonusByUser.get(b[0]) ?? 0) - (bonusByUser.get(a[0]) ?? 0) ||
      (clinched.get(b[0]) ?? 0) - (clinched.get(a[0]) ?? 0),
  );
  const rankIndex = sorted.findIndex(([id]) => id === userId);
  const rank = rankIndex >= 0 ? rankIndex + 1 : null;

  return {
    rank,
    totalPlayers: sorted.length,
    myScore,
    clinched: myClinched,
    bonusScore: myBonus,
  };
}

export function computeLeaderboard(
  currentUserId: string,
  predictions: PredictionRow[],
  teams: Team[],
  members: Array<{ user_id: string; display_name: string | null; picks_submitted_at: string | null }>,
  bonus?: { questions: BonusQuestion[]; answers: BonusAnswerRow[] },
): LeaderboardEntry[] {
  const submittedMemberIds = new Set(
    members.filter((m) => m.picks_submitted_at).map((m) => m.user_id),
  );
  const filteredPredictions = predictions.filter((p) => submittedMemberIds.has(p.user_id));
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const picksByUser = new Map<string, Map<string, 'over' | 'under'>>();

  for (const row of filteredPredictions) {
    if (!picksByUser.has(row.user_id)) {
      picksByUser.set(row.user_id, new Map());
    }
    picksByUser.get(row.user_id)!.set(row.team_id, row.pick === 'OVER' ? 'over' : 'under');
  }

  const scored = members.map((member) => {
    const teamPicks = picksByUser.get(member.user_id);
    let score = 0;
    let clinched = 0;
    if (teamPicks) {
      for (const [teamId, side] of teamPicks) {
        const team = teamById.get(teamId);
        if (!team) {
          continue;
        }
        const pts = scorePick(team, side);
        score += pts;
        if (pts === 1) {
          clinched += 1;
        }
      }
    }
    const picksSubmitted = Boolean(member.picks_submitted_at);
    const bonusScore = picksSubmitted
      ? bonusPointsForUser(member.user_id, bonus?.questions ?? [], bonus?.answers ?? [])
      : 0;
    return {
      userId: member.user_id,
      displayName: member.display_name?.trim() || 'Player',
      score: picksSubmitted ? score : 0,
      bonusScore,
      clinched: picksSubmitted ? clinched : 0,
      rank: 0,
      picksSubmitted,
      isMe: member.user_id === currentUserId,
    };
  });

  const ranked = [...scored]
    .filter((e) => e.picksSubmitted)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.bonusScore - a.bonusScore ||
        b.clinched - a.clinched ||
        a.displayName.localeCompare(b.displayName),
    );

  let lastScore: number | null = null;
  let lastRank = 0;
  ranked.forEach((entry, index) => {
    if (lastScore !== entry.score) {
      lastRank = index + 1;
      lastScore = entry.score;
    }
    entry.rank = lastRank;
  });

  const rankByUser = new Map(ranked.map((e) => [e.userId, e.rank]));
  return scored
    .map((entry) => ({
      ...entry,
      rank: entry.picksSubmitted ? (rankByUser.get(entry.userId) ?? ranked.length) : 0,
    }))
    .sort((a, b) => {
      if (a.picksSubmitted !== b.picksSubmitted) {
        return a.picksSubmitted ? -1 : 1;
      }
      if (a.picksSubmitted && b.picksSubmitted) {
        return (
          a.rank - b.rank ||
          b.score - a.score ||
          b.bonusScore - a.bonusScore ||
          a.displayName.localeCompare(b.displayName)
        );
      }
      return a.displayName.localeCompare(b.displayName);
    });
}
