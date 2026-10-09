import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
test.use({deviceScaleFactor:2});

type SpiderSnapshot = { position:{x:number;y:number}; state:string; legs:unknown[];
  appearance:{theme:string;blend:number;luminance:number|null;samples:number;switches:number} };
const spider=(page:import('@playwright/test').Page)=>page.evaluate(()=>
  (window.__spiderInspector!.status() as {spiders:SpiderSnapshot[]}).spiders[0]);

test('redesigned spider keeps eight articulated legs and adapts between real light/dark laboratory surfaces',async({page})=>{
  test.setTimeout(60000);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',message=>{if(message.type()==='error'&&!message.location().url.includes('intentionally-missing.png'))errors.push(`${message.text()} @ ${JSON.stringify(message.location())}`);});
  await page.goto('/');await page.getByRole('button',{name:'Liberar aranhas'}).click();
  await expect.poll(async()=>(await spider(page)).appearance.theme).toBe('dark-shell');
  await expect.poll(async()=>(await spider(page)).appearance.samples).toBeGreaterThan(2);
  const first=await spider(page);expect(first.legs).toHaveLength(8);expect(first.appearance.luminance).toBeGreaterThan(.64);
  await fs.mkdir('artifacts',{recursive:true});
  const lightClip={x:Math.max(0,first.position.x-82),y:Math.max(0,first.position.y-82),width:164,height:164};
  await page.screenshot({path:'artifacts/spider-redesign-light.png',clip:lightClip});
  await page.locator('#dark-surface-button').scrollIntoViewIfNeeded();
  await expect.poll(async()=>page.evaluate(()=>{
    const el=document.querySelector('#dark-surface-button')!,r=el.getBoundingClientRect();
    const s=window.__spiderInspector!.status() as any;return s.candidates.find((c:any)=>c.tag==='BUTTON'&&Math.abs(c.rect.x-r.x)<2&&Math.abs(c.rect.y-r.y)<2)?.id as string;
  })).toBeTruthy();
  await page.evaluate(()=>{
    const el=document.querySelector('#dark-surface-button')!,r=el.getBoundingClientRect();
    const s=window.__spiderInspector!.status() as any;
    const target=s.candidates.find((c:any)=>c.tag==='BUTTON'&&Math.abs(c.rect.x-r.x)<2&&Math.abs(c.rect.y-r.y)<2);
    window.__spiderInspector!.focus(target.id);
  });
  await expect.poll(async()=>(await spider(page)).appearance.theme,{timeout:22000}).toBe('light-shell');
  await expect.poll(async()=>(await spider(page)).appearance.blend).toBeGreaterThan(.88);
  const dark=await spider(page);expect(dark.appearance.luminance).toBeLessThan(.36);
  expect(dark.legs).toHaveLength(8);
  await page.screenshot({path:'artifacts/spider-redesign-dark.png',clip:{x:Math.max(0,dark.position.x-82),y:Math.max(0,dark.position.y-82),width:164,height:164}});
  expect(errors).toEqual([]);
  await page.evaluate(()=>window.__spiderInspector!.stop());await expect(page.locator('spider-inspector-overlay')).toHaveCount(0);
});

test('local color hysteresis holds on midtones, changes only at thresholds, and stops sampling while paused',async({page})=>{
  await page.goto('/');await page.evaluate(()=>window.__spiderInspector!.start({count:3}));
  await page.evaluate(()=>{
    const tile=document.createElement('div');tile.id='theme-probe';
    tile.style.cssText='position:fixed;z-index:2;inset:0;background:rgb(11,20,34)';
    document.body.append(tile);
  });
  await expect.poll(async()=>(await spider(page)).appearance.theme).toBe('light-shell');
  const switchCount=(await spider(page)).appearance.switches;
  await page.locator('#theme-probe').evaluate(el=>(el as HTMLElement).style.backgroundColor='rgb(190,190,190)');
  await page.waitForTimeout(650);
  expect((await spider(page)).appearance.theme).toBe('light-shell');
  expect((await spider(page)).appearance.switches).toBe(switchCount);
  await page.locator('#theme-probe').evaluate(el=>(el as HTMLElement).style.backgroundColor='rgb(255,255,255)');
  await expect.poll(async()=>(await spider(page)).appearance.theme).toBe('dark-shell');
  await page.evaluate(()=>window.__spiderInspector!.pause());const before=await spider(page);
  await page.waitForTimeout(380);const after=await spider(page);
  expect(after.appearance.samples).toBe(before.appearance.samples);expect(after.legs).toEqual(before.legs);
  expect((await page.evaluate(()=>(window.__spiderInspector!.status() as any).spiders)).length).toBe(3);
});
