import { colors } from '../theme/colors';

/** Stakes uses amber/gold — distinct from Classic blue, not alarm red. */
export const formatColors = {
  classic: colors.accent,
  classicBg: 'rgba(59, 130, 246, 0.14)',
  stakes: colors.statusAround,
  stakesStrong: '#ca8a04',
  stakesBg: colors.statusAroundBg,
  stakesBorder: 'rgba(234, 179, 8, 0.45)',
} as const;

export const classicFormat = {
  title: 'Classic',
  tagline: 'Original overall & your league',
  bullets: [
    'Same 30 season O/U picks (OVER or UNDER); each pick locks the line at save time.',
    '+1 per pick that’s on track or already won; 0 if unsure or off track; 0 if the pick is lost.',
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
    'On track or won: +stake. Off track or lost: −stake. Unsure (around the line): 0.',
    'Own leaderboard — no bonus tiebreak.',
  ],
} as const;
