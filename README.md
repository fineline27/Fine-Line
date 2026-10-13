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
| [`update-ou-lines-2026-27.sql`](supabase/update-ou-lines-2026-27.sql) | Update **2026–27** win-total O/U lines only (keeps records and picks) |
| [`04-league-submit-and-roster.sql`](supabase/04-league-submit-and-roster.sql) | Submit picks, league roster, gated visibility of others’ picks |
| [`05-bonus-questions.sql`](supabase/05-bonus-questions.sql) | Bonus tiebreakers (MVP, champion, ROY) |
| [`06-mandatory-bonus-questions.sql`](supabase/06-mandatory-bonus-questions.sql) | Enable bonus on **all** leagues and backfill questions |

After the season, set `winning_answer` on rows in **`bonus_questions`** (Table Editor) to score bonus points. Use exact team or player names as stored in picks. Refresh the player list with `npm run refresh:nba-players` (ESPN rosters → `src/data/nba-players.json`).

**Do not** mix schema + sample 3-team inserts + delete/insert in one paste from chat. Tables already exist → run **`01-seed-30-nba-teams.sql` only** (copy from the repo file in Cursor).

4. Confirm: **Table Editor** → `teams` → **30 rows**. App: pull to refresh, or `npm run check:teams`.

5. Run [`supabase/02-auth-rls.sql`](supabase/02-auth-rls.sql) for login, leagues, and saved picks.

6. Run [`supabase/03-sport-leaderboard-rls.sql`](supabase/03-sport-leaderboard-rls.sql) for **overall** NBA rankings.

6. In Supabase **Authentication → Providers**, enable **Email**. For local testing, you can disable **Confirm email** under email auth settings.

### Going public (privacy & accounts)

Before inviting strangers or shipping to app stores:

1. Set **`EXPO_PUBLIC_LEGAL_CONTACT_EMAIL`** in `.env` (privacy requests and account deletion). Restart Expo after changing env.
2. In Supabase **Authentication → Email**, turn **Confirm email** on so sign-ups are verified.
3. Review in-app **Privacy** and **Terms** (`/privacy`, `/terms`) with a lawyer for your country and user base.
4. Honor **deletion requests** at that email (remove auth user + related rows, or use Supabase dashboard / a secure admin script).
5. Optional but recommended: enable Supabase **Auth rate limits** and CAPTCHA if you see abuse.
6. App Store / Play Console will ask for a **privacy policy URL** — use your deployed web URL + `/privacy`.

Fine Line stores: email, display name, league membership, picks, and bonus answers via Supabase; session and preferences locally on device. No ad trackers today.

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

## Go live (production web)

See **[DEPLOY.md](DEPLOY.md)** for Vercel/static hosting, Supabase auth URLs, and env vars. Quick build:

```bash
npm run build:web
```

Output is in **`dist/`** (deploy that folder or connect git to Vercel using the included `vercel.json`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Expo dev server |
| `npm run web` | Web dev server |
| `npm run build:web` | Static production web export → `dist/` |
| `npx tsc --noEmit` | Typecheck |
