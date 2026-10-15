/**
 * Injects Open Graph / Twitter meta tags into the exported SPA index.html so
 * iMessage, Slack, etc. show the sign-in branding instead of the default app icon.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const indexPath = path.join(projectRoot, 'dist', 'index.html');

const SITE_URL = (
  process.env.EXPO_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  'https://finelinesports.vercel.app'
).replace(/\/$/, '');

const SHARE = {
  title: 'Fine Line',
  description:
    'Season-long NBA win-total picks. Free to play — predict OVER/UNDER for all 30 teams and compete with mates.',
  imagePath: '/og-share.png',
};

function escapeAttr(value) {
  return value
   .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function buildMetaBlock() {
  const imageUrl = `${SITE_URL}${SHARE.imagePath}`;
  const t = escapeAttr(SHARE.title);
  const d = escapeAttr(SHARE.description);
  const u = escapeAttr(SITE_URL);
  const img = escapeAttr(imageUrl);

  return `
    <!-- fine-line share preview -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${t}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:url" content="${u}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${img}" />
`;
}

if (!fs.existsSync(indexPath)) {
  console.error(`inject-share-meta: missing ${indexPath} — run expo export first`);
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');
const marker = '<!-- fine-line share preview -->';

if (html.includes(marker)) {
  html = html.replace(/<!-- fine-line share preview -->[\s\S]*?(?=<\/head>)/, buildMetaBlock().trim());
} else {
  html = html.replace('</head>', `${buildMetaBlock()}\n  </head>`);
}

fs.writeFileSync(indexPath, html);
console.log(`inject-share-meta: og:image → ${SITE_URL}${SHARE.imagePath}`);
