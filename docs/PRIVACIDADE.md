# Privacidade e segurança

O MVP não possui servidores, telemetria, contas, modelos de IA ou código carregado remotamente.
A inspeção ocorre na aba em que o usuário aciona a extensão. Acesso é temporário via activeTab.
Frames, páginas internas e contextos inacessíveis não são contornados.

Lemos geometria, estilos, tags, estrutura e presença de nomes acessíveis. Não serializamos
valores de inputs, senhas, conteúdo editável, cookies, tokens, URLs de recursos,
identificadores DOM ou texto completo. Nomes acessíveis são registrados como presença/ausência.
O relatório contém a origem (protocolo e domínio), que o usuário deve considerar antes de compartilhar.
Propriedades visuais e contagens também podem revelar informações sobre a página.

Para efeitos de texto, uma palavra alfabética curta pode ser lida e desenhada transitoriamente
em memória, sem entrar no relatório. Campos editáveis e ancestrais marcados com
`data-private` / `data-sensitive` são excluídos desses ecos.

Configurações de modo, quantidade e intensidade são guardadas localmente pelo Chrome.
Resultados não são guardados em storage. Recolher ou recarregar descarta a sessão.
JSON e resumo técnico só saem da memória por exportação/cópia explícita do usuário.

A extensão nunca clica em controles da aplicação nem altera textos, valores ou estilos
dos elementos originais. Adiciona um único host de overlay e o remove ao recolher.
O link de download temporário existe apenas dentro do próprio Shadow DOM.

Dependências de desenvolvimento e testes são baixadas durante instalação do projeto;
não são serviços usados pela extensão em execução. axe-core roda nos testes do popup,
não é injetado automaticamente nas páginas auditadas pelo produto.
