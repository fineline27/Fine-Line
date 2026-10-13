# Start the Fine Line app (local machine)

## 1. Prerequisites

- **Node.js 20+** — check: `node -v`
- Project folder on your computer (clone/sync from Cursor or git)

## 2. One-time setup

```bash
cd path/to/fine-line
npm install
```

Create **`.env`** in the project root (same folder as `package.json`):

```env
SUPABASE_URL=https://zayzjewfbcoovhtpdtgo.supabase.co
EXPO_PUBLIC_SUPABASE_URL=https://zayzjewfbcoovhtpdtgo.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_sb_publishable_key
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_sb_publishable_key
```

## 3. Open the app (pick one)

### Option A — Web (simplest)

```bash
npm run web
```

Look for a big banner **`Open this URL in your browser: http://localhost:8081`**  
(or the line **`Waiting on http://localhost:8081`**).  
The browser may not open by itself — **copy that address into Chrome/Safari manually**.

If nothing works, try **http://localhost:8081** and **http://localhost:8082** while Expo is running.

### “localhost refused to connect”

That means **nothing is serving the app on your machine** at that moment. Check:

1. **Terminal still running?** You must keep the `npm run web` window open. If you closed it or see red errors, start again:
   ```bash
   npm run web:clean
   ```
2. **Same computer?** `localhost` in Chrome on your laptop only works if Expo is running **on that laptop**. It does **not** reach a Cursor **cloud agent** VM by itself.
3. **Cursor cloud / remote workspace:** Use the chat **Preview** button, or **Ports** (forward **8081** → open in browser). Do not use your laptop’s `localhost` unless you forwarded the port.
4. Try **http://127.0.0.1:8081** instead of `localhost`.
5. If Expo asked for **8082**, use **http://localhost:8082**.

When Expo is healthy you will see **`Waiting on http://localhost:8081`** and the page will load (not “refused”).

### Option B — Expo menu

```bash
npx expo start
```

Then press **`w`** for web, or scan the QR code with **Expo Go** on your phone.

## 4. If something “failed”

| What you see | What to do |
|--------------|------------|
| `command not found: expo` | Use `npx expo start` or `npm run web` (not bare `expo`) |
| `Cannot find module` | Run `npm install` in the project root |
| `Missing Supabase credentials` | Add `.env` (step 2), then **stop** Expo (Ctrl+C) and start again |
| Browser “can’t connect” / blank | Is the terminal still running? Start `npm run web` again and use the URL it prints |
| Phone QR won’t load | Same Wi‑Fi as PC, or run `npx expo start --tunnel` |
| `EADDRINUSE` port busy | `npx expo start --web --port 8083` and open `http://localhost:8083` |

Copy the **full red error text** from the terminal if it still fails—that pinpoints the fix.

## 5. Only 3 teams showing (but SQL count is 30)

1. Run `npm run check:teams` — if it says API is capping rows:
   - Supabase **Dashboard → Project Settings → Data API → Max rows** → set to **1000** → Save.
2. Confirm `.env` `SUPABASE_URL` matches the project where you ran `select count(*)`.
3. Hard refresh the browser (**Cmd/Ctrl + Shift + R**) or press **`r`** in the Expo terminal.

The header should say **“30 teams”** when loaded correctly.

## 6. Refresh team list

- **Web:** browser reload (Cmd/Ctrl + R)
- **Phone:** pull down on the standings list
- **Terminal:** press **`r`** while Expo is running
