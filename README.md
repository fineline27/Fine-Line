# OU League (Expo)

React Native app for an Over/Under sports league. Loads team lines and records from Supabase, highlights win-pace status, and lets you pick OVER or UNDER on each team.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (or legacy `SUPABASE_ANON_KEY`) from your Supabase project (**Settings → API**).

3. Create the `teams` table (example):

```sql
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  abbreviation text not null,
  primary_color text not null default '#334155',
  total_season_games integer not null,
  ou_line numeric not null,
  current_wins integer not null default 0,
  current_losses integer not null default 0
);

grant select on public.teams to anon, authenticated;

alter table public.teams enable row level security;

drop policy if exists "Public read teams" on public.teams;
create policy "Public read teams"
  on public.teams
  for select
  to anon, authenticated
  using (true);
```

Optional: `league_members` (`user_id uuid`, `rank integer`) for the signed-in user’s header rank.

### Seed all 30 NBA teams

1. In Cursor, open **`supabase/load-30-nba-teams.sql`** (file tree — do not copy from chat).
2. Select all (Cmd/Ctrl+A) → Copy.
3. Supabase Dashboard → **SQL Editor** → **New query** → select all in the box → Delete → Paste → **Run**.
4. Table Editor → `teams` → confirm **30 rows**. App: pull to refresh, or `npm run check:teams`.

Do not paste anything after the last `);` — extra words like “Full script” cause `syntax error at or near "Full"`.

The seed **deletes existing rows** in `teams` and inserts all 30 franchises.

4. Start the dev server:

```bash
npx expo start
```

Press `w` for web, `i` for iOS simulator, or scan the QR code in Expo Go.

`app.config.ts` loads `.env` automatically — you do **not** need `source .env` before `npx expo start`.

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| “Supabase is not configured” | Add `.env` with `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (or `EXPO_PUBLIC_*` copies), then **restart** Expo. |
| “permission denied for table teams” | Add the RLS `select` policy from the SQL section above (or copy from the in-app error screen). |
| Expo Go cannot connect (QR) | Use **tunnel** mode on your machine: `npx expo start --tunnel`, or run Expo on the same Wi‑Fi as your phone. |
| Web preview works but phone does not | The dev server must run on **your** computer; copy the project and `.env` locally. |

## Win pace status

- **Win pace** = `(current_wins / games_played) × total_season_games` (0 if no games yet)
- **ON TRACK** (green): win pace ≥ `ou_line + 1.5`
- **AROUND MARK** (yellow): between the red and green thresholds
- **NEEDS WORK** (red): win pace ≤ `ou_line - 1.5`

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Expo dev server |
| `npm run web` | Web dev server |
| `npx tsc --noEmit` | Typecheck |
