import {bundle} from '@remotion/bundler';
import {renderMedia,renderStill,selectComposition} from '@remotion/renderer';
import {mkdir,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

const cache=path.join(process.env.LOCALAPPDATA||'','ms-playwright');
const installed=(await readdir(cache)).filter(n=>/^chromium-\d+$/.test(n)).sort().at(-1);
const browserExecutable=process.env.CHROMIUM_PATH||path.join(cache,installed,'chrome-win64/chrome.exe');
const output=path.resolve('../docs/media');await mkdir(output,{recursive:true});
const serveUrl=await bundle({entryPoint:path.resolve('src/index.jsx'),publicDir:path.resolve('public')});
const composition=await selectComposition({serveUrl,id:'SpiderPresentation',browserExecutable});
const stillFrames=[75,300,540,795,990];
for(const frame of stillFrames){
  await renderStill({serveUrl,composition,browserExecutable,frame,imageFormat:'png',
    output:path.join(output,frame===75?'presentation-cover.png':`scene-${frame}.png`)});
  console.log(`Checked frame ${frame}`);
}
if(process.argv.includes('--stills'))process.exit(0);
let last=-1;
await renderMedia({serveUrl,composition,browserExecutable,codec:'h264',crf:20,
  pixelFormat:'yuv420p',concurrency:2,outputLocation:path.join(output,'spider-crawler.mp4'),
  onProgress:({progress})=>{const percent=Math.floor(progress*10)*10;if(percent!==last){last=percent;console.log(`MP4 ${percent}%`);}}});
await renderMedia({serveUrl,composition:{...composition,fps:15,durationInFrames:540},browserExecutable,
  codec:'gif',frameRange:[15,74],scale:.42,concurrency:2,
  outputLocation:path.join(output,'spider-crawler-teaser.gif')});
await writeFile(path.join(output,'render.json'),JSON.stringify({width:1920,height:1080,fps:30,durationSeconds:36,
  codec:'h264',audio:'Original procedural score, no voiceover',engine:'Remotion 4.0.534',
  footage:'Real local laboratory, recorded with Playwright',stills:stillFrames},null,2));
console.log('MP4, GIF and poster ready in docs/media');
