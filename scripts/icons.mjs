import { chromium } from '@playwright/test';
import { mkdir, readdir, access, writeFile } from 'node:fs/promises';
import path from 'node:path';
let executablePath=process.env.CHROMIUM_PATH;
if(!executablePath&&process.env.LOCALAPPDATA){const base=path.join(process.env.LOCALAPPDATA,'ms-playwright');for(const dir of (await readdir(base)).filter(d=>/^chromium-\d+$/.test(d)).sort().reverse()){const candidate=path.join(base,dir,'chrome-win64','chrome.exe');if(await access(candidate).then(()=>true,()=>false)){executablePath=candidate;break;}}}
const browser=await chromium.launch({headless:true,executablePath});
try {
  const page=await browser.newPage();await page.setContent('<canvas width="128" height="128"></canvas>');
  await mkdir('public/icons',{recursive:true});
  for(const size of [16,32,48,128]) {
    const data=await page.evaluate(size=>{
      const canvas=document.querySelector('canvas');canvas.width=canvas.height=size;const c=canvas.getContext('2d');c.scale(size/128,size/128);
      c.fillStyle='#142331';c.beginPath();c.roundRect(0,0,128,128,25);c.fill();c.strokeStyle='#86d4ff';c.lineWidth=4;c.lineCap='round';c.lineJoin='round';
      for(const side of [-1,1])for(let leg=0;leg<4;leg++){const hip={x:64+side*6,y:51+leg*7},knee={x:64+side*(25+Math.sin(leg)*8),y:22+leg*26},foot={x:64+side*(43-leg%2*4),y:15+leg*32};c.beginPath();c.moveTo(hip.x,hip.y);c.lineTo(knee.x,knee.y);c.lineTo(foot.x,foot.y);c.stroke();c.fillStyle='#fb7e9e';c.beginPath();c.arc(knee.x,knee.y,3,0,Math.PI*2);c.fill();}
      c.fillStyle='#254763';c.strokeStyle='#acdfff';c.lineWidth=3;c.beginPath();c.ellipse(64,76,12,17,0,0,Math.PI*2);c.fill();c.stroke();c.beginPath();c.ellipse(64,53,9,12,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#fb7e9e';for(const x of [60,68]){c.beginPath();c.arc(x,46,2.5,0,Math.PI*2);c.fill();}
      return canvas.toDataURL('image/png').split(',')[1];
    },size);
    await writeFile(`public/icons/icon${size}.png`,Buffer.from(data,'base64'));
  }
}finally{await browser.close();}
