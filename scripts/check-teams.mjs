#!/usr/bin/env node
/**
 * Quick check: how many teams the app can read from Supabase.
 * Usage: node scripts/check-teams.mjs  (loads .env via dotenv)
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, key);
const { data, error, count } = await supabase
  .from('teams')
  .select('abbreviation', { count: 'exact' })
  .order('abbreviation')
  .range(0, 999);

if (error) {
  console.error('Fetch failed:', error.message);
  process.exit(1);
}

const total = count ?? data?.length ?? 0;
const returned = data?.length ?? 0;
console.log(`Teams in database: ${total}`);
console.log(`Rows returned by API: ${returned}`);
if (count != null && count > returned) {
  console.log(
    '\nAPI is capping rows. Supabase Dashboard → Project Settings → Data API → raise "Max rows".',
  );
  process.exit(2);
}
if (data?.length) {
  console.log(data.map((t) => t.abbreviation).join(', '));
}
if ((count ?? data?.length ?? 0) < 30) {
  console.log('\nExpected 30. Run supabase/seed-nba-teams.sql in the Supabase SQL Editor.');
  process.exit(2);
}
