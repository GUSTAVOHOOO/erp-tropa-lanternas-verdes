# Handoff: refinamentos UI-03 e preparação P do front (FE-00 a FE-08)

> **Nota de atualização:** Este documento é histórico da fase de preparação. Todos os PRs (#10 a #20 e #22) foram mergeados na `main` e o sistema foi integrado à API NestJS real. O estado atual da aplicação está em [docs/README.md](../README.md) e [INTEGRACAO §3](../INTEGRACAO.md#3-matriz-de-recursos-e-gates).

Data: 2026-11-11. Autor: sessão Claude (coordenador e revisor principal), a pedido do dev front.
Contrato usado em toda a preparação (G-1): `openapi` v1.0.0, pacote SHA-256
`cd91fef5a43bb239a67be5bbc1a942caedda7129bb268da7dbfdd0632b9a4730`
(`python docs/contratos/validar.py --conferir-hash`, exit 0; `py` não existe nesta máquina, use `python`).

> **Simulação não comprova integração real.** Tudo de FE-01 em diante foi provado contra o
> servidor falso do contrato (`scripts/contrato/servidor.mjs`), não contra a API NestJS.
> A ativação real é o Corte 1 descrito em [INTEGRACAO](../INTEGRACAO.md).

## 1. Pedido original e regras de trabalho

- Pedido: ler `docs/agents/HANDOFF-UI-02.md` e o README; fazer primeiro as correções visuais
  (REF-01 a REF-05); depois seguir "sem parar" pelas tarefas do
  [plano FE](../frontend/PLANO-IMPLEMENTACAO.md), do mesmo jeito; o dev front revisa no fim.
- Orquestração: Orca orchestration com `gpt-6-luna` (Codex), `gemini-3.8-flash-high`
  (Antigravity) e `haiku` (Claude); Claude é o revisor principal e escreve o código sensível
  (schemas, serviços, Actions quando o worker erra).
- FE-00 foi juntado ao FE-01 no mesmo PR ("coloca junto com o próximo msm").
- Regras do usuário: seguir exatamente a task e a documentação, sem inventar; na dúvida,
  perguntar. Commit/push só quando pedido (o fluxo já autorizado aqui: branch `front/<id>`,
  commit, push, PR draft empilhado). Commits terminam com
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; corpo de PR termina com
  `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- Não editar `.env.local` (variáveis vão no ambiente do processo). `db.json` é persistência
  da demonstração: teste manual de escrita usa cópia isolada.

## 2. Estado dos PRs (todos abertos)

| PR | Branch → base | Conteúdo | Commit | Testes na entrega |
|---|---|---|---|---|
| [#10](https://github.com/GUSTAVOHOOO/erp-tropa-lanternas-verdes/pull/10) (pronto) | `front/ui-03-refinamentos` → `main` | REF-01 a REF-05 | `c6fbb16` | 206 unit, lint, build |
| [#11](https://github.com/GUSTAVOHOOO/erp-tropa-lanternas-verdes/pull/11) draft | `front/fe-00-01-infra-cliente` → `main` | FE-00 (commit do usuário `179c8a9` rebaseado = `9dd0e4f`) + FE-01 cliente HTTP | `7860579` | 228, e2e 1 |
| [#12](https://github.com/GUSTAVOHOOO/erp-tropa-lanternas-verdes/pull/12) draft | `front/fe-02-sessao` → #11 | FE-02 sessão JWT, login, cadastro, saída | `0645463` | 252, e2e 5 |
| [#13](https://github.com/GUSTAVOHOOO/erp-tropa-lanternas-verdes/pull/13) draft | `front/fe-03-lanternas` → #12 | FE-03 catálogo, busca, Ficha | `e15fdc6` | 275, e2e 8 |
| [#14](https://github.com/GUSTAVOHOOO/erp-tropa-lanternas-verdes/pull/14) draft | `front/fe-04-05-ocorrencias` → #13 | FE-04/FE-05 ocorrências e ciclo de vida | `feadf6b` | 320, e2e 12 |
| [#15](https://github.com/GUSTAVOHOOO/erp-tropa-lanternas-verdes/pull/15) draft | `front/fe-07a-dashboard` → #14 | FE-07a dashboard no lugar do Resumo (fecha o conjunto do Corte 1) | `c221161` | 339, e2e 15 |
| [#16](https://github.com/GUSTAVOHOOO/erp-tropa-lanternas-verdes/pull/16) draft | `front/fe-06-eventos-comentarios` → #15 | FE-06 linha do tempo e comentários (aditivo) | `7005d67` | 388, e2e 18 |
| [#17](https://github.com/GUSTAVOHOOO/erp-tropa-lanternas-verdes/pull/17) draft | `front/fe-07b-minha-fila` → #16 | FE-07b Minha fila + links por papel (aditivo) | `404a28c` | 399, e2e 20 |
| (sem PR) | `front/fe-08-gestao` (local, **não commitado**) → #17 | FE-08 gestão do Guardião (aditivo) | — | ver §4 |

- #11 a #17 são uma **cadeia empilhada** de drafts: "não mergear antes do Corte 1". O
  plano exige ativar juntos FE-01, FE-02, FE-03, FE-04, FE-05 e FE-07a; FE-06, FE-07b e
  FE-08 entram depois, como aditivos.
- #11 saiu da `main` **antes** do merge de #10. Quando #10 entrar, rebasear a cadeia
  (#11 → … → FE-08) sobre a `main`; o conflito previsível é o `oa-panel-body` (REF-02) nos
  painéis de `painel/page`, `ocorrencias` (filtros, nova, `[id]`, atribuir), que FE-04/05 e
  FE-07a reescreveram. Mantenha o envelope `.oa-panel-body` nas versões novas.

## 3. O que cada tarefa entregou (resumo para revisão)

**UI-03 (#10).** REF-01: a barra lateral já era sticky (`.oa-lab`), mas `height: calc(100dvh - 36px)`
deixava o rodapé (45 px) empurrar 35 px; agora `calc(100dvh - 71px)` (medido: topo 18 px no fim
da rolagem). REF-02: `.oa-panel-body` (16px 16px 28px; 20px 24px 30px a partir de 768 px) nos
painéis listados acima. REF-03: `.oa-badge` com `clip-path: polygon(0 4px,4px 0,100% 0,100% 100%,0 100%)`.
REF-04: ícone `brilho` no `IconeOa`, botão `oa-icon-button oa-calm-toggle oa-has-tooltip`, dica
`oa-dica-modo-calmo` via `aria-describedby`, `aria-label` "Reduzir efeitos luminosos" mantido.
REF-05: **opção 2** (globo `role="img"` + dica "Rede OANET: 3.600 setores sob a guarda de Oa");
a opção 1 (globo interativo) depende de decisão de produto. Também: `suppressHydrationWarning`
na `section` da `MolduraOa`; CSS `.oa-has-tooltip/.oa-tooltip` (máx. 280 px).
`HANDOFF-UI-02.md` §4 registra isso. Obs.: o `next dev` do usuário na :3000 não recarregou o
`globals.css` sozinho (reiniciar o dev mostra a mudança).

**FE-00 + FE-01 (#11).** `lib/api.ts`: `requisitarApi`, `requisitarApiSemConteudo`, `CacheApi`
obrigatório, Bearer, `FALHA_REDE`/`RESPOSTA_INVALIDA`, `lancarErroHttp`, `import 'server-only'`.
No Vitest, `server-only` é um alias para `next/dist/compiled/server-only/empty.js` e
`test.env` define `API_URL`/`SITE_URL`. `lib/api-error.ts`: `ApiError(status, codigo?, detalhes)`,
`MENSAGENS_CODIGO`, `destinoDoErro`, `resultadoDeErroApi`; `erro-detalhe` 400 → `notFound`.
`lib/schemas/paginacao.ts`.

**FE-02 (#12).** `lib/cookie.ts` (`NOME_COOKIE`), `lib/auth.ts`, `lib/dal.ts`
(`lerSessao`, `verificarSessao`, `exigirPapel`, `lerTokenObrigatorio`), `app/sessao-expirada/route.ts`,
proxy só confere presença do cookie, `lib/escopo.ts`, `lib/schemas/senha.ts` (72 caracteres e 72
bytes), cadastro (`/cadastro`, action, `FormCadastro`, `lib/cadastro.ts`), avisos no login
`?expirou=1` e `?cadastro=1`, `components/oanet/navegacao.ts` com `linksDoSite`. Removidos
`lib/sessao.ts` e `lib/usuarios.ts`. `scripts/contrato/servidor.d.mts`; `e2e/sessao.spec.ts`.

**FE-03 (#13).** Schemas `setor`/`lanterna` (coordenador), `lib/setores.ts`, `lib/lanternas.ts`
(`listarLanternas`, `buscarLanterna`, `listarTodosLanternas`), catálogo com `FiltroLanternas` e
`components/Paginacao.tsx`, Ficha com `ConstructoComNota` (client; corrigiu um erro de fronteira
RSC). Playwright com `workers: 1`. `e2e/lanternas.spec.ts` prova que 404 sob streaming mantém
status 200 com `noindex` (comportamento do Next, não defeito).

**FE-04/05 (#14).** Schema `ocorrencia`, `lib/ocorrencias.ts`, `lib/permissoes-ocorrencia.ts`
(`acoesPermitidas`, `transicoesPermitidas`) e `actions.ts` reescritos pelo coordenador (os do
Luna saíram em Latin-1). UI pelo Flash: lista, `FormStatus`, `FormEditarOcorrencia`,
`ConfirmarExclusao`, `FormAtribuir` com liberar, Resumo provisório com `contarOcorrencias`.
O servidor falso ganhou `setScenario` por operação e `reset()`. `lib/filtro-ocorrencias` removido.

**FE-07a (#15).** `lib/schemas/dashboard.ts` (coordenador), `lib/dashboard.ts`,
`_components/Dashboard.tsx`, `FiltroDashboard.tsx`; `BarraStatus` removido; setores carregados
para todos os papéis; padding corrigido.

**FE-06 (#16).** Schemas `evento`/`comentario` (coordenador), `lib/eventos.ts`,
`lib/comentarios.ts`, `comentarios-actions.ts` (`comentar`, `apagarComentario`), `LinhaDoTempo`,
`Comentarios`, `FormComentario`, `ApagarComentario`; `Paginacao` ganhou a prop `parametro`
(duas paginações na mesma página).

**FE-07b (#17).** `listarMinhaFila`, `/painel/minha-fila` (page, loading, error), `linksDoPainel`
em `navegacao.ts` usado por `app/(painel)/layout.tsx`; `e2e/fila.spec.ts`. Achado para o dev back:
o cenário `listarMinhaFila.200.vazia` **não é vazio**; o e2e usa
`listarMinhaFila.200.fila-vazia-sem-pendentes`.

## 4. FE-08 em andamento (worktree, nada commitado)

Worktree `C:\Projetos\erp-tropa-fe`, branch `front/fe-08-gestao` (criada sobre `404a28c`).
Três workers Flash, um por tela, com as especificações do Apêndice A. **Os três terminaram
(`worker_done`, outcome `succeeded`)**:

| Parte | Dispatch | Relato do worker | Revisão do coordenador |
|---|---|---|---|
| Lanternas (gestão) | `ctx_9da428e24dc6` (liberado) | 37 testes passando | **pendente** |
| Setores | `ctx_9b2f95da57a9` (terminal reclaimable, auto-release 23:40Z) | TDD com 5 falhas iniciais em 3 arquivos; 25 testes, eslint 0, tsc 0, UTF-8 ok | **pendente** |
| Usuários | `ctx_f79f934d9bf6` (terminal reclaimable, auto-release 23:40Z) | 33 testes, eslint 0, tsc 0, UTF-8 ok | **pendente** |

Checagem de codificação feita nesta sessão nos 38 arquivos alterados/novos: nenhum U+FFFD,
nenhum `Ã` de dupla codificação, nenhum BOM.

**Arquivos do coordenador (prontos):**
- `components/oanet/navegacao.ts`: `LINKS_GESTAO` (`/painel/lanternas` "Lanternas (gestão)",
  `/painel/setores` "Setores", `/painel/usuarios` "Usuários") somados a `linksDoPainel` só para
  `guardiao`; teste em `__tests__/components/casca-oanet.test.tsx` (11 passando).
- `e2e/gestao.spec.ts`: Lanterna não vê os links de gestão; as três rotas pela URL vão a
  `/acesso-negado`. (O fake tem um único usuário em `/auth/me`, o Lanterna; os fluxos do
  Guardião ficam provados nos testes de Action e componente.)
- `scripts/contrato/servidor.mjs`: parâmetro de rota inteiro/número agora é convertido antes da
  validação (`/^-?\d+(\.\d+)?$/`), senão `/setores/{id}` sempre dava 400; teste novo em
  `scripts/contrato/servidor.test.mjs` (8/8).

**Arquivos dos workers:**
- Setores: `lib/setores.ts` (+`criarSetor`, `editarSetor`, `excluirSetor`), `lib/schemas/setor.ts`
  (+`setorFormularioSchema`, `edicaoSetorSchema`), `app/(painel)/painel/setores/{page,actions,loading,error}.tsx|ts`,
  `_components/{FormSetor,ExcluirSetor}.tsx`, testes `__tests__/{acoes/gestao-setores.test.ts,components/gestao-setores.test.tsx,lib/setores-gestao-contrato.test.ts}`.
- Lanternas: `lib/lanternas.ts` (+`criarLanterna`, `editarLanterna`, `alterarStatusLanterna`),
  `lib/schemas/gestao-lanterna.ts`, `app/(painel)/painel/lanternas/{page,actions,loading,error}`,
  `_components/{FormLanterna,StatusLanterna}.tsx`, testes `__tests__/{acoes/gestao-lanternas.test.ts,components/gestao-lanternas.test.tsx,lib/lanternas-gestao-contrato.test.ts}`.
- Usuários: `lib/gestao-usuarios.ts`, `lib/schemas/gestao-usuario.ts`,
  `app/(painel)/painel/usuarios/{page,actions,loading,error}`, `_components/{FormPapel,FormVinculo}.tsx`,
  testes `__tests__/{acoes/gestao-usuarios.test.ts,components/gestao-usuarios.test.tsx,lib/gestao-usuarios-contrato.test.ts}`.

**Atualização (2026-11-11, noite):** revisão feita por três workers Flash (run `run_0890d445e0de`:
Setores ganhou `h1` com `CabecalhoPagina` e `EstadoVazio`; Usuários passou a descartar `setorId` com
destino `guardiao` e a omiti-lo em "Manter o setor atual"; Lanternas ganhou testes de 401, 403, Setor 0
e Ficha inexistente) e conferida pelo coordenador (`exigirPapel` na primeira linha, `redirect` fora do
`try`, `revalidatePath`). Docs atualizadas (plano, TELAS, MAPA, índice). Verificação completa:
unit 527/527 (71 arquivos), lint 0, `tsc` 0, servidor falso 8/8, build ok, e2e 24/24. Commit e PR
draft empilhado sobre #17. Pendência: o `TELAS.md` pede "carga de cada um" na gestão de Lanternas, que
o Apêndice A não especificou; fica para o Corte 1 (o contrato da lista não traz carga).

### Próximos passos de FE-08 (em ordem, concluídos)

1. **Revisar os diffs** contra o Apêndice A e o padrão das tarefas anteriores. Pontos que
   costumam falhar nos workers:
   - `await exigirPapel('guardiao')` na primeira linha de **toda** página e Action, antes de
     qualquer chamada à API;
   - `redirect()` fora do `try`; `revalidatePath` certos (Setores também `/lanternas` e
     `/cadastro`; Lanternas também `/lanternas`; Usuários `'/', 'layout'` quando a conta alterada
     é a do próprio Guardião);
   - PATCH só com campos alterados, distinguindo omitido de `null` (`camposAlterados` das
     Lanternas; Setor envia só nome/descrição alterados; "Nada foi alterado.");
   - `alterarStatusLanterna` nunca envia `em_missao`; `setorId` descartado com papel `guardiao`;
     Setor 0 aceito em todos os selects/coerções;
   - códigos de erro no campo certo (tabelas do Apêndice A), 401 → `/sessao-expirada`,
     403 → `/acesso-negado`, 404 → "não existe mais";
   - `lib/setores.ts` e `lib/lanternas.ts` também servem páginas públicas com `revalidate`:
     mutações com Bearer e `no-store`, sem quebrar `listarSetores`/`listarLanternas`;
   - estilo do projeto: 2 espaços, sem ponto e vírgula, uma instrução por linha (o Luna
     costumava compactar código numa linha), acentos corretos, sem CSS novo em `globals.css`.
2. **Verificação completa** no worktree, uma coisa por vez (pouca memória):
   ```bash
   cd /c/Projetos/erp-tropa-fe
   npm run test:run
   npm run lint
   npx tsc --noEmit -p .
   node --test scripts/contrato/servidor.test.mjs
   # se um e2e anterior deixou processo preso, libere as portas 32123 (next start) e 32124 (fake)
   # no PowerShell: Get-NetTCPConnection -LocalPort 32123,32124 -State Listen |
   #   ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
   SITE_URL=http://localhost:3000 npm run build
   SITE_URL=http://localhost:3000 npx playwright test
   ```
   Esperado: 399 testes de antes + os novos (~100), e2e 20 + 4 de `gestao.spec.ts`.
3. **Visual (opcional):** o fake só tem o Lanterna em `/auth/me`, então as páginas de gestão
   mostram o acesso negado. Para ver as telas é preciso um `/auth/me` de Guardião (cenário do
   pacote, se existir, ou a API real).
4. **Documentação:** status FE-08 no `docs/frontend/PLANO-IMPLEMENTACAO.md`; linhas
   Setores, Lanternas (gestão) e Usuários no `docs/frontend/TELAS.md`; entradas no
   `docs/agents/MAPA.md`. `node docs/agents/validar-documentacao.mjs` deve passar.
5. **Commit, push e PR draft** com base `front/fe-07b-minha-fila`, no formato dos anteriores
   (título `feat(front): FE-08 gestão do Guardião (preparação P, aditivo)`, contrato G-1 no corpo,
   comandos e resultados, "não mergear antes do Corte 1"). Rode `git diff --check` antes: linha
   em branco no fim de arquivo bloqueia o commit.
6. Incluir este handoff no commit do FE-08 e linká-lo no índice `docs/README.md`.
7. Liberar os workers restantes: `orca orchestration worker-list --terminal-state reclaimable`
   e liberar cada um (os dois do FE-08 se liberam sozinhos às 23:40Z).

## 4b. Rebase e Corte 1 (2026-11-11, noite)

- Depois do merge de #10 e do back-end corrigido na `main` (`7ee3357`, G-1 revisão 2 `4e5dfad5…33b0`),
  a cadeia #11…#18 foi rebaseada com `git rebase --update-refs origin/main` e publicada com
  `--force-with-lease`. As páginas de ocorrência ficaram com a versão da cadeia e o REF-02
  voltou num commit próprio (`fix(ui-03): reaplica .oa-panel-body`).
- Corte 1 e aditivos ativados (A), com o dev front como responsável pelo aceite. Registro completo em
  [INTEGRACAO §3](../INTEGRACAO.md#registro-de-ativação-a--corte-1-e-aditivos). E2E real:
  `SITE_URL=http://127.0.0.1:32133 npx playwright test -c playwright.corte1.config.ts` (40 passed);
  exige `npm ci` e `npm run build` em `backend/`.
- O manifesto da fixture e as capturas ficam em `.corte1/` (o Playwright limpa `test-results/`).
  O cache de dados do Next sobrevive ao reinício: a configuração do Corte 1 o apaga antes do start.
- Relatórios para a apresentação (fora do repositório): `C:\Projetoselatorios-apresentacao\`.
- Próximo: merge de #11 a #18 em ordem e FE-09/FE-10.

## 5. Depois do FE-08

- FE-09 e FE-10 fecham **depois** dos aditivos e dependem da API real e dos gates G1–G8
  ([plano FE](../frontend/PLANO-IMPLEMENTACAO.md), [INTEGRACAO](../INTEGRACAO.md)). FE-10 é dono
  de `package.json`, `package-lock.json`, `scripts/iniciar.sh` e `db.json`. Não dá para fechar
  só com o fake: pare aqui e combine com o coordenador (Gustavo) o Corte 1.

## 6. Pendências e decisões em aberto

| Item | Dono | Situação |
|---|---|---|
| REF-05 opção 1 (globo interativo) | produto / dev front | aguardando decisão; entregue a opção 2 |
| Rebase da cadeia #11…FE-08 sobre a `main` depois de #10 | dev front | conflito previsto no `oa-panel-body` |
| Cenário `listarMinhaFila.200.vazia` não é vazio | dev back | relatar; e2e usa `…fila-vazia-sem-pendentes` |
| E2E dos fluxos do Guardião | dev back / front | fake tem um só usuário em `/auth/me`; cobrir no Corte 1 ou com cenário de Guardião |
| Corte 1 (FE-01..05 + FE-07a juntos) | coordenador | só com a API real e os gates |

## 7. Ambiente e armadilhas

- Checkout principal: `C:\Projetos\erp-tropa-lanternas-verdes` (está em `front/ui-03-refinamentos`).
  O `next dev` do usuário roda na **:3000 a partir dele**: não derrube nem reinicie.
- Worktree do FE: `C:\Projetos\erp-tropa-fe` (tem cópia do `.env.local`). Build e Playwright
  precisam de `SITE_URL` no ambiente do processo.
- Servidor falso manual: `CONTRATO_PORT=4010 node scripts/contrato/servidor.mjs`. Nos testes:
  `createContractServer({ port })`, `setScenario(id)` vale só para a operação daquele cenário,
  `reset()` volta tudo ao sucesso. Cada arquivo de teste usa porta exclusiva (Vitest 40000–49999;
  e2e 32124, specs em série).
- Máquina com ~3 GB livres: workers **não** rodam `next dev`, `next build`, Playwright nem a
  suíte completa; o coordenador roda build/navegador, um de cada vez.
- Arquivos do repositório são CRLF: normalize antes de substituir texto por script. Heredoc no
  bash come barras invertidas e crases: use Edit/Write ou arquivos.
- Capturas de tela usaram `playwright-core` com scripts no scratchpad da sessão anterior
  (`pw/captura.mjs`, `recorte.mjs`), que pode ter sido apagado; refaça se precisar.

## 8. Lições da orquestração (Orca)

- Run `run_db74b72324af`. Seletores: `--agent codex --model gpt-6-luna`,
  `--agent antigravity --model gemini-3.8-flash-high`, `--agent claude --model haiku`;
  worktree `--worktree "path:C:\\Projetos\\erp-tropa-fe"`.
- **Luna (Codex):** gravou arquivos em Latin-1 (U+FFFD), dupla codificação ("nÃ£o"), código
  compactado numa linha, desistiu cedo; às vezes o rascunho fica parado e precisa de
  `orca terminal send --terminal <h> --enter`. Cota mensal do Codex estava em ~40%. Use só
  para tarefas pequenas e confira a codificação.
- **Flash (Antigravity):** melhor custo-benefício para UI e testes com especificação fechada
  (posse de arquivos explícita, contrato resumido, aceite com comandos).
- **Haiku:** documentação e tarefas mecânicas.
- Schemas Zod, serviços `lib/*`, Actions e regras de permissão: o coordenador escreve ou
  reescreve. Sempre conferir UTF-8 com node depois de cada worker.
- Formato de especificação que funcionou: arquivo comum (contexto, padrões a copiar, regras,
  aceite) + um arquivo por worker (POSSE, CONTRATO, IMPLEMENTAR, TESTES MÍNIMOS). O Apêndice A
  reproduz os do FE-08.

## Apêndice A. Especificações do FE-08 entregues aos workers

### A.0 Contexto comum

Worktree `C:\Projetos\erp-tropa-fe`, branch `front/fe-08-gestao` (contém FE-00..FE-07b).
Português do Brasil, UTF-8 sem BOM, 2 espaços, sem ponto e vírgula, uma instrução por linha.
Ler antes: `AGENTS.md`; plano FE seção FE-08; `docs/frontend/TELAS.md` (Setores, Lanternas
(gestão), Usuários); `docs/backend/API.md` (rotas de gestão); `docs/backend/REGRAS-DE-NEGOCIO.md`
(RN-31, RN-34, papel/vínculo); skill `frontend-web` e as regras AUTH-05, AUTH-06, API-12, API-14,
API-18, API-19, FORM-01, FORM-08, FORM-09, FORM-17, FORM-18, FORM-19, ROTA-20, ROTA-21.
Modelos de padrão (copiar a estrutura, não editar): `lib/ocorrencias.ts`,
`app/(painel)/painel/ocorrencias/actions.ts`, `_components/{FormEditarOcorrencia,ConfirmarExclusao}.tsx`
(RHF com `useForm<z.input, unknown, z.output>`, confirmação `alertdialog`), `loading`/`error` de
ocorrências, `components/{Paginacao,EstadoVazio,CampoTexto,CampoSelect,MensagemErro}.tsx`,
`components/oanet/PainelOa.tsx`, `lib/api.ts`, `lib/api-error.ts`, `lib/dal.ts`. Testes contra o
fake seguem `__tests__/lib/ocorrencias-contrato.test.ts` (porta exclusiva, `@/lib/env` mockado
com getter, `lerTokenObrigatorio` mockado).

Regras gerais: `await exigirPapel('guardiao')` na primeira linha de página e Action. PATCH só com
o que mudou, distinguindo omitido de `null`. Erros de domínio em português via `MENSAGENS_CODIGO`;
códigos de campo vão ao campo; 401 → `/sessao-expirada`, 403 → `/acesso-negado`, 404 → "não
existe mais". Formulário preserva valores após erro. Quatro estados em cada lista. Sem CSS novo,
sem dependência nova, sem editar `app/(painel)/layout.tsx` nem `navegacao.ts`, sem commit.

### A.1 Setores

- Contrato: `GET /setores` (público, sem paginação). `POST /setores` (G) `{ id 0..9999, nome 2..60,
  descricao 10..300 }` → 201; 409 `SETOR_JA_CADASTRADO`. `PATCH /setores/{id}` (G) `{ nome?, descricao? }`
  minProperties 1 → 200; 404. `DELETE /setores/{id}` (G) → 204; 409 `SETOR_EM_USO` com Lanternas,
  Ocorrências (inclusive excluídas) ou Usuários ligados (RN-31).
- `setorFormularioSchema`: id `z.coerce` int 0..9999 (Setor 0 válido; '' → "Informe o número do
  setor."), nome trim 2..60, descricao trim 10..300; `edicaoSetorSchema`.
- Página: tabela (número, nome, descrição) em `MolduraOa`; `?editar={id}` mostra o `FormSetor`
  preenchido acima da tabela; `ExcluirSetor` com `alertdialog` por linha; moldura "Novo setor";
  vazio "Nenhum setor cadastrado".
- Actions: `criarSetorAcao`, `editarSetorAcao(id, dados)` ("Nada foi alterado."), `excluirSetorAcao(id)`;
  revalida `/painel/setores`, `/lanternas`, `/cadastro`; 409 `SETOR_JA_CADASTRADO` → campo `id`;
  409 `SETOR_EM_USO` → erro geral "Este setor tem lanternas, ocorrências ou contas ligadas e não
  pode ser removido."; 404 → "Este setor não existe mais."
- Testes mínimos: contrato (201, 409 duplicado, PATCH só campos enviados, 204, 409 em uso);
  Actions (Lanterna barrado sem chamar a API, validação, Setor 0, duplicado no campo, em uso
  geral, nada alterado, 401/403); componentes (lista, vazio, erros associados, botão desabilitado
  ao enviar, confirmação com Escape e foco devolvido).

### A.2 Lanternas (gestão)

- Contrato: `POST /lanternas` (G) `{ id slug, codinome 2..60, especie 2..50, planetaNatal 2..60,
  identidadeCivil 2..80|null, setorId int|null, anoIngresso 1900..2100|null, primeiraAparicao ≤300|null,
  habilidades ≤10 itens 2..60, mentorId slug|null, citacao ≤15 palavras|null, biografia ≤1200|null, fontes }`
  → 201; 404 setor; 409 `LANTERNA_JA_CADASTRADA`; 422 `MENTOR_INVALIDO`. `PATCH /lanternas/{id}`
  (mesmos campos sem id, opcionais, minProperties 1; `fontes` enviado substitui o objeto) → 200;
  409 `LANTERNA_EM_USO` ao trocar/anular `setorId` com conta vinculada ou Ocorrência, inclusive
  histórica/excluída (RN-34); 422 `MENTOR_INVALIDO`. `PATCH /lanternas/{id}/status`
  `{ status: 'ativo'|'afastado' }` → 200; 409 `LANTERNA_EM_MISSAO` (`em_missao` é calculado e nunca
  enviado). Não existe DELETE de Lanterna.
- `lanternaFormularioSchema` (vazios opcionais → null; habilidades por vírgula ou linha, trim,
  ≤10; citação ≤15 palavras) e `camposAlterados(atual, novo)`.
- Página: `listarLanternas` com busca/status/setor/página na URL (`filtroLanternasSchema`,
  `Paginacao`), `listarSetores`, `listarTodosLanternas` (mentor). Tabela: codinome (Link para a
  Ficha pública), setor, status com texto, ano de ingresso, "Editar" (`?editar={slug}` com
  `buscarLanterna`) e `StatusLanterna` ("Afastar"/"Reativar"; em missão desabilitado com
  "Em missão: o status muda quando a missão terminar"). Moldura "Nova Ficha".
- Actions: `criarLanternaAcao`, `editarLanternaAcao(slug, dados)`, `alterarStatusLanternaAcao(slug, status)`;
  revalida `/painel/lanternas` e `/lanternas`; 409 `LANTERNA_JA_CADASTRADA` → `id`; 422
  `MENTOR_INVALIDO` → `mentorId`; 404 setor → `setorId`; 409 `LANTERNA_EM_USO` → `setorId`
  preservando o valor digitado; 409 `LANTERNA_EM_MISSAO` → erro geral.

### A.3 Usuários

- Contrato: `GET /usuarios` (G) `{ busca ≤100 (nome ou e-mail, como digitado), pagina, limite ≤50,
  ordenar nome|criadoEm, ordem }` → página de `{ id, nome, email, papel, lanternaId, setorId, criadoEm }`.
  `PATCH /usuarios/{id}/papel` `{ papel, setorId? }` (setorId só com destino `lanterna`; com
  `guardiao` é 400; omitido preserva) → 404 conta; 409 `ULTIMO_GUARDIAO`; 404 setor; 422
  `SETOR_OBRIGATORIO`; 422 `SETOR_DIFERENTE`. `PATCH /usuarios/{id}/lanterna` `{ lanternaId: slug|null }`
  → 404 Ficha; 422 `VINCULO_NAO_PERMITIDO`; 422 `SETOR_DIFERENTE`; 409 `LANTERNA_JA_VINCULADA`.
- Página: busca e ordenação na URL, `Paginacao`; tabela com nome, e-mail, papel, setor, Ficha
  vinculada (codinome ou "Sem vínculo") e "Gerenciar" (`?conta={id}`) que mostra `FormPapel` e
  `FormVinculo` acima da tabela ("Conta não encontrada nesta página" se fora da página). Vazio:
  "Nenhuma conta encontrada" (com busca) / "Nenhuma conta cadastrada".
- `FormPapel`: setor só para destino `lanterna`, com "Manter o setor atual" (= omitir).
  `FormVinculo`: "Sem vínculo" desvincula; lista só Fichas do setor da conta quando houver.
- Actions: `alterarPapelAcao(id, dados)`, `vincularLanternaAcao(id, dados)`; sucesso →
  `revalidatePath('/painel/usuarios')` e `redirect('/painel/usuarios?conta=' + id)`; própria conta →
  também `revalidatePath('/', 'layout')`. `ULTIMO_GUARDIAO` → geral; `SETOR_OBRIGATORIO`/
  `SETOR_DIFERENTE` no papel → `setorId`; `VINCULO_NAO_PERMITIDO`/`SETOR_DIFERENTE`/
  `LANTERNA_JA_VINCULADA` → `lanternaId`; 404 → "Esta conta ou Ficha não existe mais."
