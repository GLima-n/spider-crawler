import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const manifest=JSON.parse(await readFile('dist/manifest.json','utf8'));
if(manifest.host_permissions||manifest.content_scripts||manifest.permissions.join(',')!=='activeTab,scripting,storage')throw new Error('Manifesto de distribuição contém permissões inesperadas.');
await mkdir('artifacts',{recursive:true});
const destination=`artifacts/spider-inspector-${manifest.version}.zip`;
if(process.platform!=='win32')throw new Error('Use zip no seu sistema para compactar dist, README.md e docs. Este empacotador usa Compress-Archive no Windows.');
// Fixed project paths only; no shell interpolation of user-controlled input.
const result=spawnSync('powershell.exe',['-NoProfile','-Command',"Compress-Archive -LiteralPath 'dist','README.md','docs' -DestinationPath 'artifacts/spider-inspector-0.1.0.zip' -Force"],{stdio:'inherit',windowsHide:true});
if(result.status!==0)throw new Error('Falha ao gerar ZIP');
const hash=createHash('sha256').update(await readFile(destination)).digest('hex');
await writeFile(`${destination}.sha256`,`${hash}  spider-inspector-${manifest.version}.zip\n`);console.log(`${destination}\nSHA256 ${hash}`);
