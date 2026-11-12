# Central de Oa: Tropa dos Lanternas Verdes

Sistema web da Tropa para registrar, acompanhar e atribuir ocorrências intergalácticas. Trabalho da disciplina Desenvolvimento Web (React e Next.js, Prof. Wellington), em duas partes: o **front-end** (Next.js) e o **back-end** (NestJS + TypeORM + SQLite).

## Estado do projeto

O front e a API NestJS reais (`backend/`) estão integrados. O json-server e o `db.json` foram removidos: o front não usa mais servidor de demonstração. Esta tabela diz o que existe hoje; estado conferido em 2026-11-11.

| Parte | Estado |
|---|---|
| Front-end Next.js (site público e painel) | **Pronto e ligado à API NestJS real**, sem json-server |
| Integração front ↔ API (Corte 1 e aditivos) | **Ativada (A) em 2026-11-11**: login com JWT em cookie `httpOnly` no servidor do Next, cadastro, catálogo, ocorrências, dashboard, Minha fila, gestão, linha do tempo e comentários ([registro](docs/INTEGRACAO.md#registro-de-ativação-a--corte-1-e-aditivos)) |
| UI OANET oficial (D28) | Concluída em todas as 12 rotas existentes (UI-01 e UI-02.00 a UI-02.12 integradas à `main`); refinamentos em [HANDOFF-UI-02](docs/agents/HANDOFF-UI-02.md) |
| Back-end NestJS (`backend/`) | **Implementado** (BE-01 a BE-12): 30 operações do contrato, SQLite/TypeORM, JWT, seeds e testes. Auditado em 2026-11-11 ([relatórios](docs/relatorios/README.md)); os defeitos encontrados no back foram corrigidos |
| Limpeza e E2E real (FE-09 e FE-10) | **Concluídos** na branch `front/fe-09-10-entrega`: json-server, `db.json` e `SESSION_SECRET` removidos; `npm run test:e2e:real` roda contra a API real. Aceite final **G9** ainda pendente até a execução registrada em [INTEGRACAO](docs/INTEGRACAO.md) |
| Planos separados e contrato v1 (DOC-03) | Consolidados, revisados e com aceite técnico documental G-1; implementação do front autorizada em 2026-11-10 pelo plano FE; o back foi implementado em `backend/` |

Documentação completa em [docs/README.md](docs/README.md).
Planejamento atual: [plano por frente](docs/PLANO.md). A [DOC-03](docs/agents/DOC-03-PLANEJAMENTO.md) está concluída; a implementação do front está autorizada desde 2026-11-10 e segue o [plano FE](docs/frontend/PLANO-IMPLEMENTACAO.md). O contrato consumível está identificado em [G-1](docs/INTEGRACAO.md#g-1--aceite-do-contrato).
A UI-01 (casca OANET) e toda a suíte UI-02 (UI-02.00 a UI-02.12, PRs #1, #2, #3, #6, #7 e #8) foram concluídas e integradas à `main`. O [handoff UI-02](docs/agents/HANDOFF-UI-02.md) traz o relatório de entrega e revisões, e o [handoff OANET](docs/agents/HANDOFF-OANET.md) preserva o histórico da transferência inicial da UI-01.
Todo design novo parte de [docs/UI.md](docs/UI.md) e dos assets em código do laboratório.

## Guia para os dois desenvolvedores

1. Ambos leem o [plano geral](docs/PLANO.md), o [pacote de contrato](docs/contratos/README.md) e o [acordo de integração](docs/INTEGRACAO.md).
2. O dev de front segue [PLANO-IMPLEMENTACAO do front](docs/frontend/PLANO-IMPLEMENTACAO.md): UI OANET e preparação das funcionalidades contra o contrato, com simulações restritas ao ambiente de desenvolvimento/teste.
3. O dev de back segue [PLANO-IMPLEMENTACAO do back](docs/backend/PLANO-IMPLEMENTACAO.md): API NestJS, migrations e testes do provedor, usando o mesmo contrato, sem esperar telas prontas.
4. A primeira ativação reúne todos os consumidores existentes no **Corte 1**, depois das evidências de cada frente. Histórico/comentários, fila e gestão entram como incrementos aditivos. Simulação aprovada não equivale a integração real; persistência, sessão e permissões são verificadas contra a API.

A ativação do back real no app é um corte integrado único (login, cadastro, catálogo, ocorrências e dashboard juntos), seguido de recursos aditivos; ver [INTEGRACAO](docs/INTEGRACAO.md). Cada tarefa tem um responsável por arquivo. Contratos mudam nos dois lados no mesmo incremento. O back-end está em `backend/` e cumpre o contrato; a ligação do front a ele foi ativada no Corte 1 (2026-11-11). O servidor falso de contrato (FE-00, `npm run contrato:servidor`) continua disponível para testes de consumidor, sem substituir a API real.

### Pastas da documentação

| Pasta | Para que serve | Entrada |
|---|---|---|
| `docs/` | Índice, sequência de trabalho, contrato visual e integração | [Índice completo](docs/README.md), [PLANO](docs/PLANO.md) |
| `docs/agents/` | Instruções de execução, mapa do código, escopo e passagem de tarefas | [Guia de agentes](docs/agents/README.md) |
| `docs/agents/revisoes/` | Achados, decisões e provas de correção das revisões documentais | [Índice de revisões](docs/agents/revisoes/README.md) |
| `docs/contratos/` | OpenAPI, exemplos de requisição/resposta e verificação de compatibilidade documental | [Contrato v1](docs/contratos/README.md) |
| `docs/contratos/exemplos/` | Fixtures sintéticas por operação para os dois desenvolvedores | [Guia do contrato](docs/contratos/README.md) |
| `docs/backend/` | Decisões, regras, dados, API, DTOs, seed, cenários e plano do dev de back | [Plano BE](docs/backend/PLANO-IMPLEMENTACAO.md) |
| `docs/frontend/` | Arquitetura, inventário de telas, migração e plano do dev de front | [Plano FE](docs/frontend/PLANO-IMPLEMENTACAO.md) |
| `docs/adr/` | Decisões de arquitetura e consequências | [JWT no servidor Next](docs/adr/0001-token-jwt-fica-no-servidor-do-next.md) |
| `docs/research/` | Pesquisa com fontes e recomendações; não substitui contratos/decisões | [Documentação para agentes](docs/research/2026-11-09-documentacao-para-agentes.md) |
| `docs/research/lanternas/` | Pesquisa aceita para converter os 25 Lanternas no seed | [Especificação do seed](docs/backend/SEED.md) |
| `docs/design/` | Estudos e evidências visuais organizados por direção | [Contrato visual](docs/UI.md) |
| `docs/design/oanet/` | Histórico do design aprovado e registros da implementação visual | [Índice OANET](docs/design/oanet/README.md) |
| `docs/design/oanet/verificacao/` | Capturas e resultados datados de inspeção; não são assets da aplicação | [Registro de movimento](docs/design/oanet/movimento-cinematografico.md) |
| `docs/superpowers/` | Specs e planos históricos agrupados | [Índice e autoridade](docs/README.md) |
| `docs/superpowers/specs/` | Specs históricas; decisões recentes prevalecem em caso de divergência | [Índice e autoridade](docs/README.md) |
| `docs/superpowers/plans/` | Planos históricos de incrementos; o plano ativo é `docs/PLANO.md` | [Plano do laboratório](docs/superpowers/plans/2026-11-06-laboratorio-oanet.md) |

## Como executar

### Pré-requisitos

- Node.js 26 ou mais novo, npm e Git.
- Para verificar o pacote documental de contratos: Python 3.10+ (neste Windows, `py -3`), sem bibliotecas adicionais; [comandos e limites](docs/contratos/README.md#verificação-documental).

```bash
node --version
```

### Atalho: `npm run iniciar` (Bash: Git Bash, WSL, macOS, Linux)

`scripts/iniciar.sh` faz tudo na ordem: checa Node 26 ou mais novo; instala as dependências da raiz e de `backend/`; cria `.env.local` e `backend/.env` (com `JWT_SECRET` aleatório) se faltarem; compila o back; roda as migrations e o seed completo (idempotente); e sobe a API em `http://localhost:3001` e o Next em `http://localhost:3000` juntos.

```bash
npm run iniciar
```

### Passo a passo manual (PowerShell)

Gere um segredo para o `JWT_SECRET` com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` (64 caracteres, acima do mínimo de 32).

Terminal 1, back-end (a partir da raiz do repositório):

```powershell
cd backend
Copy-Item .env.example .env     # troque JWT_SECRET pelo segredo gerado
npm install
npm run build
npm run migration:run
npm run seed -- --etapa completa
npm start                       # http://localhost:3001 (GET /saude confirma)
```

Terminal 2, front-end (a partir da raiz do repositório, não de `backend/`):

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev                     # http://localhost:3000
```

`.env.local` e `backend/.env` ficam fora do Git. O front lê `API_URL=http://localhost:3001` e `SITE_URL=http://localhost:3000` de `.env.example`.

### Contas de demonstração

O seed completo cria estas contas (senhas só para uso local; ver [backend/README.md](backend/README.md)):

| Usuário | Papel | Setor | E-mail | Senha |
|---|---|---|---|---|
| Ganthet | Guardião | todos | `ganthet@oa.tropa` | `guardiao123` |
| Hal Jordan | Lanterna | 2814 | `hal@oa.tropa` | `lanterna123` |
| Kilowog | Lanterna | 674 | `kilowog@oa.tropa` | `lanterna123` |

A sessão é o JWT emitido por `POST /auth/login` da API, guardado em cookie `httpOnly` pelo servidor do Next (ver [ADR 0001](docs/adr/0001-token-jwt-fica-no-servidor-do-next.md)). Para testes manuais de escrita, use um banco próprio por `DATABASE_PATH`, conforme o [guia de agentes](docs/agents/README.md#estado-local-servidores-e-dados).

### Testes do back-end

`npm test` (unitários) e `npm run test:e2e` (sobem a API em porta livre com SQLite temporário; não tocam no seu banco). O back isolado exige Node `^22.13` ou `>=24.11`; o atalho e o front exigem Node 26.

## Páginas

| Rota | Acesso | Função |
|---|---|---|
| `/` | público | Apresentação da Central de Oa |
| `/lanternas`, `/lanternas/[id]` | público | Lista de Lanternas e Ficha |
| `/sobre` | público | Oa, a Tropa e o juramento |
| `/login` | público | Entrada na Central de Comando |
| `/painel` | autenticado | Resumo das ocorrências |
| `/painel/ocorrencias` | autenticado | Lista com filtros |
| `/painel/ocorrencias/nova` | autenticado | Registrar ocorrência |
| `/painel/ocorrencias/[id]` | autenticado | Detalhe e mudança de status |
| `/painel/ocorrencias/[id]/atribuir` | Guardião | Atribuir responsável |
| `/laboratorio` | público | Laboratório do redesign (dados ilustrativos) |

O mapa completo das telas atuais e planejadas está em [docs/frontend/TELAS.md](docs/frontend/TELAS.md).

## Scripts

| Comando | Função |
|---|---|
| `npm run iniciar` | Atalho em Bash: prepara e sobe a API (3001) e o Next (3000) juntos |
| `npm run dev` | Next.js em desenvolvimento (porta 3000), precisa da API rodando |
| `npm run build` | Build de produção do front |
| `npm start` | Servidor de produção do front (após `npm run build`) |
| `npm run test:run` | Vitest uma vez |
| `npm test` | Vitest em observação |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright contra o servidor falso de contrato (`scripts/contrato/`), sem API real |
| `npm run test:e2e:real` | Playwright contra a API NestJS real; exige `npm run build` do back (`backend/`) e do front, e a API rodando com o banco migrado e semeado |
| `npm run contrato:servidor` | Servidor falso de contrato, para testes de consumidor |

Antes de um commit: `npm run test:run`, `npm run lint` e `npm run build`. Para a integração, rode também `npm run test:e2e:real`.

## Estrutura

- `app/(site)`: páginas públicas, login e acesso negado.
- `app/(painel)`: painel protegido.
- `app/laboratorio`: laboratório do redesign.
- `components`: componentes compartilhados, `ui/` (shadcn sobre Base UI) e `oanet/` (redesign).
- `lib`: camada de dados (HTTP, sessão, autorização, schemas Zod, formatação).
- `__tests__`: testes Vitest.
- `backend/`: API NestJS (TypeORM, SQLite, JWT), consumida pelo front em `lib/api.ts`.
- `.claude/skills/frontend-web` e `.claude/skills/backend-api`: regras de código de cada lado.
- `docs`: documentação do projeto.

## Limitações conhecidas

- O front exige `API_URL` e `SITE_URL` no ambiente (`lib/env.ts` valida ao iniciar); sem a API no ar, as telas mostram erro, sem dados de demonstração.
- O banco é um arquivo SQLite local, configurado por `DATABASE_PATH`. Não há deploy, réplica nem migração para outro banco.
- As senhas de demonstração do seed são públicas neste README e servem só para uso local.
- O seed demonstrativo grava no banco apontado por `DATABASE_PATH`. Testes de escrita usam um banco próprio, separado do de demonstração.
- O aceite final G9 (E2E real, remoção da demonstração e instalação limpa) ainda depende da execução registrada em [INTEGRACAO](docs/INTEGRACAO.md).
