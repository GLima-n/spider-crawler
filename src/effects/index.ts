import type { Anchor } from '../inspection/dom';
import type { ComponentType, Point, Rect, SpiderContact } from '../types';
import { WebEngine } from './web';
export interface Effect { type:ComponentType; point:Point; rect:Rect; age:number; life:number; intensity:number; word?:Anchor['word']; cells?:Rect[] }
export class InteractionEngine {
  effects:Effect[]=[];
  web=new WebEngine();
  counts:Partial<Record<ComponentType,number>>={};
  contacts=0;
  private last=new Map<string,number>();
  constructor(private intensity:number,private reduced:boolean) {}
  contact(event:SpiderContact,anchor:Anchor,origin:()=>Point) {
    this.contacts++;
    if(!anchor.candidate) return;
    const key=anchor.candidate.id,previous=this.last.get(key)||0;
    if(event.timestamp-previous<350)return;
    this.last.set(key,event.timestamp);
    const c=anchor.candidate, r=c.rect;
    const effect:Effect={type:c.type,point:{...event.position},rect:{...r},age:0,life:this.reduced?.45:1.35,intensity:this.intensity,word:anchor.word};
    if(c.type==='TABLE')effect.cells=[...c.el.querySelectorAll('th,td')].slice(0,80).map(e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};});
    this.effects.push(effect);this.effects=this.effects.slice(-28);
    this.counts[c.type]=(this.counts[c.type]||0)+1;
    if(!this.reduced&&c.type==='TEXT') this.web.add('Silk Thread',origin,event.position,r);
    if(!this.reduced&&c.type==='CHART') this.web.add('Web Capture',origin,event.position,r);
  }
  update(dt:number) {for(const e of this.effects)e.age+=dt;this.effects=this.effects.filter(e=>e.age<e.life);this.web.update(dt);}
  draw(ctx:CanvasRenderingContext2D) {
    for(const e of this.effects) {
      const progress=e.age/e.life, pulse=Math.sin(progress*Math.PI), x=e.point.x,y=e.point.y,r=e.rect,force=this.reduced?0:pulse*e.intensity;
      ctx.save();ctx.globalAlpha=(1-progress)*.85;ctx.strokeStyle='#78cbff';ctx.fillStyle='#82d7ff';ctx.lineWidth=1.2;
      if(e.type==='TEXT'&&e.word) {
        const w=e.word;ctx.translate(w.rect.x,w.rect.y+w.rect.height*.78);ctx.rotate(Math.sin(progress*6)*.12*force);
        ctx.font=w.font||'16px sans-serif';ctx.fillStyle='#b97cff';ctx.fillText(w.text,0,-force*8);
        ctx.strokeStyle='#d2a0ff';ctx.beginPath();ctx.moveTo(0,3);ctx.lineTo(w.rect.width,3+force*3);ctx.stroke();
      } else if(e.type==='BUTTON') {
        ctx.beginPath();ctx.ellipse(x+Math.sin(progress*30)*force*2,y,10+force*13,5+force*5,0,0,Math.PI*2);ctx.fillStyle='#3d6ef044';ctx.fill();ctx.stroke();ctx.strokeRect(r.x,r.y,r.width,r.height);
      } else if(e.type==='CARD') {
        const lean=(x-r.x-r.width/2)/Math.max(r.width/2,1)*force*9;
        ctx.fillStyle='#69b6ff13';ctx.beginPath();ctx.moveTo(r.x,r.y);ctx.lineTo(r.x+r.width,r.y+lean);ctx.lineTo(r.x+r.width,r.y+r.height);ctx.lineTo(r.x,r.y+r.height-lean);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+lean*3,y-force*18);ctx.stroke();
      } else if(e.type==='INPUT') {ctx.strokeStyle='#bd9dff';ctx.setLineDash([4,3]);ctx.strokeRect(r.x-2,r.y-2,r.width+4,r.height+4);ctx.beginPath();ctx.arc(x,y,6+force*5,0,Math.PI*2);ctx.stroke();
      } else if(e.type==='IMAGE') {for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(x,y,5+progress*45+i*7,3+progress*22+i*5,0,0,Math.PI*2);ctx.stroke();}
      } else if(e.type==='MENU') {ctx.strokeStyle='#86efba';ctx.strokeRect(r.x,r.y,r.width,r.height);for(let i=0;i<3;i++)ctx.strokeRect(x,y+8+i*9,(30+i*8)*pulse,5);
      } else if(e.type==='TABLE'&&e.cells) {for(const cell of e.cells){const d=Math.hypot(cell.x+cell.width/2-x,cell.y+cell.height/2-y);if(Math.abs(d-progress*240)<65){ctx.fillStyle='#6eafff33';ctx.fillRect(cell.x,cell.y,cell.width,cell.height);ctx.strokeRect(cell.x,cell.y,cell.width,cell.height);}}
      } else {ctx.beginPath();ctx.arc(x,y,3+progress*(this.reduced?5:20),0,Math.PI*2);ctx.stroke();}
      ctx.restore();
    }
    this.web.draw(ctx);
  }
  clear() {this.effects=[];this.web.clear();this.last.clear();}
}
