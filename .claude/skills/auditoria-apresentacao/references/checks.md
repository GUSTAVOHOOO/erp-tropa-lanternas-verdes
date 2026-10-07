# Verificações (checks)

Automáticas: `bash .claude/skills/auditoria-apresentacao/scripts/verificar.sh <raiz-do-projeto>`.
O script ignora `node_modules/`, `.next/` e `components/ui/` (gerado pelo shadcn).

- **VIOLACAO**: o padrão encontrado quebra a regra. Mesmo assim abra o arquivo e confirme antes de
  escrever no relatório (pode ser comentário ou string).
- **REVISAR**: heurística. Abra cada arquivo listado e decida; só vira violação se você confirmar.

Se o script não rodar (sem bash), use a coluna "Equivalente rg" com a ferramenta Grep. Nas
tabelas, `\|` é só escape do Markdown: no comando de verdade escreva `|`.

## Automáticas

| Check | Regra | O que acusa | Equivalente rg / observação |
|---|---|---|---|
| C-01 | ROTA-18 | `from 'next/router'` | `rg -n "next/router" app components lib` |
| C-02 | ROTA-16 | `<a href="/...">` interno ou `window.location` | `rg -n "<a [^>]*href=[\"'{]/\|window\.location" app components`. Link externo (`https://`) não é acusado. |
| C-03 | API-08 | qualquer `NEXT_PUBLIC_` no código ou nos `.env*` | `rg -n "NEXT_PUBLIC_" . -g "!node_modules"`. O projeto não precisa de nenhuma; se houver uma pública de verdade, crie uma `[DECISÃO]`. |
| C-04a | API-01 | `fetch(` fora de `lib/` | `rg -n "fetch\(" app components` |
| C-04b | API-02 | arquivo de `lib/` com `fetch` e sem nenhum `.ok` | `rg -l "fetch\(" lib` menos `rg -l "\.ok" lib` |
| C-04c | API-02 | `await fetch(` sem `!res.ok` nas 6 linhas seguintes (REVISAR) | `rg -n -A6 "await fetch\(" lib` |
| C-05 | ROTA-07, ROTA-08 | `'use client'` no topo de `page.tsx` ou `layout.tsx` | `rg -l "^['\"]use client" app -g page.tsx -g layout.tsx` |
| C-06 | FORM-12 | arquivo com `register(` e `useState` (REVISAR: só é violação se for o mesmo campo) | `rg -l "register\(" app components` ∩ `rg -l useState` |
| C-07 | AUTH-01 | `middleware.ts` existe, `proxy.ts` falta, ou `proxy.ts` não exporta `proxy` | `rg --files -g "middleware.ts" -g "proxy.ts" --max-depth 2` |
| C-08 | ROTA-10 | `params: {` ou `searchParams: {` (tipo sem `Promise`) | `rg -n "(params\|searchParams): \{" app` |
| C-09 | ROTA-10 | `params.x` / `searchParams.x` em `page.tsx`/`layout.tsx` (leitura sem `await`) | `rg -n "[^a-zA-Z](params\|searchParams)\.[a-zA-Z]" app -g page.tsx -g layout.tsx` |
| C-10 | AUTH-05 | `export async function` em `'use server'` de `app/(painel)` sem `verificarSessao`/`exigirPapel` (ignora `sair`) | abrir cada `actions.ts` do painel |
| C-11 | FORM-17 | arquivo `'use server'` sem `safeParse` (ignora `app/(painel)/actions.ts`, que só tem `sair`) | `rg -l "^['\"]use server" app` menos `rg -l safeParse` |
| C-12 | AUTH-04 | `page.tsx` de `app/(painel)` sem `verificarSessao`/`exigirPapel` | `rg -L "verificarSessao\|exigirPapel" "app/(painel)" -g page.tsx` |
| C-13 | ROTA-21 | `error.tsx` sem `'use client'` | `rg -L "^['\"]use client" app -g error.tsx` |
| C-14 | ROTA-21, API-10 | `page.tsx` com `await listar/buscar` sem `loading.tsx` ou `error.tsx` na pasta ou acima (até `app/`) | listar pastas manualmente |
| C-15 | API-06 | `fetch(` em `lib/` sem `cache:`/`revalidate` nas 8 linhas seguintes | `rg -n -A8 "fetch\(" lib` |
| C-16 | API-05, API-15 | qualquer `useEffect` (REVISAR: acusa busca de dados no cliente; efeito de foco/scroll é aceitável) | `rg -n useEffect app components` |
| C-17 | COMP-13 | `key={i}`, `key={index}`, `key={idx}` | `rg -n "key=\{(i\|index\|idx)\}" app components` |
| C-18 | STACK-06 | dependência do `package.json` fora da lista permitida | ler `package.json` |
| C-19 | COMP-16, JS-06 | `dangerouslySetInnerHTML`, `innerHTML`, `document.querySelector/getElementById`, `addEventListener`, `classList` | `rg -n "dangerouslySetInnerHTML\|innerHTML\|document\.\|addEventListener\|classList" app components` |
| C-20 | CSS-02 | `style={{` | `rg -n "style=\{\{" app components` |
| C-21 | JS-01 | declaração com `var` | `rg -n "\bvar\s" app components lib` |
| C-22 | JS-02 | `==` ou `!=` soltos | `rg -n -P "[^=!<>]==[^=]\|!=[^=]" app components lib` |
| C-23 | API-12 | `catch` vazio numa linha (`catch {}` / `catch (e) {}`) | `rg -n -U "catch\s*(\([^)]*\))?\s*\{\s*\}" app lib` (o rg com `-U` pega também em várias linhas) |
| C-24 | API-14 | `revalidateTag('x')` com um argumento (Next 16 exige dois) | `rg -n "revalidateTag\(['\"][^'\"]*['\"]\)"` |
| C-25 | FORM-15, FORM-18 | `z.string().email()` / `.uuid()` / `.url()` e `.flatten()` (Zod 3) | `rg -n "z\.string\(\)\.(email\|uuid\|url)\(\|\.flatten\(\)" lib app` |
| C-26 | FORM-13 | `z.number()` em `lib/schemas` (REVISAR: ok em schema de resposta; erro em schema de formulário) | `rg -n "z\.number\(\)" lib/schemas` |
| C-27a/b/c | FORM-01, FORM-04, FORM-05 | `useForm(` sem `zodResolver` / sem `defaultValues` / sem `mode: 'onBlur'` + `reValidateMode: 'onChange'` | abrir cada arquivo com `useForm(` |
| C-28 | FORM-06 | `onSubmit={` sem `handleSubmit` | `rg -n "onSubmit=\{" app components` |
| C-29 | FORM-07 | `<form ... handleSubmit` sem `noValidate` na mesma linha | se a tag `<form>` quebra em várias linhas, confira à mão |
| C-30 | FORM-10 | `<p>`/`<span>` exibindo `errors.`/`fieldState.error`/`{erro}` sem `role="alert"` na mesma linha (REVISAR) | `rg -n "<(p\|span)[^>]*>.*errors\." app components` |
| C-31 | FORM-21 | `watch(` solto (o certo é `useWatch(`) | `rg -n "(^\|[^A-Za-z])watch\(" app components` |
| C-32 | FORM-14 | `.refine(` em `lib/schemas` sem `path:` nas 5 linhas seguintes (REVISAR: refine de campo único não precisa de path) | `rg -n -A5 "\.refine\(" lib/schemas` |
| C-33 | AUTH-02, ROTA-10 | `cookies().get/set/delete` sem `await` | `rg -n "[^(]cookies\(\)\.(get\|set\|delete)" app lib proxy.ts` |
| C-34 | AUTH-02 | `localStorage`, `sessionStorage`, `document.cookie` | `rg -n "localStorage\|sessionStorage\|document\.cookie" app components lib` |
| C-35 | ROTA-05 | `app/layout.tsx` sem `lang="pt-BR"` | |
| C-36 | ROTA-22 | falta `app/not-found.tsx` | |
| C-37 | CSS-04, CSS-09 | valor arbitrário `x-[13px]` ou cor hex em `.ts/.tsx` (REVISAR) | `rg -n "[a-z]-\[[0-9#]\|#[0-9a-fA-F]{6}" app components` |
| C-38 | ROTA-08 | lista todos os arquivos `'use client'` (REVISAR: cada um precisa ter hook de cliente ou evento) | |
| C-39 | (skill) | marcador `[XXX-NN]` no código cujo ID não existe em `padroes-wellington/references` | |
| C-41 | ROTA-05 | `<html` fora de `app/layout.tsx` | |
| C-44 | COMP-14, JS-08 | `.length &&` | `rg -n "\.length &&" app components` |
| C-45 | COMP-06 | `: any` / `<any>` | `rg -n ": any\b" app components lib` |
| C-46 | FORM-02 | `z.object(` fora de `lib/` | `rg -n "z\.object\(" app components` |
| C-47 | API-08 | `process.env` em arquivo `'use client'` | |
| C-48 | DEC-04 | `localhost` escrito no código (a URL vem de `API_URL`) | `rg -n localhost app components lib` |
| C-49 | AUTH-06 | `forbidden(` ou `authInterrupts` | |
| C-50 | FORM-03 | `useForm<` com genérico | `rg -n "useForm<" app components` |
| C-51 | API-04 | `res.json()` em `lib/` fora de `.parse(` na mesma linha (REVISAR) | `rg -n "res\.json\(\)" lib` |
| C-52 | API-11, API-13 | `{error.message}` / `{e.message}` renderizado | `rg -n "\{ *(error\|e\|erro)\.message *\}" app components` |
| C-53 | COMP-15 | ` class="` ou ` for="` em `.tsx` | `rg -n " (class\|for)=\"" app components -g "*.tsx"` |
| C-54 | CSS-09 | existe `tailwind.config.*` | `rg --files -g "tailwind.config.*"` |
| C-55 | CSS-07 | `<div ... onClick` | `rg -n "<div[^>]*onClick" app components` |
| C-56 | DEC-01, DEC-02, DEC-07, STACK-06 | import de axios, TanStack Query, swr, zustand, redux, jose, next-auth, prop-types, yup, formik | |
| C-57 | DEC-10 | `cacheComponents`, `reactCompiler` ou `experimental` no `next.config.ts` | |
| C-58 | DEC-10 | cacheComponents ligado: `cacheComponents` ou `partialPrefetching` no `next.config.ts` (o create-next-app do Next 16.4 gera as duas linhas; elas precisam ser apagadas) | `grep -nE "cacheComponents\|partialPrefetching" next.config.ts` |
| C-59 | DEC-13 | variante `dark:` ou seletor `.dark` (tema único) | `rg -n "\.dark\|dark:" app components` |
| C-60 | CSS-12 | listra colorida lateral (`border-l-2`…`border-l-8`, `border-r-2`…`border-r-8`) | `rg -n "border-[lr]-[2-8]" app components` |
| C-61 | CSS-12 | classe de gravidade montada por interpolação (o Tailwind não gera) | `rg -n 'gravidade-\$\{' app components` |
| C-62 | CSS-13 | fonte condensada dentro de `components/ui` (botão, campo, menu) | `rg -n "font-heading" components/ui` |

## Manuais (o script não consegue decidir)

| Check | Regra | Como fazer |
|---|---|---|
| M-01 | ROTA-20 | `rg -n -B8 "redirect\(" app lib`: nenhum `redirect` dentro de bloco `try { }` (dentro de `catch` pode). |
| M-02 | ROTA-15 | Para cada arquivo com `useSearchParams`, achar quem o renderiza e conferir `<Suspense>` em volta. |
| M-03 | ROTA-14, COMP-09 | Cada `useState` encontrado: não guarda filtro, página, dado da API nem campo de formulário. |
| M-04 | REQ-06 (c) | Existe pelo menos um `useState` legítimo (menu, mostrar senha, aba). Se não existir, é pendência do requisito "estado local". |
| M-05 | AUTH-01..09, REQ-03..05 | Com `npm run api` e `npm run dev`: (1) janela anônima em `/painel` → vai para `/login`; (2) senha errada → mensagem no form, sem dizer qual campo; (3) login de Lanterna → lista só do setor dele; (4) Lanterna abre URL de ocorrência de outro setor → `/acesso-negado`; (5) Lanterna abre `/painel/ocorrencias/<id>/atribuir` → `/acesso-negado`; (6) Guardião vê tudo e atribui; (7) depois do login, botão Voltar do navegador não volta ao `/login`; (8) Sair → `/login` e `/painel` volta a pedir login; (9) editar o cookie `sessao` no DevTools (trocar um caractere) → tratado como não logado. |
| M-06 | API-09, API-10, API-11 | Os 4 estados: (a) loading: DevTools > Network > Slow 3G; (b) vazio: filtro sem resultado; (c) erro: parar o json-server e recarregar → `error.tsx` com "Tentar de novo"; (d) sucesso. |
| M-07 | CSS-03 | DevTools em 375 px: homepage, lista, formulário e login sem rolagem horizontal. |
| M-08 | FORM-09..11, CSS-08 | Formulário de login e de ocorrência só com teclado (Tab, Enter); erro aparece embaixo do campo, em português, com texto (não só cor); foco vai para o primeiro campo inválido. |
| M-09 | STACK-01 | `npm run lint` e `npm run build` sem erro. Anote a saída no relatório. |
| M-10 | (skill) | Amostra de marcadores: para pelo menos 10 marcadores (todos os de `proxy.ts`, `lib/dal.ts`, `lib/sessao.ts` e actions), abrir a regra e confirmar que a linha marcada aplica mesmo a regra. Marcador na linha errada = violação "marcador incorreto". |
| M-11 | COMP-02 | Arquivos com mais de ~150 linhas: `wc -l` e avaliar se devem ser divididos. |
