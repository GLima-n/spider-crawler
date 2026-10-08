import { clamp, distance, mix, nearest, solveIK } from '../../shared/math';
import { DOMInspector, type Anchor } from '../../inspection/dom';
import type { Candidate, Point, SpiderContact, SpiderState } from '../../types';
interface Leg { side:number; pair:number; foot:Point; knee:Point; from:Point; anchor:Anchor; phase:number; stepping:boolean; hip:Point }
export class Spider {
  position:Point;
  heading=0;
  state:SpiderState='IDLE';
  legs:Leg[]=[];
  target?:Candidate;
  steps=0;
  travelled=0;
  private time=0;
  private stateTime=0;
  private contacted=false;
  private reported=false;
  private group=0;
  private stride=0;
  private forced?:Candidate;
  private touchedPoint?:Point;
  constructor(public id:string,private dom:DOMInspector,private onContact:(c:SpiderContact,a:Anchor,spider:Spider)=>void,private onInspect:(c:Candidate,s:Spider)=>void,private reduced=false,index=0) {
    this.position={x:Math.min(innerWidth-80,120+index*110),y:Math.min(innerHeight-80,180+index*80)};
    for(let i=0;i<8;i++) {const side=i<4?-1:1,pair=i%4,foot=this.rest(side,pair);this.legs.push({side,pair,foot,knee:{...foot},from:{...foot},anchor:{point:foot},phase:0,stepping:false,hip:{...this.position}});}
  }
  private rest(side:number,pair:number):Point {
    const angle=this.heading+side*([.52,1.12,1.98,2.62][pair]);
    const reach=[58,53,53,64][pair];
    return {x:this.position.x+Math.cos(angle)*reach,y:this.position.y+Math.sin(angle)*reach};
  }
  private change(state:SpiderState) {this.state=state;this.stateTime=0;}
  focus(c:Candidate) {this.forced=c;this.target=undefined;this.change('TARGETING');}
  private choose() {
    if(this.forced&&this.dom.visible(this.forced)) {this.target=this.forced;this.forced=undefined;}
    else {
      const options=this.dom.candidates.filter(c=>this.dom.visible(c)&&c.rect.x<innerWidth-350);
      const fallback=options.length?options:this.dom.candidates.filter(c=>this.dom.visible(c));
      this.target=fallback.sort((a,b)=>(a.visited*450+distance(this.position,nearest(this.position,a.rect)))-(b.visited*450+distance(this.position,nearest(this.position,b.rect))))[0];
    }
    this.contacted=false;this.reported=false;this.touchedPoint=undefined;
    this.change(this.target?'WALKING':'RESTING');
  }
  update(dt:number) {
    this.time+=dt;this.stateTime+=dt;
    if(this.target&&(!this.target.el.isConnected||!this.dom.visible(this.target))) {this.target=undefined;this.change('TARGETING');}
    if(this.state==='IDLE'&&this.stateTime>.3)this.change('TARGETING');
    if(this.state==='TARGETING')this.choose();
    let speed=0;
    if((this.state==='WALKING'||this.state==='APPROACHING')&&this.target) {
      const r=this.target.rect;
      const goal={x:clamp(r.x+Math.min(r.width*.45,70),45,Math.max(46,innerWidth-50)),y:clamp(r.y+Math.min(r.height*.5,45),45,Math.max(46,innerHeight-50))};
      const d=distance(this.position,goal);
      const desired=Math.atan2(goal.y-this.position.y,goal.x-this.position.x), delta=Math.atan2(Math.sin(desired-this.heading),Math.cos(desired-this.heading));
      if(d>7)this.heading+=clamp(delta,-dt*2.8,dt*2.8);
      speed=Math.min(this.reduced?35:105+18*Math.sin(this.time*2.4),d*2.8);
      if(d>8) {const next=mix(this.position,goal,Math.min(1,speed*dt/d));this.travelled+=distance(this.position,next);this.position=next;}
      if(d<85&&this.state==='WALKING')this.change('APPROACHING');
      if(d<9) this.change('TOUCHING');
    }
    if(this.state==='TOUCHING'&&this.contacted) this.change(this.target?.type==='CHART'?'WEBBING':'INSPECTING');
    if(this.state==='TOUCHING'&&this.stateTime>2.5) {if(this.target)this.target.visited++;this.change('RESTING');}
    if(this.state==='WEBBING'&&this.stateTime>.65)this.change('INSPECTING');
    if(this.state==='INSPECTING'&&this.stateTime>.6&&this.target&&!this.reported) {this.onInspect(this.target,this);this.reported=true;this.target.visited++;this.change('REPORTING');}
    if(this.state==='REPORTING'&&this.stateTime>.45)this.change('RESTING');
    if(this.state==='RESTING'&&this.stateTime>.65+Math.sin(this.time)*.2)this.change('TARGETING');
    this.stride+=dt;
    if(this.stride>.19) {this.group=1-this.group;this.stride=0;}
    for(let i=0;i<8;i++) {
      const leg=this.legs[i], off=(1.5-leg.pair)*4;
      leg.hip={x:this.position.x+Math.cos(this.heading)*off-Math.sin(this.heading)*leg.side*4,y:this.position.y+Math.sin(this.heading)*off+Math.cos(this.heading)*leg.side*4};
      if(!leg.stepping&&leg.anchor.candidate&&leg.anchor.uv) {
        const r=leg.anchor.candidate.rect, p={x:r.x+leg.anchor.uv.x*r.width,y:r.y+leg.anchor.uv.y*r.height};
        if(distance(p,leg.foot)<35)leg.foot=p;else leg.anchor={point:leg.foot};
      }
      if(leg.stepping) {
        leg.phase=Math.min(1,leg.phase+dt/(this.reduced?.28:.17));
        const t=leg.phase*leg.phase*(3-2*leg.phase), p=mix(leg.from,leg.anchor.point,t);
        leg.foot={x:p.x,y:p.y-Math.sin(leg.phase*Math.PI)*(this.reduced?2:9)};
        if(leg.phase===1) {leg.stepping=false;this.steps++;this.plant(i,leg);}
      } else {
        let destination=this.rest(leg.side,leg.pair);
        const probe=this.state==='TOUCHING'&&!this.contacted&&leg.pair===0&&this.target;
        if(probe)destination=nearest(leg.hip,this.target!.rect,6);
        else if(speed>0) {destination.x+=Math.cos(this.heading)*10;destination.y+=Math.sin(this.heading)*10;}
        const error=distance(leg.foot,destination), reach=distance(leg.hip,leg.foot);
        const moving=this.legs.filter(l=>l.stepping).length;
        if((probe||error>19||reach>78)&&moving<4&&((leg.pair+(leg.side>0?1:0))%2===this.group||reach>80)) {
          let a=this.dom.anchor(destination,probe?this.target:undefined);
          if(distance(a.point,leg.hip)>80)a={point:destination};
          leg.anchor=a;leg.from={...leg.foot};leg.phase=0;leg.stepping=true;
        }
      }
      const ik=solveIK(leg.hip,leg.foot,40,46,(leg.pair===3?-1:1)*leg.side);leg.knee=ik.knee;
    }
  }
  private plant(index:number,leg:Leg) {
    const c=leg.anchor.candidate;if(!c)return;
    if(c===this.target) {this.contacted=true;this.touchedPoint={...leg.foot};}
    this.onContact({spiderId:this.id,legId:index,elementId:c.id,elementType:c.type,position:{...leg.foot},intensity:.6+Math.min(1,this.travelled/200)*.4,timestamp:performance.now(),state:this.state},leg.anchor,this);
  }
  get contactPoint() {return this.touchedPoint||this.position;}
  draw(ctx:CanvasRenderingContext2D) {
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    for(const leg of this.legs) {
      const ik=solveIK(leg.hip,leg.foot,40,46,(leg.pair===3?-1:1)*leg.side);
      ctx.strokeStyle='#12293b';ctx.lineWidth=3.6;ctx.beginPath();ctx.moveTo(leg.hip.x,leg.hip.y);ctx.lineTo(ik.knee.x,ik.knee.y);ctx.lineTo(ik.tip.x,ik.tip.y);ctx.stroke();
      ctx.strokeStyle='#7bcefa';ctx.lineWidth=1.35;ctx.stroke();
      ctx.fillStyle=leg.stepping?'#ffb9cb':'#ff648c';
      for(const p of [ik.knee,ik.tip]){ctx.beginPath();ctx.arc(p.x,p.y,2,0,Math.PI*2);ctx.fill();}
      if(!leg.stepping){ctx.fillStyle='#66b9ff20';ctx.beginPath();ctx.ellipse(ik.tip.x,ik.tip.y+2,4,2,0,0,Math.PI*2);ctx.fill();}
    }
    ctx.translate(this.position.x,this.position.y+(this.reduced?0:Math.sin(this.time*7)*1.1));ctx.rotate(this.heading);
    ctx.fillStyle='#172c4be6';ctx.strokeStyle='#bbdfff';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.ellipse(-12+Math.sin(this.time*3)*1.1,0,12,7.5,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.ellipse(3,0,9,5.5,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle='#729de9';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-20+i*5,-4);ctx.lineTo(-17+i*5,4);ctx.stroke();}
    ctx.strokeStyle='#a6dfff';for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(9,side*3);ctx.lineTo(16,side*(7+Math.sin(this.time*4)));ctx.lineTo(20,side*4);ctx.stroke();ctx.fillStyle='#ff648c';ctx.beginPath();ctx.arc(10,side*2.8,1.8,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  snapshot() {return {id:this.id,state:this.state,position:{...this.position},steps:this.steps,travelled:this.travelled,target:this.target?.id,legs:this.legs.map(l=>({foot:{...l.foot},knee:{...l.knee},stepping:l.stepping}))};}
}
