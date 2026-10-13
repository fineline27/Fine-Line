# Go live (web)

Fine Line is an **Expo web** app: production is a **static export** (`dist/`) plus your **Supabase** backend. You do not need a Node server in production.

## 1. Create the repo (if you have not)

In Cursor, use **Create repo** on this project, or push to GitHub/GitLab. Vercel deploys from git.

## 2. Supabase production settings

In [Supabase Dashboard](https://supabase.com/dashboard) → your project:

1. **Run all SQL** from `README.md` if you have not (schema, RLS, teams seed, bonus migrations).
2. **Authentication → Providers → Email** — enable email; turn **Confirm email** on for public users.
3. **Authentication → URL configuration**
   - **Site URL**: `https://your-production-domain.com` (update after first deploy if needed).
   - **Redirect URLs**: add  
     `https://your-production-domain.com/**`  
     and your Vercel preview URL pattern, e.g.  
     `https://*.vercel.app/**`
4. Set **`EXPO_PUBLIC_LEGAL_CONTACT_EMAIL`** for privacy/account requests (see README).

Keep using the **publishable (anon) key** in the web app — never put the service role key in the frontend.

## 3. Deploy to Vercel (recommended)

### Option A — Cursor **Publish**

If Cursor shows **Publish**, connect Vercel, set environment variables (step 4 below), and deploy.

### Option B — Vercel dashboard

1. [vercel.com](https://vercel.com) → **Add New Project** → import your git repo.
2. Framework preset: **Other** (or let Vercel read `vercel.json`).
3. Build command: `npm run build:web` (already in `vercel.json`).
4. Output directory: `dist`.
5. Add **Environment Variables** (Production + Preview):

| Variable | Value |
|----------|--------|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | your `sb_publishable_...` key |
| `EXPO_PUBLIC_LEGAL_CONTACT_EMAIL` | your support/privacy email |

Also set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` to the same values if you use them locally — `app.config.ts` reads either name.

6. **Deploy**. Open the `*.vercel.app` URL and test sign-up, picks, and `/privacy`.

7. **Domains** → add your custom domain (optional). Then update Supabase **Site URL** and **Redirect URLs** to that domain.

## 4. Verify after deploy

- Sign up / sign in (email confirmation if enabled).
- My picks loads **30 teams**.
- Create or join a league; submit picks; League tab.
- Privacy policy loads at `/privacy`.

If auth redirects fail, Supabase redirect URLs almost always need one more edit to match the exact host you use.

## 5. Other hosts

Any static host works if you upload **`dist/`** after `npm run build:web` and configure **SPA fallback** to `index.html` (same idea as `vercel.json` rewrites):

- Cloudflare Pages, Netlify, S3 + CloudFront, GitHub Pages (with SPA redirect rules).

## 6. Mobile app stores (later)

Web go-live does not require the App Store. For iOS/Android later, use [EAS Build](https://docs.expo.dev/build/introduction/) and the same Supabase env vars in `eas.json` / EAS secrets.

## Local production smoke test

```bash
npm run build:web
npx serve dist
```

Open the URL `serve` prints and click through routes before pushing to Vercel.
