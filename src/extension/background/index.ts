import type { Settings } from '../../types';
import type {} from '../content';
const commands=['start','pause','stop','status','export'];
chrome.runtime.onMessage.addListener((msg,sender,reply)=>{
  // Only our own popup may request tab access; page-originated messages are ignored.
  if(sender.id!==chrome.runtime.id||sender.url!==chrome.runtime.getURL('popup.html')||!commands.includes(msg?.action)||!Number.isInteger(msg?.tabId))return false;
  void (async()=>{
    const tab=await chrome.tabs.get(msg.tabId);
    if(!tab.active||!tab.url||!/^https?:\/\//.test(tab.url)||/^https:\/\/(chromewebstore\.google\.com|chrome\.google\.com\/webstore)/.test(tab.url))throw new Error('Abra uma página HTTP ou HTTPS compatível. Páginas internas e a loja de extensões são protegidas.');
    if(msg.action==='start') {
      await chrome.storage.local.set({settings:msg.settings});
      await chrome.scripting.executeScript({target:{tabId:msg.tabId},files:['content.js']});
    }
    const result=await chrome.scripting.executeScript({target:{tabId:msg.tabId},func:(action:string,settings:Partial<Settings>)=>{
      const api=window.__spiderInspector;
      if(action==='start')return api?.start(settings);
      if(action==='stop')return api?.stop()||{running:false};
      if(action==='pause')return api?.pause()||{running:false};
      if(action==='export'){api?.export();return api?.status()||{running:false};}
      return api?.status()||{running:false};
    },args:[msg.action,msg.settings||{}]});
    return {ok:true,result:result[0]?.result};
  })().then(reply,e=>reply({ok:false,error:e instanceof Error?e.message:'Não foi possível acessar esta página.'}));return true;
});
