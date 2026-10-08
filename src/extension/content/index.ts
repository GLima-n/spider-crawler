import { Controller, normalize } from './controller';
import type { Settings } from '../../types';
export function createAPI() {
  let controller:Controller|undefined;
  const api={
    start(settings:Partial<Settings>={}) {controller?.stop();controller=new Controller(normalize(settings),()=>api.stop());return api.status();},
    stop() {controller?.stop();controller=undefined;delete window.__spiderInspector;return {running:false};},
    pause() {controller?.pause();return api.status();},
    status() {return controller?.snapshot()||{running:false};},
    report() {return controller?.report()||null;},
    focus(id:string) {controller?.focus(id);},
    export() {controller?.export();}
  };return api;
}
declare global { interface Window { __spiderInspector?:ReturnType<typeof createAPI> } }
window.__spiderInspector??=createAPI();
