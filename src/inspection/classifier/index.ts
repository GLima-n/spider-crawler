import type { Classification } from '../../types';
export function classify(el: Element): Classification {
  const tag=el.tagName.toLowerCase(), role=el.getAttribute('role');
  const result=(type: Classification['type'], confidence: number, evidence: string[]): Classification=>({type,confidence,evidence});
  if(tag==='button'||role==='button'||(tag==='input'&&/^(button|submit|reset)$/.test((el as HTMLInputElement).type))) return result('BUTTON',.99,['Semântica de botão']);
  if(['input','textarea','select'].includes(tag)||role==='textbox') return result('INPUT',.99,['Campo de entrada; valores omitidos']);
  if(tag==='table'||role==='table'||role==='grid') return result('TABLE',.98,['Estrutura tabular']);
  if(tag==='nav'||role==='menu'||role==='menubar') return result('MENU',.95,['Navegação semântica']);
  if(tag==='img'||tag==='picture') return result('IMAGE',.99,['Elemento de imagem']);
  if(tag==='svg'||tag==='canvas') {
    const label=[el.getAttribute('aria-label'),el.getAttribute('class'),el.querySelector('title')?.textContent,el.getAttribute('data-chart')].join(' ');
    const named=/chart|gr[aá]fico|plot|recharts|highcharts|apexcharts/i.test(label);
    const geometry=tag==='svg'&&el.querySelectorAll('path,rect,circle,polyline').length>=3;
    if(named) return result('CHART',geometry?.92:.78,['Indício público de gráfico',geometry?'Geometria SVG composta':'Dados internos não acessados']);
    return result(tag==='svg'?'SVG':'CANVAS',.99,['Superfície gráfica; finalidade não presumida']);
  }
  if(['p','h1','h2','h3','h4','h5','h6','a','label','li','blockquote','code'].includes(tag)) return result('TEXT',.95,['Conteúdo textual semântico']);
  if(['article','section','div'].includes(tag)) {
    const cs=getComputedStyle(el), heading=!!el.querySelector('h1,h2,h3,h4'), content=!!el.querySelector('p,img,button,a');
    const surface=cs.boxShadow!=='none'||parseFloat(cs.borderRadius)>3;
    if(heading&&content&&(tag==='article'||surface)) return result('CARD',.84,['Título e conteúdo agrupados',tag==='article'?'Artigo semântico':'Superfície visual arredondada ou elevada']);
  }
  return result('UNKNOWN',.3,['Evidência insuficiente para classificação específica']);
}
