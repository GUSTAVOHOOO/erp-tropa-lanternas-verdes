# ERP da Tropa dos Lanternas Verdes: design

**Data:** 2026-10-07
**Disciplina:** Desenvolvimento Web com React & Next.js (Prof. Wellington de Souza Ferreira)
**Status:** aguardando revisão do grupo

## 1. Objetivo

Front-end de um "ERP" da Tropa dos Lanternas Verdes para registrar e acompanhar ocorrências
intergalácticas. O trabalho precisa:

- cumprir os requisitos mínimos do enunciado (seção 2);
- aplicar os padrões ensinados em sala, com cada escolha rastreável até um slide, uma doc oficial ou
  uma decisão do grupo, porque o grupo vai explicar o código numa apresentação;
- ser simples e funcional;
- servir de base para a próxima etapa da disciplina (back-end) sem retrabalho nas telas.

**Critério de sucesso:** os 5 requisitos do enunciado e o texto do professor atendidos com evidência
em `docs/AUDITORIA.md` (gerado pela skill `auditoria-apresentacao`), `npm run lint` e
`npm run build` sem erros, e o roteiro de demonstração da seção 10 funcionando de ponta a ponta.

## 2. Requisitos do enunciado

| REQ | Requisito | Onde é atendido |
|---|---|---|
| REQ-01 | Homepage: ponto de entrada, navegação clara | `/` (seção 5.1) |
| REQ-02 | 2+ páginas públicas | `/lanternas`, `/lanternas/[id]`, `/sobre` (seção 5.1) |
| REQ-03 | Área privada protegida | `/painel/*` (seção 5.3) |
| REQ-04 | Login funcional que controla o acesso | `/login` + action `entrar` (seção 6) |
| REQ-05 | Middleware ou equivalente: verificar autenticação, permitir/bloquear, redirecionar ao login | `proxy.ts` + DAL (seção 6) |
| REQ-06 | Componentização, estrutura, estado local, hooks, navegação, pensar no back-end | Projeto inteiro; estado local legítimo no menu mobile; seção 7.4 |

O texto completo dos requisitos fica em
`.claude/skills/auditoria-apresentacao/references/requisitos-enunciado.md`.

## 3. Regras do código

Todas as regras ficam na skill `padroes-wellington` (`.claude/skills/padroes-wellington/`), cada uma
com ID (`FORM-17`, `ROTA-10`...) e fonte etiquetada (`[SLIDE]`, `[DOCS]`, `[DECISÃO]`). O código marca
com `// [ID]` a linha onde a regra é aplicada. Esta spec não repete as regras: cita os IDs.

## 4. Stack

| Item | Escolha | Regra |
|---|---|---|
| Framework | Next.js 16, App Router, TypeScript, Tailwind 4, ESLint, sem `src/` | STACK-01 |
| UI | shadcn/ui sobre Base UI (`npx shadcn@latest init --base base`) | STACK-02 |
| Formulários | react-hook-form + @hookform/resolvers + Zod 4 | STACK-03 |
| API fake | json-server **0.17.4** (fixado; `latest` no npm é beta), porta 3001 | STACK-04 |
| Busca de dados | `fetch` em Server Components; sem Axios e sem TanStack Query | DEC-01, DEC-02 |
| Dependências | lista fechada | STACK-06 |

**Local:** o projeto Next fica na raiz de `TrabalhoWeb/` (o `package.json` mora ao lado de `.claude/`
e `docs/`). Rodar com dois terminais: `npm run api` (json-server) e `npm run dev` (Next).

## 5. Mapa de rotas

```
app/
├── layout.tsx                     <html lang="pt-BR">                               ROTA-05
├── not-found.tsx                  404 global + "Voltar ao início"                   ROTA-22
├── (site)/                        ÁREA PÚBLICA                                      ROTA-04
│   ├── layout.tsx                 header (MenuNavegacao) + rodapé                   ROTA-06
│   ├── page.tsx                   /
│   ├── lanternas/
│   │   ├── page.tsx               /lanternas?setor=2814
│   │   ├── loading.tsx, error.tsx                                                   ROTA-21
│   │   └── [id]/
│   │       ├── page.tsx           /lanternas/hal-jordan
│   │       └── not-found.tsx
│   ├── sobre/page.tsx             /sobre
│   ├── login/
│   │   ├── page.tsx               /login
│   │   ├── actions.ts             entrar()
│   │   └── _components/FormLogin.tsx
│   └── acesso-negado/page.tsx     /acesso-negado                                    AUTH-06
└── (painel)/                      ÁREA PRIVADA
    ├── layout.tsx                 barra lateral: nome, selo do papel, menu, Sair
    ├── actions.ts                 sair()                                            AUTH-09
    └── painel/
        ├── page.tsx               /painel
        ├── loading.tsx, error.tsx
        └── ocorrencias/
            ├── page.tsx           /painel/ocorrencias?status=aberta&setor=2814
            ├── loading.tsx, error.tsx
            ├── actions.ts         registrarOcorrencia, atualizarStatus, atribuirResponsavel
            ├── _components/       FormOcorrencia, FiltroOcorrencias, FormStatus, FormAtribuir
            ├── nova/page.tsx      /painel/ocorrencias/nova
            └── [id]/
                ├── page.tsx       /painel/ocorrencias/o1
                ├── not-found.tsx
                └── atribuir/page.tsx   /painel/ocorrencias/o1/atribuir (só Guardião)

proxy.ts                           o "middleware" do enunciado (Next 16)             AUTH-01
components/  ui/ (shadcn), CampoTexto, CampoSelect, MenuNavegacao, EstadoVazio, TelaDeErro,
             EsqueletoLista, TabelaOcorrencias, BadgeGravidade, BadgeStatus
lib/         api.ts, api-error.ts, resultado-acao.ts, erros-formulario.ts, formatar.ts,
             sessao.ts (assinatura, sem next/*), dal.ts (cookies, verificarSessao, exigirPapel),
             setores.ts, lanternas.ts, usuarios.ts, ocorrencias.ts,
             schemas/ (setor, lanterna, usuario, ocorrencia, login)
__tests__/   testes Vitest (lib, actions, proxy, componentes)
db.json, .env.local, .env.example
```

### 5.1 Área pública

| Rota | Conteúdo | Demonstra |
|---|---|---|
| `/` | Apresentação da Central de Oa; cards para Lanternas, Sobre e Central de Comando | `<Link>`, composição (ROTA-16, COMP-12) |
| `/lanternas` | Grade de cartões; filtro por setor na URL | Server Component + fetch, `searchParams`, 4 estados, loading/error (ROTA-14, API-09, ROTA-21) |
| `/lanternas/[id]` | Ficha: espécie, planeta natal, setor, status | `await params`, `notFound()` (ROTA-10, ROTA-12) |
| `/sobre` | Página estática (Juramento, a Tropa, Oa) | Server Component sem dados, `metadata` (ROTA-07) |

### 5.2 Navegação

- `MenuNavegacao` (`'use client'`): links com `usePathname` + `aria-current` (ROTA-17) e botão de menu
  mobile com `useState`, o uso legítimo de estado local exigido por REQ-06 (COMP-09).
- O link "Central de Comando" aponta sempre para `/painel`. Quem não está logado é redirecionado pelo
  `proxy.ts`. O layout público não lê a sessão.

### 5.3 Área privada

| Rota | Conteúdo |
|---|---|
| `/painel` | Saudação (nome, setor), contadores por status, 5 ocorrências mais recentes, botão "Registrar ocorrência". Lanterna: só o próprio setor; Guardião: todos. |
| `/painel/ocorrencias` | Tabela (título, planeta, setor, gravidade, status, responsável). Filtros na URL: status (todos) e setor (só Guardião). `FiltroOcorrencias` é cliente (`useSearchParams` + `router.push`) dentro de `<Suspense>` (ROTA-14, ROTA-15). Estado vazio com "Limpar filtros". |
| `/painel/ocorrencias/nova` | Formulário de nova ocorrência (seção 8.2). |
| `/painel/ocorrencias/[id]` | Detalhe + formulário de status (seção 8.3). Lanterna de outro setor → `/acesso-negado`. Id inexistente → `not-found.tsx`. Guardião vê "Atribuir responsável". |
| `/painel/ocorrencias/[id]/atribuir` | Só Guardião (`exigirPapel('guardiao')`). Select com os lanternas do setor da ocorrência. |

## 6. Autenticação, papéis e controle de acesso

### 6.1 Login

1. `FormLogin` (cliente): RHF + `zodResolver(loginSchema)`, `mode: 'onBlur'`; `onSubmit` faz
   `await entrar(dados)`.
2. Action `entrar`: `loginSchema.safeParse` → `buscarUsuarioPorEmail` → compara senha → se errado,
   devolve `{ ok: false, erro: 'E-mail ou senha incorretos.' }` (o form mostra com `setError('root')`)
   → `criarSessao` → `redirect('/painel', RedirectType.replace)`.

Regras: AUTH-08, FORM-17, FORM-19, ROTA-19.

### 6.2 Sessão

Cookie `sessao`, `httpOnly`, `sameSite: 'lax'`, 8 horas, assinado com HMAC-SHA256 (`node:crypto`) e
`SESSION_SECRET` do `.env.local`. Conteúdo: `{ id, nome, papel, setorId, lanternaId, expiraEm }`
(`setorId` e `lanternaId` são `null` para o Guardião). Sem senha, sem e-mail. Regras AUTH-02, AUTH-03.

### 6.3 Proteção em três camadas

| Camada | Onde | Comportamento |
|---|---|---|
| Middleware | `proxy.ts`, `matcher: ['/painel/:path*', '/login']` | Sem sessão em `/painel/*` → `/login`. Com sessão em `/login` → `/painel`. |
| Página | `verificarSessao()` / `exigirPapel()` de `lib/dal.ts`, primeira linha de toda `page.tsx` do painel | Sem sessão → `redirect('/login')`; papel errado → `/acesso-negado` |
| Ação | as mesmas funções, primeira linha de toda Server Action do painel | idem |

Regras AUTH-01, AUTH-04, AUTH-05, AUTH-06, AUTH-10.

### 6.4 Papéis

| Ação | Guardião | Lanterna |
|---|---|---|
| Ver ocorrências | todos os setores, filtro por setor | só o próprio setor (filtro vem da sessão, nunca da URL) |
| Registrar ocorrência | em qualquer setor (escolhe no form) | só no próprio setor (campo não aparece; a action usa o setor da sessão) |
| Mudar status | qualquer ocorrência | só do próprio setor |
| Atribuir responsável | sim | não → `/acesso-negado` |

Regra AUTH-07. Esconder botões é conveniência; a checagem real está na página e na action.

### 6.5 Sair

`<form action={sair}>` no layout do painel; `sair()` apaga o cookie e faz `redirect('/login')` (AUTH-09).

### 6.6 Usuários de demonstração

| Usuário | Papel | Setor | E-mail / senha |
|---|---|---|---|
| Ganthet | Guardião | (todos) | `ganthet@oa.tropa` / `guardiao123` |
| Hal Jordan | Lanterna | 2814 | `hal@oa.tropa` / `lanterna123` |
| Kilowog | Lanterna | 674 | `kilowog@oa.tropa` / `lanterna123` |

## 7. Dados e camada de serviço

### 7.1 Coleções do `db.json`

```
setores      { id: "2814", numero: 2814, nome: "Setor 2814", descricao }
lanternas    { id: "hal-jordan", nome, especie, planetaNatal, setorId,
               status: "ativo" | "em_missao" | "afastado" }
usuarios     { id: "u1", nome, email, senha, papel: "guardiao" | "lanterna",
               setorId: string | null, lanternaId: string | null }
ocorrencias  { id: "o1", titulo, descricao, planeta, setorId,
               gravidade: "baixa" | "media" | "alta" | "critica",
               status: "aberta" | "em_andamento" | "resolvida",
               envolvidos: number, responsavelId: string | null, resolucao: string | null,
               criadaPor: string, criadaEm: string (ISO) }
```

Os ids são strings. Os dados iniciais são cerca de 4 setores, 6 lanternas, 3 usuários e 8 ocorrências
distribuídas para os filtros mostrarem resultados e o estado vazio. `usuarios` e `lanternas` são
coleções separadas para a área pública nunca ler senha (AUTH-11).

### 7.2 Funções por recurso (API-01)

| Arquivo | Funções | Cache (API-06) |
|---|---|---|
| `lib/setores.ts` | `listarSetores()` | `next: { revalidate: 60 }` |
| `lib/lanternas.ts` | `listarLanternas({ setorId? })`, `buscarLanterna(id)` | `next: { revalidate: 60 }` |
| `lib/ocorrencias.ts` | `listarOcorrencias({ setorId?, status? })`, `buscarOcorrencia(id)`, `criarOcorrencia(dados)`, `atualizarOcorrencia(id, campos)` | `cache: 'no-store'` |
| `lib/usuarios.ts` | `buscarUsuarioPorEmail(email)`, usada só na action `entrar` | `cache: 'no-store'` |

Molde de toda leitura: `fetch(new URL(caminho, process.env.API_URL), opçãoDeCache)` → `if (!res.ok)
throw new ApiError(res.status)` → `schema.parse(await res.json())` (API-02, API-03, API-04, API-16).
`buscar*` devolve `null` em 404, e a página chama `notFound()`.

Filtros usam a query do json-server 0.17 (`?setorId=2814&status=aberta`). Listas que precisam de nomes
de setor e responsável buscam ocorrências, setores e lanternas com `Promise.all` (API-07). Escritas:
`POST` e `PATCH`, seguidas de `revalidatePath` (API-14).

### 7.3 Schemas (`lib/schemas/`)

Um arquivo por entidade (`setor`, `lanterna`, `usuario`, `ocorrencia`, `login`) com o schema de
resposta e, quando houver formulário, o schema de formulário. Tipos por `z.infer` (FORM-02, FORM-03).

### 7.4 Preparação para o back-end (DEC-04)

Na próxima etapa muda `API_URL` e, se preciso, o miolo das funções em `lib/`. Páginas, formulários e
schemas ficam iguais. Os schemas Zod são o contrato que o back-end precisa respeitar. O login passa a
ser da API real, com hash de senha.

## 8. Formulários

Padrão único (DEC-05): componente cliente com RHF + `zodResolver`, `mode: 'onBlur'`,
`reValidateMode: 'onChange'`, `defaultValues` completos, `noValidate`, botão com `isSubmitting`;
`onSubmit` chama a Server Action; a action verifica a sessão, revalida com `safeParse` e devolve
`ResultadoAcao` (`{ ok, erro?, errors? }`) ou faz `redirect`. Erros de campo voltam com `setError`.
Regras FORM-01 a FORM-22.

### 8.1 Login
E-mail (`z.email`, `type="email"`, `autoComplete="email"`) e senha (mínimo 1, `type="password"`).

### 8.2 Nova ocorrência

| Campo | Componente | Validação |
|---|---|---|
| titulo | `CampoTexto` | trim, 5 a 100 caracteres |
| descricao | `Textarea` | trim, mínimo 10 caracteres |
| planeta | `CampoTexto` | trim, mínimo 2 caracteres |
| setorId | `Select` + `Controller` | obrigatório no schema. **Só renderiza para o Guardião.** Para o Lanterna, a página passa `sessao.setorId` como `defaultValues.setorId` (o campo não aparece, mas o schema passa) e a action sobrescreve com `sessao.setorId` de qualquer forma |
| gravidade | `Select` + `Controller` | enum |
| envolvidos | `Input type="number"` | `z.coerce.number().int().min(1)` |

Mensagens em português dizendo como corrigir (FORM-11). Sucesso → `redirect` para o detalhe.

### 8.3 Status
`status` (`Select` + `Controller`) e `resolucao` (`Textarea`) que aparece só quando
`watch('status') === 'resolvida'` (FORM-21). `.refine` com `path: ['resolucao']`: resolvida exige
pelo menos 10 caracteres (FORM-14).

### 8.4 Atribuir responsável
`responsavelId` (`Select` + `Controller`) com os lanternas do setor da ocorrência. A action confere
que o lanterna escolhido é do mesmo setor.

## 9. Erros e estados de tela

| Situação | Comportamento |
|---|---|
| Carregando | `loading.tsx` com skeleton em cada rota com dados (API-10) |
| Lista vazia | `EstadoVazio` com mensagem e ação ("Limpar filtros") (API-09) |
| Id inexistente (404) | `notFound()` → `not-found.tsx` do segmento (ROTA-12) |
| json-server desligado / 5xx | `error.tsx` "Não foi possível falar com a Central de Oa." + "Tentar de novo" (`reset`) (API-11) |
| Resposta fora do formato | Zod lança → mesmo `error.tsx`, mensagem genérica, detalhe só no log (API-13) |
| Não logado | `/login` (401) |
| Sem permissão | `/acesso-negado` (403 explicado; responde HTTP 200, ressalva em AUTH-06) |

## 10. Verificação

Testes com **Vitest + React Testing Library**, configurados como no guia oficial do Next.js
(`node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`), em `__tests__/`. O guia avisa que
Server Components `async` não são suportados pelo Vitest: eles são verificados por `build`, por
requisições `curl` e pelo roteiro manual. A verificação é:

1. `npm run test:run`, `npm run lint` e `npm run build` sem erros. Testes cobrem: schemas e `db.json`,
   camada de serviço (fetch simulado), sessão assinada, `proxy.ts`, Server Actions (sessão, papel,
   setor, API fora do ar) e componentes cliente/síncronos (formulários, menu, estados).
2. `bash .claude/skills/auditoria-apresentacao/scripts/verificar.sh .` sem `VIOLACAO`.
3. Roteiro de demonstração manual, executado no navegador:
   1. `/` → navegar para `/lanternas`, filtrar por setor, F5 mantém o filtro, voltar desfaz.
   2. `/lanternas/nao-existe` → "Lanterna não encontrado".
   3. Deslogado, clicar em "Central de Comando" → cai em `/login`.
   4. Login com senha errada → mensagem geral; e-mail inválido → erro no campo ao sair dele.
   5. Login como Hal → `/painel` com o setor 2814; voltar não retorna ao login.
   6. Lista mostra só o setor 2814; abrir a URL de uma ocorrência do setor 674 → `/acesso-negado`.
   7. Abrir `/painel/ocorrencias/o1/atribuir` como Hal → `/acesso-negado`.
   8. Registrar ocorrência com campos inválidos (mensagens) e depois válida (aparece na lista).
   9. Mudar status para "resolvida" sem resolução → erro no campo; com resolução → salva.
   10. Login como Ganthet → vê todos os setores, filtra por setor, atribui responsável.
   11. Logado, desligar o json-server e abrir `/painel/ocorrencias` → tela de erro com "Tentar de novo"; religar e tentar de novo. (Páginas públicas com `revalidate` seguem mostrando a última versão boa: é o cache funcionando.)
   12. Sair → `/login`; tentar `/painel` → `/login`.
4. Skill `auditoria-apresentacao` gera `docs/AUDITORIA.md` e `docs/ROTEIRO.md` com os 6 requisitos ✅.

## 11. Ajustes necessários nas skills (primeira tarefa do plano)

As skills foram escritas antes deste design. Antes do código:

- **STACK-04:** exemplo do `db.json` com as quatro coleções da seção 7.1 (incluindo `lanternas`,
  `usuarios.lanternaId`, `ocorrencias.planeta`, `resolucao`, `criadaPor`; `setorId: null` no Guardião).
- **STACK-05:** trocar a árvore pelo mapa da seção 5 (`/lanternas` no lugar de `/setores`; `BadgeStatus`)
  e retirar o status RASCUNHO.
- **DEC-09:** páginas públicas = `/lanternas`, `/lanternas/[id]`, `/sobre`.
- **AUTH-03:** `sessaoSchema` com `setorId` e `lanternaId` `z.string().nullable()`.
- **auditoria-apresentacao:** `requisitos-enunciado.md` (REQ-01/02 apontando para `/lanternas`) e
  qualquer outra menção a `/setores` como página pública.

## 12. Fora do escopo

Cadastro de usuários, recuperação de senha, voltar à página original após login (`?next=`), paginação,
testes E2E (Playwright), modo escuro, upload de arquivos, tempo real. Senhas em texto puro no `db.json`
são uma limitação declarada da API fake (AUTH-11).

## 13. Riscos

| Risco | Mitigação |
|---|---|
| `create-next-app` recusa a pasta por já ter `.claude/` e `docs/` | Gerar numa pasta temporária e mover os arquivos para a raiz (detalhado no plano) |
| Esquecer `npm run api` e achar que o app quebrou | `README` com os dois comandos; a tela de erro já explica |
| Componentes do shadcn com Base UI têm API diferente da de Radix nos exemplos da internet | Usar só os componentes gerados em `components/ui/` e conferir as props neles |
| Projeto sem nenhum `useState` (REQ-06 estado local) | Menu mobile com `useState` é parte do design (seção 5.2) |
