import type { Point, Rect } from '../../types';
export type WebKind='Silk Thread'|'Web Capture'|'Web Inspection';
export interface WebEffect { kind: WebKind; origin: ()=>Point; anchor: Point; rect: Rect; age: number; life: number }
export class WebEngine {
  items: WebEffect[]=[];
  add(kind: WebKind,origin:()=>Point,anchor:Point,rect:Rect) {this.items.push({kind,origin,anchor:{...anchor},rect:{...rect},age:0,life:kind==='Silk Thread'?1.3:3.2});this.items=this.items.slice(-9);}
  update(dt:number) { for(const e of this.items)e.age+=dt;this.items=this.items.filter(e=>e.age<e.life); }
  draw(ctx:CanvasRenderingContext2D) {
    for(const w of this.items) {
      const t=Math.min(1,w.age/.65), fade=Math.min(1,(w.life-w.age)/.7), a=w.origin(), b=w.anchor;
      ctx.save();ctx.globalAlpha=fade*.8;ctx.strokeStyle=w.kind==='Silk Thread'?'#dc8cf8':'#adcfff';ctx.lineWidth=.8;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2+Math.sin(w.age*6)*6,b.x,b.y);ctx.stroke();
      if(w.kind!=='Silk Thread') {
        const corners:Point[]=[];
        for(let i=0;i<12;i++) {
          const angle=i*Math.PI/6, dx=Math.cos(angle),dy=Math.sin(angle),r=w.rect;
          const k=Math.min(dx>0?(r.x+r.width-b.x)/(dx||1):dx<0?(r.x-b.x)/dx:Infinity,dy>0?(r.y+r.height-b.y)/(dy||1):dy<0?(r.y-b.y)/dy:Infinity);
          const p={x:b.x+dx*Math.max(0,k)*t,y:b.y+dy*Math.max(0,k)*t};corners.push(p);
          ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(p.x,p.y);ctx.stroke();
        }
        for(let ring=1;ring<=5;ring++) {ctx.beginPath();corners.forEach((p,i)=>{const k=ring/5,x=b.x+(p.x-b.x)*k,y=b.y+(p.y-b.y)*k;if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.closePath();ctx.stroke();}
      }
      ctx.restore();
    }
  }
  clear() {this.items=[];}
}
