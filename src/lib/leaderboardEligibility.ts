export type LeaderboardMemberMeta = {
  user_id: string;
  display_name: string | null;
  picks_submitted_at: string | null;
  joined_at?: string | null;
};

/** When the sport pick window is closed (e.g. NBA season started). */
export type SeasonLockContext = {
  picksWindowClosed: boolean;
  lockAt: Date;
};

function parseTime(iso: string | null | undefined): number | null {
  if (iso == null || iso === '') {
    return null;
  }
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Counts toward rank / score on leaderboards and overall rank.
 * Requires a submitted card; after lock, must have joined and submitted before lock.
 */
export function isRankedParticipant(
  member: LeaderboardMemberMeta,
  ctx: SeasonLockContext,
): boolean {
  const submittedMs = parseTime(member.picks_submitted_at);
  if (submittedMs == null) {
    return false;
  }
  if (!ctx.picksWindowClosed) {
    return true;
  }
  if (submittedMs >= ctx.lockAt.getTime()) {
    return false;
  }
  const joinedMs = parseTime(member.joined_at ?? null);
  if (joinedMs != null && joinedMs >= ctx.lockAt.getTime()) {
    return false;
  }
  return true;
}

/** Shown on leaderboard lists (pre-lock: entire roster; after lock: ranked participants only). */
export function isLeaderboardListed(
  member: LeaderboardMemberMeta,
  ctx: SeasonLockContext,
): boolean {
  if (ctx.picksWindowClosed) {
    return isRankedParticipant(member, ctx);
  }
  return true;
}

export function rankedParticipantIds(
  members: LeaderboardMemberMeta[],
  ctx: SeasonLockContext,
): Set<string> {
  return new Set(members.filter((m) => isRankedParticipant(m, ctx)).map((m) => m.user_id));
}

export function listedLeaderboardMembers(
  members: LeaderboardMemberMeta[],
  ctx: SeasonLockContext,
): LeaderboardMemberMeta[] {
  return members.filter((m) => isLeaderboardListed(m, ctx));
}
