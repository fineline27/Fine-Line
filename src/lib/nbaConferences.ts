import type { Team } from '../types/team';

export type NbaConferenceId = 'east' | 'west';

const EAST_ABBREVIATIONS = new Set([
  'ATL',
  'BOS',
  'BKN',
  'CHA',
  'CHI',
  'CLE',
  'DET',
  'IND',
  'MIA',
  'MIL',
  'NYK',
  'ORL',
  'PHI',
  'TOR',
  'WAS',
]);

const WEST_ABBREVIATIONS = new Set([
  'DAL',
  'DEN',
  'GSW',
  'HOU',
  'LAC',
  'LAL',
  'MEM',
  'MIN',
  'NOP',
  'OKC',
  'PHX',
  'POR',
  'SAC',
  'SAS',
  'UTA',
]);

export const NBA_CONFERENCES: readonly {
  id: NbaConferenceId;
  title: string;
  abbreviations: ReadonlySet<string>;
}[] = [
  { id: 'east', title: 'Eastern Conference', abbreviations: EAST_ABBREVIATIONS },
  { id: 'west', title: 'Western Conference', abbreviations: WEST_ABBREVIATIONS },
];

export function getTeamConference(team: Team): NbaConferenceId | null {
  const abbr = team.abbreviation.toUpperCase();
  if (EAST_ABBREVIATIONS.has(abbr)) {
    return 'east';
  }
  if (WEST_ABBREVIATIONS.has(abbr)) {
    return 'west';
  }
  return null;
}

export function conferenceTitle(conferenceId: NbaConferenceId): string {
  return NBA_CONFERENCES.find((c) => c.id === conferenceId)?.title ?? 'Conference';
}

export function filterTeamsByConference(teams: Team[], conferenceId: NbaConferenceId): Team[] {
  const allowed = NBA_CONFERENCES.find((c) => c.id === conferenceId)?.abbreviations;
  if (!allowed) {
    return teams;
  }
  return teams.filter((t) => allowed.has(t.abbreviation.toUpperCase()));
}