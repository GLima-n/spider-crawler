# Decisões técnicas — Spider Inspector 0.1

## Referência e autoria

Inspeção em 08/10/2026 de https://github.com/cyohei9907/web-crawlers,
commit `2a15a2d7bc912abf095beca5bf4b429f4d90df32`. Foram lidos README,
PRIVACY, manifest, background, motor da demonstração e motor da extensão.
Nenhum arquivo LICENSE, COPYING ou NOTICE estava presente no checkout.
O README e a política de privacidade não concedem autorização explícita de reutilização.
Por isso, nenhum código, asset, CSS ou distribuição da referência foi incorporado.
O checkout ignorado `.reference/` serve apenas para estudo e execução local.

Crédito da referência: **cyohei9907**, inspirado no trabalho visual de **Slava Rybin (@rybinfx)**.
Esses créditos não implicam afiliação ou autorização dos autores.

Conceitos observados: pés presos a palavras, IK de dois segmentos, joelho com orientação
estável, passos alternados, liberação de apoios após deslocamentos de layout e efeitos
temporários isolados. A extensão de referência usa Range/segmentação de palavras e
Shadow DOM; a demonstração original também usa mutações na própria página.
Sua demo foi executada separadamente e capturada em `artifacts/reference.png`.

A implementação aqui usa a interseção geométrica de dois círculos para IK,
planejamento próprio, classificação semântica e uma máquina de estados ligada à coleta real.
Componentes reutilizáveis **conceitualmente**: apoios, alternância de passos, segmentação,
separação entre renderização e leituras de layout. Componentes copiados: **nenhum**.

## Arquitetura mínima

| Módulo | Responsabilidade |
|---|---|
| `src/extension/background` | Validar origem do popup e aba ativa; injetar no mundo isolado |
| `src/extension/content` | Ciclo de vida, agendamento, relatórios e coordenação |
| `src/extension/popup` | Modo, quantidade, intensidade, iniciar/pausar/recolher/exportar |
| `src/extension/panel` | Lista, destaque ao apontar, detalhes, correção manual e achados |
| `src/spider/engine` | Corpo, oito patas, apoios, estados, caminhada e contato |
| `src/shared/math` | IK de dois segmentos e geometria |
| `src/inspection/dom` | TreeWalker incremental, MutationObserver e cache de geometria |
| `src/inspection/classifier` | Categorias, confiança e evidências semânticas |
| `src/inspection` | Propriedades reais minimizadas e estrutura simplificada |
| `src/inspection/audit` | Verificações passivas com evidências e grau de certeza |
| `src/effects` e `src/effects/web` | Reações por componente, fios e teias |
| `src/overlay` | Canvas de viewport dentro de Shadow DOM fechado |

Vite gera um IIFE autocontido para injeção e módulos ES para popup/service worker.
Sem framework, código remoto, content script automático ou dependência de runtime externa.
O painel é lateral dentro do overlay, dispensando a permissão `sidePanel`.
Somente a área do painel recebe ponteiro; Canvas e restante do overlay deixam cliques passar.

## Movimento e inspeção

`IDLE → TARGETING → WALKING → APPROACHING → TOUCHING → [WEBBING] → INSPECTING → REPORTING → RESTING`.

Relatórios de componentes só surgem depois de contato e execução real de `inspect`.
Auditoria passiva também examina lotes limitados independentemente da caminhada para
encontrar conteúdo fora da viewport; isso produz achados, não inspeções fictícias.
O usuário pode enviar a aranha para um componente ou um achado pelo painel.
Não há rolagem automática, envio de formulário ou clique na aplicação.

Canvas mantém as representações transitórias. Texto é um eco visual de uma palavra,
não uma alteração da palavra original. Cards e botões usam superfícies/contornos
deformados e pressão localizada; imagens usam ondulações, sem leitura/cópia de pixels.
Menus recebem uma representação esquemática; não são abertos de verdade.
Teias possuem ancoragem no contato e origem que acompanha a aranha, expansão e dissipação.

## Desempenho e limites

- requestAnimationFrame com delta de simulação limitado a 50 ms; FPS medido pelo tempo real.
- Varredura incremental: até 100 nós por lote, alvo de 4 ms, no máximo 12.000 nós / 600 componentes.
- Auditoria: até cinco candidatos por lote, orçamento de 3 ms; repetição limitada.
- Cache geométrico renovado em scroll/resize/mutações e a cada 350 ms para layouts animados.
- Até 28 reações, nove teias e três aranhas; até 150 componentes visíveis na lista.
- Suspensão da animação em aba oculta. Reduced motion reduz velocidade/elevação e remove teias.
- Mudança da preferência de movimento pausa a sessão; reinicie para aplicar o novo perfil.

## Segurança e evolução

Somente `activeTab`, `scripting`, `storage`; preferências em `storage.local`, sem relatórios persistidos.
Relatórios ficam em memória até recolher/recarregar, exportados exclusivamente por ação do usuário.
Sem rede, cookies, tokens, valores de campos, HTML bruto, seletores, textos completos ou URLs completas.
O relatório inclui a origem do site e medidas técnicas; isso ainda pode revelar informação sobre a interface.
Nomes de fontes personalizados são omitidos. Mensagens e caminhos de erros são omitidos.

`AnalysisProvider` define um ponto de extensão para análise futura de relatório minimizado.
`ActiveAuditAdapter` exige um objeto explícito de autorização para ambiente de teste, mas
nenhum executor ativo está implementado. Uma integração futura deverá validar essa autorização
na interface e no executor; o tipo TypeScript isoladamente não é uma barreira de segurança.

## Fontes consultadas

- Referência: https://github.com/cyohei9907/web-crawlers
- Licenciamento de repositórios: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository
- activeTab: https://developer.chrome.com/docs/extensions/develop/concepts/activeTab
- Testes de extensões: https://playwright.dev/docs/chrome-extensions
