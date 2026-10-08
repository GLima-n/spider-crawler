import { test, expect, chromium } from '@playwright/test';
import { mkdtemp, cp, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { browserPath } from './browser-path';
import axe from 'axe-core';
test('real MV3 package: service worker, popup, isolated injection, strict CSP and recall',async()=>{
  test.setTimeout(60000);
  await mkdir('artifacts',{recursive:true});
  const fixture=await mkdtemp(path.resolve('artifacts/extension-fixture-'));
  const extension=path.join(fixture,'extension');await cp('dist',extension,{recursive:true});
  const manifest=JSON.parse(await readFile('dist/manifest.json','utf8'));
  expect(manifest.permissions).toEqual(['activeTab','scripting','storage']);expect(manifest.host_permissions).toBeUndefined();expect(manifest.content_scripts).toBeUndefined();
  // Automated toolbar gestures cannot grant activeTab. Only this disposable test copy
  // gets one loopback origin; the shipped dist/manifest.json is untouched.
  await writeFile(path.join(extension,'manifest.json'),JSON.stringify({...manifest,host_permissions:['http://127.0.0.1/*']}));
  const context=await chromium.launchPersistentContext(path.join(fixture,'profile'),{headless:true,executablePath:browserPath(),viewport:{width:1440,height:1000},args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]});
  try {
    const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');const id=new URL(worker.url()).host;
    const page=await context.newPage();
    await page.route('http://127.0.0.1:5173/extension-fixture',route=>route.fulfill({contentType:'text/html',headers:{'Content-Security-Policy':"default-src 'none'; style-src 'none'; script-src 'none'; img-src 'none'"},body:'<!doctype html><html lang="pt-BR"><head><title>CSP fixture</title></head><body><h1>Inspeção em página com CSP restrita</h1><p>As palavras desta página fornecem apoios reais para as patas da aranha durante a investigação.</p><button>Controle real</button><input type="password" value="fixture-secret" aria-label="Senha"><form><button type="submit">Enviar</button></form></body></html>'}));
    await page.goto('http://127.0.0.1:5173/extension-fixture');
    const tabId=await worker.evaluate(async()=> (await chrome.tabs.query({})).find(t=>t.url?.includes('/extension-fixture'))!.id!);
    const popup=await context.newPage();await popup.goto(`chrome-extension://${id}/popup.html`);
    await page.bringToFront();await popup.reload();
    await expect(popup.locator('#status')).toContainText('Pronto');
    await popup.addScriptTag({content:axe.source});
    const accessibility=await popup.evaluate(async()=>await (window as any).axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa']}}));
    await writeFile('artifacts/popup-accessibility.json',JSON.stringify(accessibility.violations,null,2));
    expect(accessibility.violations).toEqual([]);
    const requests:string[]=[];page.on('request',r=>requests.push(r.url()));
    await popup.locator('#count').selectOption('2');await popup.locator('#start').click();
    await expect(popup.locator('#status')).toContainText('Aranhas liberadas');
    await expect(page.locator('spider-inspector-overlay')).toHaveCount(1);
    const status=()=>worker.evaluate(async tabId=>(await chrome.scripting.executeScript({target:{tabId},func:()=>window.__spiderInspector!.status()}))[0].result as any,tabId);
    await expect.poll(async()=> (await status()).spiders[0].steps).toBeGreaterThan(0);
    expect((await status()).spiders).toHaveLength(2);
    expect(await page.evaluate(()=>window.__spiderInspector)).toBeUndefined();
    await page.screenshot({path:'artifacts/extension-csp.png'});await popup.screenshot({path:'artifacts/popup.png'});
    await popup.locator('#pause').click();expect((await status()).paused).toBe(true);
    const a=await status();await page.waitForTimeout(250);expect((await status()).spiders).toEqual(a.spiders);
    await popup.locator('#stop').click();await expect(page.locator('spider-inspector-overlay')).toHaveCount(0);
    expect(await page.locator('input').inputValue()).toBe('fixture-secret');expect(requests).toEqual([]);
    expect(JSON.parse(await readFile('dist/manifest.json','utf8')).host_permissions).toBeUndefined();
    await writeFile('artifacts/extension-validation.json',JSON.stringify({extensionId:id,loaded:true,isolated:true,csp:"default-src 'none'",networkRequests:requests.length,productionPermissions:manifest.permissions,testOnlyHostPermission:'http://127.0.0.1/*',activeTabToolbarGesture:'Requires manual Chrome verification'},null,2));
  } finally {await context.close();}
});
