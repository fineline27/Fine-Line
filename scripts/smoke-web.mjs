import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:8765/';
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    errors.push(`console: ${msg.text()}`);
  }
});

try {
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);
  const title = await page.title();
  const bodyText = (await page.locator('body').innerText()).slice(0, 500);
  console.log(JSON.stringify({ url, status: response?.status(), title, bodyPreview: bodyText, errors }, null, 2));
} catch (err) {
  console.log(JSON.stringify({ url, fatal: String(err), errors }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
