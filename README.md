# Central de Oa: Tropa dos Lanternas Verdes

Sistema web da Tropa para registrar, acompanhar e atribuir ocorrências intergalácticas. Trabalho da disciplina Desenvolvimento Web (React e Next.js, Prof. Wellington), em duas partes: o **front-end** (Next.js) e o **back-end** (NestJS + TypeORM + SQLite).

## Estado do projeto

O projeto está **em migração** de uma API de demonstração (json-server) para um back-end real. Esta tabela diz o que existe hoje e o que está planejado; só o que está em "Pronto" funciona neste repositório.

| Parte | Estado |
|---|---|
| Front-end Next.js (site público e painel) | Pronto, ainda consumindo o json-server |
| UI OANET oficial (D28) | Base aprovada e implementada em `/laboratorio`; adoção nas rotas reais em migração |
| Back-end NestJS (`backend/`) | Documentado, **ainda não implementado** |
| Migração do front para a API real | Planejada, depois do back-end |
| Features novas (linha do tempo, comentários, dashboard, fila, Ficha completa) | Especificadas, ainda não implementadas |

Documentação completa em [docs/README.md](docs/README.md).
Continuação da implementação: [handoff OANET](docs/agents/HANDOFF-OANET.md).
Todo design novo parte de [docs/UI.md](docs/UI.md) e dos assets em código do laboratório.

## Pré-requisitos

- Node.js 26 ou mais novo, npm e Git.

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

O json-server grava em `db.json`. Para descartar alterações de uma demonstração: `git restore db.json` (só se não houver alterações suas para manter).

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
