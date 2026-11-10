# Bibliotecas permitidas

### STACK-02: shadcn/ui sobre Base UI
**Fonte:** [DECISÃO] usar shadcn/ui com Base UI (link do professor: base-ui.com) + [DOCS] https://ui.shadcn.com/docs/cli (`-b, --base <base>`: `base`, `radix`, `aria`)
**Regra:** Inicializar com `npx shadcn@latest init --base base`. Isso cria `components.json`, `lib/utils.ts` (função `cn`) e o tema em `app/globals.css`. Componentes entram com `npx shadcn@latest add button input label ...` e ficam em `components/ui/` (arquivos em kebab-case, gerados pelo CLI).
**✅ Certo:** `npx shadcn@latest add select` e `import { Select } from '@/components/ui/select'`
**❌ Errado:** instalar `@radix-ui/*` ou `@base-ui/react` à mão e montar componentes do zero.
**Nota:** o visual dos arquivos de `components/ui/` pode ser reescrito para o design system do projeto, mantendo API e Base UI. Ver DEC-11.
**Como verificar:** `components.json` existe; `rg -n "\"base\"|base-ui|@base-ui" components.json package.json` confirma a base.
**Nota de versão:** conferido em 2026-10-07 com `npx shadcn@latest init --help` (shadcn 4.21.4): `--base` aceita `base`, `radix` e `aria`. O valor certo é `base` (não `base-ui`).

### STACK-03: react-hook-form + @hookform/resolvers + Zod 4
**Fonte:** [SLIDE] FORMS p. 9 (`npm i react-hook-form zod @hookform/resolvers`) + [DECISÃO] Zod 4
**Regra:** Instalar com o comando do slide. A versão do `zod` no `package.json` é 4.x.
**✅ Certo:** `npm i react-hook-form zod @hookform/resolvers`
**❌ Errado:** instalar `yup`, `formik` ou `valibot`.
**Como verificar:** `package.json` tem `"zod": "^4`.

### STACK-06: Dependências: lista base e opcionais de produção, todas registradas
**Fonte:** [DECISÃO] simplicidade: cada dependência precisa de motivo registrado
**Regra:** Base: `next`, `react`, `react-dom`, `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `tailwindcss`, `@tailwindcss/turbopack`, `eslint`, `eslint-config-next`, `react-hook-form`, `@hookform/resolvers`, `zod`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, e o que `shadcn init`/`add` instalam (`shadcn`, `@base-ui/react`, `class-variance-authority`, `cn`, `lucide-react`, `tw-animate-css`). Opcionais de produção, cada um só com registro no PR: `server-only` (AUTH-12), `@playwright/test` e `@axe-core/playwright` (PROD-11, PROD-08), `@sentry/nextjs` (PROD-05). Qualquer outra exige uma regra `[DECISÃO]` nova.
**✅ Certo:** dependência discutida e registrada aqui antes do `npm i`.
**❌ Errado:** `npm i axios @tanstack/react-query zustand jose next-auth` sem decisão.
**Como verificar:** ler `package.json` e comparar com esta lista.

### DEC-01: fetch nos Server Components, não Axios
**Fonte:** [DECISÃO] + [SLIDE] APIS p. 9 ("No Next.js: prefira fetch nos Server Components (cache e revalidação de graça). Axios brilha no cliente"), p. 23 (armadilha "Esperar que o Axios use o cache do Next.js")
**Regra:** Toda chamada HTTP usa `fetch` nativo dentro do cliente de `lib/api.ts` (API-17). Axios (APIS p. 8) foi ensinado como alternativa e não é usado.
**Como verificar:** `rg -n "axios" app components lib package.json` vazio.

### DEC-02: Sem TanStack Query nem SWR
**Fonte:** [DECISÃO] + [SLIDE] APIS p. 15 (TanStack Query para busca no cliente: "Exige um Provider em um layout")
**Regra:** Não há busca no cliente (API-15, AUTH-12), então não há biblioteca de cache de cliente.
**Como verificar:** `rg -n "@tanstack|from 'swr'" app components package.json` vazio.

### DEC-07: Sem Context API nem estado global no cliente
**Fonte:** [DECISÃO] + [SLIDE] PROPS p. 12 ("Context para dados globais", citado como próximo tópico)
**Regra:** O dado "global" é a sessão, lida no servidor (`verificarSessao`, AUTH-04) e passada por props. Não crie `createContext`, Zustand nem Redux.
**Como verificar:** `rg -n "createContext|zustand|redux" app components lib` vazio.

### DEC-11: Visual próprio sobre Base UI
**Fonte:** [DECISÃO] design system do projeto — complementa STACK-02 e CSS-11
**Regra:** Os arquivos de `components/ui/` continuam vindos do shadcn e usando o Base UI (teclado, foco, ARIA, posicionamento). Só o visual (as classes) é reescrito para seguir os tokens do projeto (CSS-12). Nomes exportados, variantes (`default`, `outline`, `secondary`, `ghost`, `destructive`, `link`) e tamanhos não mudam, para nenhuma tela mudar por causa da API do componente. Componentes novos do design system ficam em `components/`, fora de `ui/`.
**✅ Certo:** trocar as classes de `buttonVariants` mantendo `variant="outline"`.
**❌ Errado:** apagar o Base UI e reescrever o select com `<div>` e `useState`; criar `components/marca/Button.tsx` paralelo.
**Como verificar:** `rg -n "@base-ui/react" components/ui` continua achando button, input, select e badge.
