# Central de Oa: Tropa dos Lanternas Verdes

Sistema web da Tropa para registrar, acompanhar e atribuir ocorrências intergalácticas. Trabalho da disciplina Desenvolvimento Web (React e Next.js, Prof. Wellington), em duas partes: o **front-end** (Next.js) e o **back-end** (NestJS + TypeORM + SQLite).

## Estado do projeto

O projeto está **em migração** de uma API de demonstração (json-server) para um back-end real. Esta tabela diz o que existe hoje e o que está planejado; só o que está em "Pronto" funciona neste repositório.

| Parte | Estado |
|---|---|
| Front-end Next.js (site público e painel) | Pronto, ainda consumindo o json-server |
| UI OANET oficial (D28) | Concluída em todas as 12 rotas existentes (UI-01 e UI-02.00 a UI-02.12 integradas à `main`); refinamentos em [HANDOFF-UI-02](docs/agents/HANDOFF-UI-02.md) |
| Back-end NestJS (`backend/`) | Documentado, **ainda não implementado** |
| Migração do front para a API real | Preparação independente por contrato; ativação após aceite da API |
| Features novas (linha do tempo, comentários, dashboard, fila, Ficha completa) | Especificadas, ainda não implementadas |
| Planos separados e contrato v1 (DOC-03) | Consolidados, revisados e com aceite técnico documental G-1; implementação do front autorizada em 2026-11-10 pelo plano FE, back ainda planejado |

Documentação completa em [docs/README.md](docs/README.md).
Planejamento atual: [plano por frente](docs/PLANO.md). A [DOC-03](docs/agents/DOC-03-PLANEJAMENTO.md) está concluída; a implementação do front está autorizada desde 2026-11-10 e segue o [plano FE](docs/frontend/PLANO-IMPLEMENTACAO.md). O contrato consumível está identificado em [G-1](docs/INTEGRACAO.md#g-1--aceite-do-contrato).
A UI-01 (casca OANET) e toda a suíte UI-02 (UI-02.00 a UI-02.12, PRs #1, #2, #3, #6, #7 e #8) foram concluídas e integradas à `main`. O [handoff UI-02](docs/agents/HANDOFF-UI-02.md) traz o relatório de entrega e revisões, e o [handoff OANET](docs/agents/HANDOFF-OANET.md) preserva o histórico da transferência inicial da UI-01.
Todo design novo parte de [docs/UI.md](docs/UI.md) e dos assets em código do laboratório.

## Guia para os dois desenvolvedores

1. Ambos leem o [plano geral](docs/PLANO.md), o [pacote de contrato](docs/contratos/README.md) e o [acordo de integração](docs/INTEGRACAO.md).
2. O dev de front segue [PLANO-IMPLEMENTACAO do front](docs/frontend/PLANO-IMPLEMENTACAO.md): UI OANET e preparação das funcionalidades contra o contrato, com simulações restritas ao ambiente de desenvolvimento/teste.
3. O dev de back segue [PLANO-IMPLEMENTACAO do back](docs/backend/PLANO-IMPLEMENTACAO.md): API NestJS, migrations e testes do provedor, usando o mesmo contrato, sem esperar telas prontas.
4. A primeira ativação reúne todos os consumidores existentes no **Corte 1**, depois das evidências de cada frente. Histórico/comentários, fila e gestão entram como incrementos aditivos. Simulação aprovada não equivale a integração real; persistência, sessão e permissões são verificadas contra a API.

A ativação do back real no app é um corte integrado único (login, cadastro, catálogo, ocorrências e dashboard juntos), seguido de recursos aditivos; ver [INTEGRACAO](docs/INTEGRACAO.md). Cada tarefa tem um responsável por arquivo. Contratos mudam nos dois lados no mesmo incremento; o código atual continua com json-server até a troca aceita. Os planos descrevem trabalho futuro, não afirmam que os adaptadores de teste ou o back-end já existem.

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

## Pré-requisitos

- Node.js 26 ou mais novo, npm e Git.
- Para verificar o pacote documental de contratos: Python 3.10+ (neste Windows, `py -3`), sem bibliotecas adicionais; [comandos e limites](docs/contratos/README.md#verificação-documental).

```bash
node --version
```

## Executar o que existe hoje

O front atual usa dois servidores: o Next.js na porta 3000 e o json-server na porta 3001.

```bash
npm install
cp .env.example .env.local     # PowerShell: Copy-Item .env.example .env.local
```

Abra `.env.local` e troque `SESSION_SECRET` por um segredo aleatório. O arquivo é ignorado pelo Git.

Em dois terminais, na raiz:

```bash
npm run api     # json-server em http://localhost:3001
npm run dev     # Next.js em http://localhost:3000
```

Em Bash (Git Bash, WSL, macOS, Linux) o atalho `npm run iniciar` prepara e inicia os dois.

Quando o back-end existir, estas instruções passam a iniciar `backend/` no lugar do json-server, e o `SESSION_SECRET` deixa de existir (a sessão será o JWT da API; ver [ADR 0001](docs/adr/0001-token-jwt-fica-no-servidor-do-next.md)).

### Usuários de demonstração (json-server)

| Usuário | Papel | Setor | E-mail | Senha |
|---|---|---|---|---|
| Ganthet | Guardião | todos | `ganthet@oa.tropa` | `guardiao123` |
| Hal Jordan | Lanterna | 2814 | `hal@oa.tropa` | `lanterna123` |
| Kilowog | Lanterna | 674 | `kilowog@oa.tropa` | `lanterna123` |

O json-server grava em `db.json`. Para testes manuais de escrita, use uma cópia isolada e outra porta, conforme o [guia de agentes](docs/agents/README.md#estado-local-servidores-e-dados). Preserve a persistência compartilhada e as alterações locais.

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
| `npm run dev` | Next.js em desenvolvimento |
| `npm run api` | json-server na porta 3001 (sai com a migração) |
| `npm run test:run` | Vitest uma vez |
| `npm test` | Vitest em observação |
| `npm run lint` | ESLint |
| `npm run build` | Build de produção |
| `npm start` | Servidor de produção (após `npm run build`) |

Antes de um commit: `npm run test:run`, `npm run lint` e `npm run build`.

## Estrutura

- `app/(site)`: páginas públicas, login e acesso negado.
- `app/(painel)`: painel protegido.
- `app/laboratorio`: laboratório do redesign.
- `components`: componentes compartilhados, `ui/` (shadcn sobre Base UI) e `oanet/` (redesign).
- `lib`: camada de dados (HTTP, sessão, autorização, schemas Zod, formatação).
- `__tests__`: testes Vitest.
- `backend/`: API NestJS, a criar.
- `.claude/skills/frontend-web` e `.claude/skills/backend-api`: regras de código de cada lado.
- `docs`: documentação do projeto.

## Limitações conhecidas

Até a migração, o json-server não autentica de verdade e as senhas de demonstração ficam em texto puro em `db.json`. É uma limitação da API de demonstração e some com o back-end real (bcrypt e JWT).
