import { colors } from '../theme/colors';

export const formatColors = {
  classic: colors.accent,
  classicBg: 'rgba(59, 130, 246, 0.14)',
  stakes: '#f87171',
  stakesStrong: '#ef4444',
  stakesBg: 'rgba(239, 68, 68, 0.22)',
  stakesBorder: '#ef4444',
} as const;

export const classicFormat = {
  title: 'Classic',
  tagline: 'Original overall & your league',
  bullets: [
    'Same 30 season O/U picks (OVER or UNDER).',
    '+1 point when your pick is right; 0 while the season is still open or if you’re wrong.',
    'Worldwide Classic rank; close scores tiebreak with bonus picks (MVP, champion, ROY).',
    'Private leagues score Classic only.',
  ],
} as const;

export const stakesFormat = {
  title: 'Stakes',
  tagline: 'Separate overall — higher risk, higher reward',
  bullets: [
    'Same 30 O/U picks — Classic and Stakes share one pick per team.',
    'Set a stake of 1, 2, or 3 on each team you’ve picked.',
    'Right: earn the full stake (+1 / +2 / +3). Wrong: lose the full stake (−1 / −2 / −3).',
    'Still undecided: 0 until the season result is known. Own leaderboard — no bonus tiebreak.',
  ],
} as const;
