import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
test('panel selection, manual correction, clipboard, minimize and recall use real controls',async({page,context})=>{
  test.setTimeout(60000);
  // Test-only observation of the closed root; production keeps it closed.
  await page.addInitScript(()=>{const original=Element.prototype.attachShadow;Element.prototype.attachShadow=function(init){const root=original.call(this,init);if(this.tagName==='SPIDER-INSPECTOR-OVERLAY')(window as any).__testRoot=root;return root;};});
  await context.grantPermissions(['clipboard-read','clipboard-write'],{origin:'http://127.0.0.1:5173'});
  await page.goto('/');await page.getByRole('button',{name:'Liberar aranhas'}).click();
  await expect.poll(()=>page.evaluate(()=>(window as any).__testRoot.querySelectorAll('.item').length)).toBeGreaterThan(4);
  const selected=await page.evaluate(()=>{const root=(window as any).__testRoot as ShadowRoot;const b=root.querySelector<HTMLButtonElement>('.item')!;b.click();return b.dataset.component!;});
  await expect.poll(()=>page.evaluate(id=>window.__spiderInspector!.report()!.components.some(c=>c.id===id),selected)).toBe(true);
  await page.evaluate(()=>{const select=(window as any).__testRoot.querySelector('select') as HTMLSelectElement;select.value='UNKNOWN';select.dispatchEvent(new Event('change'));});
  await expect.poll(()=>page.evaluate(id=>window.__spiderInspector!.report()!.components.find(c=>c.id===id)?.manual,selected)).toBe(true);
  expect(await page.evaluate(id=>window.__spiderInspector!.report()!.components.find(c=>c.id===id)?.type,selected)).toBe('UNKNOWN');
  await page.evaluate(()=>(window as any).__testRoot.querySelector('[data-action="copy"]').click());
  await expect.poll(()=>page.evaluate(()=>navigator.clipboard.readText())).toContain('Spider Inspector');
  await page.evaluate(()=>(window as any).__testRoot.querySelector('.collapse').click());expect(await page.evaluate(()=>(window as any).__testRoot.querySelector('.panel').classList.contains('small'))).toBe(true);
  await page.evaluate(()=>(window as any).__testRoot.querySelector('.collapse').click());
  await page.evaluate(()=>(window as any).__testRoot.querySelector('[data-action="stop"]').click());await expect(page.locator('spider-inspector-overlay')).toHaveCount(0);
});
test('passive batch finds covered and offscreen controls, avoids classifying arbitrary canvas as chart',async({page})=>{
  await page.goto('/');await page.evaluate(()=>{const p=document.createElement('p');p.textContent='Overflow de teste';p.style.cssText='position:absolute;left:-500px;top:50px';p.id='overflow-test';document.body.append(p);const canvas=document.createElement('canvas');canvas.width=100;canvas.height=30;canvas.id='plain-canvas';document.body.prepend(canvas);});
  await page.getByRole('button',{name:'Auditar laboratório'}).click();
  await expect.poll(()=>page.evaluate(()=>window.__spiderInspector!.report()!.findings.some(f=>f.rule==='horizontal-overflow'))).toBe(true);
  await expect.poll(()=>page.evaluate(()=>(window.__spiderInspector!.status() as any).candidates.some((c:any)=>c.type==='CANVAS'))).toBe(true);
  await page.locator('#covered-button').scrollIntoViewIfNeeded();
  await expect.poll(()=>page.evaluate(()=>window.__spiderInspector!.report()!.findings.some(f=>f.rule==='overlap'))).toBe(true);
  await page.evaluate(()=>{const privateText=document.createElement('p');privateText.dataset.private='true';privateText.textContent='sensitive-example-secret';document.body.append(privateText);window.dispatchEvent(new ErrorEvent('error',{message:'password=do-not-export-error'}));});
  const report=await page.evaluate(()=>JSON.stringify(window.__spiderInspector!.report()));expect(report).not.toContain('sensitive-example-secret');expect(report).not.toContain('do-not-export-error');
});
test('normal motion on a large DOM bounds scanning and effects while remaining responsive',async({page})=>{
  await page.goto('/');await page.evaluate(()=>{const fragment=document.createDocumentFragment();for(let i=0;i<3000;i++){const p=document.createElement('p');p.textContent='Conteúdo adicional para verificar o limite de varredura';fragment.append(p);}document.body.append(fragment);window.__spiderInspector!.start({count:3,intensity:'intense'});});
  await expect.poll(()=>page.evaluate(()=>(window.__spiderInspector!.status() as any).candidates.length)).toBe(600);
  await page.waitForTimeout(3000);
  const s=await page.evaluate(()=>window.__spiderInspector!.status() as any);
  expect(s.effects.length).toBeLessThanOrEqual(28);expect(s.webs.length).toBeLessThanOrEqual(9);expect(s.frameWorkMs).toBeLessThan(30);
  await fs.writeFile('artifacts/performance-large.json',JSON.stringify({browser:await page.evaluate(()=>navigator.userAgent),additionalNodes:3000,count:3,intensity:'intense',sampledComponents:s.candidates.length,observedFps:s.fps,meanFrameWorkMs:s.frameWorkMs,frames:s.frames},null,2));
});
