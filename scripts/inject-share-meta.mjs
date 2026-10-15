import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_SITE_URL = 'https://finelinesports.vercel.app';
const SITE_NAME = 'Fine Line';
const SITE_DESCRIPTION =
  'Season-long sports picks. Predict NBA win totals, play in leagues with mates, and climb the live standings.';

function getSiteUrl() {
  const fromEnv =
    process.env.EXPO_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  return (fromEnv || DEFAULT_SITE_URL).replace(/\/$/, '');
}

const indexPath = path.join(process.cwd(), 'dist', 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('inject-share-meta: dist/index.html not found — run expo export first.');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

if (html.includes('property="og:image"')) {
  console.log('inject-share-meta: Open Graph tags already present.');
  process.exit(0);
}

const siteUrl = getSiteUrl();
const ogImageUrl = `${siteUrl}/og-image.jpg`;

const metaBlock = `
    <meta name="description" content="${SITE_DESCRIPTION}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${SITE_NAME}" />
    <meta property="og:description" content="${SITE_DESCRIPTION}" />
    <meta property="og:url" content="${siteUrl}/" />
    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${SITE_NAME}" />
    <meta name="twitter:description" content="${SITE_DESCRIPTION}" />
    <meta name="twitter:image" content="${ogImageUrl}" />`;

html = html.replace('</head>', `${metaBlock}\n  </head>`);
fs.writeFileSync(indexPath, html);
console.log(`inject-share-meta: added share preview tags (og:image ${ogImageUrl}).`);
