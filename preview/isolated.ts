import { solveIK } from '../src/shared/math';
import { drawCandidateSpider, type ShapeLeg } from '../src/spider/appearance/shape';

const light=document.querySelector<HTMLCanvasElement>('#light')!;
const dark=document.querySelector<HTMLCanvasElement>('#dark')!;
const toggle=document.querySelector<HTMLButtonElement>('#toggle')!;
const status=document.querySelector<HTMLElement>('#status')!;
let paused=false,clock=0,last=performance.now();
toggle.onclick=()=>{paused=!paused;toggle.textContent=paused?'Continuar movimento':'Pausar movimento';status.textContent=paused?'Pausado':'Animando';};

function render(canvas:HTMLCanvasElement,blend:number,time:number) {
  const ctx=canvas.getContext('2d')!;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle=blend?'#0a1322':'#f7f8f6';ctx.fillRect(0,0,canvas.width,canvas.height);
  const scale=2.55,body={x:canvas.width/2,y:canvas.height/2+5};
  const legs:ShapeLeg[]=[];
  // Use the same eight home angles, hip offsets, and segment lengths as Spider.
  const heading=Math.PI/2;
  for(let i=0;i<8;i++) {
    const side=i<4?-1:1,pair=i%4,off=(1.5-pair)*4;
    const hip={x:-side*4,y:off};
    const pose=Math.PI/2+Math.sin(heading-Math.PI/2)*.22;
    const angle=pose+side*([.52,1.12,1.98,2.62][pair]);
    const reach=[58,53,53,64][pair];
    const phase=(time*2+i*.5)%(Math.PI*2);
    const lift=Math.max(0,Math.sin(phase))*4;
    const foot={x:Math.cos(angle)*reach+Math.sin(phase)*2,y:Math.sin(angle)*reach-lift};
    const {knee,tip}=solveIK(hip,foot,40,46,(pair===3?-1:1)*side);
    legs.push({hip,knee,tip,side,pair,stepping:lift>1});
  }
  ctx.save();ctx.translate(body.x,body.y);ctx.scale(scale,scale);
  drawCandidateSpider(ctx,{x:0,y:0},heading,legs,'WALKING',time,false,blend);
  ctx.restore();
}
function frame(now:number) {
  if(!paused)clock+=Math.min(.05,(now-last)/1000);
  last=now;render(light,0,clock);render(dark,1,clock);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
