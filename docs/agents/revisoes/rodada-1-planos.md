# Rodada 1 — revisão independente dos planos e da navegação (DOC-03)

**Data:** 2026-11-09. **Escopo:** planos FE/UI e BE, INTEGRACAO, PLANO, índices e fluxo de entrada. O pacote de contrato ficou com outro revisor. Nada foi corrigido nesta rodada; este arquivo é o único escrito.

## Modelo e limite de atestação

O ambiente desta sessão se identifica como Claude Sonnet 5.5, ID `claude-sonnet-5-5`. Isso vem da declaração do ambiente do agente. Não há recibo independente do Orca ou da API que eu possa conferir daqui, então a atestação é "declarado pelo ambiente".

## Verificações executadas

| Comando (raiz da checkout) | Resultado | Limite |
|---|---|---|
| `node docs/agents/validar-documentacao.mjs` | exit 0: 43 documentos, 402 links locais, 15 pastas, 0 falhas | Só confere destinos de links e a presença das pastas no índice. Não confere âncoras, caminhos citados entre crases nem significado. |
| `git diff --check` | exit 0, sem erro de whitespace. Só avisos "LF will be replaced by CRLF" em 20 arquivos | Avisos de normalização, não falhas. Não prova conteúdo. |
| `py -3 docs/contratos/validar.py` (extra) | exit 0: 30 operações, referências internas, exemplos e fixtures | Validador documental. Não valida API em execução nem OpenAPI integral. `python` puro falha (alias da Microsoft Store), como o próprio pacote avisa. |
| Conferência manual de caminhos | Todo caminho existente citado nos planos FE existe. Os que não existem estão marcados "novo", "novos" ou "planejado". Rotas existentes em `app/`: as 10 do README mais `/laboratorio`, estados e `acesso-negado`, todas cobertas pelas linhas UI-02.01 a UI-02.12 | Feita por script e leitura. Não cobre as listas com chaves `{a,b}`. |

Não rodei build nem testes da aplicação, conforme o brief. Os scripts `test:e2e`, `start:dev`, `seed` e `migration:run` não existem hoje. `package.json` só tem `dev, build, start, lint, test, test:run, api, iniciar`. Os planos tratam esses scripts como futuros (INTEGRACAO.md:115, BE plano L37), então não há afirmação falsa de execução.

## Fontes examinadas

- Instruções e fluxo de entrada: `AGENTS.md`, `CLAUDE.md`, `README.md`, `docs/README.md`.
- Agentes e passagem de tarefa: `docs/agents/{README,MAPA,TAREFA,DOC-03-PLANEJAMENTO,HANDOFF-OANET}.md`, `docs/agents/revisoes/{README,brief-planos}.md`.
- Planos e integração: `docs/PLANO.md`, `docs/frontend/PLANO-IMPLEMENTACAO.md`, `docs/backend/PLANO-IMPLEMENTACAO.md`, `docs/INTEGRACAO.md`.
- Front e UI: `docs/UI.md` (cabeçalho), `docs/frontend/{TELAS,MIGRACAO}.md`, `DESIGN.md` (cabeçalho).
- Consultas pontuais: `docs/backend/{API,MODELO-DE-DADOS,REGRAS-DE-NEGOCIO}.md` (RN-40, tipos de Evento, paginação), `docs/contratos/README.md`.
- Código para checagem: `package.json`, `.env.example`, `lib/api.ts`, `app/(painel)/layout.tsx`, `app/(painel)/painel/page.tsx` e os imports das páginas do painel e do catálogo.
- Não li integralmente: a pesquisa `docs/research/2026-11-09-...`, `docs/frontend/ARQUITETURA.md`, `docs/backend/{ARQUITETURA,CENARIOS-DE-TESTE,SEED,DTOS,ESCOPO}.md` e `docs/contratos/openapi.json`. Nada que afirmo depende deles além do que cito.

## Veredito curto

**Um dev novo consegue começar a preparação do back (BE-01, BE-02, BE-03) e da infraestrutura do front (FE-00, FE-01) sem esperar o outro.** A ordem BE-01 → BE-12 e o grafo FE não têm ciclo. Os caminhos batem com os arquivos. P, B e A estão definidos com evidência mínima (INTEGRACAO §2). Os arquivos de ativação têm responsável.

**Ele não consegue ativar com segurança.** O roteiro de ativação por recurso (G1 a G8) não produz um estado integrado consistente, e G2 depende de uma rota que o gate não inclui (P-01, P-02). Dois documentos de entrada mandam um agente retomar a UI imediatamente, contra a suspensão (P-03). O que pode ser preparado de forma independente agora é descrito no fim.

## Achados

### P-01 — P1 — Não existe estado integrado entre G1 e G5: o cliente único e as páginas atuais não coexistem

**Onde:** `docs/INTEGRACAO.md` L60-62, L71 e L132; `docs/frontend/PLANO-IMPLEMENTACAO.md` L28, L84, L115, L125, L144; `docs/PLANO.md` L234-240 (marcos M1 e M3).

**Evidência:**
- FE-01 diz "Reescrever `lib/api.ts`" e "cliente HTTP único" (PLANO.md FE-01, FE plano L84). O cliente atual é uma única função com um único `API_URL` (`lib/api.ts:3-4`).
- INTEGRACAO §8 L132 proíbe flag no navegador, fallback silencioso e `NEXT_PUBLIC_API_URL`. FE plano L28 admite que trocar só `API_URL` não converte o contrato do json-server no do Nest.
- Cada gate ativa um recurso por vez: G1 transporte, G2 sessão, G3 domínio público, G4 ocorrência básica, G5 ciclo de vida. Ao mesmo tempo, INTEGRACAO L71 diz "não publicar branch intermediária com cliente de envelope novo e services ainda esperando arrays json-server".
- Páginas que já existem hoje juntam recursos que os gates separam:
  - `app/(painel)/painel/page.tsx` (Resumo) chama `listarOcorrencias`, `listarSetores` e `listarLanternas` e conta tudo em `BarraStatus`. Com a lista paginada da API (`limite` padrão 20, máximo 50, `API.md` L33), a barra contaria só a primeira página, **em silêncio**. O Resumo só é trocado pelo dashboard em FE-07 e G7.
  - O detalhe da ocorrência já contém `FormStatus`, e existe a rota atribuir. Eles precisam de `PATCH /status` e `/responsavel`, que só chegam em G5. Ativar G4 sozinho quebra as ações que a tela tem hoje.
  - Depois de G2 (JWT, `/auth/me`), as páginas ainda dependentes do json-server ficam com `criadoPor` e `responsavelId` em formato incompatível com os ids de usuário da API.
- Os marcos M1 (login real) e M3 (ocorrências) em PLANO.md L234 e seguintes apresentam a ativação como progressiva, mas sem estado intermediário que funcione.

**Impacto:** o integrador que seguir INTEGRACAO §3 ao pé da letra, ativando G1, G2, G3 e G4 em sequência, publica uma aplicação que quebra páginas já existentes ou mostra contagens erradas. Os gates não dizem qual combinação mínima precisa ser ativada junta. Isso torna a regra "A só no estado combinado" (INTEGRACAO L110) inexequível.

**Correção verificável:**
1. Em INTEGRACAO §3, definir a primeira ativação integrada como um bloco único. Mínimo coerente: G1 a G5 mais a troca do Resumo, ou seja, FE-01 a FE-05 e a parte do FE-07 que substitui o Resumo.
2. G6, G7 parcial e G8 passam a ser aditivos, porque só criam rotas novas.
3. Ou, alternativamente, adotar um adaptador temporário explícito (`lib/legado/*`) com prazo de remoção em FE-09, e registrá-lo com dono e arquivos.
4. Reescrever o texto dos marcos M1 e M3 de acordo.
5. Critério de aceite: a tabela de gates tem uma coluna "ativa junto com" e nenhuma linha deixa uma página existente sem endpoint real.

### P-02 — P1 — G2 e FE-02 exigem a lista de Setores (BE-05), mas o gate e a dependência não a incluem

**Onde:** `docs/INTEGRACAO.md` L62; `docs/frontend/PLANO-IMPLEMENTACAO.md` L94 e L96-101; `docs/backend/PLANO-IMPLEMENTACAO.md` L19 (ordem BE-03 → BE-07a → BE-05); `docs/frontend/TELAS.md` (linha do Cadastro).

**Evidência:**
- TELAS descreve o Cadastro com "Nome, e-mail, senha e Setor" e a Setor vem da escolha do usuário.
- FE-02 A depende de "BE-03, seed mínimo BE-07a e G2". G2 fornece "BE-02/03/07a". O endpoint `GET /setores` é BE-05, que fica depois do seed mínimo na ordem do BE (L19) e pertence a G3.
- Nenhuma bolinha de FE-02 (L96-99) menciona de onde vem a lista de Setores do formulário de cadastro. `lib/setores.ts` hoje fala com o json-server.
- BE-03 diz "Cadastro verifica Setor por persistência existente" (BE plano L65), então o provedor funciona em teste. O consumidor não tem de onde ler os Setores em G2.

**Impacto:** o aceite de G2 ("Cadastro cria L e leva ao login", INTEGRACAO L62) não pode ser demonstrado no navegador. Ou o formulário usa uma lista fixa (o que o plano proíbe: dado inventado), ou usa o json-server (o que P-01 mostra ser incompatível), ou G2 só fecha depois de BE-05.

**Correção verificável:** adicionar BE-05 (leitura pública de Setores) como pré-condição de FE-02 A e do gate G2, ou mover o Cadastro para G3. Em FE-02, acrescentar o passo "origem da lista de Setores no cadastro" e um teste de consumidor com o fake devolvendo `GET /setores`. Conferir que INTEGRACAO §3 e PLANO.md (FE-02) citam a mesma dependência.

### P-03 — P1 — Quatro documentos de entrada ainda mandam retomar a UI imediatamente

**Onde:** `AGENTS.md` L24; `docs/agents/HANDOFF-OANET.md` L30-33, L91 ("começar agora"), L157-160; `DESIGN.md` L5; `docs/frontend/MIGRACAO.md` L8.

**Evidência:**
- `AGENTS.md` (seção UI oficial): "Para continuar a migração, comece pelo handoff OANET".
- `HANDOFF-OANET.md`: o cabeçalho (L4) diz que a implementação está suspensa. O corpo continua: "O pedido de handoff autoriza começar a implementação, sem nova aprovação" (L30), "Primeiro incremento: UI-01 (começar agora)" (L91), "O prompt entregue pelo Orca autoriza o receptor a implementar UI-01 imediatamente" e "Não aguardar outro briefing nem pedir novamente aprovação" (L157-160). O receptor nomeado é um agente Codex específico, já substituído nesta tarefa.
- `DESIGN.md` L5: "A migração começa pelo handoff". `MIGRACAO.md` L8: a UI "pode começar agora".
- Em contraste, `docs/README.md` L14 ("retomar apenas após a tarefa documental"), `DOC-03` e `PLANO.md` corretamente dizem que a conclusão da DOC-03 não retoma a implementação.
- `AGENTS.md` é o ponto de entrada de todo agente. A leitura "comece pelo handoff" leva direto às frases de autorização do corpo.

**Impacto:** um agente novo que siga AGENTS.md, leia o handoff e obedeça o corpo inicia UI-01 contra a suspensão pedida pelo usuário. É exatamente a "retomada automática de UI" que o brief pede para verificar. O cabeçalho do handoff é a única proteção, e vem antes de instruções que dizem o contrário.

**Correção verificável:**
- No `AGENTS.md`, trocar "comece pelo handoff" por "depois de autorizado pelo usuário, retome conforme o plano FE (UI-01)".
- No `HANDOFF-OANET.md`, marcar L30-33, L91 e L157-160 como "histórico da transferência, sem efeito" e remover a identificação do receptor.
- Em `DESIGN.md` L5 e `MIGRACAO.md` L8, apontar para o plano em vez de autorizar.
- Teste de aceite: `grep -rnE "começar agora|imediatamente|comece pelo" AGENTS.md DESIGN.md docs/agents docs/frontend` não deve devolver nenhuma frase operacional.

### P-04 — P2 — FE-04 a FE-08 e FE-02 editam as mesmas páginas das linhas UI-02 sem declarar a dependência; a regra de branch cria duas linhas de mudança nos mesmos arquivos

**Onde:** `docs/frontend/PLANO-IMPLEMENTACAO.md` L28, L54-67, L94, L115, L125, L144, L153; `docs/INTEGRACAO.md` L60.

**Evidência:**
- FE-03 declara "Depende P: FE-02 e UI-02.04/05" (L105). FE-04, FE-05, FE-06, FE-07 e FE-08 não citam nenhuma linha UI-02, mas editam os mesmos arquivos:
  - FE-04: `FiltroOcorrencias.tsx`, `FormOcorrencia.tsx` e as páginas de lista, nova e detalhe, que são os arquivos de UI-02.07 e UI-02.08.
  - FE-05: `FormStatus.tsx` e `FormAtribuir.tsx` (UI-02.09 e UI-02.10).
  - FE-07: `app/(painel)/painel/page.tsx` (UI-02.06).
  - FE-02: `FormLogin.tsx`, `actions.ts` do login e os layouts (UI-02.03 e UI-01).
- FE plano L28 manda manter a preparação "em branch própria" enquanto UI-01 e UI-02 seguem na "branch de demonstração atual". INTEGRACAO G0 (L60) diz que UI-02 "não bloqueia a preparação de HTTP", o que contradiz a dependência de FE-03 em UI-02.04/05.

**Impacto:** o dev front (que acumula UI-02 e FE) mantém, em paralelo, duas branches que reescrevem os mesmos componentes. O merge das duas é conflito certo, e o plano não diz qual vence nem em que ordem. Além disso, "um responsável por arquivo por tarefa" é violado ao longo do tempo para esses arquivos.

**Correção verificável:** em cada FE-xx que toca página ou formulário com linha UI-02, acrescentar "depende P: UI-02.xx" ou "rebase sobre UI-02.xx", ou declarar que FE-xx assume o arquivo depois de UI-02.xx entregue. Em INTEGRACAO G0, remover a frase que contradiz FE-03 ou ajustá-la. Em FE plano L28, definir uma única branch base (UI-02 mergeada em `main` antes de rebasear a preparação FE) ou uma regra de ordem de merge.

### P-05 — P2 — Componentes compartilhados usados pelas páginas reais não têm responsável em nenhuma linha UI-02

**Onde:** `docs/frontend/PLANO-IMPLEMENTACAO.md` L54-67 e L21; `docs/frontend/MIGRACAO.md`; testes em `__tests__/components/{compartilhados,ui,navegacao,marca,dados}.test.tsx`.

**Evidência:** as páginas reais importam `CabecalhoPagina`, `TabelaOcorrencias`, `BarraStatus`, `BadgeStatus`, `BadgeGravidade`, `LinkVoltar` e `components/ui/button` (imports de `painel/page.tsx`, `ocorrencias/page.tsx`, `ocorrencias/[id]/page.tsx` e `lanternas/page.tsx`). As linhas UI-02.06 a UI-02.10 mandam compor `MolduraOa`, `BotaoOa` e `SeloOa`, mas só atribuem as páginas e os `_components` locais. `TabelaOcorrencias`, `BadgeStatus`, `CabecalhoPagina` e os demais ficam sem dono, e o plano não diz se serão trocados, mantidos ou removidos. `MenuNavegacao.tsx` e `Marca.tsx` também ficam sem destino. Os testes que cobrem esses componentes não aparecem em nenhuma linha.

**Impacto:** quem migra Ocorrências precisa decidir sozinho se edita `TabelaOcorrencias` (compartilhado com o Resumo). Duas tarefas podem editar o mesmo arquivo, ou ficar um mix de design antigo e novo. O aceite de UI-02 "nenhuma rota usa o design antigo como referência" (PLANO.md) não pode ser verificado sem o inventário.

**Correção verificável:** acrescentar em UI-02 uma linha de "componentes compartilhados" com dono, arquivos (`components/*.tsx`, `components/ui/*`), destino (substituir, adaptar ou remover) e testes. Teste de aceite: `grep -rl "from '@/components/\(TabelaOcorrencias\|BadgeStatus\|CabecalhoPagina\)" app` vazio, ou lista deliberada dos que permanecem.

### P-06 — P2 — "Contrato v1 aceito" é pré-condição de FE-00 e BE-01, mas não há definição de aceite

**Onde:** `docs/frontend/PLANO-IMPLEMENTACAO.md` L73; `docs/backend/PLANO-IMPLEMENTACAO.md` L43; `docs/PLANO.md` L106 e L168; `docs/INTEGRACAO.md` L37; `docs/contratos/README.md` L65-67.

**Evidência:** quatro documentos usam "contrato v1 aceito" como primeira dependência de ambas as frentes. O README dos contratos trata de versionamento (L65-67), mas nenhum documento diz quem aceita, em que registro, com que hash ou versão e que condição fecha a rodada de revisão. `revisoes/README.md` prevê "Rodada 2 — correções" sem dizer que a rodada encerra com o aceite.

**Impacto:** os dois devs não têm sinal único de que podem começar. Pode um começar sobre um contrato que o outro ainda considera em revisão. Os registros P/B/A pedem `info.version` e SHA-256 (INTEGRACAO L36), então a ausência de um valor "aceito" quebra a rastreabilidade desde o primeiro dia.

**Correção verificável:** acrescentar a INTEGRACAO §2 um passo "G-1 — contrato aceito" com: responsável, registro (o modelo TAREFA), `info.version` e SHA-256 gravados, critério (rodada 2 sem P0/P1 abertos, `validar.py` com exit 0) e quem assina de cada lado. FE-00 e BE-01 passam a citar G-1.

### P-07 — P2 — Os ensaios de G2 a G8 exigem dados que nenhuma tarefa fornece (contas L2814/L674, ocorrências vencidas, relógio fixo)

**Onde:** `docs/INTEGRACAO.md` L77-91; `docs/frontend/PLANO-IMPLEMENTACAO.md` L175 e L149; `docs/backend/PLANO-IMPLEMENTACAO.md` BE-07a (seed mínimo), BE-07c e BE-12.

**Evidência:**
- INTEGRACAO §4 exige, no estado combinado: contas L2814 e L674 em setores distintos com fichas vinculadas, Lanterna sem ficha, ocorrências "vencida e no limite exato; relógio fixo", Setor `0`.
- BE-07a cria só Setores verificados e um Guardião. BE-07c cria dados relativos à data de execução e é descrito como "não substitui fixture determinística" (INTEGRACAO L91; BE-07c Aceite).
- FE-10 (L175) manda "criar contas/dados via fixture de teste ... sem depender do seed demonstrativo", mas nenhuma tarefa BE entrega esse mecanismo (comando, rota de teste ou script). INTEGRACAO L81 também proíbe rota pública de bootstrap. BE-12 só diz "expor evidências por recurso ao front".
- Contas e vínculos podem ser criados pela API real, partindo do Guardião do seed mínimo (cadastro, `POST /setores`, vínculo). Ocorrência vencida ou no limite exato **não pode**: a API não aceita data de criação do cliente, e não há relógio injetável no processo iniciado pelo E2E.

**Impacto:** FE-07 ("métricas correspondem à fixture conhecida", L149) e INTEGRACAO §4 (Prazo no limite exato) não têm como ser demonstrados no estado combinado. O front fica sem como validar o que o plano manda validar.

**Correção verificável:** acrescentar a BE-12 (ou BE-07) a entrega "fixture de integração": um comando documentado de teste (por exemplo, script `seed:teste` com instante de referência fixo e ids estáveis) que carrega as contas e ocorrências de INTEGRACAO §4, ou um relógio configurável só em ambiente de teste. FE-10 e INTEGRACAO §4 passam a citar o comando. Declarar o que fica coberto só no teste do provedor (limite exato do Prazo).

### P-08 — P2 — Critério de remoção do json-server diverge e o do PLANO é inatingível; a regex da INTEGRACAO omite `scripts/`

**Onde:** `docs/PLANO.md` L212; `docs/frontend/PLANO-IMPLEMENTACAO.md` L169; `docs/INTEGRACAO.md` L126.

**Evidência:** PLANO.md L212: "`grep` por `json-server` e `db.json` fora de `docs/` não acha nada". FE plano L169 usa `rg -n 'json-server|db\.json' app lib components __tests__ scripts package.json`. INTEGRACAO L126 usa `app lib components __tests__ package.json`, sem `scripts`, e escreve "conferir scripts/ se ainda existir". Hoje, fora de `docs/`, a string aparece em `AGENTS.md`, `README.md`, `package-lock.json`, `package.json`, `scripts/iniciar.sh`, `tsconfig.tsbuildinfo`, `.claude/skills/frontend-web/references/removidas.md` e em seis arquivos de teste (resultado de `grep -rIl`). O critério do PLANO falharia por README, AGENTS.md, lockfile, histórico da skill e `tsbuildinfo` (artefato gerado), mesmo com tudo removido.

**Impacto:** o fechamento de FE-09 pode ser dado como cumprido ou reprovado conforme o documento que o integrador ler. A condição de saída da tarefa mais destrutiva do plano está ambígua.

**Correção verificável:** adotar um único comando em FE-09 (o do FE plano, com caminhos explícitos) e referenciá-lo de PLANO.md e INTEGRACAO.md. Listar à parte onde a menção pode permanecer (documentação histórica, `removidas.md`) e que `package-lock.json` é conferido por `npm ls json-server`. Oferecer o equivalente em PowerShell (`Select-String`), já que o `rg` não é garantido na máquina do dev.

### P-09 — P2 — INTEGRACAO manda transportar "assets OANET locais" que já estão rastreados, e não trata os documentos DOC-03 que ainda são só locais

**Onde:** `docs/INTEGRACAO.md` L37; `docs/agents/README.md` L156; `docs/agents/DOC-03-PLANEJAMENTO.md` (base observada).

**Evidência:** `git ls-files components/oanet` lista os arquivos; o commit `5377e39` incorporou o pacote e a casca. O `git status` atual mostra como não rastreados exatamente os entregáveis da DOC-03: `docs/INTEGRACAO.md`, `docs/contratos/`, os dois `PLANO-IMPLEMENTACAO.md`, `docs/agents/validar-documentacao.mjs`, `docs/agents/revisoes/` e a pesquisa; mais 21 arquivos modificados. INTEGRACAO L37 pede "primeiro merge do pacote contratual aceito", mas esse merge não leva os dois planos, o validador e as edições de `AGENTS.md`/`README.md`. Uma worktree criada a partir do HEAD não terá nenhum deles, apesar de `AGENTS.md` e `README.md` já apontarem para eles.

**Impacto:** o segundo dev, ao criar a worktree da base comum, abre links que não existem. O texto de "assets locais" induz a erro: os assets já estão no HEAD e o que falta é a documentação.

**Correção verificável:** reescrever o passo para listar a base mínima rastreável (contrato, os dois planos, INTEGRACAO, índices, `validar-documentacao.mjs`) e o critério `git status --short` sem `??` nesses caminhos antes de criar worktrees. Registrar que o commit depende de autorização do usuário (esta tarefa não commita). Atualizar `agents/README.md` L156 no mesmo sentido.

### P-10 — P3 — BE-09 não lista o Evento `atribuida` nem o critério de aceite correspondente

**Onde:** `docs/backend/PLANO-IMPLEMENTACAO.md` L138 e Aceite de BE-09; `docs/backend/REGRAS-DE-NEGOCIO.md` RN-40 (L73); `docs/backend/API.md` L129.

**Evidência:** RN-40 inclui "atribuição" entre as mutações que geram Evento, e API.md/MODELO-DE-DADOS definem o tipo `atribuida` (com `de/para` anuláveis, inclusive liberar com `null`). BE-09 L138 enumera só `status_alterado`, `resolvida` e `reaberta`, e o aceite não verifica Evento de atribuição nem de liberação.

**Impacto:** a atribuição pode ser entregue sem Evento e sem teste que acuse a omissão. A timeline de FE-06 mostraria atribuições ausentes.

**Correção verificável:** acrescentar `atribuida` ao bullet de L138 e ao aceite de BE-09, com casos de atribuir, reatribuir e liberar (`null`), inclusive a falha injetada no Evento.

### P-11 — P3 — Navegação por papel (links de Minha fila, Gestão, Cadastro) não tem arquivo atribuído

**Onde:** `docs/frontend/PLANO-IMPLEMENTACAO.md` L94, L144, L153; `docs/frontend/TELAS.md` (seção Navegação); `app/(painel)/layout.tsx` (três links fixos para todos os papéis).

**Evidência:** TELAS define links distintos por papel (Lanterna: Minha fila; Guardião: Lanternas (gestão), Setores, Usuários; visitante: Cadastrar). O layout atual declara `LINKS_PAINEL` com três itens iguais para ambos os papéis. FE-07 cita "casca/navegação" como arquivo existente, FE-08 "navegação OANET" e FE-02 "layouts", sem caminho exato nem responsável.

**Impacto:** três tarefas podem editar `app/(painel)/layout.tsx` e `app/(site)/layout.tsx`, arquivos de UI-01, sem que o plano diga quem. Risco de conflito e de links ausentes passarem no teste de aceite de cada rota.

**Correção verificável:** nomear `app/(painel)/layout.tsx`, `app/(site)/layout.tsx` e `__tests__/components/casca-oanet.test.tsx` em FE-02, FE-07 e FE-08, com um teste "links por papel" no aceite de cada uma.

### P-12 — P3 — Aceite de G8 depende de dados de Ocorrência que G8 não fornece

**Onde:** `docs/INTEGRACAO.md` L68 e L71; `docs/frontend/PLANO-IMPLEMENTACAO.md` L159.

**Evidência:** G8 lista BE-04/05/06 como fornecedor, e INTEGRACAO L71 permite integrar G8 logo após G3. O aceite inclui `SETOR_EM_USO` e `LANTERNA_EM_USO` por Ocorrência histórica ou excluída, o que exige ocorrências criadas, ou seja BE-08 e FE-04.

**Impacto:** no estado combinado de G8 antecipado, esses dois casos ficam sem como ser exercitados. Só o teste do provedor (B, com fixtures por repository) os cobre.

**Correção verificável:** marcar esses dois casos em G8 como "provados em B; em A só depois de G4", ou mover o fechamento deles para G9.

## Sugestões (não bloqueiam)

- **S-01.** Em INTEGRACAO §3, repetir como critério de todo gate A a matriz de navegador (375 px, tablet, desktop, teclado, movimento reduzido), já escrita no ciclo do FE plano L35. Hoje a tabela de gates exige "sucesso e erro" e ausência de segredos (L56), mas só o ciclo do FE cobre a parte visual. Evita que A seja marcado só com os testes de API.
- **S-02.** INTEGRACAO §8 fala em "backup do banco real" e "produção". Nenhum documento define ambiente de produção. Para um trabalho de curso, vale dizer em uma frase que o rollback é reverter o merge de integração e restaurar o arquivo SQLite da demonstração, e que "produção" aqui é a demonstração.
- **S-03.** `.env.local` é arquivo único da checkout compartilhada. Os documentos mandam ajustar `API_URL` "só no ambiente local da tarefa" (agents/README L179-181). Dizer explicitamente "variável de processo, sem editar `.env.local`", para dois agentes não se sobreporem.
- **S-04.** `package.json` aparece com donos diferentes: INTEGRACAO L26 dá a "Dev front em FE-00/09", e FE plano L163 dá a "integrador". Alinhar o texto; hoje os dois são a mesma pessoa em dupla, mas o registro por tarefa pede um nome.
- **S-05.** FE-00 instala Playwright. `npm install` não baixa os navegadores; acrescentar o passo de instalação dos navegadores e quem o autoriza, já que é rede e disco fora de `package.json`.
- **S-06.** A remoção de `lib/sessao.ts` e `lib/usuarios.ts` (FE-02 L99) não cita o teste `__tests__/lib/sessao.test.ts`, que existe e importa o módulo. Incluí-lo na lista de arquivos de FE-02.

## O que o dev novo consegue fazer

| Pode começar agora, sem o outro | Precisa de correção antes | Depende do estado integrado |
|---|---|---|
| BE-01, BE-02, BE-03 e BE-07a (só `backend/`, banco isolado) | Definir "contrato aceito" (P-06) | Qualquer marcação A (P-01, P-02) |
| FE-00 (fake HTTP e infraestrutura), FE-01 (cliente) | Resolver a ordem UI-02 versus FE (P-04) | Dados de integração (P-07) |
| UI-02, depois da autorização do usuário para retomar a UI, e das correções P-03 e P-05 | Retirar as instruções de retomada imediata (P-03) | Remoção do json-server (FE-09) e E2E real (FE-10) |
| BE-04 a BE-12 em ordem, com fixtures próprias | Acrescentar `atribuida` em BE-09 (P-10) | |

A leitura de entrada está viável: `AGENTS.md` leva a `docs/agents/README.md`, depois a `docs/README.md`, com tabela de leitura por papel. Não encontrei referência circular que impeça a leitura. Cada plano abre com uma lista de 10 a 15 documentos, mas pede só o que a tarefa exige. Histórico (superpowers, DESIGN.md, design/oanet) está rotulado como histórico, exceto pelos trechos de P-03.

## Pontos verificados sem achado

- Ordem do BE (L19): sem ciclo, e BE-03 usa repositórios de BE-02 sem depender de endpoints de Setores. BE-02 já inclui a consulta de carga que BE-06 e BE-08 usam.
- Evento desde a primeira mutação: BE-08 cria o gravador transacional e a criação já grava `criada` (RN-40). A leitura fica em BE-10.
- Seed: BE-07a (mínimo) após BE-03; BE-07b após BE-06; BE-07c após BE-09/10. Nenhum seed exige abrir rota nem desligar o guard.
- Limites: nenhum plano autoriza commit, push ou instalação. DOC-03 declara que a conclusão não retoma a implementação (`PLANO.md` DOC-03). Os planos tratam scripts novos como futuros.
- Dados: `db.json` aparece como fixture lida por seis testes; os planos mandam usar cópia isolada para escrita (INTEGRACAO L90; agents/README L173-178).
- Pastas: as 15 pastas de `docs/` estão descritas em `docs/README.md` e no README raiz. O validador as cobre.
