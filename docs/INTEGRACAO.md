# Integração entre front-end e back-end

**Estado (2026-11-11):** procedimento para duas pessoas. A pausa da DOC-03 terminou. O **back-end NestJS está implementado** em `backend/` (BE-01 a BE-12, com a fixture de integração BE-FX e o comando `fixture:integracao`) e foi auditado contra o contrato em 2026-11-11 ([relatórios](relatorios/README.md)). O **Corte 1 e os aditivos G6, G7b e G8 foram ativados (A) em 2026-11-11**: o front usa a API real pelo cliente HTTP único e pela sessão JWT, com o registro em §3 ([Registro de ativação A](#registro-de-ativação-a--corte-1-e-aditivos)). Restam FE-09 (remoção do json-server e do `db.json`) e FE-10/G9. Aprovação visual do laboratório não prova integração de rotas. O hash G-1 foi reconferido em 2026-11-11 (revisão 2, em §2): o gate G-9 do back deixa de aguardar o registro.

**Resultado:** front e back trabalham em branches separadas, sobre a mesma revisão contratual, e combinam os recursos reais em **um primeiro corte integrado único** (Corte 1, §3), seguido de recursos aditivos. Os detalhes executáveis de cada lado estão no [plano front](frontend/PLANO-IMPLEMENTACAO.md) e [plano back](backend/PLANO-IMPLEMENTACAO.md); a visão de sequência fica em [PLANO](PLANO.md).

## 1. Fontes e papéis

| Assunto | Fonte de autoridade | Uso na integração |
|---|---|---|
| Política de produto/regras | [ESCOPO](backend/ESCOPO.md), ADRs, [regras RN](backend/REGRAS-DE-NEGOCIO.md) | Resolver intenção sem inventar permissões/estados novos. |
| HTTP | [API](backend/API.md), [DTOs](backend/DTOS.md) | Método, rota, acesso, envelope, código e formato; divergência é corrigida antes da liberação. |
| Formato verificável/exemplos | [pacote contratual](contratos/README.md), `docs/contratos/openapi.json`, `docs/contratos/exemplos/cenarios.json` | Validar consumidor/provedor contra a mesma versão; exemplos não substituem regras RN. |
| Visual | [UI](UI.md) | OANET, componentes/vetores/tokens/movimento; dados-demo só na vitrine. |
| Código atual e caminhos | [MAPA](agents/MAPA.md) e arquivos existentes | Confirmar assinaturas antes de editar. |
| Registro e evidência | [TAREFA](agents/TAREFA.md) | Base, responsáveis, comandos, resultados e próximo passo da tarefa. |

O **dev front** possui páginas, Actions, DAL, services, schemas, OANET e testes front de cada tarefa. O **dev back** possui módulos, DTOs, migrations, seed, fixture de integração e testes em `backend/`. Um dos dois acumula o papel de **integrador** por fatia: mantém a branch integrada, atribui arquivos compartilhados e verifica o fluxo combinado. O outro revisa contrato/diff/evidências. “Integrador” não exige uma terceira pessoa.

Cada arquivo tem um responsável por tarefa. Atribuir explicitamente no registro:

| Arquivo/recurso compartilhado | Responsável padrão na execução futura | Regra de coordenação |
|---|---|---|
| `docs/backend/API.md`, `DTOS.md`, `docs/contratos/**` | Integrador, com revisão dos dois | Contrato primeiro, atualizar texto/schema/exemplos juntos. |
| `docs/backend/ESCOPO.md`, regras/modelo | Integrador após decisão do grupo | Esclarecimento técnico preserva produto; alteração de política exige decisão identificada. |
| `package.json`, `package-lock.json`, `next.config.ts`, configuração front | Dev front, dono único em FE-00 e FE-09 | Em qualquer outra tarefa que precise de dependência ou script, o pedido vai ao dono, é registrado e executado por ele; nunca edição simultânea. |
| `backend/package.json`, lock/config/migrations | Dev back | Compatibilidade da API e ordem de migrations revisadas pelo integrador. |
| `backend/src/testing/fixture-integracao/**`, comando `fixture:integracao` | Dev back (BE-FX) | Só teste; entregue por etapas (§4); front e integração apenas invocam o comando. |
| `.env.example` raiz, inicialização conjunta, documentação de execução | Integrador; front entrega necessidades | Back usa seu próprio `backend/.env.example`. Sem segredos versionados. |
| `.env.local` | Ninguém, nas tarefas | Arquivo único da checkout. Variáveis da tarefa vão no ambiente do processo que ela inicia (§4). |
| `components/oanet/**`, `app/globals.css`, layouts | Dev front | UI-01 antes de UI-02; propriedade continua única se outra tarefa pedir CSS. |
| `components/*.tsx`, `components/ui/*` | Dev front em UI-02.00 | Inventário e destino no [plano front](frontend/PLANO-IMPLEMENTACAO.md); depois, mudança só por tarefa que registre o arquivo. |
| `db.json`, remoção de json-server | Dev front em FE-09 | Preservar até último consumidor migrado; nunca fixture mutável de teste. |
| `README.md`, índice, `docs/PLANO.md`, mapa, estado de telas | Integrador, recebendo evidência dos dois | Atualizar apenas o que foi observado; “P” não vira “atual” na demonstração integrada. |
| Portas, `.next`, SQLite temporário, processos | Dono da tarefa que os iniciou | Registrar reserva; worktrees/portas próprias, sem encerrar processos alheios. |

## 2. Preparar sem esperar o outro dev

### G-1 — aceite do contrato

Pré-condição de FE-00, BE-01 e de toda tarefa de implementação. **Responsável:** coordenador/integrador, que é a única pessoa a preencher o registro abaixo. Ninguém registra assinatura por outra pessoa.

**Condição de aceite**, verificada depois da última rodada de correções:

- nenhum achado P0 ou P1 aberto em [revisões](agents/revisoes/README.md); cada achado tem decisão registrada;
- `py -3 docs/contratos/validar.py`, testes documentais `py -3 -B -m unittest discover -s docs/contratos -p "test_*.py"`, `node docs/agents/validar-documentacao.mjs --ancoras` e `git diff --check` com exit 0;
- `info.version` do OpenAPI igual a `versaoContrato` das fixtures.

**Registro G-1 — aceite técnico documental concedido pela coordenação em 2026-11-09.** Não é aceite de API executável nem autorização para retomar implementação. As definições técnicas adicionais da rodada 2 foram conferidas e confirmadas no [registro DOC-03](agents/DOC-03-PLANEJAMENTO.md).

| Campo | Valor |
|---|---|
| `info.version` | `1.0.0`, igual à `versaoContrato` dos cenários |
| SHA-256 do pacote contratual (12 arquivos, LF normalizado) | `cd91fef5a43bb239a67be5bbc1a942caedda7129bb268da7dbfdd0632b9a4730` |
| SHA-256 do OpenAPI (LF normalizado, referência complementar) | `1836fa15115a7819a603431288921b3cbddb47d6032327adf5d7a35411cd7166` |
| Data (UTC) e base (commit ou pacote de §2) | `2026-11-09T17:28:21Z`; HEAD `949b1e8` + alterações locais DOC-03 (incluem não rastreados; preservar antes de distribuir) |
| Responsável pelo aceite | Codex coordenador desta DOC-03, após duas revisões e duas correções Claude Code/Sonnet 5.5; ciência individual dos devs a registrar nas futuras tarefas |
| Comandos de verificação e exits | `validar.py --hash`:0 (30 operações/310 cenários); `unittest`:0 (120 testes/29,278s); verificador com `--ancoras`:0; `git diff --check`:0. Comandos completos e limites no registro DOC-03 |
| Achados P0/P1 abertos | `0` dos achados identificados na revisão; os 22 achados têm tratamento nos relatórios e na leitura cruzada |

**Registro G-1, revisão 2 — hash do pacote reconferido em 2026-11-11.** O registro acima (revisão 1) fica como histórico do que DOC-03 aceitou. Desde então o pacote mudou só em texto, não em contrato: o `openapi.json` e o `cenarios.json` **não mudaram** (o hash do OpenAPI é o mesmo). Mudaram `docs/backend/SEED.md` (atualização do dev de back em 2026-11-10: seed mínimo/completo e teste de seed já implementado), `docs/backend/API.md` (parágrafo sobre 413, agrupamento de `detalhes` e query desconhecida) e `docs/contratos/README.md` (estado da materialização dos cenários). Foi isso que fez o hash do conjunto divergir, como o plano BE anotou em BE-10/BE-12.

| Campo | Valor |
|---|---|
| `info.version` | `1.0.0`, igual à `versaoContrato` dos cenários |
| SHA-256 do pacote contratual (12 arquivos, LF normalizado) | `4e5dfad54d593521612c52eb29572a042114e146ee3be077403709b7a5e228f3` (revisão 1: `cd91fef5…4730`) |
| SHA-256 do OpenAPI (LF normalizado) | `1836fa15115a7819a603431288921b3cbddb47d6032327adf5d7a35411cd7166` (inalterado) |
| Data (UTC) e base | 2026-11-11; branch `integracao/back-front`, pacote no commit `678b0d0` (HEAD `06863fc` na conferência) |
| Responsável pelo aceite | Coordenação (o usuário), que pediu a conferência em 2026-11-11; comandos executados por Claude Code (Sonnet 5.5). Ciência individual dos devs continua a registrar nas tarefas |
| Comandos de verificação e exits | `py -3 docs/contratos/validar.py --hash`:0 (30 operações/310 cenários); `py -3 docs/contratos/validar.py --conferir-hash 4e5dfad5…33b0`:0; `py -3 -B -m unittest discover -s docs/contratos -p "test_*.py"`:0 (120 testes/36 s); `node docs/agents/validar-documentacao.mjs --ancoras`:0 (0 falhas); `git diff --check`:0 |
| Achados P0/P1 abertos | `0`. A auditoria de 2026-11-11 ([relatórios](relatorios/README.md)) achou um P1 (`GET /lanternas?setor=N` sempre 400), corrigido e coberto por teste de regressão |
| Limite desta revisão | Aceita o **texto** do pacote contratual. O 413 `CORPO_MUITO_GRANDE` está descrito na `API.md` mas fora da tabela e do `openapi.json`, para não alterar o contrato aceito; incluí-lo no OpenAPI exige novo registro G-1 |

Quem consumiu a revisão 1 (`cd91fef5…`) deve registrar a revisão 2 na tarefa seguinte; como o OpenAPI e os cenários são idênticos, não há mudança de comportamento a reaplicar.

**Ciência da dupla:** ao abrir sua primeira tarefa, cada dev escreve no registro da tarefa ([TAREFA](agents/TAREFA.md)) a versão e o hash de G-1 que leu e consumiu. Hash diferente do registro significa contrato alterado: parar e seguir o §5. Mudança do contrato depois de G-1 gera novo registro G-1.

O hash obrigatório é o **conjunto** dos 12 arquivos definidos em `validar.py`: OpenAPI, cenários, validador/testes/README e fontes de API/DTO/RN/decisão/modelo/seed/testes. Assim uma mudança só no comportamento narrado ou na validação também reabre o gate. Confirme com `py -3 docs/contratos/validar.py --conferir-hash HASH_DO_G1`. O hash isolado de `openapi.json` não substitui essa checagem. Fins de linha são normalizados para LF para portabilidade entre checkouts Windows/Linux.

### Base comum e preparação

- [ ] **Base comum completa (pré-condição para distribuir trabalho).** A base de cada worktree inclui **todos** os entregáveis da DOC-03: `docs/INTEGRACAO.md`, `docs/agents/DOC-03-PLANEJAMENTO.md`, `docs/agents/revisoes/`, `docs/agents/validar-documentacao.mjs`, `docs/backend/PLANO-IMPLEMENTACAO.md`, `docs/contratos/`, `docs/frontend/PLANO-IMPLEMENTACAO.md`, `docs/research/2026-11-09-documentacao-para-agentes.md` e as edições dos arquivos já rastreados. O usuário autorizou a publicação desse conjunto na branch `docs/migracao-back-end`. Usar o commit que incorpora a DOC-03 (identificável no histórico da branch), ou um pacote completo autorizado que inclua arquivos novos; a base antiga `949b1e8` sozinha não contém a DOC-03. No destino, conferir a existência dos caminhos e a lista transportada, `git status --short` para detectar perdas locais, os validadores/testes de G-1 e `--conferir-hash` com o hash registrado. Não se exige checkout limpa global, e a autorização de publicar documentação não inicia implementação.
- [ ] Os assets e a casca OANET já estão no HEAD (`5377e39`, `949b1e8`); confirmar com `git ls-files components/oanet` e `git log --oneline -3`. O que faltar nessa conferência é tratado como parcial. Commit de UI parcial não é aceite.
- [ ] Criar registro da fatia com commit-base (ou identificação do pacote), revisão do contrato (G-1), `info.version` e SHA-256 do conjunto; listar exemplos/cenários usados, dono por arquivo, portas e verificações esperadas.
- [ ] Front prepara cliente/UI contra servidor HTTP falso de FE-00. Back prepara API com supertest/clientes próprios e SQLite isolado. Nenhuma tarefa depende de chamar funções, importar tipos ou iniciar o processo do outro dev.
- [ ] Ambos validam pedidos/respostas contra a mesma revisão. Rejeitar operação/campo desconhecido e resposta fora do schema; não aceitar mock permissivo que esconda divergência.
- [ ] Revisar exemplos de ambos: o pedido produzido pelo consumidor deve poder ser executado no provedor com a pré-condição indicada. Validar schema do back isoladamente não prova como o front pede os dados.

O fake de desenvolvimento/teste é um processo HTTP loopback, proposto com `node:http`/`node:test` e fixtures versionadas, e aponta `API_URL` só no ambiente da tarefa. Interceptação apenas no navegador não alcança fetch do Server Component/Action no servidor Next. MSW/Pact não são dependências presumidas; qualquer adoção precisa de escopo explícito e prova no processo correto. Biblioteca de validação OpenAPI, se necessária, entra na tarefa que a cria e deve suportar a versão do contrato.

Usar três estados distintos no registro:

| Estado | Evidência mínima | O que permite |
|---|---|---|
| Preparado P | Testes do front contra fake/exemplos válidos e UI inspecionada | Revisar consumidor e continuar front independentemente. |
| Provedor aceito B | API real + SQLite isolado + testes por operação/RN e schema de resposta | Oferecer recurso real para o Corte 1 ou para um gate aditivo. |
| Ativado A | Build front + API real + persistência + cenários autenticados no estado combinado, mais roteiro visual | Habilitar recurso real e marcar documentação correspondente como atual na demonstração integrada. |

Não confundir testes de mocks com E2E, nem sucesso em branches separadas com aprovação do merge. As restrições e limites vêm também da [pesquisa aplicada](research/2026-11-09-documentacao-para-agentes.md).

## 3. Matriz de recursos e gates

Todos os gates exigem revisão/hash iguais, testes de sucesso **e** erro, ausência de segredos em logs/browser e banco próprio. “Aceito” significa evidência registrada, não apenas endpoint criado. Todo gate A inclui o **roteiro visual** no navegador, contra a API real: 375 px, tablet, desktop, teclado/foco e movimento reduzido nas telas afetadas, com capturas por URL. Teste de API sozinho não marca A.

### Corte 1: primeira ativação integrada

O primeiro corte integrado é **único e coerente**. Sem adaptador legado temporário e sem publicação intermediária: ativam-se juntos o cliente HTTP único, a sessão JWT, **todos** os consumidores hoje existentes e o dashboard que substitui o Resumo. G1, G2, G3, G4, G5 e G7a são provas preparatórias (P/B) de partes do corte; **A é registrado uma vez, para o conjunto.** Motivo: o cliente único e a sessão JWT deixam de funcionar com as páginas que ainda esperam arrays e ids do json-server, e a lista paginada da API (`limite` padrão 20, máximo 50) tornaria as contagens do Resumo atual corretas só para a primeira página.

Exigências do Corte 1:

- **Back (B):** BE-01, 02, 03, 05, 06, 07a, 07b, 08, 09 e 11, mais BE-FX etapas a–d (§4). BE-04, 07c, 10 e 12 não bloqueiam.
- **Front (P):** FE-00, 01, 02, 03, 04, 05 e FE-07a. Com UI-01, UI-02.00 e as linhas UI-02 das rotas tocadas (02.03 a 02.10), porque cada FE assume o arquivo só depois da UI correspondente. UI-02.01, 02.02, 02.11 e 02.12 não consomem dados e não bloqueiam o corte; G9 as exige.
- **Todas as rotas existentes que usam dados** têm endpoint real no mesmo corte:

| Rota existente | Operações reais (nomes e formatos no OpenAPI) | Gate |
|---|---|---|
| `/login` e saída | login, `/auth/me`; saída apaga o cookie | G2 |
| `/cadastro` (nova) | cadastro e leitura pública de Setores (BE-05) | G2 |
| `/lanternas`, `/lanternas/[id]` | lista e Ficha de Lanternas, Setores | G3 |
| `/painel` (Resumo vira dashboard) | `/dashboard` | G7a |
| `/painel/ocorrencias`, `/nova`, `/[id]` | lista, criação e detalhe de Ocorrências; consultas auxiliares de Setores e Lanternas | G4 |
| `/painel/ocorrencias/[id]` (status) e `/[id]/atribuir` | `/status` e `/responsavel` | G5 |
| `/`, `/sobre`, `/acesso-negado`, `/design-system`, `/laboratorio` | nenhuma | — |

**Aditivos, depois do Corte 1:** G6 (histórico e comentários), G7b (Minha fila) e G8 (gestão). Acrescentam funcionalidades e rotas sem retirar os endpoints já exigidos pelo Corte 1; G6 também amplia a tela de detalhe existente. Antes do Corte 1, apenas a branch de UI (UI-01/UI-02, que preserva json-server e sessão atuais) pode ser integrada; a branch de preparação FE não é publicada.

**M1 não é publicação parcial.** Autenticação do provedor (B) e do consumidor (P) pode ser demonstrada isolada: provedor com clientes de teste, consumidor contra o fake. O app real só muda no Corte 1.

| Gate/recurso | Ativa junto com | Back fornecedor | Front consumidor | Operações/contrato e prova |
|---|---|---|---|---|
| G-1 — contrato aceito | — | — | — | §2. Pré-condição de FE-00/BE-01. |
| G0 — base visual/contratual | Branch de UI, antes do Corte 1 | Nenhum endpoint | UI-01, UI-02.00 a UI-02.12, FE-00 P | Contrato validado e exemplos catalogados; casca fecha após navegação/logout atuais, celular/teclado/movimento. UI-02 avança por tela, sem bloquear a preparação de HTTP; cobertura completa é exigida em G9. Sem dados-demo reais. |
| G1 — transporte | Corte 1 | BE-01 | FE-01 P | `/saude` e envelope real; cliente interpreta status/código e rejeita formato inválido nos testes de consumidor. 204 é preparado contra fixture e comprovado contra o DELETE real de Ocorrência (G4). Não trocar serviços json-server pela API parcialmente implementada. |
| G2 — autenticação | Corte 1 | BE-02/03/05 (leitura de Setores)/07a, BE-FX a | FE-02 | Cadastro (carrega `GET /setores` pelo servidor, com teste de erro e de lista vazia da origem), login, `/auth/me`, expiração e saída. Cadastro cria L e leva ao login; login guarda JWT servidor. Sem cookie→login, token recusado limpa sessão, papel recarregado do banco, throttle→429. |
| G3 — domínio público | Corte 1 | BE-06/07b, BE-FX b | FE-03 | Lista e Ficha de Lanternas com null/fontes, filtros/ordenação/paginação. Completa e incompleta, Setor não verificado, 404; sem coerção herdada de IDs. |
| G4 — ocorrência básica | Corte 1 | BE-08, BE-FX c | FE-04 | GET/POST/PATCH/DELETE Ocorrências, filtros/Prazo; L não envia setor no POST e não vê outro setor; G escolhe. Criar, recarregar, conferir banco/Evento `criada`. Lista com mais de uma página prova que nenhuma contagem depende da primeira página. |
| G5 — ciclo de vida | Corte 1 | BE-09, BE-FX d | FE-05 | `/status`, `/responsavel` (atribuir, reatribuir, liberar, cada um com Evento `atribuida`), editar/excluir/reabrir; 409/422 por código. Mesmo estado e carga no banco depois de resolução/reabertura; conflito não vira sucesso na UI. |
| G7a — dashboard | Corte 1 | BE-11 | FE-07a | `/dashboard` escopado substitui o Resumo; `dias` só série UTC incluindo hoje, demais métricas históricas não excluídas; tabela textual, zeros/média nula. Métricas conferidas contra a fixture conhecida. |
| **Corte 1 — ativação A** | — | Todos os acima | Todos os acima | Estado combinado completo: cenários de §4 aplicáveis, todas as rotas da tabela acima, roteiro visual, persistência após reinício da API e rollback ensaiado (§8). Único ponto em que G1–G5 e G7a ganham A. |
| G6 — histórico/comentários | Aditivo | BE-10, BE-FX e | FE-06 | GET Eventos/Comentários, POST comentário, DELETE comentário; autor/G pode apagar, outro autor403 e setor alheio404. Timeline reflete soft delete, vazio/erro/páginas, Eventos `atribuida`, `reaberta` e demais tipos. |
| G7b — Minha fila | Aditivo | BE-08/09 | FE-07b | `/minha-fila` L vinculado, só atribuídas não resolvidas/não excluídas; G403, sem ficha409 `CONTA_SEM_LANTERNA`. Resolver/excluir retira da fila e reabrir atribuída repõe. |
| G8 — gestão | Aditivo | BE-04 | FE-08 | Usuários/papel/vínculo, CRUD Setor e criar/editar/status Lanterna. Último G, Setor em uso, mentor cíclico, conta sem Setor e vínculo duplicado têm mensagem/código acordados. `SETOR_EM_USO` e `LANTERNA_EM_USO` por Ocorrência histórica ou excluída são provados em A com os casos da fixture (§4), pois o Corte 1 já fornece Ocorrências. Se alguém antecipar G8 em B (fixtures por repository), esses dois casos ficam registrados como B e só ganham A no conjunto real. L bloqueado por URL e Action. |
| G9 — remoção/entrega | Fecho | BE-07c/12 e todos os anteriores | FE-09/10 e UI-02 inteira | Instalação limpa, migration/seed, build e E2E reais, remoção de json-server/db/session HMAC pelo procedimento de FE-09, fake fora de produção. Fluxos de ponta a ponta e persistência após reinício. |

### Registro de ativação A — Corte 1 e aditivos

| Campo | Valor |
|---|---|
| Data | 2026-11-11 (noite) |
| Responsável pelo aceite | Caio Macedo (dev front), por decisão registrada na tarefa; comandos executados por Claude Code (Opus 5.5) com workers Orca |
| Estado combinado | `main` `7ee3357` (back-end corrigido, UI-02/UI-03, G-1 revisão 2) + cadeia FE-00 a FE-08 rebaseada (PRs #11 a #18) |
| Contrato | `openapi` v1.0.0; pacote G-1 **revisão 2** `4e5dfad54d593521612c52eb29572a042114e146ee3be077403709b7a5e228f3` (OpenAPI e cenários idênticos aos da revisão 1 usada na preparação P) |
| Ambiente | API `backend/dist` em `127.0.0.1:32134`, SQLite novo em pasta temporária, migrations, `fixture:integracao --etapa e`; Next `next start` em `127.0.0.1:32133` com `API_URL` no processo; cache de dados do Next apagado antes do start. Script: `scripts/corte1/api.mjs`; configuração: `playwright.corte1.config.ts` |
| Gates cobertos | G1, G2, G3, G4, G5, G7a (Corte 1) e G6, G7b, G8 (aditivos), com login real de G, L2814, L674 e L-sem-ficha |
| Comandos e resultados | `SITE_URL=http://127.0.0.1:32133 npx playwright test -c playwright.corte1.config.ts`: **40 passed** (`e2e/corte1/01` a `04`); `npm run test:run`: 529 passed (71 arquivos); `npm run lint`: 0; `npx tsc --noEmit -p .`: 0; `npm run build`: ok; `npx playwright test` (fake): 24 passed; `node --test scripts/contrato/servidor.test.mjs`: 8/8; `node docs/agents/validar-documentacao.mjs`: 0 falhas |
| Roteiro visual | `e2e/corte1/04-roteiro-visual.spec.ts`: 14 rotas em 375, 768 e 1440 px, sem rolagem horizontal, Tab até o conteúdo com foco visível, `prefers-reduced-motion`; capturas em `.corte1/capturas/` (local, fora do Git) |
| Persistência | Ocorrência criada por L2814 lida de novo após parar e subir a API sobre o mesmo SQLite |
| Defeitos achados e corrigidos | Seletor de responsável da atribuição lia Lanternas com cache de 60 s (agora `no-store`); Actions de gestão de Lanternas passam a revalidar `/painel`; layout dos painéis de gestão (`.oa-panel-body`, `.oa-table-scroll`, link "Gerenciar") |
| Rollback | Combinação anterior aceita: `main` `7ee3357` com json-server (`npm run api` sobre cópia do `db.json`). Não existia SQLite de demonstração anterior a restaurar; nenhuma migration destrutiva |
| Limites | O 429 do throttle de login e os conflitos impedidos pela UI (responsável de outro setor, liberar em andamento) são provados nos testes do provedor e de Action, não no E2E. FE-09 e FE-10/G9 seguem abertos |

**Ordem:** Corte 1 → (G6, G7b, G8 em qualquer ordem entre si) → G9. Dentro do corte, a ordem de preparação é G1→G2→G3→G4→G5→G7a, sem publicar nada no meio. Contas L, G e vínculos usados por G8 e G7b vêm da fixture; nenhum gate exige bootstrap público.

## 4. Fixtures, identidade e testes de escrita

O pacote `docs/contratos/` fornece exemplos de formato. A tarefa consumidora/provedora acrescenta **fixture de cenário** em sua área de testes, declarando origem/revisão do contrato e a pré-condição de cada operação. Os mesmos IDs/datas esperados permitem comparar os dois lados; as fixtures de teste não são catálogo de fatos de Lanternas e não entram no produto.

### Fixture de integração (BE-FX)

Mecanismo **somente de teste**, do dev back, que monta o estado dos cenários abaixo em banco novo. As etapas a–e já existem. Detalhes e arquivos no [plano back](backend/PLANO-IMPLEMENTACAO.md#be-fx--fixture-de-integração-somente-de-teste).

| Etapa | Entregue com | Conteúdo | Gates que a usam |
|---|---|---|---|
| FX a | BE-07a | Setores e contas: G (Setor nulo), L2814, L674, segundo Guardião sem Setor para ensaiar rebaixamento e conta L com Setor, sem ficha | G2 |
| FX b | BE-07b | Fichas e vínculos (L2814 e L674 em setores distintos com fichas distintas), Lanterna sem ficha | G3 |
| FX c | BE-08 | Ocorrências abertas, vencida com margem, dentro do prazo com margem, excluída, mais de uma página | G4 |
| FX d | BE-09 | Atribuídas, em andamento, resolvida e histórica por transições reais; Eventos coerentes | G5, G7a, G7b, G8 |
| FX e | BE-10 | Comentários, inclusive um apagado | G6 |

- **Comando disponível para as etapas a–e:** `npm run fixture:integracao -- --etapa a|b|c|d|e` em `backend/`, com `DATABASE_PATH` absoluto exclusivo e `FIXTURE_SENHA` fornecida pelo ambiente, sem valor padrão. Grava um **manifesto de estado** (JSON, sem senha nem token) com `versaoContrato`, instante de referência, ids estáveis, e-mails, casos e contagens. Recusa produção e banco que já tenha dados; não existe endpoint de bootstrap.
- **Quem chama:** FE e integração invocam o comando depois que a etapa existir e leem o manifesto; não recriam dados à mão nem dependem do seed demonstrativo.
- **Tempo:** o instante de referência é o da execução da fixture. O E2E usa datas relativas a ele, com margem de pelo menos 1 hora do limite do Prazo. Os casos exatos de relógio (Prazo no limite, igualdade ainda não vencida) ficam no teste do provedor com relógio injetável; nenhum relógio configurável existe em produção.

| Cenário obrigatório | Dados isolados e resultado observado |
|---|---|
| Visitante e sessão recusada | Sem cookie e token expirado/adulterado; backend401, Next remove cookie recusado e volta a login sem loop. |
| Guardião | G existente via fixture, Setor0 ou nulo conforme cenário; autenticar pelo login real, não injetar sessão fabricada no E2E. |
| L2814 e L674 | Contas de setores distintos, fichas vinculadas distintas; GET/lista/Actions e URL forjada provam escopo; outro setor404. |
| Lanterna sem ficha | Conta com Setor e `lanternaId:null`; registra/comenta, mas fila409 `CONTA_SEM_LANTERNA`. |
| Conta sem Setor para rebaixamento | G com Setor nulo; sem envio setor422, Setor inválido404, Setor diferente da ficha422, G destino com setor400. |
| Ocorrências | Aberta sem/com responsável, andamento, resolvida, excluída, vencida e dentro do prazo (ambas com margem), mais de uma página. |
| Histórico para gestão | Ocorrência resolvida e outra excluída ligadas a um Setor e a uma Lanterna: provam `SETOR_EM_USO` e `LANTERNA_EM_USO` em A. |
| Eventos/comentários | Autores distintos do mesmo Setor e outro Setor; datas de empate; comentário excluído com Evento e histórico imutável. |
| Estado de Lanternas | Ativo/afastado/em_missao e sem Setor; carga0/1/2, mentoria longa e tentativa de ciclo. |
| Dashboard/listas | Dois setores, dias sem atividade, zero resolvidas/média nula, mais de uma página e empates; excluída não soma. |

- [ ] Cada E2E inicia em banco novo migrado seguido da fixture; autenticar via `/auth/login`. Guardião não nasce por cadastro público.
- [ ] Para o estado atual json-server, copiar `db.json` para diretório temporário da tarefa e iniciar servidor nessa cópia com porta própria; não executar `npm run api` da raiz para testes de escrita compartilhados.
- [ ] No destino, `DATABASE_PATH` absoluto exclusivo por tarefa/processo; fechar conexões antes de descartar o banco. Concorrência usa arquivo real e conexões independentes. Seed final é demonstração relativa, não substitui a fixture.
- [ ] Next usa sua porta e seu diretório `.next`/worktree; não disputar `next dev`/build na mesma pasta. `scripts/iniciar.sh` atual usa portas fixas; não serve como coordenador de instâncias paralelas.
- [ ] **Variáveis da tarefa no processo, sem editar `.env.local`.** Exemplo PowerShell: `$env:API_URL = 'http://127.0.0.1:<porta-da-api>'; npm run dev -- -p <porta-do-next>` (o ambiente do processo prevalece sobre os arquivos `.env*`). Cada processo recebe `API_URL`, `DATABASE_PATH` e portas próprios; dois agentes não se sobrepõem.
- [ ] Registrar processos/portas criados e encerrá-los ao fim; preservar processos alheios. Nunca registrar token, senha, segredo ou corpo sensível como evidência.

## 5. Controle de mudança do contrato

1. **Propor:** registrar operação, problema, decisão RN/D afetada, antes/depois e consumidores/provedor atingidos. Identificar se compatível; campo obrigatório novo, tipo/nulabilidade, código ou status alterado são mudança de fronteira mesmo sem mudar URL.
2. **Acordar:** ambos revisam API/DTOs, OpenAPI e exemplos da mesma revisão. Se intenção divergir, resolver com a decisão canônica antes de codificar; um mock não estabelece política.
3. **Versionar:** atualizar versão do pacote conforme sua convenção, novo registro G-1 (hash), matriz de impactos e exemplos. Preservar fixtures da revisão anterior quando forem necessárias para provar compatibilidade; não editar snapshot só para passar.
4. **Consumir:** cada dev atualiza seu branch para o contrato aceito, troca fixtures/tests e registra testes que detectam a alteração. Respostas reais e chamadas do consumidor são validadas contra o novo acordo.
5. **Integrar:** merge contrato→provedor aceito→consumidor preparado→execução combinada. Repetir o gate afetado e regressões adjacentes. Contrato e implementação divergentes não são publicados sob a mesma versão.

Arquivos compartilhados não são editados em paralelo: o responsável recebe correção do outro dev por descrição/diff delimitado e incorpora. Uma referência local quebrada ou exemplo ausente deve bloquear aquele gate até correção, em vez de inventar um formato no consumidor.

## 6. Branches, merge e publicação

- [ ] Usar a `main` como base comum e branches por fatia (`front/<id>` no front, já em uso, p. ex. `front/ui-02-00-componentes`; `back/<id>` é nome sugerido, não existente). Criar worktree nativa do ambiente quando disponível; registrar commit-base e alterações locais preservadas. A autorização de 2026-11-10 cobre o front; o back continua sem implementação.
- [ ] Cada PR/entrega informa objetivo, arquivos, revisão/hash, cenários P/B/A, comandos/exit e limitações. Revisar pelo outro dev antes da integração. Uma falha baseline precisa de reprodução prévia registrada.
- [ ] Antes do Corte 1, só a branch de UI (que preserva json-server e sessão atuais) é integrada à `main`, por PR, como ocorreu com a UI-01 (PR #1). A branch de preparação FE (cliente, sessão, services) permanece separada; páginas e formulários entram nela por rebase sobre a `main` com a UI integrada (regra de posse no plano front), nunca por duas implementações dos mesmos arquivos.
- [ ] Na branch de integração do Corte 1, incorporar contrato aceito, depois código do provedor, depois consumidor; resolver conflitos de serviços/config e revisar lockfile. Reinstalar dependências conforme locks somente se alterados.
- [ ] Executar checks do estado combinado e roteiro autenticado, inclusive o roteiro visual (§3). Preparação FE não substitui o fluxo de demonstração fora do Corte 1.
- [ ] Publicar apenas combinação aceita. “Mock funciona” e “backend passou unitários” são resultados insuficientes para marcar A. Commit/merge/publicação seguem a autorização da tarefa de execução, sem presumir que este plano já os realizou.

## 7. Comandos e evidências esperadas

Esta seção é roteiro de execução futura. O package é a fonte da disponibilidade dos scripts; não foram executados aqui.

| Quando/onde | Comando | Resultado esperado e limite |
|---|---|---|
| Registro, raiz | `git status --short`; `git diff --check` | Preservar trabalho local; diff sem erros de whitespace. Não prova código. |
| Documentação, raiz | `node docs/agents/validar-documentacao.mjs` | Exit0. Confere destinos de links locais e a presença das pastas no índice; não confere âncoras, caminhos entre crases nem significado. |
| Contrato, raiz | `py -3 docs/contratos/validar.py` (portátil: `python3 docs/contratos/validar.py`) | Python>=3.10 stdlib; esperado exit0. Valida referências internas, cobertura de operações API e exemplos no subconjunto JSON Schema declarado no README; não é validação integral OpenAPI nem prova provedor. |
| Front atual/futuro, raiz | `npm run test:run`; `npm run lint`; `npm run build` | Exit0 ou falhas baseline reproduzidas e registradas separadamente; Vitest não cobre render assíncrono completo. |
| Front focado | `npm exec -- vitest run __tests__/lib/api.test.ts` | Script Vitest existe; arquivo será criado FE-01. Cliente contra HTTP/fixtures, não regra do backend. |
| Back depois BE-01, `backend/` | `npm run test -- --runInBand`; `npm run test:e2e -- --runInBand`; `npm run build` | Scripts **planejados** em BE-01. Exigir suíte de respostas reais e regras, não mocks isolados de service apenas. |
| Back depois BE-02/07, `backend/` | `npm run migration:run`; `npm run seed` | Scripts **planejados**. Banco exclusivo conhecido; repetir seed e verificar contagens; nunca limpeza em produção. |
| Back, fixture de integração, `backend/` | `npm run fixture:integracao -- --etapa a|b|c|d|e` | Todas as etapas disponíveis; requerem banco novo migrado, `DATABASE_PATH` e `FIXTURE_SENHA` no ambiente; gravam manifesto. Recusam produção e banco com dados. |
| Navegadores do E2E, raiz | `npx playwright install chromium` | Passo **planejado** em FE-00, exige rede e disco fora de `package.json`; o dev front o executa por autorização explícita no registro da tarefa. |
| Build integrado depois FE-00, raiz | `npm run test:e2e` | Script **planejado** em FE-00. API real + SQLite isolado + fixture + build Next, login real e roteiros do Corte 1 e dos gates aditivos. Registrar como P se usar fake. |
| Remoção em FE-09 | Procedimento canônico de [FE-09](frontend/PLANO-IMPLEMENTACAO.md#procedimento-canônico-de-remoção) | Única definição do comando e do resultado esperado (saída vazia). Não repetir regex em outros documentos. |

Para cada execução registrar data, diretório, commit/diff, revisão/hash, comando exato, exit, quantidade/cenários cobertos e evidências por URL. Resultado esperado desta tabela não é resultado observado. Suíte sem API real ou servidor antigo sem origem conhecida não valida o gate.

## 8. Switch e rollback

**Contexto:** não existe ambiente de produção. O “real” aqui é a **demonstração integrada acadêmica**: Next + API NestJS + arquivo SQLite. O rollback é proporcional a ela: voltar à combinação anterior aceita e restaurar o arquivo SQLite da demonstração.

**Switch técnico:** um recurso ativado usa o cliente real do servidor e `API_URL` servidor da API real. A branch de preparação pode apontar o mesmo cliente para o fake por ambiente local, mas o servidor fake nunca é iniciado/importado pelo build/start da demonstração. Falha real apresenta erro e retry, sem alternar para dados simulados. Não usar `NEXT_PUBLIC_API_URL`, flag no navegador, storage de token ou fallback silencioso.

Antes do Corte 1 e de G9:

- [ ] Registrar versão anterior do front e da API (commit ou tag da demonstração json-server), revisão do contrato, migrations aplicadas e ambiente. Copiar o arquivo SQLite da demonstração para a pasta da tarefa e conferir que a cópia abre em processo separado (restauração ensaiada antes da troca).
- [ ] Aplicar migrations compatíveis antes do consumidor quando aplicável; validar `/saude`, login/me e leitura/escrita controlada. Uma migration destrutiva requer tarefa e estratégia próprias; este plano não autoriza apagar dados de ninguém.
- [ ] Planejar a invalidação da sessão antiga na troca HMAC→JWT. Usuários com cookie antigo passam por login real; cookie inválido não deve ser aceito nem gerar loop.

Se o gate falhar antes da troca, manter o consumidor anterior e corrigir a fatia na branch. Se falhar depois, voltar à combinação front/API previamente aceita e restaurar a cópia do SQLite; revalidar login e leitura. Reverter migration só quando reversibilidade e a cópia tiverem sido provadas e dados novos preservados. Registrar causa, versões e gate reaberto.

Voltar à demonstração json-server exige ambiente demonstrativo explícito e isolado (cópia de `db.json` em porta própria). Após FE-09, o rollback conserva API e persistência reais; o código histórico de demonstração só serve para reprodução fora da demonstração integrada.

## 9. Fechar e retomar uma fatia

**Fechamento verificável:** cada operação consumida está no contrato, cada fixture está válida, cada regra da fatia tem sucesso/erro, consumidor e provedor usam a mesma revisão/hash e o gate real registra persistência/navegação/autorização. Front/backend isolados recebem seus aceites P/B; A é registrado somente no estado combinado (o Corte 1 como conjunto, os gates aditivos individualmente). Atualizar índices/telas/mapa sem promover o que ainda é destino.

**Handoff retomável:** entregar base e estado observado, arquivos locais ainda sem commit, dono por arquivo, última revisão/hash, passos concluídos e próximo comando/cenário exato, processos/portas/banco da tarefa, verificações feitas/faltantes e bloqueio específico. Resultados datados ficam na tarefa; regras duradouras permanecem em suas fontes. O receptor confere `git status --short` e o contrato antes de seguir, preservando alterações de outras tarefas.
