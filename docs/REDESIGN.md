# Redesign 2D/ASCII — validação visual

Direção: imagem `Concepção Visual do Spider Crawler.png` fornecida pelo usuário.
Somente o personagem foi traduzido para o Canvas. A imagem não foi copiada para o
produto, e seus painéis, textos e cenários não fazem parte da extensão.

## Mudanças

- `src/spider/appearance/index.ts`: corpo arredondado, cabeça frontal, dois olhos,
  oito patas com segmentos finos, articulações e pixels discretos; cores por estado.
- `src/spider/appearance/surface.ts`: estimativa de cor local, composição alfa,
  limiares com histerese e transição gradual. Sem leitura de estilos por frame.
- `src/spider/engine/index.ts`: renderização delegada, postura lateral limitada;
  apoios, passos, contatos e IK existentes continuam no motor.
- `index.html` e `src/demo.css`: nova área escura no laboratório para comparação.
- `tests/appearance.spec.ts`: adaptação claro/escuro, oito patas, histerese,
  pausa e capturas em resolução dupla.
- `README.md`, `docs/DECISOES.md`, `docs/TESTES.md`: orientações e resultados.

Checkpoint anterior: tag Git `pre-visual-redesign-2026-10-08` (commit `6f2a47e`).

## Capturas do motor real

| Fundo claro | Fundo escuro |
|---|---|
| ![Aranha com corpo escuro no laboratório claro](../artifacts/spider-redesign-light.png) | ![Aranha com corpo claro na superfície escura](../artifacts/spider-redesign-dark.png) |

As capturas foram tiradas durante a execução da aranha no laboratório, não de um mock.
A aparência usa traços vetoriais no Canvas e mantém legibilidade em tamanhos pequenos.

## Limites

Cor de fundo proveniente de imagem, vídeo ou gradiente não pode ser inferida com
precisão por estilos computados; o último tema confiável é mantido. Os contornos
permanecem visíveis, mas não garantem contraste em qualquer composição de pixels.
O rosto permanece frontal durante curvas para preservar os olhos e a silhueta.
O comportamento visual no Opera GX depende da versão instalada; a validação
automatizada desta entrega usa Chromium de Playwright.
