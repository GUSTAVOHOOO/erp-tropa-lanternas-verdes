# Stack, versões, estrutura e decisões do grupo (STACK / DEC)

Quase tudo aqui é `[DECISÃO]` ou `[DOCS]`. Quando houver ligação com slide, ela está indicada.
Links de referência passados pelo professor:
- https://nextjs.org/docs/app/getting-started/installation
- https://base-ui.com/react/overview/quick-start
- https://ui.shadcn.com/docs/installation
- https://react-hook-form.com/get-started
- https://zod.dev/basics


Índice: STACK-01 Next.js 16 (App Router, TypeScript, Tailwind, ESLint) · STACK-02 shadcn/ui sobre Base UI · STACK-03 react-hook-form + @hookform/resolvers + Zod 4 · STACK-04 API fake com json-server em db.json, porta 3001 · STACK-05 Estrutura de pastas · STACK-06 Lista fechada de dependências · DEC-01 fetch nos Server Components, não Axios · DEC-02 Sem TanStack Query nem SWR · DEC-03 Dois papéis: Guardião e Lanterna · DEC-04 Front preparado para o back-end: só troca API_URL · DEC-05 Um único padrão de formulário: RHF chama a Server Action · DEC-06 Testes com Vitest, como no guia oficial do Next.js · DEC-07 Sem Context API nem estado global no cliente · DEC-08 Português para o domínio, inglês só nas convenções do framework · DEC-09 Mapa das áreas exigidas pelo enunciado · DEC-10 Sem Cache Components, React Compiler ou flags experimentais · DEC-11 Visual próprio sobre Base UI · DEC-12 Vitrine /design-system · DEC-13 Tema único escuro

---

### STACK-01: Next.js 16 (App Router, TypeScript, Tailwind, ESLint)
**Fonte:** [DOCS] https://nextjs.org/docs/app/getting-started/installation + [DECISÃO] versão 16
**Regra:** O npm não aceita letras maiúsculas no nome do pacote, e a pasta se chama `TrabalhoWeb`.
Por isso o projeto é gerado como `erp-tropa` numa pasta temporária fora do repositório
(`npx create-next-app@latest erp-tropa --yes --use-npm --skip-install --disable-git`) e os arquivos
são copiados para a raiz de `TrabalhoWeb`. Padrão atual do create-next-app: TypeScript, Tailwind CSS,
ESLint, App Router, Turbopack, alias `@/*`, sem pasta `src/`. O Next.js admite Node.js 20.9 ou mais novo;
para instalar e testar esta stack completa, o projeto exige Node.js 26 ou mais novo (`package.json`),
verificado em 26.7.0 por causa das faixas de Vitest e jsdom.
Scripts: `dev`, `build`, `start`, `lint`, `test`, `test:run`, `api`.
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
**Nota:** o visual dos arquivos gerados em `components/ui/` foi reescrito para o design system da Tropa, mantendo a API e o Base UI por baixo. Ver DEC-11.
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
**Nota:** o json-server 0.17.4 escuta em `localhost` IPv6 (`::1`). Use `API_URL=http://localhost:3001`,
não `127.0.0.1`. Registros criados por POST recebem um `id` string aleatório (ex.: `"mn60GVZ"`).
**✅ Certo (formato do db.json, uma linha de exemplo por coleção):**
```json
{
  "setores": [{ "id": "2814", "numero": 2814, "nome": "Setor 2814", "descricao": "Inclui a Terra." }],
  "lanternas": [{ "id": "hal-jordan", "nome": "Hal Jordan", "especie": "Humano", "planetaNatal": "Terra", "setorId": "2814", "status": "ativo" }],
  "usuarios": [
    { "id": "u1", "nome": "Ganthet", "email": "ganthet@oa.tropa", "senha": "guardiao123", "papel": "guardiao", "setorId": null, "lanternaId": null },
    { "id": "u2", "nome": "Hal Jordan", "email": "hal@oa.tropa", "senha": "lanterna123", "papel": "lanterna", "setorId": "2814", "lanternaId": "hal-jordan" }
  ],
  "ocorrencias": [{ "id": "o1", "titulo": "Ataque de Parallax em Coast City", "descricao": "...", "planeta": "Terra",
    "setorId": "2814", "gravidade": "critica", "status": "em_andamento", "envolvidos": 3,
    "responsavelId": "hal-jordan", "resolucao": null, "criadaPor": "u1", "criadaEm": "2026-10-01T12:00:00.000Z" }]
}
```
**❌ Errado:** `API_URL` com `NEXT_PUBLIC_`; json-server na porta 3000; URL da API escrita no código.
**Como verificar:** `package.json` tem o script `api` e `json-server` em `devDependencies`; `.env.example` lista `API_URL` e `SESSION_SECRET`.
**Nota de versão:** se o grupo preferir a v1 (beta), mude o script para `json-server db.json --port 3001`
e confira a sintaxe de filtros no README da v1 antes de usar `_page`/`_sort`.

### STACK-05: Estrutura de pastas
**Fonte:** [DECISÃO] estrutura do projeto, montada a partir de [SLIDE] ROTAS p. 11 (`_components`, pastas = rotas), p. 15 (`(site)`/`(painel)`), FORMS p. 14/15 (`lib/schemas/`), FORMS p. 20 (`actions.ts` ao lado da rota), APIS p. 14 (`lib/<recurso>.ts`), APIS p. 22 (`lib/api-error.ts`)
**Regra:** Siga esta árvore. Arquivo novo entra na pasta do seu papel; se nenhuma serve, registre
uma decisão antes.
```
TrabalhoWeb/
├── proxy.ts                         controle de acesso otimista (AUTH-01)
├── db.json                          dados da API fake (STACK-04)
├── vitest.config.mts, vitest.setup.ts, CLAUDE.md, .env.example   configuração de testes e variáveis (API_URL, SESSION_SECRET: API-08)
├── app/
│   ├── layout.tsx                   <html lang="pt-BR"> (ROTA-05), fontes (CSS-13)
│   ├── icon.svg                     favicon com o emblema (DEC-11)
│   ├── globals.css                  Tailwind + tema shadcn (CSS-09)
│   ├── not-found.tsx                404 global (ROTA-22)
│   ├── (site)/                      ÁREA PÚBLICA (ROTA-04)
│   │   ├── layout.tsx, page.tsx, sobre/page.tsx                        header público, "/" homepage (DEC-09), "/sobre"
│   │   ├── lanternas/page.tsx, loading.tsx, error.tsx, _components/CartaoLanterna.tsx   "/lanternas" listagem pública com filtro por setor
│   │   ├── lanternas/[id]/page.tsx, not-found.tsx                      "/lanternas/hal-jordan" detalhe público
│   │   ├── login/page.tsx, actions.ts, _components/FormLogin.tsx       "/login", entrar() (AUTH-08)
│   │   ├── acesso-negado/page.tsx                                      403 explicado (AUTH-06)
│   │   └── design-system/page.tsx, _components/SecaoVitrine.tsx        vitrine do design system (DEC-12)
│   └── (painel)/                    ÁREA PRIVADA
│       ├── layout.tsx, actions.ts                                      sidebar + nome + botão Sair; sair() (AUTH-09)
│       └── painel/
│           ├── page.tsx, loading.tsx, error.tsx                        "/painel" resumo
│           └── ocorrencias/
│               ├── page.tsx, loading.tsx, error.tsx, actions.ts        lista + filtros (searchParams); actions.ts cresce na tarefa 8
│               ├── _components/FiltroOcorrencias.tsx, FormOcorrencia.tsx
│               ├── _components/FormStatus.tsx, FormAtribuir.tsx
│               ├── nova/page.tsx                                       "/painel/ocorrencias/nova"
│               └── [id]/page.tsx, not-found.tsx, atribuir/page.tsx     detalhe; atribuir só Guardião (exigirPapel)
├── components/
│   ├── ui/                          gerado pelo shadcn (STACK-02)
│   ├── CampoTexto, MenuNavegacao, EstadoVazio, TelaDeErro, EsqueletoLista,
│   │   BadgeGravidade, BadgeStatus, TabelaOcorrencias     CampoTexto (FORM-22); MenuNavegacao 'use client', usePathname (ROTA-17); EstadoVazio (API-09)
│   ├── CampoSelect
│   └── Emblema, Marca, IconeStatus, BarraStatus, CabecalhoPagina,
│       LinkVoltar, MensagemErro, PaginaAviso, Juramento   design system (DEC-11, CSS-10)
├── lib/
│   ├── utils.ts                     gerado pelo shadcn (cn)
│   ├── api-error.ts, resultado-acao.ts, schemas/*                      ApiError (API-03); tipo ResultadoAcao (FORM, DEC-05); schemas (FORM-02, API-04)
│   ├── api.ts, setores.ts, lanternas.ts, ocorrencias.ts, usuarios.ts   camada de serviço (API-01)
│   ├── sessao.ts, dal.ts, erros-formulario.ts   sessao.ts puro, sem next/* (AUTH-03); dal.ts verificarSessao, exigirPapel (AUTH-04, AUTH-06)
│   └── formatar.ts
├── __tests__/                       testes de cada tarefa (DEC-06)
└── README.md, docs/AUDITORIA.md, docs/ROTEIRO.md
```
**❌ Errado:** `services/`, `utils/api.ts`, `hooks/useOcorrencias.ts` com fetch, `app/api/` sem necessidade.
**Como verificar:** comparar `rg --files app components lib` com a árvore; pasta não prevista precisa de decisão registrada.

### STACK-06: Lista fechada de dependências
**Fonte:** [DECISÃO] simplicidade (o enunciado prioriza simplicidade; cada dependência precisa ser explicada)
**Regra:** `dependencies`/`devDependencies` só podem conter: `next`, `react`, `react-dom`,
`typescript`, `@types/node` (^24, para casar com o Vitest 5), `@types/react`, `@types/react-dom`,
`tailwindcss`, `@tailwindcss/turbopack`, `eslint`, `eslint-config-next`, `react-hook-form`,
`@hookform/resolvers`, `zod`, `json-server` (0.17.4), `vitest`, `jsdom`, `@testing-library/react`,
`@testing-library/dom`, e o que o `shadcn init`/`shadcn add` instalar sozinho (`shadcn`,
`@base-ui/react`, `class-variance-authority`, `cn`, `lucide-react`, `tw-animate-css`).
Qualquer outra exige uma regra `[DECISÃO]` nova.
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

### DEC-06: Testes com Vitest, como no guia oficial do Next.js
**Fonte:** [DOCS] `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md` + [SLIDE] PROPS p. 9 (item 7 do checklist: "Testes Unitários... `describe('Component')`") + [DECISÃO] ajustes de instalação
**Regra:** Testes em `__tests__/`, rodados com `npm run test:run`. Testamos schemas, camada de serviço
(com `fetch` simulado), sessão, `proxy.ts`, Server Actions (com `next/navigation`, `next/cache` e
`@/lib/dal` simulados) e componentes cliente ou síncronos com React Testing Library. Server
Components `async` não são suportados pelo Vitest (o guia avisa): eles são verificados por
`npm run build`, `curl` e pelo roteiro manual. PropTypes não: a tipagem é TypeScript (COMP-06).
**Diferenças em relação ao guia:** (1) sem `@vitejs/plugin-react`: uma dependência opcional dele
exige Babel 8 e conflita com o Babel 7 do pacote `shadcn`; o Vite 8 já transforma JSX sozinho.
(2) sem `vite-tsconfig-paths`: o Vite 8 resolve o alias `@/` com `resolve.tsconfigPaths: true` e
avisa que o plugin é desnecessário. (3) `vitest.setup.ts` chama `cleanup()` depois de cada teste.
**Como verificar:** `npm run test:run` passa; `package.json` não tem os dois plugins acima.

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
**Regra:** Homepage = `app/(site)/page.tsx` ("/"), com links para Lanternas, Sobre e Central de Comando
(`/painel`). Páginas públicas = `/lanternas` (listagem com filtro por setor), `/lanternas/[id]`
(detalhe) e `/sobre` (institucional). Login = `/login`. Acesso negado = `/acesso-negado`. Área
privada = tudo sob `/painel`. A skill `auditoria-apresentacao` usa este mapa para achar os arquivos
de cada requisito. Vitrine do design system = `/design-system` (DEC-12), fora do menu, com link no rodapé público.
**Como verificar:** os arquivos listados em STACK-05 para essas rotas existem.

### DEC-10: Sem Cache Components, React Compiler ou flags experimentais
**Fonte:** [DECISÃO] + [DOCS] https://nextjs.org/docs/app/guides/upgrading/version-16 ("React Compiler and Cache Components are not enabled merely to complete the upgrade")
**Regra:** `next.config.ts` fica como o create-next-app gerou. Nada de `cacheComponents`,
`reactCompiler` ou `experimental.*`. Os padrões de cache dos slides (API-06) continuam válidos.
**Como verificar:** `rg -n "cacheComponents|reactCompiler|experimental" next.config.ts` deve retornar vazio.
**Nota de versão:** o `create-next-app` do Next 16.4 já gera `next.config.ts` com
`cacheComponents: true` e `partialPrefetching: true`. Apague essas duas linhas logo após criar o
projeto: com elas ligadas, as opções de `fetch` do slide de APIs (p. 12) deixam de valer.
Guia do modelo usado: `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`.

### DEC-11: Visual próprio sobre Base UI
**Fonte:** [DECISÃO] design system (`docs/superpowers/specs/2026-10-07-design-system-tropa-design.md`) — complementa STACK-02 e CSS-11
**Regra:** Os arquivos de `components/ui/` continuam vindo do shadcn e usando o Base UI (teclado, foco,
ARIA, posicionamento do select). O que foi reescrito é só o visual (as classes), para seguir os
tokens da Tropa. Nomes exportados, variantes (`default`, `outline`, `secondary`, `ghost`,
`destructive`, `link`) e tamanhos não mudam, para nenhuma tela precisar mudar por causa da API.
Componentes novos do design system ficam em `components/` (fora de `ui/`).
**✅ Certo:** trocar as classes de `buttonVariants` mantendo `variant="outline"`.
**❌ Errado:** apagar o Base UI e reescrever o select com `<div>` e `useState`; criar `components/tropa/Button.tsx` paralelo.
**Como verificar:** `rg -n "@base-ui/react" components/ui` continua achando button, input, select e badge.

### DEC-12: Vitrine do design system em /design-system
**Fonte:** [DECISÃO]
**Regra:** `app/(site)/design-system/page.tsx` é um Server Component estático que mostra cores,
tipografia, emblema, ícones e cada componente em todos os estados (normal, foco, erro, desabilitado).
Fica fora do menu principal; o link está no rodapé público. Os dados de exemplo são constantes no
próprio arquivo (não chama a API).
**Como verificar:** `rg -n "listar|buscar" "app/(site)/design-system"` vazio.

### DEC-13: Tema único escuro ("Noite")
**Fonte:** [DECISÃO] (o juramento: "na noite mais densa"; e menos código para explicar)
**Regra:** Só existe o tema escuro, definido no `:root` de `globals.css`. Não há bloco `.dark`,
variante `dark:`, botão de troca de tema nem estado de cliente para isso. `color-scheme: dark` no
`html` faz os controles nativos do navegador seguirem o tema.
**Como verificar:** `rg -n "\.dark|dark:" app components` vazio.
