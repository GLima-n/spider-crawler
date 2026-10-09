# Spider Inspector

Extensão Chromium Manifest V3 para inspecionar interfaces com aranhas procedurais.
Oito patas articuladas, apoios reais, reações locais, teias e auditoria passiva.
Interface em português brasileiro. Todo processamento do produto é local.

O desenho B, aprovado na comparação visual, usa um abdômen elevado com sombras
em blocos, face escura com dois olhos azuis e oito patas preenchidas e segmentadas.
As cores se ajustam à superfície sob a aranha. Veja as capturas de comparação em
`artifacts/visual-compare-neutral.png`, `artifacts/spider-redesign-light.png`
e `artifacts/spider-redesign-dark.png`. A pose lateral das patas livres é
somente visual; os contatos em componentes mantêm as coordenadas reais.
Detalhes da comparação estão em `docs/REDESIGN.md`.

Para comparar no navegador, execute `npm.cmd run dev` e abra
`/preview/comparison.html` no endereço local indicado pelo Vite. O painel B usa
o mesmo renderer da extensão; C preserva o desenho anterior.

## Instalar no Google Chrome — Windows

1. Abra `chrome://extensions` no Chrome.
2. Ative **Modo do desenvolvedor** no canto superior direito.
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta **`dist`** deste projeto, que contém `manifest.json`.
5. Fixe **Spider Inspector** pelo ícone de extensões do Chrome.
6. Abra uma página HTTP/HTTPS própria ou autorizada, clique no ícone e em **Liberar aranhas**.

Não selecione a raiz do repositório: o código compilado está em `dist`.
O ZIP, quando disponível em `artifacts/spider-inspector-0.1.0.zip`, precisa ser extraído primeiro.
Não há publicação na Chrome Web Store nem instalação automática no seu perfil pessoal.

## Atualizar no Opera GX — Windows

Execute `npm.cmd run build` no projeto. Abra `opera://extensions`, ative **Modo do
desenvolvedor** e clique em **Recarregar** no cartão da extensão carregada sem
compactação a partir desta mesma pasta `dist`. Recarregue também a aba em inspeção
antes de liberar as aranhas novamente, para remover o script antigo da página.

Se ainda não estiver instalada no Opera GX, use **Carregar extensão sem compactação**
na mesma tela e selecione `dist`, a pasta que contém `manifest.json`.
Uma cópia extraída do ZIP deve ser atualizada no mesmo diretório de instalação
antes de usar **Recarregar**. [Instruções oficiais da Opera](https://help.opera.com/en/extensions/testing/).

## Usar

- **Explorar:** escolha uma a três aranhas e intensidade Suave, Normal ou Intensa.
- **Painel lateral:** passe o ponteiro nos itens para localizar a caixa na página;
  selecione um item para enviar a aranha. Detalhes surgem após contato e inspeção.
- **Corrigir classificação:** escolha o tipo no detalhe. A aranha faz uma nova inspeção.
- **Auditar:** verificações passivas em lotes; achados têm evidência, grau de certeza e sugestão.
  O botão **Investigar** direciona a aranha ao componente visível.
- **Pausar / Continuar:** interrompe e retoma o trabalho. **−** minimiza o painel.
- **Exportar JSON / Copiar resumo:** exportação local explícita. Exporte antes de recolher.
- **Recolher:** remove overlay, teias e marcadores, cancela animações, observers e listeners;
  descarta resultados em memória. A página continua utilizável.

Role a página para revelar novas superfícies. A extensão não rola nem abre menus automaticamente.
As aranhas exploram a área visível. Um componente fora dela precisa ser trazido à vista pelo usuário.

## Executar a demonstração

Pré-requisito: Node.js 22.12+ (validado com Node 24 no Windows).

```powershell
cd C:\Users\Gabriel\Pictures\spider-crawler
npm.cmd ci
npm.cmd run dev
```

Abra `http://127.0.0.1:5173`. Clique em **Liberar aranhas** ou **Auditar laboratório**.
Os botões da demonstração executam o mesmo motor na página para facilitar desenvolvimento.
Para validar a extensão, use o ícone do Chrome e não esses botões; evite duas sessões simultâneas.

A página contém texto, botões, cards, SVG, Canvas, tabela, formulário, menu e imagem local.
A seção **Outra superfície, a mesma curiosidade** permite conferir a aparência clara
da aranha sobre fundo escuro; as demais seções usam fundo claro.
As falhas deliberadas estão na seção **Pistas para a auditoria**: imagem quebrada/sem alt,
botão sem nome, campo sem label, link de fragmento inexistente, contraste baixo e controle encoberto.
Um campo de senha de teste serve para verificar a minimização do relatório.

No PowerShell, use `npm.cmd` / `npx.cmd` caso a política bloqueie scripts `.ps1`.

## Compilar e testar

```powershell
npm.cmd run build
npm.cmd run test:unit
npm.cmd test
npm.cmd run package
```

`build` verifica TypeScript e recompila o pacote em `dist`.
Os testes usam Chromium do Playwright e um perfil descartável; não usam seu perfil pessoal.
No Windows, o projeto detecta um Chromium já instalado no cache do Playwright.
Alternativamente defina `CHROMIUM_PATH` ou execute `npx.cmd playwright install chromium`.

O teste de extensão adiciona **somente a uma cópia temporária** a permissão de host
`http://127.0.0.1/*`, porque a automação não concede activeTab pelo clique humano na barra.
O manifesto entregue permanece sem host permissions. Verifique também o roteiro manual
em [docs/TESTES.md](docs/TESTES.md).

Relatórios, capturas e métricas: `artifacts/`. Relatório navegável de testes:
`npx.cmd playwright show-report artifacts/playwright-report`.

## Implementado

- Manifest V3, popup, injeção mediante ação, 1–3 aranhas, pausa, recolhimento e preferências locais.
- Corpo procedural com abdômen, oito patas, palpos, IK de dois segmentos, alternância e apoios.
- Máquina de estados ligada aos contatos e às inspeções reais.
- Ecos de palavras; pressão em botões; deformação de contorno/superfície em cards;
  teias em gráficos; foco simulado; ondulação em imagens; esquema de menu; ondas em células.
- Silk Thread, Web Capture e Web Inspection, com expansão, origem móvel e dissipação.
- Classificação em 12 tipos, confiança/evidências e correção manual.
- Dimensões, cores, tipografia, espaçamentos, estrutura, acessibilidade e indícios de tecnologias.
- JSON e resumo técnico; marcadores e evidências de auditoria passiva.
- Overlay em Shadow DOM fechado, limites de trabalho/efeitos, aba oculta e reduced motion.

## Limitações conhecidas

- Páginas `chrome://`, loja de extensões, PDF integrado, outros esquemas e frames protegidos
  não são compatíveis. Neste MVP, só o documento principal é examinado; Shadow DOM de terceiros
  e iframes, inclusive alguns acessíveis, ficam fora da amostra.
- Até 600 componentes / 12.000 nós; o painel lista os primeiros 150. Páginas grandes podem
  ter áreas fora da amostra. Geometria transformada usa caixas retangulares aproximadas.
- Dados são observações do DOM renderizado, não código-fonte original nem dados internos de gráficos.
  Identificação de frameworks é uma hipótese baseada em marcadores, nunca uma garantia.
- Imagens recebem ondulações desenhadas; não há distorção dos pixels originais.
  Cards são representações desenhadas; menus não abrem de verdade. O MVP não reconstrói
  visualmente todo o conteúdo de cada componente nem faz colisão física de corpos rígidos.
- Contraste só é calculado para cores opacas no próprio elemento. Transparências,
  gradientes, herança composta, acessibilidade complexa e causas de falhas exigem investigação.
  axe-core valida o popup nos testes; o auditor embarcado usa regras próprias parciais.
- Links não são visitados e não há testes de status HTTP. Erros JavaScript no mundo da página
  podem não chegar ao listener isolado; não existe interceptação de console/network.
- Teias/efeitos são limpos em scroll/resize; apoios muito deslocados são soltos.
  Mudança da preferência de movimento pausa a sessão; reinicie para aplicar o novo perfil.
- Pausar interrompe também a coleta incremental. Recolher/recarregar perde resultados não exportados.
- O painel recebe cliques apenas na sua própria área e pode ser minimizado.
  Sites que removem hosts externos, usam top layer/fullscreen ou alteram a raiz podem afetá-lo.
- Sem IA, auditoria ativa, screenshots de páginas ou transmissão de dados.
- FPS depende do site, resolução e máquina; as medições locais não são garantia universal.

## Referência e próximos passos

Referência estética/técnica: [web-crawlers, de cyohei9907](https://github.com/cyohei9907/web-crawlers),
inspirado em Slava Rybin. Não foi encontrada licença explícita no commit analisado;
este projeto implementa os conceitos independentemente e não incorpora código ou assets da referência.
Veja [decisões e análise](docs/DECISOES.md) e [privacidade](docs/PRIVACIDADE.md).

Próxima fase: cobertura de Shadow DOM aberto/frames autorizados; árvore de acessibilidade mais
completa; compositor de superfícies mais fiel; testes manuais em mais sites e resoluções;
executor Playwright explicitamente autorizado em ambiente de testes; integração opcional de IA
com consentimento e revisão do conteúdo enviado.
