# Next.js, estrutura de pastas e convenções

### STACK-01: Next.js 16 (App Router, TypeScript, Tailwind, ESLint)
**Fonte:** [DOCS] `node_modules/next/dist/docs/01-app/01-getting-started/01-installation.md` + [DECISÃO] versão 16
**Regra:** Padrão do create-next-app: TypeScript, Tailwind CSS, ESLint, App Router, Turbopack, alias `@/*`, sem pasta `src/`. A versão do Node é a do campo `engines` do `package.json`. Scripts mínimos: `dev`, `build`, `start`, `lint`, `test`, `test:run`, `e2e`. Antes de escrever código Next, leia o guia pertinente em `node_modules/next/dist/docs/` (a API desta versão difere do que se aprendeu em versões antigas).
**✅ Certo:** importar com alias: `import { listarOcorrencias } from '@/lib/ocorrencias'`
**❌ Errado:** `import { x } from '../../../lib/x'`; script `next lint` (removido no Next 16).
**Como verificar:** `package.json` tem `"next": "16.x"` e `"lint": "eslint"`; `rg -n "from '\.\./\.\./" app components` vazio.
**Nota de versão:** o create-next-app gera `AGENTS.md` e `CLAUDE.md` para agentes de código; mantenha neles o aviso da versão e o apontamento para esta skill.

### STACK-05: Estrutura de pastas
**Fonte:** [DECISÃO] estrutura do projeto, montada a partir de [SLIDE] ROTAS p. 11 (`_components`, pastas = rotas), p. 15 (grupos de rotas); FORMS p. 14/15 (`lib/schemas/`), p. 20 (`actions.ts` ao lado da rota); APIS p. 14 (`lib/<recurso>.ts`), p. 22 (`lib/api-error.ts`)
**Regra:** Arquivo novo entra na pasta do seu papel; se nenhuma serve, registre uma decisão antes. Nomes de rota e recurso abaixo são ilustração.
```
proxy.ts                 cookie presente? (AUTH-01) e CSP com nonce (PROD-03)
instrumentation.ts       valida o ambiente na subida (PROD-01), reporta erros (PROD-05)
next.config.ts           cabeçalhos de segurança (PROD-02)
app/
  layout.tsx             <html lang="pt-BR"> (ROTA-05), fontes (CSS-13), metadata base (PROD-04)
  globals.css            Tailwind + tokens de tema (CSS-09)
  not-found.tsx, error.tsx, global-error.tsx, robots.ts, sitemap.ts
  (site)/                área pública (grupos de rotas: ROTA-04): login/ (actions.ts, _components/), acesso-negado/
  (painel)/              área privada: layout.tsx, actions.ts (sair), <recurso>/ (page, loading, error, actions, _components, [id]/, nova/)
  sessao-expirada/route.ts   apaga o cookie e vai ao login (AUTH-13)
components/              ui/ (shadcn: STACK-02) e componentes compartilhados
lib/                     api.ts (API-17), api-error.ts, erros-api.ts, env.ts, cookie.ts, auth.ts, dal.ts,
                         <recurso>.ts (API-01), schemas/ (FORM-02), resultado-acao.ts, formatar.ts
__tests__/               Vitest (DEC-06)        e2e/    Playwright (PROD-11)
```
**❌ Errado:** `services/`, `utils/api.ts`, `hooks/useOcorrencias.ts` com fetch, `app/api/` sem necessidade (a API é outro serviço).
**Como verificar:** compare `rg --files app components lib` com a árvore; pasta não prevista precisa de decisão registrada.

### DEC-08: Português para o domínio, inglês só nas convenções do framework
**Fonte:** [DECISÃO] + [SLIDE] os slides nomeiam em português (`buscarProdutos`, `criarConta`, `Saudacao`, `FormLogin`)
**Regra:** Variáveis, funções, componentes, rotas e mensagens em português (`ocorrencias`, `setorId`, `/painel/ocorrencias/nova`). Ficam em inglês só os nomes impostos (`page.tsx`, `layout.tsx`, `proxy`, `metadata`, `children`, props do RHF). Sem acentos em identificadores e URLs.
**Como verificar:** `rg -n "[áéíóúãõçÁÉÍÓÚÃÕÇ]" app lib components -g "*.ts" -g "*.tsx" --only-matching` só acha strings e comentários.

### DEC-10: Sem Cache Components, React Compiler ou flags experimentais
**Fonte:** [DECISÃO] + [DOCS] `.../02-guides/upgrading/version-16.md` ("React Compiler and Cache Components are not enabled merely to complete the upgrade")
**Regra:** `next.config.ts` fica como o create-next-app gerou, mais `headers()` (PROD-02) e o que o monitoramento pedir (PROD-05). Nada de `cacheComponents`, `reactCompiler` ou `experimental.*`. Os padrões de cache dos slides (API-06) continuam válidos.
**Como verificar:** `rg -n "cacheComponents|reactCompiler|experimental" next.config.ts` vazio.
**Nota de versão:** o `create-next-app` do Next 16.4 gera `next.config.ts` com `cacheComponents: true` e `partialPrefetching: true`. Apague essas duas linhas logo após criar o projeto: ligadas, as opções de `fetch` do slide de APIs (p. 12) deixam de valer. Guia: `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`.
