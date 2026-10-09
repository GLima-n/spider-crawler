import { chromium } from 'playwright';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.PREVIEW_URL || 'http://127.0.0.1:5174';
const out = path.resolve('artifacts/presentation');
await mkdir(out, { recursive: true });
const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
const installed = (await readdir(base)).filter(n => /^chromium-\d+$/.test(n)).sort().at(-1);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || path.join(base, installed, 'chrome-win64/chrome.exe') });
const evidence = {};

async function record(name, selector, mode) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
    recordVideo: { dir: path.join(out, 'raw'), size: { width: 1440, height: 900 } } });
  const page = await context.newPage();
  const video = page.video();
  const started = Date.now();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Test instrumentation only: retained access to the otherwise closed panel.
  await page.addInitScript(() => {
    const attach = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function (init) {
      const root = attach.call(this, init);
      if (this.localName === 'spider-inspector-overlay') window.__presentationRoot = root;
      return root;
    };
  });
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.evaluate(mode => window.__spiderInspector.start({ mode, count: 1, intensity: 'normal' }), mode);
  await page.waitForFunction(selector => {
    const el = document.querySelector(selector), r = el.getBoundingClientRect();
    const target = window.__spiderInspector.status().candidates.find(c => c.tag === el.tagName && Math.abs(c.rect.x-r.x)<2 && Math.abs(c.rect.y-r.y)<2);
    return target && window.__presentationRoot?.querySelector(`[data-component="${target.id}"]`);
  }, selector);
  const id = await page.evaluate(selector => {
    const el = document.querySelector(selector), r = el.getBoundingClientRect();
    const target = window.__spiderInspector.status().candidates.find(c => c.tag === el.tagName && Math.abs(c.rect.x-r.x)<2 && Math.abs(c.rect.y-r.y)<2);
    window.__presentationRoot.querySelector(`[data-component="${target.id}"]`).click();
    return target.id;
  }, selector);
  await page.waitForFunction(id => window.__spiderInspector.report().components.some(c => c.id === id), id, { timeout: 25000 });
  if (name === 'chart') await page.waitForFunction(() => window.__spiderInspector.status().webs.length > 0);
  if (name === 'audit') {
    await page.waitForFunction(() => window.__spiderInspector.report().findings.some(f => f.rule === 'accessible-name'));
    await page.evaluate(() => window.__presentationRoot.querySelector('.findings').scrollIntoView({ block: 'center' }));
  }
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  await page.waitForTimeout(3000);
  evidence[name] = await page.evaluate(() => ({ status: window.__spiderInspector.status(), report: window.__spiderInspector.report() }));
  evidence[name].recordedSeconds = (Date.now()-started)/1000;
  evidence[name].errors = errors;
  if (errors.length) throw new Error(errors.join('; '));
  if (JSON.stringify(evidence[name]).includes('do-not-export-secret-123')) throw new Error('Private test value leaked');
  await context.close();
  await video.saveAs(path.join(out, `${name}.webm`));
  console.log(`${name}: captured, ${evidence[name].recordedSeconds.toFixed(1)}s, ${evidence[name].report.components.length} inspections`);
}
try {
  await record('explore', '#feature-card', 'explore');
  await record('chart', '#svg-chart', 'explore');
  await record('audit', '#unnamed-button', 'audit');
  await writeFile(path.join(out, 'evidence.json'), JSON.stringify(evidence, null, 2));
} finally { await browser.close(); }
