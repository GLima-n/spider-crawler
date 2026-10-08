import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
export function browserPath() {
  if(process.env.CHROMIUM_PATH)return process.env.CHROMIUM_PATH;
  const base=path.join(process.env.LOCALAPPDATA||'', 'ms-playwright');
  if(existsSync(base))for(const dir of readdirSync(base).filter(d=>/^chromium-\d+$/.test(d)).sort().reverse()) {const file=path.join(base,dir,'chrome-win64','chrome.exe');if(existsSync(file))return file;}
  return undefined;
}
