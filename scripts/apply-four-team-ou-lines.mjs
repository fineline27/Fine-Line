#!/usr/bin/env node
/**
 * Apply Oct 2026 four-team O/U line moves on the live Supabase project.
 * Requires service role (Dashboard → Settings → API → secret key).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/apply-four-team-ou-lines.mjs
 *   npm run apply:ou-four-teams   (with both vars in .env)
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const LINE_MOVES = [
  { abbreviation: 'PHI', ou_line: 50.5 },
  { abbreviation: 'POR', ou_line: 42.5 },
  { abbreviation: 'GSW', ou_line: 35.5 },
  { abbreviation: 'PHX', ou_line: 39.5 },
];

const url = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Missing SUPABASE_URL (or EXPO_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Add them to .env — use the service role key from Supabase → Settings → API (not the publishable key).',
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

console.log('Applying four-team O/U lines…\n');

for (const { abbreviation, ou_line } of LINE_MOVES) {
  const { data, error } = await supabase
    .from('teams')
    .update({ ou_line })
    .eq('abbreviation', abbreviation)
    .select('abbreviation, name, ou_line')
    .maybeSingle();

  if (error) {
    console.error(`${abbreviation}: update failed —`, error.message);
    process.exit(1);
  }
  if (!data) {
    console.error(`${abbreviation}: no team row found`);
    process.exit(1);
  }
  console.log(`${data.abbreviation} ${data.name}: ou_line = ${data.ou_line}`);
}

console.log('\nDone. Reload the app to see new board lines.');
