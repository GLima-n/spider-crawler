import { classify } from '../classifier';
import { distance, nearest, rectOf } from '../../shared/math';
import { safeWord, sensitive } from '../../shared/privacy';
import type { Candidate, Point, Rect } from '../../types';
export interface Anchor { point: Point; candidate?: Candidate; word?: { text: string; rect: Rect; font: string }; uv?: Point }
const SELECTOR='p,h1,h2,h3,h4,a,button,input,textarea,select,img,svg,canvas,table,nav,article,section,div,[role]';
export class DOMInspector {
  candidates: Candidate[]=[];
  private ids=new WeakMap<Element,string>();
  private serial=0;
  private dirty=new Set<Element>();
  private walker: TreeWalker|null=null;
  private observer: MutationObserver;
  geometryDirty=true;
  scanned=0;
  truncated=false;
  constructor(private host: HTMLElement) {
    this.walker=document.createTreeWalker(document.body||document.documentElement,NodeFilter.SHOW_ELEMENT);
    this.observer=new MutationObserver(records=>{
      for(const r of records) {
        if(r.target===host||host.contains(r.target)) continue;
        if(r.target instanceof Element) this.queue(r.target);
        else if(r.target.parentElement)this.queue(r.target.parentElement);
        for(const n of r.addedNodes) if(n instanceof Element) this.queue(n);
      }
      this.geometryDirty=true;
    });
    this.observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden','role','aria-label','aria-labelledby','src','href','alt'],characterData:true});
  }
  private queue(el: Element) { if(this.dirty.size<300) this.dirty.add(el); }
  private consider(el: Element) {
    if(el===this.host||el.closest('script,style,noscript,[hidden],[aria-hidden="true"]')||!el.matches(SELECTOR)) return;
    if(this.candidates.some(c=>c.el===el)) return;
    const r=el.getBoundingClientRect();
    if(r.width<2||r.height<2) return;
    const cs=getComputedStyle(el); if(cs.visibility==='hidden'||cs.display==='none') return;
    const classification=classify(el);
    if(classification.type==='UNKNOWN'&&!el.hasAttribute('role')) return;
    if(this.candidates.length>=600) { this.truncated=true; return; }
    let id=this.ids.get(el); if(!id) { id=`component-${++this.serial}`;this.ids.set(el,id); }
    this.candidates.push({id,el,rect:rectOf(r),visited:0,...classification});
  }
  tick() {
    const start=performance.now(); let count=0;
    while(this.walker&&count<100&&performance.now()-start<4) {
      const n=this.walker.nextNode(); if(!n) {this.walker=null;break;}
      this.consider(n as Element); count++; this.scanned++;
      if(this.scanned>=12000) {this.walker=null;this.truncated=true;}
    }
    for(const el of this.dirty) {
      if(performance.now()-start>5) break;
      if(this.walker)break;
      this.dirty.delete(el); this.consider(el);
      // Bounded subtree walker; continue in subsequent ticks for large insertions.
      if(!this.walker&&el.isConnected) this.walker=document.createTreeWalker(el,NodeFilter.SHOW_ELEMENT);
    }
    this.candidates=this.candidates.filter(c=>c.el.isConnected);
  }
  refresh() {
    for(const c of this.candidates) {
      c.rect=rectOf(c.el.getBoundingClientRect());
      const cs=getComputedStyle(c.el);if(cs.visibility==='hidden'||cs.display==='none'){c.rect.width=0;c.rect.height=0;}
      if(!c.manual) Object.assign(c,classify(c.el));
    }
    this.geometryDirty=false;
  }
  visible(c: Candidate) {const r=c.rect;return r.width>0&&r.height>0&&r.x+r.width>5&&r.y+r.height>5&&r.x<innerWidth-8&&r.y<innerHeight-8;}
  at(el: Element|null): Candidate|undefined { return this.candidates.find(c=>c.el===el)||this.candidates.filter(c=>!!el&&c.el.contains(el)).sort((a,b)=>a.rect.width*a.rect.height-b.rect.width*b.rect.height)[0]; }
  anchor(p: Point, preferred?: Candidate): Anchor {
    const hit=document.elementFromPoint(p.x,p.y), actual=this.at(hit);
    let c=actual;
    if(preferred&&(!actual||preferred.el.contains(hit))) c=preferred;
    if(!c||!this.visible(c)) return {point:p};
    const point=nearest(p,c.rect);
    if(distance(point,p)>24) return {point:p};
    const anchor: Anchor={point,candidate:c,uv:{x:(point.x-c.rect.x)/c.rect.width,y:(point.y-c.rect.y)/c.rect.height}};
    if(c.type==='TEXT'&&hit&&!sensitive(hit)) {
      const doc=document as Document & {caretRangeFromPoint(x:number,y:number):Range|null};
      const caret=doc.caretRangeFromPoint?.(point.x,point.y);
      if(caret?.startContainer.nodeType===Node.TEXT_NODE&&c.el.contains(caret.startContainer)) {
        const text=caret.startContainer.textContent||'';
        const segments=new Intl.Segmenter('pt-BR',{granularity:'word'}).segment(text);
        const word=segments.containing(Math.min(caret.startOffset,Math.max(0,text.length-1)));
        if(word?.isWordLike&&safeWord(word.segment)) {
          const range=document.createRange();range.setStart(caret.startContainer,word.index);range.setEnd(caret.startContainer,word.index+word.segment.length);
          const r=rectOf(range.getBoundingClientRect()), snap=nearest(point,r);
          if(distance(point,snap)<20) { anchor.point=snap; anchor.word={text:word.segment,rect:r,font:getComputedStyle(hit).font};anchor.uv={x:(snap.x-c.rect.x)/c.rect.width,y:(snap.y-c.rect.y)/c.rect.height}; }
        }
      }
    }
    return anchor;
  }
  destroy() {this.observer.disconnect();this.candidates=[];this.dirty.clear();this.walker=null;}
}
