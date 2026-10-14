#!/usr/bin/env node
/**
 * Replaces __SITE_ORIGIN__ in dist/index.html with an absolute https origin so
 * Open Graph / Twitter cards get a full og:image URL (required by most apps).
 */
import fs from 'node:fs';
import path from 'node:path';

const PLACEHOLDER = '__SITE_ORIGIN__';
const indexPath = path.join(process.cwd(), 'dist', 'index.html');

function resolveSiteOrigin() {
  const raw =
    process.env.EXPO_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`
      : '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.trim()}` : '');

  return raw.replace(/\/$/, '');
}

if (!fs.existsSync(indexPath)) {
  console.error('inject-share-meta: dist/index.html not found — run expo export first');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');
if (!html.includes(PLACEHOLDER)) {
  process.exit(0);
}

const origin = resolveSiteOrigin();
if (!origin) {
  console.warn(
    'inject-share-meta: no site origin env set (EXPO_PUBLIC_SITE_URL / VERCEL_URL). ' +
      'Link previews may fall back to a generic host image until you set EXPO_PUBLIC_SITE_URL and redeploy.',
  );
  html = html.replaceAll(PLACEHOLDER, '');
} else {
  html = html.replaceAll(PLACEHOLDER, origin);
}

fs.writeFileSync(indexPath, html);
console.log(`inject-share-meta: applied origin ${origin || '(relative og:image only)'}`);
