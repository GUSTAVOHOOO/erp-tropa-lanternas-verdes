# Auditoria: telas do front, documentação e suítes de teste

Data: 2026-11-11. Branch: `integracao/back-front` (HEAD `d859ce5`). Auditor: somente leitura no repositório; nenhum arquivo do repositório foi editado; nenhum servidor de longa duração foi iniciado.

Escopo e limites: `next build`/`next dev` não rodados; e2e do back não rodados (ver seção 4); Python ausente (validador de contrato `docs/contratos/validar.py` não rodado); navegador não usado (contraste, foco visível, 375 px, movimento reduzido e leitor de tela ficaram NÃO VERIFICADO).

---

## 1. Resumo

- Front: 13 rotas `page.tsx`, todas documentadas em `docs/frontend/TELAS.md` (Atuais). Nenhuma rota existente fica sem documentação. Todas as telas existentes consomem o **json-server** (`API_URL=http://localhost:3001`). Nenhuma tela está ligada à API NestJS.
- Estados: todas as telas com dados têm carregando (`loading.tsx`), erro (`error.tsx`) e vazio, exceto onde indicado. Formulários têm validação Zod cliente+servidor, erro por campo (`aria-invalid`, `aria-describedby`, `role="alert"`) e estado de envio.
- Telas e funções planejadas e ausentes: `/cadastro`, `/painel/minha-fila`, `/painel/lanternas`, `/painel/setores`, `/painel/usuarios`, comentários, linha do tempo, edição/exclusão de ocorrência, status da Lanterna. Quase todos os endpoints do back ainda não têm tela. Isso está previsto no plano FE (FE-02 a FE-08).
- Suítes: tsc OK (exit 0), eslint OK (exit 0), vitest OK (40 arquivos, 204 testes). Jest do back: exit 1, com 1 falha de timeout em e2e, porque `npm test` executa os e2e (achado P2).
- Documentação: 543 links relativos verificados, 0 quebrados (4 falsos positivos do meu regex, confirmados existentes). Há conflito de merge commitado em `docs/frontend/TELAS.md`. Há contradições graves de estado entre README, AGENTS.md, docs/README.md, docs/PLANO.md e docs/UI.md.
- Achados por severidade: P0: 0. P1: 1 (senha em texto puro, declarada como limitação da demo). P2: 8. P3: 12.

---

## 2. Tabela de telas

Legenda: "Esperada" segundo `docs/frontend/TELAS.md`. "OANET" = usa `components/oanet/**` e não componentes legados. Fonte de dados: json-server, salvo indicação.

| Rota | Esperada? | Existe? (arquivo) | OANET? | Carregando / vazio / erro | Fonte de dados | Observações |
|---|---|---|---|---|---|---|
| `/` | Sim (Atual) | Sim, `app/(site)/page.tsx` | Sim (MolduraOa, CidadeOa) | n/a (estático) / n/a / n/a | nenhuma | CTA "Entrar" aponta para `/painel`; o proxy manda ao login |
| `/sobre` | Sim (Atual) | Sim, `app/(site)/sobre/page.tsx` | Sim | n/a / n/a / n/a | nenhuma | |
| `/lanternas` | Sim (Atual; busca/status/paginação planejados FE-03) | Sim, `app/(site)/lanternas/page.tsx` | Sim (CartaoLanterna, SeloOa) | Sim (`loading.tsx`) / Sim (EstadoVazio com link) / Sim (`error.tsx`) | `GET /setores`, `GET /lanternas?setorId&_sort=nome` (revalidate 60 s) | Só filtro por setor. `?setor=` inválido é ignorado (`.catch(undefined)`) |
| `/lanternas/[id]` | Sim (Atual) | Sim, `app/(site)/lanternas/[id]/page.tsx` | Sim (ConstructoDoLanterna, SeloOa) | Sim (herda `lanternas/loading.tsx`) / n/a / Sim (`error.tsx`; `tratarErroDetalhe` relança não-404) | `GET /lanternas/:id`, `GET /setores` | 404: `notFound()` + `[id]/not-found.tsx`. Sem estatísticas, mentor, aprendizes ou fontes (FE-03) |
| `/login` | Sim (Atual) | Sim, `app/(site)/login/page.tsx` | Sim (FormLogin, BotaoOa) | Envio: "Entrando..." / n/a / Sim (`errors.root`) | `GET /usuarios?email=` (senha no payload) | Sem `loading.tsx` próprio (usa o da raiz). Sem aviso 429 (planejado). Sem link para cadastro |
| `/cadastro` | Sim (Nova, FE-02) | **Não** | — | — | — | Ausente (planejado) |
| `/acesso-negado` | Sim (Atual) | Sim, `app/(site)/acesso-negado/page.tsx` | Sim (PaginaAviso) | n/a | nenhuma | Destino de `exigirPapel` e também do detalhe de outro setor (divergente do contrato: 404, ver P2-9) |
| `/laboratorio` | Sim (referência D28) | Sim, `app/laboratorio/page.tsx` | Sim | n/a | `components/oanet/dados-demo.ts` (sem API) | Permitido pela D28 |
| `/design-system` | Sim (redirect) | Sim, `app/(site)/design-system/page.tsx` | — | n/a | nenhuma | `redirect()` = 307; TELAS diz "permanente" (P3-1) |
| 404 global | Sim | Sim, `app/not-found.tsx` | Sim (`oa-lab` + PaginaAviso) | n/a | nenhuma | |
| `/painel` (Resumo) | Sim (Atual; dashboard FE-07a planejado) | Sim, `app/(painel)/painel/page.tsx` | Parcial: MolduraOa e TabelaOcorrencias OANET; BarraStatus com tokens antigos (P3-2) | Sim (`loading.tsx`) / Sim (EstadoVazio) / Sim (`error.tsx`) | `GET /ocorrencias` (no-store), `/setores`, `/lanternas` | Lanterna restrito ao setor via `setorParaFiltro`. Contagens calculadas sobre a lista completa, não sobre `/dashboard`. Sem "Minha fila" |
| `/painel/ocorrencias` | Sim (Atual) | Sim, `ocorrencias/page.tsx` | Sim | Sim / Sim (com "Limpar filtros" quando há filtro) / Sim | `GET /ocorrencias?setorId&status&gravidade`, `/setores` (só G), `/lanternas` | Filtros na URL. Sem paginação, busca, filtro de responsável ou de vencida (planejado FE-04) |
| `/painel/ocorrencias/nova` | Sim (Atual) | Sim, `ocorrencias/nova/page.tsx` | Sim (CampoTexto, CampoSelect, BotaoOa) | Sim (herda `ocorrencias/loading.tsx`) / Parcial: Guardião sem setores vê select vazio, sem mensagem (P3-7) / Sim | `GET /setores` (só G), POST `/ocorrencias` | Validação Zod (`lib/schemas/ocorrencia.ts`), erro por campo, "Registrando...". Lanterna não escolhe setor (servidor fixa) |
| `/painel/ocorrencias/[id]` | Sim (Atual) | Sim, `ocorrencias/[id]/page.tsx` | Sim (BadgeStatus, BadgeGravidade, MolduraOa) | Sim / n/a / Sim; 404: Sim (`[id]/not-found.tsx`) | `GET /ocorrencias/:id`, `/setores`, `/lanternas`; PATCH via action | Outro setor: redirect a `/acesso-negado` (P2-9). FormStatus com "Status atualizado." e campo de resolução. Sem editar, excluir, eventos, comentários, motivo de reabertura |
| `/painel/ocorrencias/[id]/atribuir` | Sim (Atual; só G) | Sim, `ocorrencias/[id]/atribuir/page.tsx` | Sim (CampoSelect, BotaoOa) | Sim / Sim (sem lanternas no setor) / Sim; 404: Sim; 403: Sim (`exigirPapel` → `/acesso-negado`) | `GET /ocorrencias/:id`, `/lanternas?setorId`; PATCH via action | Lista inclui lanternas afastadas e em missão (P2-5) |
| `/painel/minha-fila` | Sim (Nova, FE-07b) | **Não** | — | — | — | Ausente (planejado) |
| `/painel/lanternas`, `/painel/setores`, `/painel/usuarios` | Sim (Novas, FE-08) | **Não** | — | — | — | Ausentes (planejados) |
| `/sessao-expirada` | Citada em PLANO FE-02 | **Não** | — | — | — | Ausente (planejada) |

Rotas existentes sem documentação em TELAS.md: nenhuma (exceto `/design-system`, documentada como redirect).

---

## 3. Estado de cada tela (TELAS.md)

Classificação: P (planejada), json-server (existe, consome o json-server), API real (ligada ao back).

- Existentes (13 rotas): **json-server** em todas. Nenhuma em API real. A camada `lib/*` faz `fetch` sem envelope `{sucesso,dados}` e sem paginação, o que é compatível apenas com o json-server.
- Planejadas: `/cadastro`, `/painel/minha-fila`, `/painel/lanternas`, `/painel/setores`, `/painel/usuarios`, comentários e linha do tempo (FE-06, sem rota própria na TELAS), dashboard (FE-07a, substitui o Resumo). Estado: **P**.

### Endpoints do back (docs/backend/API.md) sem tela

| Endpoint | Função | Tela no front | Situação |
|---|---|---|---|
| `POST /auth/cadastro`, `GET /auth/me` | Cadastro e sessão | `/cadastro` | P (FE-02). Hoje a sessão é cookie HMAC próprio |
| `GET /usuarios`, `PATCH /usuarios/:id/papel`, `PATCH /usuarios/:id/lanterna` | Gestão de papéis e vínculo | `/painel/usuarios` | P (FE-08) |
| `POST/PATCH/DELETE /setores` | CRUD de Setores | `/painel/setores` | P (FE-08) |
| `POST/PATCH /lanternas`, `PATCH /lanternas/:id/status` | CRUD e status da Lanterna | `/painel/lanternas` | P (FE-08) |
| `GET /ocorrencias/minha-fila` | Fila do Lanterna | `/painel/minha-fila` | P (FE-07b) |
| `GET /dashboard` | Métricas | Resumo (substituto) | P (FE-07a) |
| `GET /ocorrencias/:id/eventos` | Linha do tempo | Detalhe | P (FE-06) |
| `GET/POST /ocorrencias/:id/comentarios`, `DELETE /comentarios/:id` | Comentários | Detalhe | P (FE-06) |
| `PATCH /ocorrencias/:id` | Editar ocorrência | Detalhe | Sem UI (P, FE-05) |
| `DELETE /ocorrencias/:id` | Exclusão (soft delete) | Detalhe | Sem UI (P, FE-05) |
| `PATCH /ocorrencias/:id/responsavel` com `null` | Liberar responsável | Atribuir | Sem UI (P, FE-05) |
| `PATCH /ocorrencias/:id/status` com `motivo` | Reabertura com motivo | Detalhe | Sem campo de motivo (P, FE-05) |
| Paginação, busca e ordenação nas listas | Listas | Lanternas e Ocorrências | P (FE-03/04) |

---

## 4. Resultados dos comandos

| Comando | Onde | Exit | Resultado |
|---|---|---|---|
| `npx tsc --noEmit` | raiz | 0 | Sem erros |
| `npx eslint` | raiz | 0 | Sem saída (sem erros nem avisos). `backend/**` excluído pela alteração não commitada |
| `npm run test:run` | raiz | 0 | 40 arquivos, 204 testes, todos passam. Aviso do jsdom "Not implemented: navigation to another Document" (não falha) |
| `npm test` | backend (Jest) | **1** | 25 suítes: 9 unitárias (`src/**/*.spec.ts`) e **16 e2e** (`test/*.e2e-spec.ts`). Resultado: 24 suítes passam, 1 falha; 91/92 testes. Falha: `test/seed-minimo.e2e-spec.ts:47`, "Exceeded timeout of 20000 ms" (P2-2) |
| `npm run test:e2e` | backend | não executado | Motivo: todos os 16 e2e fixam `PORT: '3001'` (regra do escopo) |
| `git diff --check` | raiz | 0 | Sem saída. Não detecta marcadores já commitados (ver P2-3) |
| `git status --short` | raiz | — | ` M eslint.config.mjs`, ` M vitest.config.mts` (intencionais, conforme o escopo) |
| `next build`, `next dev` | — | não executado | Proibido pelo escopo |
| `python docs/contratos/validar.py` | — | não executado | Python ausente. G-1 (hash) NÃO VERIFICADO |

Incidente do auditor: rodei `npm test` no backend sem perceber que ele incluía os e2e (o regex de `jest.config.json` casa com `*.e2e-spec.ts`). Os e2e passaram, exceto o timeout. Conferência após a execução: nenhum processo escutando na porta 3001; `backend/data/dev.sqlite` com mtime 14:05, anterior às minhas execuções (14:18 em diante). Essa verificação é só por data, não por conteúdo.

Cobertura de testes observada (o que existe):
- Server Actions: `__tests__/acoes/` (login, ocorrências, status/atribuição, sair), com `lib/dal` mockado em todos os 4 arquivos.
- Proxy: `__tests__/proxy.test.ts` (7 casos).
- Páginas síncronas e componentes: `__tests__/app/`, `__tests__/components/`.
- Lacunas: nenhum teste E2E de front (Playwright planejado em FE-00/FE-10). Sem teste direto de `lib/dal.ts` (flags de cookie, redirects). Sem teste do redirect de detalhe de outro setor. Sem teste de envio com exceção da Server Action. O teste de status (`__tests__/acoes/status-atribuicao.test.ts:33-37`) fixa a regra atual (Lanterna altera status no próprio setor), que a API proíbe.

---

## 5. Documentação

Links relativos (regex de links em `*.md`): 543 verificados. Quebrados reais: 0. Os 4 apontados (`docs/agents/MAPA.md:76,107,129`) são falsos positivos do meu regex, por parênteses de grupos de rota (`app/(painel)/...`). Confirmados existentes.

Caminhos em crase: muitos citam arquivos planejados (`cadastro/`, `minha-fila/`, `e2e/`, `src/auth/...`) ou padrões com chaves (`{a,b}.tsx`). Não classifiquei um a um; cada caso precisa ser lido com o plano.

Conflitos e divergências (detalhes nos achados P2-3, P2-6, P2-7):
- `docs/frontend/TELAS.md` tem marcadores de merge.
- `AGENTS.md` diz que a implementação do front está autorizada desde 2026-11-10 e que a próxima linha é a UI-02.01. Isso vale para `main` (`df08c5c`, até UI-02.00). Na branch `integracao/back-front`, UI-02.01 a 02.12 já estão mergeadas (`1dcc81a`).
- `docs/README.md:3`, `docs/PLANO.md:3` e `:76`, `docs/UI.md:9-18` falam em "implementação suspensa" e "só recomeça quando o usuário autorizar". Contradiz `AGENTS.md`, `README.md` e `docs/agents/MAPA.md`.
- `README.md` (tabela "Estado do projeto"): "Back-end NestJS (`backend/`): Documentado, ainda não implementado". Há 127 arquivos `.ts` em `backend/src` (auth, usuarios, setores, lanternas, ocorrencias, eventos, comentarios, dashboard, saude, testing), 9 suítes unitárias em `src` e 16 e2e em `backend/test`. Documento desatualizado.
- `docs/agents/HANDOFF-FRONT.md` é um retrato de 2026-11-10 e se declara datado. Mesmo assim, PRs #4 e #5 já estão em `main`, e o item "próxima UI-02.01" não vale para esta branch.
- `docs/agents/MAPA.md` descreve bem o código atual (json-server, `proxy.ts`, `tratarErroDetalhe`, `CascaOa` no lugar de `MenuNavegacao` e `Marca`). Verificado contra os arquivos.

---

## 6. Lacunas e bugs

Severidade: P0 bloqueia; P1 grave; P2 importante; P3 melhoria. Caminhos relativos à raiz do repositório.

### P1

**P1-1. Senha em texto puro e API sem autenticação (demo).** `lib/usuarios.ts:12-14` devolve o campo `senha` do json-server; `app/(site)/login/actions.ts:24` compara em texto puro; `lib/schemas/usuario.ts:11`; senhas em `db.json`. Declarado em AUTH-11 e no README. Não pode ir a produção. Corrigir na migração para o back (bcrypt, JWT em cookie httpOnly).

### P2

**P2-1. Lacuna de regra no front quanto a transições de status.** `app/(painel)/painel/ocorrencias/actions.ts:46-62` aceita qualquer status do Lanterna no próprio setor, inclusive reabrir `resolvida` para `aberta` e iniciar sem responsável. A matriz de `docs/backend/API.md` diz "sem reabrir", e `PATCH /status` responde 422 `SEM_RESPONSAVEL` e 403 para reabrir por Lanterna. Não há motivo obrigatório. Ocorre hoje, na demo.

**P2-2. `npm test` do back executa os e2e; e os e2e fixam a porta 3001.** `backend/jest.config.json:5` tem `testRegex: ".spec.ts$"`, que casa com `*.e2e-spec.ts` (o `.` aceita o hífen). Resultado: 25 suítes, incluindo 16 e2e. Falha: `backend/test/seed-minimo.e2e-spec.ts:47` (timeout de 20 s; provável lentidão do `spawnSync` com bcrypt, causa NÃO VERIFICADA). Os 16 e2e fixam `PORT: '3001'`, a mesma porta do json-server (`package.json` script `api`) e de `API_URL` (`.env.local`). Correção: `"testRegex": "\\.spec\\.ts$"` no `jest.config.json`.

**P2-3. Marcadores de conflito commitados em `docs/frontend/TELAS.md`.** Linhas 19 (`<<<<<<< HEAD`), 22 (`=======`) e 25 (`>>>>>>> 19d3c92 ...`). A linha 34 tem `<<<<<<< HEAD` sem separador nem fechamento. Presentes no HEAD; o último commit que toca o arquivo é `e26f622`. `git diff --check` não pega porque o conteúdo já está commitado. A tabela de Painel está quebrada, e é a fonte de verdade de telas.

**P2-4. Sem tratamento de exceção no envio dos formulários.** `app/(site)/login/_components/FormLogin.tsx:27`, `app/(painel)/painel/ocorrencias/_components/FormOcorrencia.tsx:29`, `FormStatus.tsx:33` e `FormAtribuir.tsx:29` fazem `await` na action sem try/catch. Em `app/(site)/login/actions.ts:28`, `criarSessao` fica fora do `try`. Sem `SESSION_SECRET`, `lib/sessao.ts` (função `assinar`) lança, a action lança e o usuário não vê mensagem (o botão volta ao normal sem aviso). NÃO TESTADO ao vivo; inferido pelo código.

**P2-5. Atribuição a Lanterna afastado ou em missão.** `app/(painel)/painel/ocorrencias/[id]/atribuir/page.tsx:30` lista todas as lanternas do setor, sem filtrar por status. `actions.ts:79-84` só confere o setor. A API responde 409 `LANTERNA_AFASTADO` (`docs/backend/API.md`, `PATCH /ocorrencias/:id/responsavel`).

**P2-6. Documentação contraditória sobre o estado do front e do back.** Ver seção 5: `README.md` (back "ainda não implementado"), `AGENTS.md` (próxima linha UI-02.01), `docs/README.md:3`, `docs/PLANO.md:3,76`, `docs/UI.md:9-18` (implementação suspensa). Os documentos descrevem o `main`, não a branch `integracao/back-front`. Quem chega pela branch atual recebe instruções erradas sobre o que já foi feito.

**P2-7. Integração front↔back inexistente hoje.** O front espera arrays puros e parâmetros do json-server: `lib/lanternas.ts:11`, `lib/setores.ts:10`, `lib/ocorrencias.ts:20`, `lib/usuarios.ts:14` (`z.array(...)`, `_sort`, `setorId`). O back devolve envelope `{sucesso, dados}` (`backend/src/comum/interceptor-envelope.ts`, pelo código; resposta real NÃO VERIFICADA). As duas APIs usam a porta 3001. Trocar só `API_URL` não integra (o próprio PLANO FE diz isso). Os documentos devem registrar que a integração não existe.

**P2-9. Detalhe de ocorrência de outro setor vai a `/acesso-negado`.** `app/(painel)/painel/ocorrencias/[id]/page.tsx:34` faz `redirect('/acesso-negado')`. O contrato (`docs/backend/API.md`, seção "Mudanças que o front precisa absorver" e RN-05) pede 404. TELAS diz que `/acesso-negado` é só para 403 de papel. Não há teste que fixe o comportamento atual. Hoje P3 pela demo; vira P2 na ativação.

### P3

**P3-1.** `app/(site)/design-system/page.tsx:5` usa `redirect()`, que responde 307. TELAS diz "redirecionamento permanente". `permanentRedirect()` responde 308 (doc `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/redirect.md`, linha 52). Escolher um dos dois e alinhar o texto.

**P3-2.** `components/BarraStatus.tsx:8-10,32,41-44` usa tokens do tema antigo (`bg-primary`, `bg-border`, `text-muted-foreground`, `bg-texto-terciario`) e `IconeStatus`. O plano UI-02.06 pedia adaptação à OANET.

**P3-3.** `components/ui/badge.tsx` e `components/ui/card.tsx` não têm importadores (código morto). O plano UI-02.04 pede remoção sem consumidor.

**P3-4.** `components/EsqueletoLista.tsx:7` põe `aria-label="Carregando"` em `div` sem role. ARIA não permite nome em elemento genérico, então o leitor de tela não anuncia. Usar `role="status"` com texto visível ou `aria-hidden` no esqueleto.

**P3-5.** `lib/schemas/lanterna.ts:18` usa `z.coerce.string()` em `setorId`. `null` vira `"null"`. Hoje não ocorre (`setorId` obrigatório), mas o plano FE-03 exige preservar `null`.

**P3-6.** Textos "Setor {id}" mostram o número e não o nome: `app/(painel)/painel/page.tsx:30`, `ocorrencias/page.tsx:34`, `ocorrencias/nova/page.tsx:19`.

**P3-7.** Guardião sem setores cadastrados: `ocorrencias/nova/page.tsx:8` passa `[]`, e `FormOcorrencia.tsx:43-55` mostra um select vazio sem mensagem. Falta estado vazio com orientação.

**P3-8.** Navegação do visitante (`app/(site)/layout.tsx:10-16`): não há "Entrar" nem "Cadastrar" (TELAS: Visitante). "Central de Comando" aparece para visitante e leva ao login pelo proxy.

**P3-9.** Listas (`painel/page.tsx`, `ocorrencias/page.tsx`, `lanternas/page.tsx`) não tratam 401/403. Só `tratarErroDetalhe` trata nos detalhes. Cairiam no `error.tsx` genérico. Hoje o json-server não devolve 401/403: NÃO EXERCITADO.

**P3-10.** `app/(site)/login/_components/FormLogin.tsx` tem o botão de senha com rótulo fixo "Mostrar senha", mesmo quando a senha já está visível. `aria-pressed` compensa, mas o rótulo deveria mudar para "Ocultar senha".

**P3-11.** `lib/dal.ts` não tem teste direto (flags de cookie, `verificarSessao`, `exigirPapel`). Os testes de action mockam o módulo em todos os casos.

**P3-12.** Não existe teste E2E de front (Playwright planejado em FE-00/FE-10). Sem E2E não há prova de navegação real, de proteção de rota no navegador nem de persistência.

### Lacunas planejadas (não são bugs; estão no plano)

Login sem tratamento de 429; cadastro; minha fila; gestão de Lanternas, Setores e Usuários; comentários; linha do tempo; edição e exclusão de ocorrência; liberação de responsável; reabertura com motivo; paginação, busca e ordenação; `/sessao-expirada`; dashboard. Cada uma está em TELAS.md ou no PLANO FE.

### NÃO VERIFICADO

- Contraste, foco visível, 375 px, tablet, movimento reduzido, modo calmo e aba oculta (exigem navegador).
- Leitor de tela e ordem de tabulação real.
- Comportamento ao vivo do Server Action sem `SESSION_SECRET` (P2-4 é inferência do código).
- Resposta real do back ao front (envelope), porque o back não foi iniciado (P2-7 é inferência do código).
- Validador de contrato e hash G-1 (Python ausente).
- Validade dos 16 e2e do back (não executados individualmente; só pelo `npm test` acima, com 15/16 passando).
- Causa do timeout em `seed-minimo.e2e-spec.ts` (P2-2).
- Artefatos antigos do scratchpad (`api-manual.*`, `audit.sqlite`, `seed-completa.log` etc.) não foram usados nem verificados.

---

## 7. Arquivos

- Relatório: `C:\Users\WINDOW~1\AppData\Local\Temp\claude\8cd59eac40c4f8a6\3a6388e6-5415-483b-898d-e774f1df4cc1\scratchpad\relatorio-front-telas-suites.md`
- Logs das suítes: `C:\Users\WINDOW~1\AppData\Local\Temp\claude\8cd59eac40c4f8a6\3a6388e6-5415-483b-898d-e774f1df4cc1\scratchpad\log-tsc.txt`, `log-eslint.txt`, `log-vitest.txt`, `log-jest.txt`.
- Verificador de links: `C:\Users\WINDOW~1\AppData\Local\Temp\claude\8cd59eac40c4f8a6\3a6388e6-5415-483b-898d-e774f1df4cc1\scratchpad\links.mjs`.
