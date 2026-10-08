import { VisualOverlay } from '../../overlay';
import { Panel } from '../panel';
import { DOMInspector } from '../../inspection/dom';
import { InteractionEngine } from '../../effects';
import { Spider } from '../../spider/engine';
import { inspect } from '../../inspection';
import { audit } from '../../inspection/audit';
import { COMPONENT_TYPES, DEFAULT_SETTINGS, type Candidate, type Finding, type Inspection, type Report, type Settings } from '../../types';
export function normalize(value:Partial<Settings>={}):Settings {return {mode:value.mode==='audit'?'audit':'explore',count:Math.max(1,Math.min(3,Math.round(Number(value.count)||1))),intensity:['soft','normal','intense'].includes(value.intensity||'')?value.intensity!:DEFAULT_SETTINGS.intensity};}
const STATES:Record<string,string>={IDLE:'Observando',TARGETING:'Escolhendo alvo',WALKING:'Caminhando',APPROACHING:'Aproximando',TOUCHING:'Tocando',WEBBING:'Tecendo',INSPECTING:'Inspecionando',REPORTING:'Registrando',RESTING:'Descansando'};
export class Controller {
  overlay=new VisualOverlay();
  dom=new DOMInspector(this.overlay.host);
  effects:InteractionEngine;
  panel:Panel;
  spiders:Spider[]=[];
  reports=new Map<string,Inspection>();
  findings=new Map<string,Finding>();
  paused=false;
  private disposed=false;
  private raf=0;
  private last=0;
  private planTime=0;
  private panelTime=0;
  private geometryTime=0;
  private frames=0;
  private runtime=0;
  private elapsed=0;
  private durations:number[]=[];
  private abort=new AbortController();
  private urls=new Set<string>();
  private timers=new Set<ReturnType<typeof setTimeout>>();
  private auditCursor=0;
  private auditTimes=new WeakMap<Element,number>();
  private highlighted?:string;
  private media=matchMedia('(prefers-reduced-motion: reduce)');
  constructor(public settings:Settings,private onStop:()=>void) {
    this.effects=new InteractionEngine({soft:.5,normal:1,intense:1.6}[settings.intensity],this.media.matches);
    this.panel=new Panel(this.overlay.root,{pause:()=>this.pause(),stop:onStop,select:id=>this.focus(id),highlight:id=>{this.highlighted=id;},correct:(id,type)=>{const c=this.dom.candidates.find(c=>c.id===id);if(c&&COMPONENT_TYPES.includes(type as never)){c.type=type as Candidate['type'];c.manual=true;c.confidence=1;c.evidence=['Classificação corrigida manualmente'];this.reports.delete(id);this.focus(id);}},export:()=>this.export(),copy:()=>navigator.clipboard.writeText(this.summary())},settings);
    for(let i=0;i<settings.count;i++)this.spiders.push(new Spider(`spider-${i+1}`,this.dom,(event,anchor,spider)=>this.effects.contact(event,anchor,()=>spider.position),(c,s)=>this.record(c,s),this.media.matches,i));
    const signal=this.abort.signal;
    addEventListener('resize',()=>{this.overlay.resize();this.dom.geometryDirty=true;this.effects.clear();},{signal});
    addEventListener('scroll',()=>{this.dom.geometryDirty=true;this.effects.clear();},{signal,passive:true,capture:true});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(this.raf);this.raf=0;}else this.schedule();},{signal});
    this.media.addEventListener('change',()=>{this.pause(true);},{signal});
    addEventListener('pagehide',onStop,{signal,once:true});
    addEventListener('error',event=>{if(settings.mode==='audit'){const resource=event.target instanceof Element;this.findings.set(`session-${resource?'resource':'error'}`,{id:`session-${resource?'resource':'error'}`,elementId:'session',rule:'session-error',severity:'Observação',title:resource?'Falha de recurso observada':'Evento de erro observado',evidence:'Evento recebido durante a sessão. Mensagem, caminho e conteúdo omitidos.',suggestion:'Verifique o console e a rede no DevTools; a captura no contexto isolado é limitada.'});}},{signal,capture:true});
    this.schedule();
  }
  private schedule() {if(!this.disposed&&!this.paused&&!document.hidden&&!this.raf){this.last=performance.now();this.raf=requestAnimationFrame(this.frame);}}
  private frame=(now:number)=>{
    this.raf=0;if(this.disposed||this.paused||document.hidden)return;
    const start=performance.now(),wallDelta=(now-this.last)/1000,dt=Math.min(.05,wallDelta);this.last=now;this.runtime+=dt;this.elapsed+=wallDelta;this.frames++;
    this.planTime+=dt;this.panelTime+=dt;this.geometryTime+=dt;
    if(this.planTime>.12){this.dom.tick();if(this.settings.mode==='audit')this.auditBatch();this.planTime=0;}
    if(this.geometryTime>.35||this.dom.geometryDirty){this.dom.refresh();this.geometryTime=0;}
    this.effects.update(dt);for(const s of this.spiders)s.update(dt);
    this.overlay.clear();this.drawMarkers();this.effects.draw(this.overlay.ctx);for(const s of this.spiders)s.draw(this.overlay.ctx);
    if(this.panelTime>.45){this.updatePanel();this.panelTime=0;}
    this.durations.push(performance.now()-start);if(this.durations.length>600)this.durations.shift();
    this.raf=requestAnimationFrame(this.frame);
  };
  private record(c:Candidate,s:Spider) {
    if(!c.el.isConnected)return;
    this.reports.set(c.id,inspect(c));
    if(this.settings.mode==='audit'){for(const [id,f] of this.findings)if(f.elementId===c.id)this.findings.delete(id);for(const f of audit(c))this.findings.set(f.id,f);}
    if(c.type==='CHART'&&!this.media.matches)this.effects.web.add('Web Inspection',()=>s.position,s.contactPoint,c.rect);
  }
  private auditBatch() {
    // Passive checks can discover offscreen/covered controls before the spider visits.
    // Inspection records still require an actual contact and the INSPECTING state.
    const candidates=this.dom.candidates;if(!candidates.length)return;
    const start=performance.now();
    for(let i=0;i<5&&performance.now()-start<3;i++) {
      const c=candidates[this.auditCursor++%candidates.length];
      if(this.runtime-(this.auditTimes.get(c.el)??-10)<5)continue;
      this.auditTimes.set(c.el,this.runtime);
      for(const [id,f] of this.findings)if(f.elementId===c.id)this.findings.delete(id);
      for(const f of audit(c))this.findings.set(f.id,f);
    }
  }
  private drawMarkers() {
    const ctx=this.overlay.ctx;
    const highlighted=this.dom.candidates.find(c=>c.id===this.highlighted);
    if(highlighted){const r=highlighted.rect;ctx.save();ctx.fillStyle='#78baff18';ctx.strokeStyle='#508cff';ctx.lineWidth=2;ctx.fillRect(r.x,r.y,r.width,r.height);ctx.strokeRect(r.x,r.y,r.width,r.height);ctx.restore();}
    for(const f of [...this.findings.values()].slice(0,60)) {const c=this.dom.candidates.find(c=>c.id===f.elementId);if(!c||!this.dom.visible(c))continue;ctx.save();ctx.strokeStyle='#e5984b';ctx.setLineDash([4,4]);ctx.strokeRect(c.rect.x-2,c.rect.y-2,c.rect.width+4,c.rect.height+4);ctx.fillStyle='#e5984b';ctx.beginPath();ctx.arc(c.rect.x+7,c.rect.y+7,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#17120d';ctx.font='bold 11px system-ui';ctx.fillText('!',c.rect.x+5,c.rect.y+11);ctx.restore();}
  }
  private updatePanel() {this.panel.update(this.dom.candidates,this.reports,[...this.findings.values()],this.paused,this.spiders.map(s=>STATES[s.state]),this.dom.truncated);}
  focus(id:string) {const c=this.dom.candidates.find(c=>c.id===id);if(c)this.spiders[0]?.focus(c);}
  pause(force?:boolean) {this.paused=force??!this.paused;if(this.paused){cancelAnimationFrame(this.raf);this.raf=0;}else this.schedule();this.updatePanel();return this.paused;}
  report():Report {return {schemaVersion:1,generatedAt:new Date().toISOString(),mode:this.settings.mode,page:{origin:location.origin},components:[...this.reports.values()],findings:[...this.findings.values()],limitations:['Amostragem de até 600 componentes e 12.000 nós; painel lista até 150.','Somente DOM principal acessível; frames e Shadow DOM de outros componentes não examinados.','Resultados referentes ao momento do contato; alterações posteriores exigem nova inspeção.','Sem valores, textos, seletores, cookies, tokens, URLs completas ou dados internos de gráficos.','Auditoria heurística parcial; não certifica conformidade de acessibilidade.','Erros no contexto JavaScript da página podem não atravessar o mundo isolado.']};}
  summary() {return `Spider Inspector — ${this.settings.mode==='audit'?'Auditoria passiva':'Exploração'}\n${this.reports.size} componentes inspecionados; ${this.findings.size} achados.\n${[...this.reports.values()].map(r=>`${r.id}: <${r.tag}> ${r.type}, ${Math.round(r.dimensions.width)} × ${Math.round(r.dimensions.height)} px`).join('\n')}\n${[...this.findings.values()].map(f=>`${f.severity}: ${f.title} — ${f.evidence}`).join('\n')}`;}
  export() {const url=URL.createObjectURL(new Blob([JSON.stringify(this.report(),null,2)],{type:'application/json'}));this.urls.add(url);const a=document.createElement('a');a.href=url;a.download='spider-inspector.json';this.overlay.root.append(a);a.click();a.remove();const timer=setTimeout(()=>{URL.revokeObjectURL(url);this.urls.delete(url);this.timers.delete(timer);},1000);this.timers.add(timer);}
  snapshot() {return {running:!this.disposed,paused:this.paused,settings:this.settings,spiders:this.spiders.map(s=>s.snapshot()),contacts:this.effects.contacts,effectCounts:this.effects.counts,effects:this.effects.effects.map(e=>({type:e.type,point:e.point,age:e.age})),webs:this.effects.web.items.map(w=>({kind:w.kind,age:w.age,life:w.life})),candidates:this.dom.candidates.map(c=>({id:c.id,type:c.type,tag:c.el.tagName,rect:c.rect})),inspected:this.reports.size,findings:this.findings.size,frames:this.frames,fps:this.frames/Math.max(.001,this.elapsed),frameWorkMs:this.durations.length?this.durations.reduce((a,b)=>a+b)/this.durations.length:0};}
  stop() {this.disposed=true;cancelAnimationFrame(this.raf);this.raf=0;this.abort.abort();this.dom.destroy();this.effects.clear();this.panel.destroy();this.overlay.destroy();this.spiders=[];this.reports.clear();this.findings.clear();for(const url of this.urls)URL.revokeObjectURL(url);this.urls.clear();for(const timer of this.timers)clearTimeout(timer);this.timers.clear();}
}
