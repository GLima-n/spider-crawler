import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';
import path from 'node:path';

const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
const installed = readdirSync(base).filter(name => /^chromium-\d+$/.test(name)).sort().at(-1);
const browser = await chromium.launch({ headless: true,
  executablePath: path.join(base, installed, 'chrome-win64', 'chrome.exe') });
const page = await browser.newPage({ viewport: { width: 1120, height: 680 }, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:5173/preview/isolated.html');
await page.waitForTimeout(350);
await page.screenshot({ path: 'artifacts/preview-isolada-projecao.png' });
await browser.close();
