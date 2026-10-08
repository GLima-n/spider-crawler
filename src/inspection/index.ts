import type { Candidate, Inspection } from '../types';
import { hasAccessibleName } from '../shared/privacy';
export function inspect(c: Candidate): Inspection {
  const el=c.el, cs=getComputedStyle(el), styles: Record<string,string>={};
  for(const key of ['color','background-color','font-size','font-weight','line-height','letter-spacing','display','position','padding','margin','gap','border-radius','border-width','box-sizing']) styles[key]=cs.getPropertyValue(key);
  // Font family allowlist avoids serializing arbitrary CSS strings or identifiers.
  styles['font-family']=['sans-serif','serif','monospace','system-ui'].find(f=>cs.fontFamily.includes(f))||'família personalizada (nome omitido)';
  const technologies:string[]=[];
  if(document.querySelector('[data-reactroot],#__next')) technologies.push('Possível React/Next: marcador público no DOM');
  if(document.querySelector('[ng-version]')) technologies.push('Possível Angular: atributo ng-version');
  if([...el.attributes].some(a=>a.name.startsWith('data-v-'))) technologies.push('Possível Vue: atributo de escopo');
  const metadata: Inspection['metadata']={children:el.children.length};
  if(el instanceof HTMLInputElement) {metadata.inputType=el.type;metadata.required=el.required;metadata.disabled=el.disabled;}
  if(el instanceof HTMLCanvasElement) {metadata.bitmapWidth=el.width;metadata.bitmapHeight=el.height;metadata.dataAccess='Área e atributos públicos; pixels e dados internos não lidos';}
  if(el instanceof SVGElement) {metadata.paths=el.querySelectorAll('path').length;metadata.shapes=el.querySelectorAll('rect,circle,ellipse,polyline,line').length;}
  if(el instanceof HTMLImageElement) {metadata.loaded=el.complete&&el.naturalWidth>0;metadata.naturalWidth=el.naturalWidth;metadata.naturalHeight=el.naturalHeight;}
  if(el instanceof HTMLTableElement) {metadata.rows=el.rows.length;metadata.headers=el.querySelectorAll('th').length;metadata.columns=el.rows[0]?.cells.length||0;}
  return {id:c.id,type:c.type,confidence:c.confidence,manual:!!c.manual,tag:el.tagName.toLowerCase(),dimensions:{...c.rect},styles,
    structure:[...el.children].slice(0,12).map(e=>e.tagName.toLowerCase()),accessibility:{hasAccessibleName:hasAccessibleName(el),role:el.getAttribute('role')?.match(/^[a-z]+$/)?.[0]||'implícito',tabIndex:el instanceof HTMLElement?el.tabIndex:-1},
    technologies,evidence:[...c.evidence,'Análise da representação renderizada; código-fonte original não recuperado'],metadata,inspectedAt:new Date().toISOString()};
}
