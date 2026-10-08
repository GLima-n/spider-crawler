import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const snap=(page:Page)=>page.evaluate(()=>window.__spiderInspector?.status() as any);
async function focus(page:Page,selector:string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await expect.poll(async()=>page.evaluate(sel=>{const el=document.querySelector(sel),r=el?.getBoundingClientRect();const s=window.__spiderInspector?.status() as any;if(!r)return false;const c=s?.candidates?.find((c:any)=>c.tag===el!.tagName&&Math.abs(c.rect.x-r.x)<2&&Math.abs(c.rect.y-r.y)<2);return c?.id;},selector)).toBeTruthy();
  return page.evaluate(sel=>{const el=document.querySelector(sel)!,r=el.getBoundingClientRect(),s=window.__spiderInspector!.status() as any;const c=s.candidates.find((c:any)=>c.tag===el.tagName&&Math.abs(c.rect.x-r.x)<2&&Math.abs(c.rect.y-r.y)<2);window.__spiderInspector!.focus(c.id);return c.id as string;},selector);
}
test('spider walks with articulated legs, plants contacts, pauses and removes all page changes',async({page})=>{
  await page.goto('/');
  const original=await page.locator('#long-text').innerHTML();
  await page.getByRole('button',{name:'Liberar aranhas'}).click();
  await expect(page.locator('spider-inspector-overlay')).toHaveCount(1);
  await expect.poll(async()=> (await snap(page)).spiders[0].steps).toBeGreaterThan(4);
  const first=await snap(page);
  await expect.poll(async()=> (await snap(page)).spiders[0].travelled).toBeGreaterThan(35);
  const second=await snap(page);expect(second.spiders[0].legs).toHaveLength(8);expect(second.spiders[0].legs).not.toEqual(first.spiders[0].legs);
  await expect.poll(async()=> (await snap(page)).contacts).toBeGreaterThan(0);
  await page.evaluate(()=>window.__spiderInspector!.pause());const frozen=await snap(page);await page.waitForTimeout(350);expect((await snap(page)).spiders).toEqual(frozen.spiders);
  await page.screenshot({path:'artifacts/explore.png'});
  await page.evaluate(()=>window.__spiderInspector!.stop());await expect(page.locator('spider-inspector-overlay')).toHaveCount(0);
  expect(await page.locator('#long-text').innerHTML()).toBe(original);expect(await page.locator('#click-counter').textContent()).toContain('0');expect(await page.locator('#submit-counter').textContent()).toContain('0');
  expect(await page.evaluate(()=>window.__spiderInspector)).toBeUndefined();await page.getByRole('button',{name:'Botão de exemplo'}).click();await expect(page.locator('#click-counter')).toContainText('1');
});
test('contact reactions cover text, buttons, cards and chart webs; inspection and export contain actual geometry',async({page})=>{
  test.setTimeout(120000);await page.goto('/');await page.getByRole('button',{name:'Liberar aranhas'}).click();
  for(const [sel,type] of [['#long-text','TEXT'],['#safe-button','BUTTON'],['#feature-card','CARD'],['#svg-chart','CHART']] as const){
    const id=await focus(page,sel);
    await expect.poll(async()=>page.evaluate(id=>window.__spiderInspector!.report()!.components.some(c=>c.id===id),id),{timeout:25000}).toBe(true);
    expect((await snap(page)).effectCounts[type]).toBeGreaterThan(0);
    if(type==='CHART'){expect((await snap(page)).webs.length).toBeGreaterThan(0);await page.screenshot({path:'artifacts/chart-web.png'});}
  }
  const report=await page.evaluate(()=>window.__spiderInspector!.report()!);const chart=report.components.find(c=>c.type==='CHART')!;
  expect(chart.metadata.shapes).toBeGreaterThan(0);expect(chart.dimensions.width).toBeGreaterThan(100);expect(chart.styles.display).toBeTruthy();
  const serialized=JSON.stringify(report);expect(serialized).not.toContain('do-not-export-secret-123');expect(serialized).not.toContain('Pequenas criaturas');
  const download=page.waitForEvent('download');await page.evaluate(()=>window.__spiderInspector!.export());const result=await download;expect(result.suggestedFilename()).toBe('spider-inspector.json');await result.saveAs('artifacts/report-example.json');
  expect(JSON.parse(await fs.readFile('artifacts/report-example.json','utf8')).components.length).toBeGreaterThan(0);
  await page.evaluate(()=>window.__spiderInspector!.focus((window.__spiderInspector!.status() as any).candidates.find((c:any)=>c.type==='INPUT').id));
  await page.waitForTimeout(4200);expect((await snap(page)).webs.some((w:any)=>w.kind==='Web Inspection')).toBe(false);
});
test('passive audit detects seeded issues and never submits or reads a password value',async({page})=>{
  test.setTimeout(140000);await page.goto('/');await page.getByRole('button',{name:'Auditar laboratório'}).click();
  for(const [sel,rule] of [['#broken-image','broken-image'],['#unnamed-button','accessible-name'],['#unlabelled-input','accessible-name'],['#bad-link','missing-fragment'],['#low-contrast','contrast']] as const){
    const id=await focus(page,sel);await expect.poll(async()=>page.evaluate(({id,rule})=>window.__spiderInspector!.report()!.findings.some(f=>f.elementId===id&&f.rule===rule),{id,rule}),{timeout:25000}).toBe(true);
  }
  await page.screenshot({path:'artifacts/audit.png'});
  const report=await page.evaluate(()=>window.__spiderInspector!.report()!);expect(report.findings.some(f=>f.severity==='Erro confirmado')).toBe(true);expect(JSON.stringify(report)).not.toContain('do-not-export-secret-123');expect(await page.locator('#submit-counter').textContent()).toContain('0');expect(await page.locator('#secret-field').inputValue()).toBe('do-not-export-secret-123');
});
test('three spiders, dynamic DOM and reduced motion stay bounded',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.evaluate(()=>window.__spiderInspector!.start({count:3}));
  await expect.poll(async()=> (await snap(page)).spiders.length).toBe(3);
  await page.evaluate(()=>{const b=document.createElement('button');b.id='dynamic-button';b.textContent='Botão dinâmico';document.querySelector('main')!.prepend(b);});
  await expect.poll(async()=> (await snap(page)).candidates.some((c:any)=>c.tag==='BUTTON'&&c.rect.y<160)).toBe(true);
  await page.waitForTimeout(3000);const s=await snap(page);expect(s.webs.length).toBe(0);expect(s.effects.length).toBeLessThanOrEqual(28);expect(s.frameWorkMs).toBeLessThan(30);
  await fs.mkdir('artifacts',{recursive:true});await fs.writeFile('artifacts/performance.json',JSON.stringify({browser:await page.evaluate(()=>navigator.userAgent),viewport:page.viewportSize(),spiders:3,reducedMotion:true,frames:s.frames,observedFps:s.fps,meanFrameWorkMs:s.frameWorkMs},null,2));
});
test('reference demo runs independently (not bundled)',async({page})=>{
  const available=await fs.stat(path.resolve('.reference/index.html')).catch(()=>null);test.skip(!available,'Reference checkout unavailable');
  await page.goto('/.reference/index.html?debug');await expect(page.locator('#legs')).toBeVisible();await page.waitForTimeout(1600);await page.screenshot({path:'artifacts/reference.png'});
  expect(await page.evaluate(()=>document.querySelector('canvas')!.width)).toBeGreaterThan(0);
});
