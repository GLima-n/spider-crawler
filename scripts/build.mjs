import { build } from 'vite';
import { mkdir, copyFile } from 'node:fs/promises';
await build({ configFile: false, build: { outDir: 'dist', emptyOutDir: true,
  lib: { entry: 'src/extension/content/index.ts', formats: ['iife'], name: 'SpiderInspector', fileName: () => 'content.js' } } });
for (const [entry, name] of [['background/index.ts','background'], ['popup/index.ts','popup']]) {
  await build({ configFile: false, build: { outDir: 'dist', emptyOutDir: false,
    lib: { entry: `src/extension/${entry}`, formats: ['es'], fileName: () => `${name}.js` } } });
}
await mkdir('dist', { recursive: true });
for (const [from, to] of [['manifest.json','manifest.json'], ['src/extension/popup/popup.html','popup.html'], ['src/extension/popup/popup.css','popup.css']]) await copyFile(from, `dist/${to}`);
