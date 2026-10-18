import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_SITE_URL = 'https://finelinesports.vercel.app';
const SITE_NAME = 'Fine Line';
const PAGE_TITLE = 'Fine Line — NBA Win Total O/U Picks & Leagues';
const SITE_DESCRIPTION =
  'Free season-long NBA win total picks. Choose OVER or UNDER on all 30 teams, create a league with mates, and track live standings.';

/** Public routes worth indexing (SPA; each serves index.html). */
const SITEMAP_PATHS = ['/', '/login', '/sign-up', '/privacy', '/terms'];

function getSiteUrl() {
  const fromEnv =
    process.env.EXPO_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  return (fromEnv || DEFAULT_SITE_URL).replace(/\/$/, '');
}

function getGoogleSiteVerificationToken() {
  return envFirst(
    'EXPO_PUBLIC_GOOGLE_SITE_VERIFICATION',
    'GOOGLE_SITE_VERIFICATION',
  );
}

function envFirst(...keys) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return '';
}

/** Ensure Google HTML verification files from public/ exist in dist/ after export. */
function copyGoogleVerificationFiles(publicDir, distDir) {
  if (!fs.existsSync(publicDir)) {
    return;
  }
  for (const name of fs.readdirSync(publicDir)) {
    if (!/^google[a-z0-9_-]+\.html$/i.test(name)) {
      continue;
    }
    fs.copyFileSync(path.join(publicDir, name), path.join(distDir, name));
    console.log(`inject-share-meta: copied public/${name} → dist/${name}`);
  }
}

/** Warn if a Search Console HTML file in public/ was edited or misnamed. */
function checkGoogleVerificationFiles(publicDir, distDir) {
  if (!fs.existsSync(publicDir)) {
    return;
  }
  for (const name of fs.readdirSync(publicDir)) {
    if (!/^google[a-z0-9_-]+\.html$/i.test(name)) {
      continue;
    }
    for (const dir of [publicDir, distDir]) {
      const filePath = path.join(dir, name);
      if (!fs.existsSync(filePath)) {
        continue;
      }
      const body = fs.readFileSync(filePath, 'utf8').trim();
      const expected = `google-site-verification: ${name}`;
      if (body !== expected) {
        console.warn(
          `inject-share-meta: ${name} content does not match Google's download. Expected exactly:\n  ${expected}\nRe-download from Search Console and replace public/${name} without editing.`,
        );
      } else {
        console.log(`inject-share-meta: OK ${name} (HTML file verification).`);
      }
    }
  }
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function writeRobotsTxt(distDir, siteUrl) {
  const body = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
  fs.writeFileSync(path.join(distDir, 'robots.txt'), body);
}

function writeSitemapXml(distDir, siteUrl) {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = SITEMAP_PATHS.map((p) => {
    const loc = p === '/' ? `${siteUrl}/` : `${siteUrl}${p}`;
    const priority = p === '/' || p === '/login' ? '1.0' : '0.6';
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), body);
}

const distDir = path.join(process.cwd(), 'dist');
const indexPath = path.join(distDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('inject-share-meta: dist/index.html not found — run expo export first.');
  process.exit(1);
}

const siteUrl = getSiteUrl();
const ogImageUrl = `${siteUrl}/og-image.jpg`;

const publicDir = path.join(process.cwd(), 'public');

writeRobotsTxt(distDir, siteUrl);
writeSitemapXml(distDir, siteUrl);
copyGoogleVerificationFiles(publicDir, distDir);
checkGoogleVerificationFiles(publicDir, distDir);

const googleVerification = getGoogleSiteVerificationToken();

let html = fs.readFileSync(indexPath, 'utf8');

html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(PAGE_TITLE)}</title>`);

const seoTags = [
  `<meta name="description" content="${escapeHtml(SITE_DESCRIPTION)}" />`,
  `<meta name="robots" content="index, follow" />`,
  `<link rel="canonical" href="${siteUrl}/" />`,
  ...(googleVerification
    ? [
        `<meta name="google-site-verification" content="${escapeHtml(googleVerification)}" />`,
      ]
    : []),
  `<meta property="og:type" content="website" />`,
  `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
  `<meta property="og:title" content="${escapeHtml(PAGE_TITLE)}" />`,
  `<meta property="og:description" content="${escapeHtml(SITE_DESCRIPTION)}" />`,
  `<meta property="og:url" content="${siteUrl}/" />`,
  `<meta property="og:image" content="${ogImageUrl}" />`,
  `<meta property="og:image:width" content="1200" />`,
  `<meta property="og:image:height" content="630" />`,
  `<meta name="twitter:card" content="summary_large_image" />`,
  `<meta name="twitter:title" content="${escapeHtml(PAGE_TITLE)}" />`,
  `<meta name="twitter:description" content="${escapeHtml(SITE_DESCRIPTION)}" />`,
  `<meta name="twitter:image" content="${ogImageUrl}" />`,
  `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: `${siteUrl}/`,
    description: SITE_DESCRIPTION,
  })}</script>`,
].join('\n    ');

if (html.includes('property="og:image"')) {
  html = html.replace(
    /<meta name="description"[^>]*\/>\s*/gi,
    '',
  );
  html = html.replace(
    /<meta property="og:[^"]+"[^>]*\/>\s*/gi,
    '',
  );
  html = html.replace(
    /<meta name="twitter:[^"]+"[^>]*\/>\s*/gi,
    '',
  );
  html = html.replace(
    /<meta name="robots"[^>]*\/>\s*/gi,
    '',
  );
  html = html.replace(
    /<link rel="canonical"[^>]*\/>\s*/gi,
    '',
  );
  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi,
    '',
  );
  html = html.replace(
    /<meta name="google-site-verification"[^>]*\/>\s*/gi,
    '',
  );
}

html = html.replace('</head>', `    ${seoTags}\n  </head>`);

const noscriptHtml = `<noscript>
      <h1>${escapeHtml(SITE_NAME)}</h1>
      <p>${escapeHtml(SITE_DESCRIPTION)}</p>
      <p><a href="${siteUrl}/login">Sign in or create a free account</a></p>
    </noscript>`;
html = html.replace(/<noscript>[\s\S]*?<\/noscript>/i, noscriptHtml);

fs.writeFileSync(indexPath, html);
console.log(
  `inject-share-meta: SEO tags, robots.txt, and sitemap.xml (${siteUrl}).`,
);
