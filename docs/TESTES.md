# Relatório de validação — 08/10/2026

## Ambiente e resultado

- Windows, Node.js `24.14.0`, npm `11.9.0`.
- Chromium headless `151.0.0.0`, cache Playwright `chromium-1234`.
- Contextos limpos e perfil exclusivo para teste da extensão.
- Viewport principal: 1440 × 1000 CSS px.
- `npm.cmd run build`: **aprovado**, TypeScript strict e três bundles Vite.
- `npm.cmd run test:unit`: **2 aprovados**, nenhum ignorado.
- Última execução de `npm.cmd test`: **9 aprovados**, nenhum ignorado, aproximadamente 1,1 minuto.
- Relatório estruturado: `artifacts/tests.json`; HTML: `artifacts/playwright-report/index.html`.

## Cobertura executada

| Teste | Evidência validada | Resultado |
|---|---|---|
| IK alcançável | Comprimentos de ambos os segmentos em 48 direções e dois lados de joelho | Passou |
| IK degenerado | Ponto coincidente e alvo inalcançável, sem NaN | Passou |
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

Algumas linhas pertencem ao mesmo cenário Playwright; são nove cenários, não quinze testes independentes.
O teste do painel captura uma referência ao ShadowRoot fechado apenas na instrumentação da demonstração.
O código de produção mantém o Shadow DOM fechado; o teste MV3 valida a injeção no mundo isolado.

## Medições observadas

| Cenário | Frames na amostra | FPS observado | Trabalho médio de JS por frame |
|---|---:|---:|---:|
| 3 aranhas, reduced motion, demonstração | 192 | 60,43 | 0,60 ms |
| 3 aranhas, intensidade intensa, +3.000 nós, 600 componentes amostrados | 305 | 59,48 | 0,99 ms |

Arquivos brutos: `artifacts/performance.json` e `artifacts/performance-large.json`.
São amostras curtas de headless nesta máquina, sem equivalência a um benchmark universal.
O custo medido é o trabalho JavaScript do frame; não inclui todo o custo de composição/pintura da GPU.

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

## Etapas entregues

| Etapa | Implementado e validado | Pendência explícita |
|---|---|---|
| 1 — Fundação | Pacote MV3, popup, injeção, overlay, CSP | Gesto activeTab no Chrome pessoal via roteiro manual |
| 2 — Aranha | Corpo, oito patas, IK, apoios, caminhada, pausa/recolhimento | Mais validação visual em layouts e resoluções variados |
| 3 — Interações | Texto, botão, card, gráfico e teias; demais tipos com reações próprias | Reconstrução visual mais fiel de superfícies e distorção de pixels |
| 4 — Inspeção | Classificação, painel, correção manual, dados reais, JSON/resumo | Frames, Shadow DOM de terceiros, paginação da amostra |
| 5 — Auditoria | Verificações passivas, evidências e marcadores | Acessibilidade completa, auditoria ativa e console da página |
| 6 — Validação | 9 cenários Playwright, 2 testes IK, axe-core, capturas e métricas | Matriz ampla de sites e teste manual do gesto na barra do Chrome |
