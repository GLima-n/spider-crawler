import { COMPONENT_TYPES, type Candidate, type Finding, type Inspection, type Settings } from '../../types';
const STYLE=`
.panel{position:absolute;right:18px;top:20px;width:304px;max-height:calc(100vh - 40px);overflow:auto;background:#12171ff5;color:#e9eff8;border:1px solid #354153;border-radius:16px;box-shadow:0 16px 70px #0004;font:12px/1.5 system-ui,sans-serif;pointer-events:auto;scrollbar-width:thin;overscroll-behavior:contain}
.head{padding:18px;border-bottom:1px solid #303a48;display:flex;align-items:center;gap:9px}.logo{color:#7bccff;font-size:24px}.head strong{font-size:14px;letter-spacing:-.3px}.sub{color:#a5b2c5;font-size:10px;letter-spacing:1.3px;text-transform:uppercase}.dot{color:#a3ebc2}.body{padding:14px}.toolbar{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}button,select{font:inherit;color:#eaf3ff;background:#232d3a;border:1px solid #43536a;border-radius:7px;padding:7px 9px;cursor:pointer}button:hover{background:#35455b}button:focus-visible,select:focus-visible{outline:2px solid #83ccff;outline-offset:2px}.primary{background:#77c7fa;color:#111923;border-color:#77c7fa;font-weight:700}.muted{color:#a5b2c5}.status{padding:9px;background:#1a2330;border-radius:8px;margin-bottom:14px}.list{display:grid;gap:5px;max-height:180px;overflow:auto}.item{text-align:left;display:flex;justify-content:space-between;align-items:center;width:100%}.pill{font-size:9px;color:#95d2fc}.details{margin-top:12px;padding-top:12px;border-top:1px solid #354153}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:11px/1.6 ui-monospace,monospace;background:#0b111a;padding:10px;border-radius:8px}.finding{border-left:2px solid #f3b76a;padding:8px 10px;margin:8px 0;background:#29251e;font-size:11px}.finding button{margin-top:6px}.footer{padding:12px 14px;border-top:1px solid #303a48;color:#a5b2c5;font-size:10px}.collapse{margin-left:auto}.panel.small .body,.panel.small .footer{display:none}h2{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#a5b2c5;margin:14px 0 8px}label{display:block;margin:7px 0}select{max-width:100%}.note{font-size:11px;color:#b6c7df;margin:8px 0}@media(max-width:520px){.panel{right:8px;top:8px;width:260px;max-height:calc(100vh - 16px)}}`;
interface Callbacks { pause():void;stop():void;select(id:string):void;correct(id:string,type:string):void;export():void;copy():Promise<void> }
export class Panel {
  el=document.createElement('aside');
  private status:HTMLElement;
  private list:HTMLElement;
  private detail:HTMLElement;
  private findings:HTMLElement;
  private pauseButton:HTMLButtonElement;
  private selected='';
  private lastList='';
  constructor(root:ShadowRoot,private callbacks:Callbacks,settings:Settings) {
    const sheet=new CSSStyleSheet();sheet.replaceSync(STYLE);root.adoptedStyleSheets=[...root.adoptedStyleSheets,sheet];
    this.el.className='panel';this.el.setAttribute('aria-label','Spider Inspector');
    this.el.innerHTML=`<div class="head"><span class="logo" aria-hidden="true">⌘</span><div><strong>Spider Inspector</strong><div class="sub"><span class="dot">●</span> ${settings.mode==='audit'?'Auditoria passiva':'Exploração local'}</div></div><button class="collapse" aria-label="Minimizar painel">−</button></div><div class="body"><div class="toolbar"><button data-action="pause">Pausar</button><button data-action="stop">Recolher</button><button data-action="export">Exportar JSON</button><button data-action="copy">Copiar resumo</button></div><div class="status" role="status">Mapeando superfícies…</div><h2>Componentes encontrados</h2><p class="note">Selecione abaixo para enviar a aranha. Use a rolagem da página para revelar outras áreas.</p><div class="list"></div><div class="details"></div><h2>Achados da sessão</h2><div class="findings"></div></div><div class="footer">100% local · Sem cliques automáticos<br>Textos e valores omitidos dos relatórios.</div>`;
    root.append(this.el);
    const q=<T extends HTMLElement>(s:string)=>this.el.querySelector<T>(s)!;
    this.status=q('.status');this.list=q('.list');this.detail=q('.details');this.findings=q('.findings');this.pauseButton=q('[data-action="pause"]');
    q('.collapse').onclick=()=>{const small=this.el.classList.toggle('small');q('.collapse').textContent=small?'+':'−';q('.collapse').setAttribute('aria-label',small?'Expandir painel':'Minimizar painel');};
    this.pauseButton.onclick=callbacks.pause;q('[data-action="stop"]').onclick=callbacks.stop;q('[data-action="export"]').onclick=callbacks.export;
    q('[data-action="copy"]').onclick=()=>void callbacks.copy().catch(()=>{this.status.textContent='Cópia indisponível nesta página. Exporte o JSON.';});
  }
  update(candidates:Candidate[],reports:Map<string,Inspection>,findings:Finding[],paused:boolean,states:string[],limited:boolean) {
    this.pauseButton.textContent=paused?'Continuar':'Pausar';
    this.status.textContent=`${paused?'Pausado':states.join(' · ')} · ${reports.size} inspecionados${limited?' · Amostra limitada':''}`;
    const key=candidates.map(c=>`${c.id}:${c.type}:${reports.has(c.id)}`).join('|');
    if(key!==this.lastList) {
      this.lastList=key;this.list.replaceChildren();
      for(const c of candidates.slice(0,150)) {
        const b=document.createElement('button');b.className='item';b.dataset.component=c.id;
        const name=document.createElement('span');name.textContent=`${c.el.tagName.toLowerCase()} · ${c.id.split('-')[1]}`;
        const type=document.createElement('span');type.className='pill';type.textContent=`${c.type}${reports.has(c.id)?' ✓':''}`;b.append(name,type);
        b.onclick=()=>{this.selected=c.id;this.callbacks.select(c.id);this.show(reports.get(c.id),c);};this.list.append(b);
      }
      if(!candidates.length)this.list.textContent='Procurando elementos acessíveis…';
    }
    if(this.selected) {const c=candidates.find(c=>c.id===this.selected),r=reports.get(this.selected);if(c&&r&&this.detail.dataset.stamp!==r.inspectedAt)this.show(r,c);}
    this.findings.replaceChildren();
    if(!findings.length)this.findings.textContent='Nenhum achado registrado.';
    for(const f of findings.slice(0,50)) {
      const box=document.createElement('div');box.className='finding';const title=document.createElement('strong');title.textContent=`${f.severity} · ${f.title}`;
      const evidence=document.createElement('p');evidence.textContent=f.evidence;const suggestion=document.createElement('p');suggestion.textContent=f.suggestion;
      const locate=document.createElement('button');locate.textContent=`Investigar ${f.elementId}`;locate.onclick=()=>this.callbacks.select(f.elementId);box.append(title,evidence,suggestion,locate);this.findings.append(box);
    }
  }
  private show(report:Inspection|undefined,c:Candidate) {
    this.detail.replaceChildren();this.detail.dataset.stamp=report?.inspectedAt||'';
    const title=document.createElement('strong');title.textContent=`${c.type} · ${Math.round(c.confidence*100)}% de confiança`;
    const label=document.createElement('label');label.textContent='Corrigir classificação';const select=document.createElement('select');select.setAttribute('aria-label','Corrigir classificação');
    for(const type of COMPONENT_TYPES){const o=document.createElement('option');o.value=type;o.textContent=type;o.selected=type===c.type;select.append(o);}select.onchange=()=>this.callbacks.correct(c.id,select.value);label.append(select);
    const pre=document.createElement('pre');pre.textContent=report?JSON.stringify({tag:report.tag,dimensões:report.dimensions,estilos:report.styles,estrutura:report.structure,acessibilidade:report.accessibility,tecnologias:report.technologies,metadados:report.metadata,evidências:report.evidence},null,2):'Aguardando contato e inspeção da aranha…';this.detail.append(title,label,pre);
  }
  destroy() {this.el.remove();}
}
