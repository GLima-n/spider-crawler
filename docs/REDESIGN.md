# Correção visual 2D/ASCII — 08/10/2026

A imagem `Concepção Visual do Spider Crawler.png`, fornecida pelo usuário, orientou
somente o personagem. A primeira versão tinha corpo pequeno e patas retas que
pareciam antenas. Esta correção foi desenhada e comparada primeiro em uma prévia
isolada, feita com o Canvas e o mesmo `solveIK` do projeto, antes de entrar na
extensão.

## Comparação visual

| Prévia isolada clara e escura | Extensão em superfície clara | Extensão em superfície escura |
|---|---|---|
| ![Prévia isolada](../artifacts/preview-isolada-projecao.png) | ![Runtime claro](../artifacts/spider-redesign-light.png) | ![Runtime escuro](../artifacts/spider-redesign-dark.png) |

Em relação à referência aprovada: corpo arredondado e compacto, rosto integrado
com apenas dois olhos, oito patas finas com joelho e curvatura, postura lateral
mais baixa e poucos pixels de brilho. A figura ainda é uma tradução vetorial
simplificada da arte, especialmente no tratamento das patas e dos detalhes do
casco. As capturas da extensão mostram poses reais durante a caminhada e a
aproximação de componentes; por isso variam da pose neutra da prévia.

## Implementação

- `preview/isolated.html`, `preview/isolated.ts` e `preview/capture.mjs`:
  laboratório reproduzível com os mesmos comprimentos de segmentos e solução IK.
  Com `npm.cmd run dev` ativo, abra `http://127.0.0.1:5173/preview/isolated.html`;
  `node preview/capture.mjs` grava a captura em `artifacts` no Windows.
- `src/spider/appearance/shape.ts`: desenho Canvas 2D, contornos suaves e
  pequenos detalhes geométricos. A pose lateral das patas livres é uma projeção
  **somente visual** dos joelhos e pés reais. A projeção muda com os movimentos
  do IK; patas ancoradas em componentes transitam para o pé real antes do
  contato, mantendo o desenho alinhado ao efeito.
- `src/spider/appearance/index.ts`: pele desacoplada do controlador de movimento.
- `src/spider/engine/index.ts`: passa à pele apenas se a pata está ancorada.
  Nenhum alvo, comprimento, equação IK, tempo de passo ou reação foi alterado.
- `src/spider/appearance/surface.ts`: contraste local com histerese e transição
  gradual da revisão anterior, preservado sem novas leituras por quadro.

Checkpoint anterior à correção: commit `ecc8ae1`. A referência e os painéis
da arte não são distribuídos com a extensão.

## Limitações

A projeção visual das patas livres não coincide necessariamente com a posição
interna de apoio calculada pelo motor. A transição para o contato é interpolada,
mas uma diferença breve ainda pode surgir quando o alvo muda muito rápido.
Fundos baseados em imagem, vídeo ou gradiente não permitem inferência
confiável de luminância por estilos computados. O gesto `activeTab` no perfil
pessoal do Chrome e o Opera GX requerem validação manual.
