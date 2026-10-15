# Go live — detailed guide (Fine Line web)

Fine Line is an **Expo web** app. Production = **static files** in `dist/` (hosted on Vercel or similar) + **Supabase** (auth, database). You do **not** run Node 24/7 on your own server.

---

## Overview

| Piece | What it does | Who hosts it |
|-------|----------------|--------------|
| Website (HTML/JS) | UI, picks, routing | Vercel CDN (free tier is fine to start) |
| Supabase | Login, leagues, saved picks, team W/L | Supabase cloud (your existing project) |

Every **production deploy** runs `npm run build:web`, which bakes Supabase URL + keys from **environment variables** into the JavaScript bundle. If env vars are missing on Vercel, the live site will say Supabase is not configured.

---

## Part A — One-time: Supabase database

Project: **Supabase Dashboard** → select your project (e.g. `zayzjewfbcoovhtpdtgo`).

### A1. Run SQL scripts (order matters)

Open **SQL Editor** → **New query**. Run each file from the repo **once**, in this order (copy/paste full file contents):

| Order | File | Purpose |
|-------|------|---------|
| 1 | `supabase/00-schema.sql` | Tables (teams, leagues, picks, …) |
| 2 | `supabase/02-auth-rls.sql` | Auth, leagues, predictions, RLS |
| 3 | `supabase/03-sport-leaderboard-rls.sql` | Overall leaderboard reads |
| 4 | `supabase/04-league-submit-and-roster.sql` | Submit picks, gated board |
| 5 | `supabase/01-seed-30-nba-teams.sql` | 30 NBA teams (skip if already 30 rows) |
| 6 | `supabase/update-ou-lines-2026-27.sql` | 2026–27 O/U lines |
| 7 | `supabase/05-bonus-questions.sql` | Bonus tables |
| 8 | `supabase/06-mandatory-bonus-questions.sql` | Bonus on all leagues |

**Check:** **Table Editor** → `teams` → **30 rows**. Spot-check `ou_line`, `current_wins`, `current_losses`.

If the app ever shows “permission denied for table teams”, re-run the grant/RLS section from `src/hooks/useTeams.ts` (`TEAMS_RLS_SQL`) or from `01-seed-30-nba-teams.sql`.

### A2. Get API credentials

**Project Settings** → **API**:

- **Project URL** → use as `EXPO_PUBLIC_SUPABASE_URL` (e.g. `https://xxxxx.supabase.co`)
- **Publishable key** (`sb_publishable_...`) → use as `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do **not** put the **service role** or **secret** key in the web app or Vercel “public” env — that bypasses RLS.

### A3. Email auth (public users)

**Authentication** → **Providers** → **Email**:

- Email provider **enabled**
- For a public launch: enable **Confirm email** (users must click link before sign-in works)
- For quick private testing only: you can leave confirm off temporarily

**Authentication** → **Email templates** — optional: customize “Confirm signup” text/branding.

### A4. Auth URLs (critical for production login)

**Authentication** → **URL configuration**:

1. **Site URL** — your **NBA app’s** Vercel URL from the project linked to **`fineline27/Fine-Line`** (Dashboard → that project → **Domains**).  
   Do **not** use unrelated `fine-line*.vercel.app` sites that belong to other Vercel projects.

2. **Redirect URLs** — add **each** of these (one per line in the allow list):

   ```
   https://YOUR-PRODUCTION-DOMAIN.vercel.app/**
   https://YOUR-PRODUCTION-DOMAIN.vercel.app/auth/callback
   https://*.vercel.app/**
   http://localhost:8081/**
   http://localhost:8081/auth/callback
   ```

3. **Email confirmation landing page:** In Vercel env, set **`EXPO_PUBLIC_SITE_URL`** to `https://YOUR-PRODUCTION-DOMAIN.vercel.app` (no trailing slash). Redeploy. New sign-ups then get a link to **`/auth/callback`** with a green “Email confirmed” screen.

4. **Link previews (iMessage, Slack, etc.):** Sharing the site uses **Open Graph** metadata baked into `dist/index.html` at build time, plus **`public/og-image.jpg`**. This is **not** tied to having a custom domain — a `*.vercel.app` URL works the same. If previews still show an old blurry icon after deploy, wait a few minutes or paste the link again (apps cache previews). Set **`EXPO_PUBLIC_SITE_URL`** to your live hostname so `og:image` uses the correct absolute URL. Replace **`public/og-image.jpg`** anytime you want a new share card image (recommended size **1200×630**).

   Replace `YOUR-PRODUCTION-DOMAIN` with your actual Vercel project hostname. The wildcard line helps **preview deployments**.

If login works on localhost but **not** on Vercel, 99% of the time this list is wrong or missing the exact hostname.

### A5. Updating win/loss during the season

The app does **not** auto-sync NBA scores. After games:

- **Table Editor** → `teams` → edit `current_wins` / `current_losses`, **or**
- SQL: `update public.teams set current_wins = 10, current_losses = 5 where abbreviation = 'BOS';`

Users **pull to refresh** on My picks (or reload the browser) to see new colors and standings.

---

## Part B — Code on GitHub (or GitLab)

Vercel deploys from git.

1. Create a repo on GitHub (empty or import).
2. On your machine (or ensure Cursor has pushed):

   ```bash
   git remote add origin https://github.com/YOU/fine-line.git   # if needed
   git push -u origin main
   ```

3. Confirm the repo contains: `package.json`, `vercel.json`, `app.config.ts`, `src/`, `supabase/`.

---

## Part C — Deploy to Vercel (step by step)

### C1. Create Vercel project

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub login is easiest).
2. **Add New…** → **Project**.
3. **Import** your `fine-line` repository.
4. **Configure Project** screen:
   - **Framework Preset:** Other (or Vercel auto-detects from `vercel.json`)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build:web` (from `vercel.json`)
   - **Output Directory:** `dist` (from `vercel.json`)
   - **Install Command:** `npm install` (default)

Do **not** deploy yet — add env vars first.

### C2. Environment variables (required)

In the same screen (or **Settings** → **Environment Variables**), add for **Production** and **Preview**:

| Name | Example / notes |
|------|------------------|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://zayzjewfbcoovhtpdtgo.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` from Supabase API settings |
| `EXPO_PUBLIC_LEGAL_CONTACT_EMAIL` | `you@yourdomain.com` (shown on Privacy/Terms; privacy requests) |

Optional duplicates (same values; `app.config.ts` reads these too):

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

**Important:** Names must match exactly. Values are injected at **build time** for Expo. After changing env vars, ** redeploy** (Deployments → … → Redeploy).

### C3. Deploy

Click **Deploy**. First build often takes 2–4 minutes.

When done, Vercel shows **Visit** → URL like `https://fine-line-xxxxx.vercel.app`.

### C4. Fix Supabase URLs to match Vercel

Copy that **exact** hostname (no trailing slash) into Supabase:

- **Site URL:** `https://fine-line-xxxxx.vercel.app`
- **Redirect URLs:** ensure that host is allowed (see Part A4)

### C5. Production test checklist

Open the live URL in an **incognito** window:

| Step | Expected |
|------|----------|
| `/login` | Fine Line landing + sign in |
| `/privacy` | Privacy policy |
| Sign up | Checkbox for Terms/Privacy; email confirm if enabled |
| Sign in | Redirect to sport/league flow |
| My picks | 30 teams, O/U lines, green/yellow/red badges |
| Pull to refresh | No error |
| Create/join league | Works |
| Submit full card + bonus | League tab unlocks |
| `/terms` | Terms load |

### C6. Custom domain (optional)

1. Vercel project → **Settings** → **Domains** → add `fineline.yourdomain.com` (or apex).
2. Follow DNS instructions (CNAME/A records at your registrar).
3. Update Supabase **Site URL** and **Redirect URLs** to `https://fineline.yourdomain.com/**`.
4. Redeploy not required for DNS only; auth URLs **must** match the domain users use in the browser.

---

## Part D — Cursor **Publish** (alternative)

If your Cursor project shows a **Publish** button:

1. Connect Vercel when prompted.
2. Set the **same three** `EXPO_PUBLIC_*` env vars in the Publish/Vercel flow.
3. Publish → use the URL Cursor/Vercel gives you.
4. Complete **Part A4** and **C4** with that URL.

---

## Part E — Redeploying after code changes

Any push to `main` (if Vercel git integration is on) triggers a new deploy automatically.

Manual redeploy: Vercel → **Deployments** → latest → **Redeploy**.

After changing **only** Supabase data (W/L), you do **not** redeploy Vercel — users refresh the app.

After changing **env vars** or **app code**, redeploy or push again.

---

## Part F — Local production smoke test (before Vercel)

On your computer, with `.env` filled like production:

```bash
npm install
npm run build:web
npx serve dist
```

Open the URL printed (often `http://localhost:3000`). Click `/login`, `/privacy`. If this works but Vercel fails, compare env vars on Vercel to local `.env`.

---

## Part G — Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| “Supabase is not configured” on live site | Missing env at **build** | Add `EXPO_PUBLIC_*` on Vercel → Redeploy |
| Sign-in spins or “invalid redirect” | Redirect URLs | Supabase Auth URLs include exact Vercel host + `/**` |
| Email sign-up never completes | Confirm email on | User must click email link; check spam; or disable confirm for testing |
| Sign-up: “Database error saving new user” | `auth.users` insert trigger on `usernames` | Run [`supabase/15-unblock-signup-drop-username-trigger.sql`](supabase/15-unblock-signup-drop-username-trigger.sql) in Supabase SQL Editor **first** (instant unblock), then [`14-fix-signup-database-error.sql`](supabase/14-fix-signup-database-error.sql) + redeploy app |
| “permission denied for table teams” | RLS/grant | Run teams RLS SQL from README / `01-seed` |
| 404 on `/login` or refresh on deep link | SPA routing | `vercel.json` rewrites should be in repo; redeploy |
| Blank page after deploy | Build failed | Vercel → Deployment → **Build logs** |
| Old UI after push | Cache | Hard refresh; check latest deployment is **Production** |
| Bonus / submit broken | Migrations | Run `05` and `06` SQL |

---

## Part H — Other hosts (not Vercel)

1. Run `npm run build:web` locally or in CI.
2. Upload contents of **`dist/`** to Netlify, Cloudflare Pages, S3+CloudFront, etc.
3. Configure **single-page app** fallback: all routes → `index.html` (same logic as `vercel.json` rewrites).
4. Set the same env vars in that platform’s build settings before `npm run build:web`.

---

## Part I — App Store / Play Store (later)

Web go-live does **not** require mobile stores. For native apps later, use [EAS Build](https://docs.expo.dev/build/introduction/) and store the same Supabase vars as EAS secrets.

---

## Quick reference — env vars

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
EXPO_PUBLIC_LEGAL_CONTACT_EMAIL=you@example.com
```

Local `.env` uses the same names; restart Expo after changes. Vercel uses them at deploy/build time only.
