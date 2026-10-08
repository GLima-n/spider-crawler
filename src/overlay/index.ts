export class VisualOverlay {
  host=document.createElement('spider-inspector-overlay');
  root:ShadowRoot;
  canvas=document.createElement('canvas');
  ctx:CanvasRenderingContext2D;
  constructor() {
    this.host.style.cssText='all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important;display:block!important;width:100vw!important;height:100vh!important;';
    this.root=this.host.attachShadow({mode:'closed'});
    const sheet=new CSSStyleSheet();sheet.replaceSync(':host{color-scheme:dark}canvas{position:absolute;inset:0;pointer-events:none}*{box-sizing:border-box}');this.root.adoptedStyleSheets=[sheet];
    this.canvas.setAttribute('aria-hidden','true');this.root.append(this.canvas);document.documentElement.append(this.host);
    this.ctx=this.canvas.getContext('2d')!;this.resize();
  }
  resize() {const dpr=Math.min(2,devicePixelRatio||1);this.canvas.width=Math.round(innerWidth*dpr);this.canvas.height=Math.round(innerHeight*dpr);this.canvas.style.width=`${innerWidth}px`;this.canvas.style.height=`${innerHeight}px`;this.ctx.setTransform(dpr,0,0,dpr,0,0);}
  clear() {this.ctx.clearRect(0,0,innerWidth,innerHeight);}
  destroy() {this.host.remove();this.canvas.width=0;this.canvas.height=0;}
}
