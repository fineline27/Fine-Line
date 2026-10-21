import { bonusPointsForUser } from './bonusScoring';
import {
  isRankedParticipant,
  listedLeaderboardMembers,
  type LeaderboardMemberMeta,
  type SeasonLockContext,
} from './leaderboardEligibility';
import { scoreConfidencePick, scorePick } from './pickScoring';
import { clampConfidence } from '../types/confidence';
import type { BonusAnswerRow, BonusQuestion } from '../types/bonus';
import type { Team } from '../types/team';

export type { LeaderboardMemberMeta, SeasonLockContext };

const OPEN_SEASON: SeasonLockContext = { picksWindowClosed: false, lockAt: new Date(0) };

function filterPredictionsForRanked(
  predictions: PredictionRow[],
  members: LeaderboardMemberMeta[],
  season: SeasonLockContext,
): PredictionRow[] {
  const ranked = new Set(
    members.filter((m) => isRankedParticipant(m, season)).map((m) => m.user_id),
  );
  return predictions.filter((p) => ranked.has(p.user_id));
}

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
  members: LeaderboardMemberMeta[] = [],
  season: SeasonLockContext = OPEN_SEASON,
): StandingsResult {
  const pool =
    members.length > 0
      ? filterPredictionsForRanked(predictions, members, season)
      : predictions;
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const picksByUser = indexPredictions(pool);

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
      const pts = scorePick(team, side, lockedOuLine);
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
  const userRanked =
    members.length === 0 || members.some((m) => m.user_id === userId && isRankedParticipant(m, season));
  const rankIndex = sorted.findIndex(([id]) => id === userId);
  const rank = userRanked && rankIndex >= 0 ? rankIndex + 1 : null;

  return {
    rank,
    totalPlayers: sorted.length,
    myScore: userRanked ? myScore : 0,
    clinched: userRanked ? myClinched : 0,
    bonusScore: userRanked ? myBonus : 0,
  };
}

export function computeConfidenceStandings(
  userId: string,
  predictions: PredictionRow[],
  teams: Team[],
  members: LeaderboardMemberMeta[] = [],
  season: SeasonLockContext = OPEN_SEASON,
): Omit<StandingsResult, 'bonusScore'> & { bonusScore: 0 } {
  const pool =
    members.length > 0
      ? filterPredictionsForRanked(predictions, members, season)
      : predictions;
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const picksByUser = indexPredictions(pool);
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
      const pts = scoreConfidencePick(team, side, clampConfidence(confidence), lockedOuLine);
      total += pts;
      if (pts > 0) {
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
  const userRanked =
    members.length === 0 || members.some((m) => m.user_id === userId && isRankedParticipant(m, season));
  const rankIndex = sorted.findIndex(([id]) => id === userId);
  const rank = userRanked && rankIndex >= 0 ? rankIndex + 1 : null;

  return {
    rank,
    totalPlayers: sorted.length,
    myScore: userRanked ? myScore : 0,
    clinched: userRanked ? myClinched : 0,
    bonusScore: 0,
  };
}

export function computeLeaderboard(
  currentUserId: string,
  predictions: PredictionRow[],
  teams: Team[],
  members: LeaderboardMemberMeta[],
  bonus?: { questions: BonusQuestion[]; answers: BonusAnswerRow[] },
  season: SeasonLockContext = OPEN_SEASON,
): LeaderboardEntry[] {
  const visibleMembers = listedLeaderboardMembers(members, season);
  const rankedMemberIds = new Set(
    visibleMembers.filter((m) => isRankedParticipant(m, season)).map((m) => m.user_id),
  );
  const filteredPredictions = predictions.filter((p) => rankedMemberIds.has(p.user_id));
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const picksByUser = indexPredictions(filteredPredictions);

  const scored = visibleMembers.map((member) => {
    const teamPicks = picksByUser.get(member.user_id);
    let score = 0;
    let clinched = 0;
    if (teamPicks) {
      for (const [teamId, { side, lockedOuLine }] of teamPicks) {
        const team = teamById.get(teamId);
        if (!team) {
          continue;
        }
        const pts = scorePick(team, side, lockedOuLine);
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

export function computeConfidenceLeaderboard(
  currentUserId: string,
  predictions: PredictionRow[],
  teams: Team[],
  members: LeaderboardMemberMeta[],
  season: SeasonLockContext = OPEN_SEASON,
): LeaderboardEntry[] {
  const visibleMembers = listedLeaderboardMembers(members, season);
  const rankedMemberIds = new Set(
    visibleMembers.filter((m) => isRankedParticipant(m, season)).map((m) => m.user_id),
  );
  const filteredPredictions = predictions.filter((p) => rankedMemberIds.has(p.user_id));
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const picksByUser = indexPredictions(filteredPredictions);

  const scored = visibleMembers.map((member) => {
    const teamPicks = picksByUser.get(member.user_id);
    let score = 0;
    let clinched = 0;
    if (teamPicks) {
      for (const [teamId, { side, confidence, lockedOuLine }] of teamPicks) {
        const team = teamById.get(teamId);
        if (!team) {
          continue;
        }
        const pts = scoreConfidencePick(team, side, clampConfidence(confidence), lockedOuLine);
        score += pts;
        if (pts > 0) {
          clinched += 1;
        }
      }
    }
    const picksSubmitted = Boolean(member.picks_submitted_at);
    return {
      userId: member.user_id,
      displayName: member.display_name?.trim() || 'Player',
      score: picksSubmitted ? score : 0,
      bonusScore: 0,
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
          a.displayName.localeCompare(b.displayName)
        );
      }
      return a.displayName.localeCompare(b.displayName);
    });
}
