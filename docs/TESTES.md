# Relatório de validação — 09/10/2026

## Opção B aprovada e integrada

Após aprovação visual do usuário, a pele B foi transferida da prévia para
`src/spider/appearance/shape.ts`. O painel B agora importa esse mesmo renderer;
o painel C usa uma cópia da versão anterior. A única alteração no motor foi
expor a fase do passo para a interpolação visual, sem alterar as equações IK.

Validação executada após a integração:

- `npm.cmd test`: **11/11 cenários Playwright aprovados**, aproximadamente 1,2 min;
  inclui a compilação TypeScript/Vite e a extensão MV3.
- `npm.cmd run test:unit`: **2/2 testes IK aprovados**.
- `node preview/capture-comparison.mjs`: oito patas, caminhada, contatos e
  inspeção em movimento normal e reduzido, sem erros de página. Na amostra:
  normal 34 passos/2 contatos/1 inspeção; reduzido 48 passos/2 contatos/1 inspeção.
- Capturas da comparação e da extensão real revistas nos dois temas:
  `visual-compare-neutral.png`, `visual-compare-neutral-dark.png`,
  `visual-compare-walk-dark.png`, `spider-redesign-light.png` e
  `spider-redesign-dark.png`, em `artifacts/`.
- Três aranhas, intensidade intensa, 3.000 nós adicionais, 600 candidatos:
  **59,33 FPS**, **3,69 ms** médios de trabalho JavaScript/quadro, 310 quadros.
- Três aranhas com movimento reduzido: **60,02 FPS**, **2,82 ms/quadro**, 193 quadros.

O custo de JavaScript ficou acima da medição histórica de 1,63 ms da pele
anterior. O FPS permaneceu próximo de 60 nesta amostra, mas isso não prova
equivalência de desempenho em outros dispositivos. Os testes foram feitos em
Chromium headless; o Opera GX e o gesto activeTab no perfil pessoal ainda
dependem do roteiro manual. A arte de referência não é incluída em `dist`.

## Histórico — validação de 08/10/2026

Os resultados abaixo pertencem às versões anteriores. Para a opção B, prevalecem
os números e capturas descritos acima.

## Correção de silhueta e proporções

A correção visual foi verificada primeiro em `preview/isolated.html`, com a mesma
rotina de desenho Canvas e o `solveIK` do projeto. A captura
`artifacts/preview-isolada-projecao.png` registra as versões clara e escura.
Depois da integração, `artifacts/spider-redesign-light.png` e
`artifacts/spider-redesign-dark.png` foram capturadas com a aranha caminhando
na demonstração. As duas poses foram comparadas à imagem aprovada: o corpo
está maior, o rosto não é mais um visor separado e as oito patas livres
descrevem arcos laterais. A semelhança continua limitada por uma simplificação
vetorial da arte original, descrita em `docs/REDESIGN.md`.

O motor de IK, os comprimentos, os passos e os eventos de contato não foram
alterados. A pele recebe apenas a indicação de pata ancorada para interpolar
o desenho até o ponto real de contato.

Na versão com interpolação e otimização de quadro, `npm.cmd test` executou
**11/11 cenários Playwright** e `npm.cmd run test:unit` executou **2/2 testes
de IK**. A última mudança apenas restaurou as cores discretas de estado;
TypeScript compilou e os cenários de aparência e produto foram repetidos.
Em Chromium headless, com três aranhas, intensidade Intensa e 3.000 nós
adicionais, a amostra registrou **59,45 FPS** e **1,63 ms** médios de trabalho
JavaScript por quadro. O custo médio do desenho anterior na mesma classe de
cenário foi 1,16 ms; a nova curva e projeção visual acrescentam custo, embora
o FPS observado permaneça próximo de 60 nesta máquina. As medidas não incluem
todo o custo de pintura/composição e não substituem teste em hardware variado.

## Ambiente e resultado

- Windows, Node.js `24.14.0`, npm `11.9.0`.
- Chromium headless `151.0.0.0`, cache Playwright `chromium-1234`.
- Contextos limpos e perfil exclusivo para teste da extensão.
- Viewport principal: 1440 × 1000 CSS px.
- `npm.cmd run build`: **aprovado**, TypeScript strict e três bundles Vite.
- `npm.cmd run test:unit`: **2 aprovados**, nenhum ignorado.
- Última execução de `npm.cmd test` após o redesign: **11 aprovados**, nenhum ignorado, aproximadamente 1,2 minuto.
- Relatório estruturado: `artifacts/tests.json`; HTML: `artifacts/playwright-report/index.html`.

## Cobertura executada

| Teste | Evidência validada | Resultado |
|---|---|---|
| IK alcançável | Comprimentos de ambos os segmentos em 48 direções e dois lados de joelho | Passou |
| IK degenerado | Ponto coincidente e alvo inalcançável, sem NaN | Passou |
| Aparência claro/escuro | Oito patas mantidas; corpo escuro no laboratório claro e claro na área escura; capturas do motor real | Passou |
| Histerese e pausa | Tom intermediário preserva o tema; limiares trocam o tema; três aranhas e amostragem congelada durante pausa | Passou |
| Console no laboratório | Nenhum erro de página ou console além do recurso quebrado intencional | Passou |
| Pacote MV3 | Service worker, popup real, duas aranhas, injeção isolada, pausa/recolhimento | Passou |
| CSP/rede/permissões | Página com `default-src 'none'`; zero novas requisições durante sessão; manifesto sem host permissions | Passou |
| Acessibilidade do popup | axe-core, regras com tags WCAG 2 A e AA; zero violações encontradas | Passou |
| Caminhada | Aranha presente, deslocamento, oito patas com coordenadas variáveis, passos e contatos | Passou |
| Reações/teias | Contatos em TEXT, BUTTON, CARD e CHART; teias aparecem e expiram | Passou |
| Inspeção/exportação | Inspeções após visita, medidas reais, estilos, contagens SVG e arquivo JSON baixado | Passou |
| Auditoria conhecida | Imagem quebrada, botão sem nome, campo sem label, fragmento ausente, contraste baixo | Passou |
| Integridade/privacidade | Texto original preservado, nenhum envio/clique automático de aplicação, senha ausente no relatório | Passou |
| Três aranhas/reduced motion | Três instâncias, novo elemento detectado, nenhuma teia com movimento reduzido, limites de efeitos | Passou |
| Referência | Demonstração original executada em checkout isolado e capturada | Passou |
| Painel real | Seleção, correção manual, resumo na área de transferência, minimização e recolhimento | Passou |
| Auditoria complementar | Conteúdo horizontalmente fora da viewport, controle encoberto, Canvas genérico não tratado como gráfico | Passou |
| DOM grande | 3.000 parágrafos adicionais, teto de 600 componentes e efeitos/teias limitados | Passou |

Algumas linhas pertencem ao mesmo cenário Playwright; são onze cenários, não dezoito testes independentes.
O teste do painel captura uma referência ao ShadowRoot fechado apenas na instrumentação da demonstração.
O código de produção mantém o Shadow DOM fechado; o teste MV3 valida a injeção no mundo isolado.

## Medições observadas

| Cenário | Frames na amostra | FPS observado | Trabalho médio de JS por frame |
|---|---:|---:|---:|
| Antes: 3 aranhas, intensidade intensa, +3.000 nós | 305 | 59,48 | 0,99 ms |
| Redesign: 3 aranhas, reduced motion, demonstração | 190 | 60,00 | 0,74 ms |
| Redesign: 3 aranhas, intensidade intensa, +3.000 nós, 600 componentes | 297 | 58,41 | 1,16 ms |

Arquivos brutos: `artifacts/performance.json` e `artifacts/performance-large.json`.
São amostras curtas de headless nesta máquina, sem equivalência a um benchmark universal.
O custo medido é o trabalho JavaScript do frame; não inclui todo o custo de composição/pintura da GPU.
No cenário grande, a diferença de 0,17 ms por frame é pequena em termos absolutos;
os FPS continuam próximos de 60 nesta amostra curta. A variação entre execuções
e dispositivos exige validação adicional antes de concluir equivalência universal.

## Falhas encontradas e corrigidas

1. PowerShell bloqueou `npm.ps1`: comandos documentados como `npm.cmd`.
2. Instalação de dependências e clone foram bloqueados pelo sandbox de rede;
   concluídos após a liberação solicitada pelo ambiente.
3. TypeScript rejeitou acesso às preferências não tipadas: aplicada tipagem explícita.
4. O teste de popup aberto como aba recebeu metadados `sender.tab`; o controlador passou
   a validar a URL exata do popup e a identidade da extensão, sem depender desse campo.
5. axe-core via tag inline foi bloqueado pela CSP: o teste passou a executá-lo por DevTools.
   Não foi adicionada autorização de inline/eval à extensão.
6. Vite tentou examinar o HTML de distribuição do popup como entrada de desenvolvimento;
   `optimizeDeps.entries` foi limitado à demonstração.
7. O laboratório gerava erro 404 para o favicon e apontava a ilustração para uma
   pasta incorreta; ambos os caminhos foram corrigidos. A imagem quebrada da
   seção de auditoria permanece intencional e é excluída do teste de console.

## Limite do teste automatizado de activeTab

O pacote de produção foi compilado e carregado em Chromium. Para automatizar o popup sem
um gesto real da barra de ferramentas, o teste cria uma cópia descartável em
`artifacts/extension-fixture-*` com permissão **somente** `http://127.0.0.1/*`.
O teste confirma que `dist/manifest.json` conserva apenas `activeTab`, `scripting`, `storage`.
Não foram usados `<all_urls>`, credenciais, perfis pessoais ou páginas externas de clientes.

O clique no ícone e a concessão de activeTab no Chrome de uso pessoal **não foram automatizados**.
Nenhuma instalação no perfil pessoal do usuário foi realizada. Execute o roteiro abaixo.

## Roteiro manual no Chrome

1. Carregue `dist` em `chrome://extensions` como descrito no README.
2. Execute `npm.cmd run dev` e abra `http://127.0.0.1:5173`.
3. Sem clicar nos botões da demonstração, abra o ícone da extensão.
4. Selecione Explorar, uma aranha, intensidade Normal e clique em Liberar aranhas.
5. Observe as oito patas, apoios e mudança de coordenadas do corpo. Verifique que links/botões
   da página continuam recebendo seus cliques fora da área do painel.
6. Aponte um item da lista para destacá-lo. Selecione um texto ou card e aguarde o contato.
   Confirme o detalhe com tag, medidas e estilos. Corrija a classificação e aguarde nova visita.
7. Role até o gráfico SVG e selecione o item CHART correspondente. Observe a teia nascer no contato,
   expandir e dissipar. Repita com o gráfico Canvas.
8. Exporte JSON e copie o resumo. Verifique que o valor `do-not-export-secret-123`, presente
   na senha fictícia da demonstração, não está no relatório.
9. Pause: corpo/patas param; continue: trabalho retoma. Minimize o painel com **−**.
10. Recolha: não deve restar o elemento `spider-inspector-overlay` no documento,
    nenhuma teia ou marcador. Botão de exemplo e formulário local continuam utilizáveis.
11. No popup, mude para Auditar e libere novamente. Role até as falhas intencionais;
    confirme evidências e graus de certeza, sem submissão automática.
12. Teste duas/três aranhas; alterne de aba; teste zoom, rolagem e redução de movimento do sistema.
    Visite a seção escura do laboratório: confirme corpo claro, duas luzes nos olhos
    e retorno ao corpo escuro em superfícies claras.
13. Em `chrome://version` e na loja de extensões, confirme a mensagem de incompatibilidade.
14. Em um site autorizado com layout diferente, repita os passos 4–10. Não interprete ausência
    de achados como prova de ausência de problemas.

## Artefatos

- `artifacts/explore.png`: aranha e overlay.
- `artifacts/chart-web.png`: contato e teia em gráfico real.
- `artifacts/audit.png`: auditoria na demonstração.
- `artifacts/extension-csp.png`: pacote MV3 sob CSP restritiva.
- `artifacts/popup.png`: popup da extensão carregada.
- `artifacts/reference.png`: referência executada separadamente, não redistribuída no pacote.
- `artifacts/report-example.json`: JSON produzido pela exportação do produto.
- `artifacts/popup-accessibility.json`: zero violações do axe-core no escopo executado.
- `artifacts/extension-validation.json`: permissões, isolamento e verificação de rede.
- `artifacts/spider-redesign-light.png` e `artifacts/spider-redesign-dark.png`:
  personagem real sobre duas superfícies, capturado em resolução dupla.

## Etapas entregues

| Etapa | Implementado e validado | Pendência explícita |
|---|---|---|
| 1 — Fundação | Pacote MV3, popup, injeção, overlay, CSP | Gesto activeTab no Chrome pessoal via roteiro manual |
| 2 — Aranha | Corpo, oito patas, IK, apoios, caminhada, pausa/recolhimento | Mais validação visual em layouts e resoluções variados |
| 3 — Interações | Texto, botão, card, gráfico e teias; demais tipos com reações próprias | Reconstrução visual mais fiel de superfícies e distorção de pixels |
| 4 — Inspeção | Classificação, painel, correção manual, dados reais, JSON/resumo | Frames, Shadow DOM de terceiros, paginação da amostra |
| 5 — Auditoria | Verificações passivas, evidências e marcadores | Acessibilidade completa, auditoria ativa e console da página |
| 6 — Validação | 11 cenários Playwright, 2 testes IK, axe-core, capturas e métricas | Matriz ampla de sites, Opera GX e teste manual do gesto na barra do Chrome |
