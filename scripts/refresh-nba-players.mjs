#!/usr/bin/env node
/**
 * Refreshes src/data/nba-players.json from ESPN team rosters.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = join(root, 'src/data/nba-players.json');

const all = [];

async function loadRoster(teamId) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/roster`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Roster ${teamId}: HTTP ${res.status}`);
  }
  const json = await res.json();
  for (const athlete of json.athletes ?? []) {
    const name = athlete.fullName ?? athlete.displayName;
    if (name) {
      all.push(name);
    }
  }
}

const teamsRes = await fetch(
  'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams?limit=30',
);
if (!teamsRes.ok) {
  throw new Error(`Teams list: HTTP ${teamsRes.status}`);
}
const teamsJson = await teamsRes.json();
const teams = teamsJson.sports?.[0]?.leagues?.[0]?.teams ?? [];

for (const entry of teams) {
  const id = entry.team?.id;
  if (id) {
    await loadRoster(id);
  }
}

const unique = [...new Set(all)].sort((a, b) => a.localeCompare(b));
writeFileSync(outPath, `${JSON.stringify(unique)}\n`);
console.log(`Wrote ${unique.length} player names to ${outPath}`);
