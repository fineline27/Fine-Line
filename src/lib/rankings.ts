import { bonusPointsForUser } from './bonusScoring';
import {
  classicPointsForEvaluation,
  evaluatePick,
  pickIsClinched,
  stakesPointsForEvaluation,
} from './pickScoring';
import { clampConfidence } from '../types/confidence';
import type { BonusAnswerRow, BonusQuestion } from '../types/bonus';
import type { Team } from '../types/team';

export type PredictionRow = {
  user_id: string;
  team_id: string;
  pick: 'OVER' | 'UNDER';
  confidence_points?: number;
  locked_ou_line?: number | null;
};

type UserTeamPick = {
  side: 'over' | 'under';
  confidence: number;
  lockedOuLine?: number | null;
};

function indexPredictions(predictions: PredictionRow[]): Map<string, Map<string, UserTeamPick>> {
  const picksByUser = new Map<string, Map<string, UserTeamPick>>();
  for (const row of predictions) {
    if (!picksByUser.has(row.user_id)) {
      picksByUser.set(row.user_id, new Map());
    }
    picksByUser.get(row.user_id)!.set(row.team_id, {
      side: row.pick === 'OVER' ? 'over' : 'under',
      confidence: row.confidence_points ?? 1,
      lockedOuLine: row.locked_ou_line,
    });
  }
  return picksByUser;
}

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
  const picksByUser = indexPredictions(predictions);

  const scores = new Map<string, number>();
  const clinched = new Map<string, number>();

  for (const [uid, teamPicks] of picksByUser) {
    let total = 0;
    let clinchedCount = 0;
    for (const [teamId, { side, lockedOuLine }] of teamPicks) {
      const team = teamById.get(teamId);
      if (!team) {
        continue;
      }
      const evaluation = evaluatePick(team, side, lockedOuLine);
      total += classicPointsForEvaluation(evaluation);
      if (pickIsClinched(evaluation)) {
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

export function computeConfidenceStandings(
  userId: string,
  predictions: PredictionRow[],
  teams: Team[],
): Omit<StandingsResult, 'bonusScore'> & { bonusScore: 0 } {
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const picksByUser = indexPredictions(predictions);
  const scores = new Map<string, number>();
  const clinched = new Map<string, number>();

  for (const [uid, teamPicks] of picksByUser) {
    let total = 0;
    let clinchedCount = 0;
    for (const [teamId, { side, confidence, lockedOuLine }] of teamPicks) {
      const team = teamById.get(teamId);
      if (!team) {
        continue;
      }
      const evaluation = evaluatePick(team, side, lockedOuLine);
      total += stakesPointsForEvaluation(evaluation, clampConfidence(confidence));
      if (pickIsClinched(evaluation)) {
        clinchedCount += 1;
      }
    }
    scores.set(uid, total);
    clinched.set(uid, clinchedCount);
  }

  const myScore = scores.get(userId) ?? 0;
  const myClinched = clinched.get(userId) ?? 0;
  const sorted = [...scores.entries()].sort(
    (a, b) => b[1] - a[1] || (clinched.get(b[0]) ?? 0) - (clinched.get(a[0]) ?? 0),
  );
  const rankIndex = sorted.findIndex(([id]) => id === userId);
  const rank = rankIndex >= 0 ? rankIndex + 1 : null;

  return {
    rank,
    totalPlayers: sorted.length,
    myScore,
    clinched: myClinched,
    bonusScore: 0,
  };
}

export function computeLeaderboard(
  currentUserId: string,
  predictions: PredictionRow[],
  teams: Team[],
  members: Array<{ user_id: string; display_name: string | null; picks_submitted_at: string | null }>,
  bonus?: { questions: BonusQuestion[]; answers: BonusAnswerRow[] },
): LeaderboardEntry[] {
  const submittedMembers = members.filter((m) => m.picks_submitted_at);
  const submittedMemberIds = new Set(submittedMembers.map((m) => m.user_id));
  const filteredPredictions = predictions.filter((p) => submittedMemberIds.has(p.user_id));
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const picksByUser = indexPredictions(filteredPredictions);

  const scored = submittedMembers.map((member) => {
    const teamPicks = picksByUser.get(member.user_id);
    let score = 0;
    let clinched = 0;
    if (teamPicks) {
      for (const [teamId, { side, lockedOuLine }] of teamPicks) {
        const team = teamById.get(teamId);
        if (!team) {
          continue;
        }
        const evaluation = evaluatePick(team, side, lockedOuLine);
        score += classicPointsForEvaluation(evaluation);
        if (pickIsClinched(evaluation)) {
          clinched += 1;
        }
      }
    }
    const bonusScore = bonusPointsForUser(
      member.user_id,
      bonus?.questions ?? [],
      bonus?.answers ?? [],
    );
    return {
      userId: member.user_id,
      displayName: member.display_name?.trim() || 'Player',
      score,
      bonusScore,
      clinched,
      rank: 0,
      picksSubmitted: true,
      isMe: member.user_id === currentUserId,
    };
  });

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      b.bonusScore - a.bonusScore ||
      b.clinched - a.clinched ||
      a.displayName.localeCompare(b.displayName),
  );

  let lastScore: number | null = null;
  let lastRank = 0;
  scored.forEach((entry, index) => {
    if (lastScore !== entry.score) {
      lastRank = index + 1;
      lastScore = entry.score;
    }
    entry.rank = lastRank;
  });

  return scored;
}

export function computeConfidenceLeaderboard(
  currentUserId: string,
  predictions: PredictionRow[],
  teams: Team[],
  members: Array<{ user_id: string; display_name: string | null; picks_submitted_at: string | null }>,
): LeaderboardEntry[] {
  const submittedMembers = members.filter((m) => m.picks_submitted_at);
  const submittedMemberIds = new Set(submittedMembers.map((m) => m.user_id));
  const filteredPredictions = predictions.filter((p) => submittedMemberIds.has(p.user_id));
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const picksByUser = indexPredictions(filteredPredictions);

  const scored = submittedMembers.map((member) => {
    const teamPicks = picksByUser.get(member.user_id);
    let score = 0;
    let clinched = 0;
    if (teamPicks) {
      for (const [teamId, { side, confidence, lockedOuLine }] of teamPicks) {
        const team = teamById.get(teamId);
        if (!team) {
          continue;
        }
        const evaluation = evaluatePick(team, side, lockedOuLine);
        score += stakesPointsForEvaluation(evaluation, clampConfidence(confidence));
        if (pickIsClinched(evaluation)) {
          clinched += 1;
        }
      }
    }
    return {
      userId: member.user_id,
      displayName: member.display_name?.trim() || 'Player',
      score,
      bonusScore: 0,
      clinched,
      rank: 0,
      picksSubmitted: true,
      isMe: member.user_id === currentUserId,
    };
  });

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      b.clinched - a.clinched ||
      a.displayName.localeCompare(b.displayName),
  );

  let lastScore: number | null = null;
  let lastRank = 0;
  scored.forEach((entry, index) => {
    if (lastScore !== entry.score) {
      lastRank = index + 1;
      lastScore = entry.score;
    }
    entry.rank = lastRank;
  });

  return scored;
}
