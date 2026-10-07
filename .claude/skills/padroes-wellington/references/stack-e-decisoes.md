# Stack, versões, estrutura e decisões do grupo (STACK / DEC)

Quase tudo aqui é `[DECISÃO]` ou `[DOCS]`. Quando houver ligação com slide, ela está indicada.
Links de referência passados pelo professor:
- https://nextjs.org/docs/app/getting-started/installation
- https://base-ui.com/react/overview/quick-start
- https://ui.shadcn.com/docs/installation
- https://react-hook-form.com/get-started
- https://zod.dev/basics


Índice: STACK-01 Next.js 16 (App Router, TypeScript, Tailwind, ESLint) · STACK-02 shadcn/ui sobre Base UI · STACK-03 react-hook-form + @hookform/resolvers + Zod 4 · STACK-04 API fake com json-server em db.json, porta 3001 · STACK-05 Estrutura de pastas · STACK-06 Lista fechada de dependências · DEC-01 fetch nos Server Components, não Axios · DEC-02 Sem TanStack Query nem SWR · DEC-03 Dois papéis: Guardião e Lanterna · DEC-04 Front preparado para o back-end: só troca API_URL · DEC-05 Um único padrão de formulário: RHF chama a Server Action · DEC-06 Testes unitários e PropTypes fora do escopo · DEC-07 Sem Context API nem estado global no cliente · DEC-08 Português para o domínio, inglês só nas convenções do framework · DEC-09 Mapa das áreas exigidas pelo enunciado · DEC-10 Sem Cache Components, React Compiler ou flags experimentais

---

### STACK-01: Next.js 16 (App Router, TypeScript, Tailwind, ESLint)
**Fonte:** [DOCS] https://nextjs.org/docs/app/getting-started/installation + [DECISÃO] versão 16
**Regra:** Projeto criado com `npx create-next-app@latest erp-tropa --yes` (padrão atual:
TypeScript, Tailwind CSS, ESLint, App Router, Turbopack, alias `@/*`, sem pasta `src/`). Node.js
20.9 ou mais novo. Scripts: `npm run dev`, `npm run build`, `npm run lint` (que roda `eslint`).
**✅ Certo:** importar com alias: `import { listarSetores } from '@/lib/setores'`
**❌ Errado:** `import { listarSetores } from '../../../lib/setores'`; script `next lint` (removido no Next 16).
**Como verificar:** `package.json` tem `"next": "16.x"` e `"lint": "eslint"`; `rg -n "from '\.\./\.\./" app components` deve retornar vazio.
**Nota de versão:** o create-next-app atual também gera `AGENTS.md` e `CLAUDE.md` para agentes de
código. Acrescente no `CLAUDE.md` do projeto uma linha: "Siga a skill padroes-wellington para todo código".

### STACK-02: shadcn/ui sobre Base UI
**Fonte:** [DECISÃO] usar shadcn/ui com Base UI (link do professor: base-ui.com) + [DOCS] https://ui.shadcn.com/docs/cli (`-b, --base <base>`: `base`, `radix`, `aria`)
**Regra:** Inicializar com `npx shadcn@latest init --base base` dentro do projeto. Isso cria
`components.json`, `lib/utils.ts` (função `cn`) e o tema em `app/globals.css`. Componentes entram
com `npx shadcn@latest add button input label textarea select card table badge alert` e ficam em
`components/ui/` (arquivos em kebab-case, gerados pelo CLI).
**✅ Certo:** `npx shadcn@latest add select` e `import { Select, ... } from '@/components/ui/select'`
**❌ Errado:** instalar `@radix-ui/*` ou `@base-ui/react` à mão e montar componentes do zero.
**Como verificar:** `components.json` existe; `rg -n "\"base\"|base-ui|@base-ui" components.json package.json` confirma a base.
**Nota de versão:** conferido em 2026-10-07 com `npx shadcn@latest init --help` (shadcn 4.21.4):
`-b, --base <base>` aceita `base`, `radix` e `aria`. O valor certo é `base` (não `base-ui`).

### STACK-03: react-hook-form + @hookform/resolvers + Zod 4
**Fonte:** [SLIDE] FORMS p. 9 (`npm i react-hook-form zod @hookform/resolvers`) + [DECISÃO] Zod 4
**Regra:** Instalar com o comando do slide. A versão do `zod` no `package.json` deve ser 4.x.
**✅ Certo:** `npm i react-hook-form zod @hookform/resolvers`
**❌ Errado:** instalar `yup`, `formik` ou `valibot`.
**Como verificar:** `package.json` tem `"zod": "^4`.

### STACK-04: API fake com json-server em db.json, porta 3001
**Fonte:** [DECISÃO] API fake + [DOCS] https://github.com/typicode/json-server (README: v1 em beta, "for stable version" 0.17.4; rotas GET/POST/PUT/PATCH/DELETE por recurso; filtro por igualdade na query string)
**Regra:** `db.json` na raiz do projeto. Instalar a versão estável como dependência de
desenvolvimento: `npm i -D json-server@0.17.4`. Script `"api": "json-server --watch db.json --port 3001"`.
Rodar `npm run api` e `npm run dev` em dois terminais. Porta 3001 porque o Next usa a 3000.
`.env.local`: `API_URL=http://localhost:3001`. Os `id` no `db.json` são strings.
**✅ Certo (formato do db.json):**
```json
{
  "setores": [
    { "id": "2814", "numero": 2814, "nome": "Setor 2814", "descricao": "Setor que inclui a Terra." }
  ],
  "usuarios": [
    { "id": "u1", "nome": "Ganthet", "email": "ganthet@oa.tropa", "senha": "guardiao123", "papel": "guardiao", "setorId": "0" },
    { "id": "u2", "nome": "Hal Jordan", "email": "hal@oa.tropa", "senha": "lanterna123", "papel": "lanterna", "setorId": "2814" }
  ],
  "ocorrencias": [
    { "id": "o1", "titulo": "Ataque de Parallax em Coast City", "descricao": "...", "setorId": "2814",
      "gravidade": "critica", "status": "aberta", "envolvidos": 3, "responsavelId": null, "criadaEm": "2026-10-01T12:00:00.000Z" }
  ]
}
```
**❌ Errado:** `API_URL` com `NEXT_PUBLIC_`; json-server na porta 3000; URL da API escrita no código.
**Como verificar:** `package.json` tem o script `api` e `json-server` em `devDependencies`; `.env.example` lista `API_URL` e `SESSION_SECRET`.
**Nota de versão:** se o grupo preferir a v1 (beta), mude o script para `json-server db.json --port 3001`
e confira a sintaxe de filtros no README da v1 antes de usar `_page`/`_sort`.

### STACK-05: Estrutura de pastas
**Fonte:** [DECISÃO] estrutura do projeto, montada a partir de [SLIDE] ROTAS p. 11 (`_components`, pastas = rotas), p. 15 (`(site)`/`(painel)`), FORMS p. 14/15 (`lib/schemas/`), FORMS p. 20 (`actions.ts` ao lado da rota), APIS p. 14 (`lib/<recurso>.ts`), APIS p. 22 (`lib/api-error.ts`)
**Status:** RASCUNHO. O mapa de rotas e as telas ainda serão aprovados no design do sistema; atualize
esta árvore quando o design for aprovado.
**Regra:** Siga esta árvore. Arquivo novo entra na pasta do seu papel; se nenhuma serve, registre
uma decisão antes.
```
erp-tropa/
├── proxy.ts                          controle de acesso otimista (AUTH-01)
├── db.json                           dados da API fake (STACK-04)
├── .env.local / .env.example         API_URL, SESSION_SECRET (API-08)
├── app/
│   ├── layout.tsx                    <html lang="pt-BR"> (ROTA-05)
│   ├── globals.css                   Tailwind + tema shadcn (CSS-09)
│   ├── not-found.tsx                 404 global (ROTA-22)
│   ├── (site)/                       ÁREA PÚBLICA (ROTA-04)
│   │   ├── layout.tsx                header público
│   │   ├── page.tsx                  "/"  homepage (DEC-09)
│   │   ├── sobre/page.tsx            "/sobre"  institucional
│   │   ├── setores/page.tsx          "/setores"  listagem pública
│   │   ├── setores/loading.tsx, error.tsx
│   │   ├── setores/[id]/page.tsx     "/setores/2814"  detalhe público
│   │   ├── login/page.tsx            "/login"
│   │   ├── login/actions.ts          entrar() (AUTH-08)
│   │   ├── login/_components/FormLogin.tsx
│   │   └── acesso-negado/page.tsx    403 explicado (AUTH-06)
│   └── (painel)/                     ÁREA PRIVADA
│       ├── layout.tsx                sidebar + nome + botão Sair
│       ├── actions.ts                sair() (AUTH-09)
│       └── painel/
│           ├── page.tsx              "/painel"  resumo
│           ├── loading.tsx, error.tsx
│           └── ocorrencias/
│               ├── page.tsx          "/painel/ocorrencias"  lista + filtros (searchParams)
│               ├── loading.tsx, error.tsx
│               ├── actions.ts        criarOcorrencia, atualizarStatus, atribuirResponsavel
│               ├── _components/      FormOcorrencia.tsx, FiltroOcorrencias.tsx, ...
│               ├── nova/page.tsx     "/painel/ocorrencias/nova"
│               └── [id]/
│                   ├── page.tsx      "/painel/ocorrencias/o1"  detalhe
│                   ├── not-found.tsx
│                   └── atribuir/page.tsx   só Guardião (exigirPapel)
├── components/
│   ├── ui/                           gerado pelo shadcn (STACK-02)
│   ├── CampoTexto.tsx                (FORM-22)
│   ├── MenuNavegacao.tsx             'use client', usePathname (ROTA-17)
│   ├── EstadoVazio.tsx               (API-09)
│   └── BadgeGravidade.tsx
└── lib/
    ├── utils.ts                      cn() do shadcn
    ├── api-error.ts                  ApiError (API-03)
    ├── resultado-acao.ts             tipo ResultadoAcao (FORM, DEC-05)
    ├── sessao.ts                     cookie assinado (AUTH-02, AUTH-03)
    ├── dal.ts                        verificarSessao, exigirPapel (AUTH-04, AUTH-06)
    ├── ocorrencias.ts                camada de serviço (API-01)
    ├── setores.ts
    ├── usuarios.ts
    └── schemas/
        ├── ocorrencia.ts             schemas de resposta e de formulário (FORM-02, API-04)
        ├── login.ts
        └── setor.ts
```
**❌ Errado:** `services/`, `utils/api.ts`, `hooks/useOcorrencias.ts` com fetch, `app/api/` sem necessidade.
**Como verificar:** comparar `rg --files app components lib` com a árvore; pasta não prevista precisa de decisão registrada.

### STACK-06: Lista fechada de dependências
**Fonte:** [DECISÃO] simplicidade (o enunciado prioriza simplicidade; cada dependência precisa ser explicada)
**Regra:** `dependencies`/`devDependencies` só podem conter: `next`, `react`, `react-dom`,
`typescript`, `@types/*`, `tailwindcss`, `@tailwindcss/postcss`, `eslint`, `eslint-config-next`,
`react-hook-form`, `@hookform/resolvers`, `zod`, `json-server`, e o que o `shadcn init`/`shadcn add`
instalar sozinho (Base UI, `class-variance-authority`, `clsx`, `tailwind-merge`, ícones `lucide-react`,
`tw-animate-css`). Qualquer outra exige uma regra `[DECISÃO]` nova.
**✅ Certo:** dependência nova discutida e registrada aqui antes do `npm i`.
**❌ Errado:** `npm i axios @tanstack/react-query zustand jose next-auth`.
**Como verificar:** ler `package.json` e comparar com esta lista (a skill de auditoria faz isso).

---

### DEC-01: fetch nos Server Components, não Axios
**Fonte:** [DECISÃO] + [SLIDE] APIS p. 9 ("No Next.js: prefira fetch nos Server Components (cache e revalidação de graça). Axios brilha no cliente"), APIS p. 23 (armadilha "Esperar que o Axios use o cache do Next.js")
**Regra:** Toda chamada HTTP usa `fetch` nativo dentro de `lib/`. Axios (APIS p. 8) foi ensinado
como alternativa e não é usado.
**Como verificar:** `rg -n "axios" app components lib package.json` deve retornar vazio.

### DEC-02: Sem TanStack Query nem SWR
**Fonte:** [DECISÃO] + [SLIDE] APIS p. 15 (TanStack Query para busca no cliente: "Exige um Provider em um layout")
**Regra:** Não há busca no cliente (API-15), então não há biblioteca de cache de cliente.
**Como verificar:** `rg -n "@tanstack|from 'swr'" app components package.json` deve retornar vazio.

### DEC-03: Dois papéis: Guardião e Lanterna
**Fonte:** [DECISÃO] regra de negócio do ERP
**Regra:** `papel` é `'guardiao' | 'lanterna'`. Matriz de permissões:

| Ação | Guardião | Lanterna |
|---|---|---|
| Ver lista de ocorrências | todas (pode filtrar por setor) | só do próprio setor |
| Ver detalhe | qualquer uma | só do próprio setor (senão 403) |
| Registrar ocorrência | em qualquer setor | só no próprio setor |
| Atualizar status | qualquer uma | só do próprio setor |
| Atribuir responsável | sim | não (403) |

"Logado sem permissão" sempre vai para `/acesso-negado` (AUTH-06); "não logado" vai para `/login`
(AUTH-01, AUTH-04).
**Como verificar:** cada linha da tabela tem código correspondente (AUTH-05, AUTH-06, AUTH-07).

### DEC-04: Front preparado para o back-end: só troca API_URL
**Fonte:** [DECISÃO] + texto do professor ("pensar o front para ser reutilizado na próxima etapa (back-end), evitando retrabalho")
**Regra:** Tudo que fala com a API está em `lib/` (API-01) e valida a resposta (API-04). Na etapa
de back-end, troca-se `API_URL` no `.env.local` e, se o formato mudar, só os schemas de
`lib/schemas/`. Páginas, componentes e formulários não mudam. Tratamento de 401/403 já existe (API-12)
mesmo que o json-server nunca devolva esses status.
**Como verificar:** `rg -n "localhost" app components lib` deve retornar vazio.

### DEC-05: Um único padrão de formulário: RHF chama a Server Action
**Fonte:** [DECISÃO] + [SLIDE] FORMS p. 16 (onSubmit chamando `criarConta(dados)`), p. 19 (`setError` com resposta), p. 20 (Server Action com `safeParse`)
**Regra:** Formulário cliente com RHF; no `onSubmit`, `await acao(dados)`; a action recebe
`unknown`, revalida e devolve `ResultadoAcao` ou faz `redirect`. O exemplo `useActionState` +
`<form action>` do slide FORMS p. 20 não é usado nos formulários com campos, para não ter dois
padrões. A única `<form action={...}>` do projeto é o botão Sair (AUTH-09), que não tem campos.
**Como verificar:** `rg -n "useActionState" app components` deve retornar vazio.
**Nota de versão:** `useActionState` não está desatualizado: é a API atual do React 19 (substituiu
`useFormState`). A escolha é só por simplicidade.

### DEC-06: Testes unitários e PropTypes fora do escopo
**Fonte:** [DECISÃO] + [SLIDE] PROPS p. 9 (itens 5 e 7 do checklist aparecem como "Pendente")
**Regra:** Não há biblioteca de testes nem PropTypes. A validação de props é feita por TypeScript
(COMP-06). A verificação do projeto é a skill `auditoria-apresentacao` + `npm run lint` + `npm run build`.
**Como verificar:** `package.json` sem `jest`, `vitest`, `@testing-library/*`, `prop-types`.

### DEC-07: Sem Context API nem estado global no cliente
**Fonte:** [DECISÃO] + [SLIDE] PROPS p. 12 ("Context para dados globais", citado como próximo tópico)
**Regra:** O dado "global" do projeto é a sessão, e ela é lida no servidor (`verificarSessao`, AUTH-04)
e passada por props. Não crie `createContext`, Zustand nem Redux.
**Como verificar:** `rg -n "createContext|zustand|redux" app components lib` deve retornar vazio.

### DEC-08: Português para o domínio, inglês só nas convenções do framework
**Fonte:** [DECISÃO] + [SLIDE] os slides nomeiam em português (`buscarProdutos`, `criarConta`, `Saudacao`, `FormLogin`)
**Regra:** Variáveis, funções, componentes, rotas e mensagens em português (`ocorrencias`,
`setorId`, `/painel/ocorrencias/nova`). Ficam em inglês só os nomes impostos (`page.tsx`,
`layout.tsx`, `proxy`, `metadata`, `children`, props do RHF). Sem acentos em identificadores e URLs.
**Como verificar:** `rg -n "[áéíóúãõçÁÉÍÓÚÃÕÇ]" app lib components -g "*.ts" -g "*.tsx" --only-matching` só acha strings e comentários.

### DEC-09: Mapa das áreas exigidas pelo enunciado
**Fonte:** [DECISÃO]
**Regra:** Homepage = `app/(site)/page.tsx` ("/"), com links para Sobre, Setores, Login e (se logado)
Painel. Páginas públicas = `/sobre` (institucional), `/setores` (listagem), `/setores/[id]` (detalhe).
Login = `/login`. Área privada = tudo sob `/painel`. A skill `auditoria-apresentacao` usa este mapa
para achar os arquivos de cada requisito.
**Como verificar:** os arquivos listados em STACK-05 para essas rotas existem.

### DEC-10: Sem Cache Components, React Compiler ou flags experimentais
**Fonte:** [DECISÃO] + [DOCS] https://nextjs.org/docs/app/guides/upgrading/version-16 ("React Compiler and Cache Components are not enabled merely to complete the upgrade")
**Regra:** `next.config.ts` fica como o create-next-app gerou. Nada de `cacheComponents`,
`reactCompiler` ou `experimental.*`. Os padrões de cache dos slides (API-06) continuam válidos.
**Como verificar:** `rg -n "cacheComponents|reactCompiler|experimental" next.config.ts` deve retornar vazio.
