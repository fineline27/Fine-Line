import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useLeague } from '../contexts/LeagueContext';
import {
  fetchBonusAnswersForLeague,
  fetchBonusQuestionsForLeague,
  fetchBonusQuestionsRawForLeague,
} from '../lib/bonusQuestions';
import { fetchLeagueMembers } from '../lib/leagueMembers';
import { fetchAllPredictionsInLeague } from '../lib/predictions';
import { computeLeaderboard, type LeaderboardEntry } from '../lib/rankings';
import type { BonusAnswerRow, BonusQuestion } from '../types/bonus';
import type { LeagueMember } from '../types/leagueMember';
import type { PickSide, Team } from '../types/team';

export type TeamGroupPick = {
  team: Team;
  entries: Array<{
    userId: string;
    displayName: string;
    pick: PickSide;
    lockedOuLine?: number | null;
  }>;
};

type BoardState = {
  members: LeagueMember[];
  leaderboard: LeaderboardEntry[];
  predictions: Array<{
    user_id: string;
    team_id: string;
    pick: 'OVER' | 'UNDER';
    locked_ou_line?: number | null;
  }>;
  teamPicks: TeamGroupPick[];
  bonusQuestions: BonusQuestion[];
  bonusQuestionsRaw: BonusQuestion[];
  bonusAnswers: BonusAnswerRow[];
  loading: boolean;
  error: string | null;
};

export function useLeagueBoard(teams: Team[], picksSubmitted: boolean) {
  const { user } = useAuth();
  const { activeLeague } = useLeague();
  const [state, setState] = useState<BoardState>({
    members: [],
    leaderboard: [],
    predictions: [],
    teamPicks: [],
    bonusQuestions: [],
    bonusQuestionsRaw: [],
    bonusAnswers: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!user || !activeLeague || teams.length === 0) {
      setState({
        members: [],
        leaderboard: [],
        predictions: [],
        teamPicks: [],
        bonusQuestions: [],
        bonusQuestionsRaw: [],
        bonusAnswers: [],
        loading: false,
        error: null,
      });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const members = await fetchLeagueMembers(activeLeague.id);
      const submittedIds = new Set(
        members.filter((m) => m.picks_submitted_at).map((m) => m.user_id),
      );
      const nameByUser = new Map(
        members.map((m) => [m.user_id, m.display_name?.trim() || 'Player']),
      );

      let predictions: Array<{
        user_id: string;
        team_id: string;
        pick: 'OVER' | 'UNDER';
        locked_ou_line?: number | null;
      }> = [];
      if (picksSubmitted) {
        predictions = await fetchAllPredictionsInLeague(activeLeague.id);
      }

      let bonusQuestions: BonusQuestion[] = [];
      let bonusQuestionsRaw: BonusQuestion[] = [];
      let bonusAnswers: BonusAnswerRow[] = [];
      try {
        bonusQuestionsRaw = await fetchBonusQuestionsRawForLeague(activeLeague.id);
        bonusQuestions = await fetchBonusQuestionsForLeague(activeLeague.id);
        if (picksSubmitted) {
          bonusAnswers = await fetchBonusAnswersForLeague(activeLeague.id);
        }
      } catch {
        bonusQuestions = [];
        bonusQuestionsRaw = [];
        bonusAnswers = [];
      }
      const bonusBundle =
        bonusQuestions.length > 0 ? { questions: bonusQuestions, answers: bonusAnswers } : undefined;

      const leaderboard = computeLeaderboard(user.id, predictions, teams, members, bonusBundle);

      const picksByTeam = new Map<string, TeamGroupPick['entries']>();
      if (picksSubmitted) {
        for (const row of predictions) {
          if (!submittedIds.has(row.user_id)) {
            continue;
          }
          const team = teams.find((t) => t.id === row.team_id);
          if (!team) {
            continue;
          }
          if (!picksByTeam.has(team.id)) {
            picksByTeam.set(team.id, []);
          }
          picksByTeam.get(team.id)!.push({
            userId: row.user_id,
            displayName: nameByUser.get(row.user_id) ?? 'Player',
            pick: row.pick === 'OVER' ? 'over' : 'under',
            lockedOuLine: row.locked_ou_line,
          });
        }
      }

      const teamPicks = [...teams]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((team) => ({
          team,
          entries: (picksByTeam.get(team.id) ?? []).sort((a, b) =>
            a.displayName.localeCompare(b.displayName),
          ),
        }));

      setState({
        members,
        leaderboard,
        predictions,
        teamPicks,
        bonusQuestions,
        bonusQuestionsRaw,
        bonusAnswers,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        members: [],
        leaderboard: [],
        predictions: [],
        teamPicks: [],
        bonusQuestions: [],
        bonusQuestionsRaw: [],
        bonusAnswers: [],
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load league board',
      });
    }
  }, [user, activeLeague, teams, picksSubmitted]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh };
}
