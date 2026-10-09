import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';
import path from 'node:path';

const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
const installed = readdirSync(base).filter(name => /^chromium-\d+$/.test(name)).sort().at(-1);
const browser = await chromium.launch({ headless: true,
  executablePath: path.join(base, installed, 'chrome-win64', 'chrome.exe') });
const page = await browser.newPage({ viewport: { width: 1600, height: 1300 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto(`${process.env.PREVIEW_URL || 'http://127.0.0.1:5174'}/preview/comparison.html`);
await page.locator('#reference').waitFor();
await page.waitForTimeout(500);
const neutral = await page.evaluate(() => window.__spiderVisualStudy?.());
if (neutral?.legs !== 8) throw new Error('A prévia neutra não apresentou oito patas articuladas.');
await page.screenshot({ path: 'artifacts/visual-compare-neutral.png', fullPage: true });
await page.locator('#surface').selectOption('dark');
await page.waitForTimeout(100);
await page.screenshot({ path: 'artifacts/visual-compare-neutral-dark.png', fullPage: true });
await page.locator('#view').selectOption('side');
await page.locator('#pose').selectOption('walk');
await page.locator('#surface').selectOption('dark');
await page.waitForFunction(() => window.__spiderVisualStudy?.().inspections > 0, { timeout: 10000 });
await page.waitForTimeout(300);
const walking = await page.evaluate(() => window.__spiderVisualStudy?.());
if (walking?.legs !== 8 || walking.steps < 1 || walking.contacts < 1 || walking.inspections < 1)
  throw new Error(`O motor real não caminhou/inspecionou na prévia: ${JSON.stringify(walking)}`);
await page.screenshot({ path: 'artifacts/visual-compare-walk-dark.png', fullPage: true });
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.locator('#reset').click();
await page.waitForFunction(() => window.__spiderVisualStudy?.().inspections > 0, { timeout: 15000 });
const reduced = await page.evaluate(() => window.__spiderVisualStudy?.());
if (reduced?.legs !== 8 || reduced.steps < 1 || reduced.contacts < 1)
  throw new Error(`Movimento reduzido perdeu passos/contatos: ${JSON.stringify(reduced)}`);
if (errors.length) throw new Error(`Erros da prévia: ${errors.join('; ')}`);
console.log(JSON.stringify({ neutral, walking, reduced, pageErrors: errors }, null, 2));
await browser.close();
