# Vídeo de apresentação — Spider Crawler

Animação de 36 segundos (1920×1080, 30 fps) feita em JavaScript/JSX com [Remotion](https://www.remotion.dev/) 4.0.534.
Projeto isolado: nada aqui entra na extensão.

| Arquivo | Conteúdo |
|---|---|
| `src/Root.jsx` | Composição `SpiderPresentation` e cenas avulsas. |
| `src/Opening.jsx`, `src/Closing.jsx` | Títulos e a aranha B animada. |
| `src/ProductScenes.jsx` | Cenas Explorar, Teias e Auditoria sobre as capturas reais. |
| `src/design.jsx` | Cores, tipografia e componentes visuais compartilhados. |
| `scripts/soundtrack.mjs` | Gera `public/score.wav`, trilha procedural original, sem voz. |
| `scripts/render.mjs` | Renderiza MP4, GIF, capa e quadros de conferência em `docs/media`. |
| `public/*.webm` | Capturas do laboratório local, gravadas com Playwright. |

## Reproduzir

Requer o Chromium do Playwright instalado (`npx playwright install chromium`) ou `CHROMIUM_PATH`.

```powershell
# 1. Capturas reais (na raiz do projeto, com o laboratório rodando)
npm.cmd run dev
$env:PREVIEW_URL = 'http://127.0.0.1:5173'; node scripts/capture-presentation.mjs
Copy-Item artifacts/presentation/*.webm video/public/

# 2. Trilha e renderização (em video/)
cd video
npm.cmd install
npm.cmd run score
npm.cmd run render     # MP4 + GIF + quadros; use "stills" só para os quadros
```

`npm.cmd run dev` dentro de `video/` abre o Remotion Studio para editar as cenas.

Saídas: `docs/media/spider-crawler.mp4`, `spider-crawler-teaser.gif`, `presentation-cover.png`, `scene-*.png` e `render.json`.
Legendas em `docs/media/presentation.vtt`; player com capítulos em `docs/apresentacao.html`.

Remotion exige licença de empresa para algumas organizações: [termos](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
