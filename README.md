# Fine Line (Expo)

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

3. Database scripts (in **`supabase/`**):

| File | When to run |
|------|-------------|
| [`00-schema.sql`](supabase/00-schema.sql) | Once — creates all tables (teams, leagues, predictions, etc.) |
| [`01-seed-30-nba-teams.sql`](supabase/01-seed-30-nba-teams.sql) | When you need all 30 NBA teams + RLS read access |

**Do not** mix schema + sample 3-team inserts + delete/insert in one paste from chat. Tables already exist → run **`01-seed-30-nba-teams.sql` only** (copy from the repo file in Cursor).

4. Confirm: **Table Editor** → `teams` → **30 rows**. App: pull to refresh, or `npm run check:teams`.

5. Run [`supabase/02-auth-rls.sql`](supabase/02-auth-rls.sql) for login, leagues, and saved picks.

6. Run [`supabase/03-sport-leaderboard-rls.sql`](supabase/03-sport-leaderboard-rls.sql) for **overall** NBA rankings.

6. In Supabase **Authentication → Providers**, enable **Email**. For local testing, you can disable **Confirm email** under email auth settings.

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
