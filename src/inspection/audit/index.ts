import type { Candidate, Finding } from '../../types';
import { hasAccessibleName } from '../../shared/privacy';
function luminance(color: string): number|null {
  const m=color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if(!m||(m[4]&&Number(m[4])!==1)) return null;
  const rgb=m.slice(1,4).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
}
export function audit(c: Candidate): Finding[] {
  const el=c.el, out: Finding[]=[];
  const add=(rule:string,severity:Finding['severity'],title:string,evidence:string,suggestion:string)=>out.push({id:`${c.id}:${rule}`,elementId:c.id,rule,severity,title,evidence,suggestion});
  if(el instanceof HTMLImageElement) {
    if(el.complete&&el.naturalWidth===0&&el.getAttribute('src')) add('broken-image','Erro confirmado','Imagem não carregada','complete=true e naturalWidth=0. A causa não foi determinada.','Verifique o recurso e a resposta de rede.');
    if(!el.hasAttribute('alt')&&!el.hasAttribute('aria-label')&&!el.hasAttribute('aria-labelledby')) add('image-alt','Possível problema','Imagem sem alternativa textual','Atributos alt e nome ARIA ausentes.','Adicione uma descrição ou alt vazio se decorativa.');
  }
  if((c.type==='BUTTON'||c.type==='INPUT'||el.matches('a[href]'))&&!hasAccessibleName(el)) add('accessible-name','Possível problema','Elemento sem nome acessível detectável','Não foi encontrado texto, label associado, title ou nome ARIA válido.','Confirme na árvore de acessibilidade e associe um nome adequado.');
  if(el instanceof HTMLAnchorElement) {
    const href=el.getAttribute('href');
    if(href===''||href==='#') add('empty-link','Observação','Link sem destino específico','href vazio ou fragmento vazio; pode haver comportamento JavaScript.','Verifique o destino e a semântica de botão.');
    else if(href?.startsWith('#')) {try {if(!document.getElementById(decodeURIComponent(href.slice(1)))&&!document.getElementsByName(decodeURIComponent(href.slice(1))).length) add('missing-fragment','Possível problema','Destino de fragmento ausente','Nenhum id ou âncora nomeada corresponde ao fragmento neste momento.','Confirme navegação dinâmica ou corrija a referência.');} catch {add('invalid-link','Erro confirmado','Fragmento malformado','Falha ao decodificar percentuais no fragmento.','Corrija a codificação do destino.');}}
    else if(href) { try{new URL(href,location.href);}catch{add('invalid-link','Erro confirmado','URL malformada','O parser URL rejeitou o destino.','Corrija a URL.');} }
  }
  const r=c.rect, cs=getComputedStyle(el);
  if(r.width>0&&(r.x+r.width<0||r.x>innerWidth||r.x+r.width>innerWidth+4||r.x< -4)) add('horizontal-overflow','Possível problema','Conteúdo fora da largura visível','A caixa ultrapassa os limites horizontais da viewport.','Verifique responsividade, carrosséis e contêineres roláveis.');
  if(r.y>=innerHeight||r.y+r.height<=0) add('outside-viewport','Observação','Componente fora da viewport vertical','Pode estar acessível por rolagem normal.','Verifique apenas se deveria estar visível neste estado.');
  if(c.type==='TEXT'&&el.textContent?.trim()) {
    const fg=luminance(cs.color), bg=cs.backgroundImage==='none'?luminance(cs.backgroundColor):null;
    if(fg!==null&&bg!==null) {
      const ratio=(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05), large=parseFloat(cs.fontSize)>=24||(parseFloat(cs.fontSize)>=18.66&&parseInt(cs.fontWeight)>=700);
      if(ratio<(large?3:4.5)) add('contrast','Possível problema','Contraste possivelmente insuficiente',`Contraste calculado ${ratio.toFixed(2)}:1 nas cores opacas do elemento; composição visual não avaliada.`,'Verifique a composição final e ajuste as cores.');
    }
  }
  if((c.type==='BUTTON'||c.type==='INPUT')&&r.x>=0&&r.y>=0&&r.x+r.width<innerWidth&&r.y+r.height<innerHeight) {
    const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    if(hit&&hit!==el&&!el.contains(hit)&&!hit.contains(el)&&!hit.matches('spider-inspector-overlay')) add('overlap','Possível problema','Controle possivelmente encoberto','O elemento no centro visual do controle pertence a outro componente.','Inspecione empilhamento, overlays e áreas de clique.');
  }
  return out;
}
