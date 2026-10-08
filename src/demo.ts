import { createAPI } from './extension/content';
const canvas=document.querySelector<HTMLCanvasElement>('#canvas-chart')!,ctx=canvas.getContext('2d')!;
ctx.strokeStyle='#d9dfdf';for(const y of [30,75,120]){ctx.beginPath();ctx.moveTo(20,y);ctx.lineTo(480,y);ctx.stroke();}
ctx.strokeStyle='#528575';ctx.lineWidth=3;ctx.beginPath();[120,105,117,76,82,40,27].forEach((y,i)=>{if(!i)ctx.moveTo(30+i*72,y);else ctx.lineTo(30+i*72,y);});ctx.stroke();
ctx.fillStyle='#528575';[120,105,117,76,82,40,27].forEach((y,i)=>{ctx.beginPath();ctx.arc(30+i*72,y,4,0,Math.PI*2);ctx.fill();});
let clicks=0,submits=0;
document.querySelector('#safe-button')!.addEventListener('click',()=>{document.querySelector('#click-counter')!.textContent=`Cliques humanos: ${++clicks}`;});
document.querySelector('#sample-form')!.addEventListener('submit',e=>{e.preventDefault();document.querySelector('#submit-counter')!.textContent=`Envios humanos: ${++submits}`;});
for(const [id,mode] of [['demo-start','explore'],['demo-audit','audit']] as const)document.getElementById(id)!.onclick=()=>{
  window.__spiderInspector??=createAPI();window.__spiderInspector.start({mode,count:1,intensity:'normal'});document.getElementById('demo-status')!.textContent='Investigação em andamento';
};
