import { DEFAULT_SETTINGS, type Settings } from '../../types';
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const status=$('status');let tabId:number|undefined;
const settings=():Settings=>({mode:$<HTMLSelectElement>('mode').value as Settings['mode'],count:Number($<HTMLSelectElement>('count').value),intensity:$<HTMLSelectElement>('intensity').value as Settings['intensity']});
async function send(action:string) {
  if(tabId===undefined){status.textContent='Não foi possível localizar a aba ativa.';return;}
  try {const response=await chrome.runtime.sendMessage({action,tabId,settings:settings()});if(!response?.ok)throw new Error(response?.error||'Extensão indisponível.');const running=response.result?.running;for(const name of ['pause','stop','export'])$<HTMLButtonElement>(name).disabled=!running;$('pause').textContent=response.result?.paused?'Continuar':'Pausar';status.textContent=running?(response.result.paused?'Investigação pausada.':'Aranhas liberadas. O painel está na página.'):'Pronto para investigar a aba atual.';}catch(e){status.textContent=e instanceof Error?e.message:'Página não compatível.';}
}
async function init() {const saved=((await chrome.storage.local.get('settings')).settings||DEFAULT_SETTINGS) as Partial<Settings>;for(const key of ['mode','count','intensity'] as const)$<HTMLSelectElement>(key).value=String(saved[key]??DEFAULT_SETTINGS[key]);const [tab]=await chrome.tabs.query({active:true,currentWindow:true});tabId=tab?.id;await send('status');}
for(const action of ['start','pause','stop','export'])$(action).onclick=()=>void send(action);
void init().catch(()=>{status.textContent='Não foi possível inicializar a extensão.';});
