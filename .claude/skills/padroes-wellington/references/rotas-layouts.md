# Rotas, layouts e navegação (ROTA)

Deck: ROTAS (`Rotas, Layouts e Navegação — React Router Next.js App Router.pdf`).
A parte 1 do deck (React Router, p. 5 a 9) é conceitual: o projeto usa só o App Router. O checklist
"Faça sempre / Armadilhas" (ROTAS p. 22) está coberto assim:

| Item do checklist (p. 22) | Regra |
|---|---|
| Uma pasta por segmento; page.tsx só onde há tela | ROTA-01 |
| Layouts para tudo que se repete entre rotas | ROTA-06 |
| `<Link>` para toda navegação interna | ROTA-16 |
| Filtros e paginação em searchParams | ROTA-14 |
| loading.tsx e error.tsx nas rotas que buscam dados | ROTA-21 |
| Validar params (são strings!) antes de usar | ROTA-11 |
| 'use client' só nos componentes interativos | ROTA-08 |
| Armadilha: useRouter de next/router | ROTA-18 |
| Armadilha: `<a href>` ou window.location para rotas internas | ROTA-16 |
| Armadilha: esquecer o await em params | ROTA-10 |
| Armadilha: 'use client' no layout inteiro | ROTA-08 |
| Armadilha: pasta sem page.tsx e um 404 misterioso | ROTA-01 |
| Armadilha: duas rotas iguais em grupos diferentes | ROTA-04 |
| Armadilha: useState guardando o que deveria estar na URL | ROTA-14 |

O deck não fala de middleware/proxy. Controle de acesso está em `autenticacao.md` (AUTH).


Índice: ROTA-01 Pasta é segmento de URL; page.tsx só onde há tela · ROTA-02 Arquivos especiais por convenção · ROTA-03 Pastas com _ são privadas (colocation) · ROTA-04 Grupos de rotas (site) e (painel), sem URLs repetidas · ROTA-05 Um único layout raiz com html lang="pt-BR" · ROTA-06 Layout para tudo que se repete entre rotas · ROTA-07 Páginas são Server Components; podem ser async e ter metadata · ROTA-08 'use client' só nos componentes interativos, nunca em layout · ROTA-09 Segmentos dinâmicos com colchetes · ROTA-10 params e searchParams são Promise: sempre await · ROTA-11 Validar params antes de usar · ROTA-12 notFound() quando o registro não existe · ROTA-13 useParams/usePathname/useSearchParams/useRouter vêm de next/navigation · ROTA-14 Filtros e paginação vivem na URL (searchParams), não em useState · ROTA-15 useSearchParams dentro de Suspense · ROTA-16 Link para toda navegação interna; nunca a href nem window.location · ROTA-17 Link ativo com usePathname + aria-current · ROTA-18 Nunca importar de next/router · ROTA-19 Depois do login, substituir o histórico (replace) · ROTA-20 redirect() no servidor para navegar após ação ou bloquear acesso · ROTA-21 loading.tsx e error.tsx em toda rota que busca dados · ROTA-22 not-found.tsx para 404 com saída clara

---

### ROTA-01: Pasta é segmento de URL; page.tsx só onde há tela
**Fonte:** [SLIDE] ROTAS p. 11 ("Pasta = segmento da URL", "A pasta só vira URL acessível quando contém um page.tsx"); p. 22
**Regra:** Cada pasta dentro de `app/` é um pedaço da URL. Só existe rota onde existe `page.tsx`.
Pasta sem `page.tsx` dá 404.
**✅ Certo:**
```
app/(painel)/painel/ocorrencias/page.tsx   → /painel/ocorrencias
app/(painel)/painel/ocorrencias/nova/page.tsx → /painel/ocorrencias/nova
```
**❌ Errado:** criar `app/painel/relatorios/` com só um componente dentro e linkar para `/painel/relatorios`.
**Como verificar:** todo `href` usado em `<Link>` corresponde a uma pasta com `page.tsx` (`rg -n "href=\"/" app components` e comparar com `rg --files app -g page.tsx`).

### ROTA-02: Arquivos especiais por convenção
**Fonte:** [SLIDE] ROTAS p. 12 (tabela "Mesmo conceito, outro endereço"), p. 13 (page.tsx), p. 14 (layout.tsx), p. 21 (loading, error, not-found)
**Regra:** Use os nomes que o Next reconhece: `page.tsx` (tela), `layout.tsx` (casca),
`loading.tsx`, `error.tsx`, `not-found.tsx`. A página exporta o componente com `export default`.
**✅ Certo:**
```tsx
export default async function OcorrenciasPage() { ... }
```
**❌ Errado:** `app/ocorrencias/Ocorrencias.tsx` esperando virar rota, ou página com export nomeado só.
**Como verificar:** `rg -L "export default" -g "page.tsx" -g "layout.tsx" -g "loading.tsx" -g "error.tsx" -g "not-found.tsx" app` deve retornar vazio.

### ROTA-03: Pastas com _ são privadas (colocation)
**Fonte:** [SLIDE] ROTAS p. 11 ("_pasta = privada", "Colocation segura", `_components/Header.tsx`)
**Regra:** Componentes usados por uma rota só ficam em `_components/` dentro da pasta da rota. O `_`
tira a pasta do roteamento. Componentes usados em várias áreas ficam em `components/` na raiz (STACK-05).
**✅ Certo:**
```
app/(painel)/painel/ocorrencias/_components/FormOcorrencia.tsx
```
**❌ Errado:** `app/(painel)/painel/ocorrencias/components/FormOcorrencia.tsx` sem `_` (fica sujeita a virar segmento se alguém criar `page.tsx` ali).
**Como verificar:** `rg --files app | rg "/components/"` deve retornar vazio (só `_components/`).

### ROTA-04: Grupos de rotas (site) e (painel), sem URLs repetidas
**Fonte:** [SLIDE] ROTAS p. 15 ("Grupos de rotas: layouts sem mudar a URL", exemplo com `(site)/` e `(painel)/`, "Cuidado com conflitos"); p. 22
**Regra:** A área pública fica em `app/(site)/` e a privada em `app/(painel)/`, cada uma com seu
`layout.tsx`. Os parênteses não aparecem na URL. Nunca crie a mesma URL nos dois grupos. Por isso
as telas privadas ficam sob o segmento `painel/` (`app/(painel)/painel/...`): isso evita conflito e
dá um prefixo único para o `proxy.ts` proteger (AUTH-01).
**✅ Certo:**
```
app/(site)/page.tsx                → /
app/(site)/sobre/page.tsx          → /sobre
app/(painel)/painel/page.tsx       → /painel
```
**❌ Errado:**
```
app/(site)/ocorrencias/page.tsx
app/(painel)/ocorrencias/page.tsx  ← ambos resolvem para /ocorrencias: erro de build
```
**Como verificar:** listar as rotas de cada grupo (`rg --files "app/(site)" -g page.tsx`, idem `(painel)`) e conferir que nenhum caminho relativo se repete.

### ROTA-05: Um único layout raiz com html lang="pt-BR"
**Fonte:** [SLIDE] ROTAS p. 14 ("único lugar com `<html>` e `<body>`", `<html lang="pt-BR">`)
**Regra:** `app/layout.tsx` é o único arquivo com `<html>` e `<body>`, com `lang="pt-BR"`. Layouts
de grupo devolvem só a casca (header, sidebar) e `{children}`.
**✅ Certo:**
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
```
**❌ Errado:** `<html>` dentro de `app/(painel)/layout.tsx`, ou `lang="en"` deixado do create-next-app.
**Como verificar:** `rg -n "<html" app` deve achar só `app/layout.tsx`, com `lang="pt-BR"`.

### ROTA-06: Layout para tudo que se repete entre rotas
**Fonte:** [SLIDE] ROTAS p. 14 ("layout.tsx: a casca que persiste", "Estado preservado"); p. 22
**Regra:** Header público vai em `app/(site)/layout.tsx`; sidebar e botão "Sair" em
`app/(painel)/layout.tsx`. Nenhuma página repete header/menu.
**✅ Certo:**
```tsx
// app/(painel)/layout.tsx
export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen"><Sidebar /><main className="flex-1 p-6">{children}</main></div>
}
```
**❌ Errado:** `<Sidebar />` importado em cada `page.tsx` do painel.
**Como verificar:** `rg -n "<(Header|Sidebar|Footer|Menu)" app -g page.tsx` deve retornar vazio.

### ROTA-07: Páginas são Server Components; podem ser async e ter metadata
**Fonte:** [SLIDE] ROTAS p. 13 ("Server Component por padrão: pode ser async", `export const metadata`); APIS p. 11
**Regra:** `page.tsx` não leva `'use client'`. Ela é `async`, busca os dados pela camada de serviço
(API-05) e exporta `metadata` com título em português.
**✅ Certo:**
```tsx
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Ocorrências | ERP da Tropa' }
export default async function OcorrenciasPage() { const lista = await listarOcorrencias({}); ... }
```
**❌ Errado:** `'use client'` no topo de `page.tsx` para poder usar `useEffect` e buscar dados.
**Como verificar:** `rg -l "^['\"]use client['\"]" app -g page.tsx` deve retornar vazio.

### ROTA-08: 'use client' só nos componentes interativos, nunca em layout
**Fonte:** [SLIDE] ROTAS p. 13 ("'use client' só se precisar. Estado e eventos? Extraia um componente cliente pequeno"); p. 22 (armadilha "'use client' no layout inteiro") + [DOCS] https://nextjs.org/docs/app/getting-started/server-and-client-components
**Regra:** Só leva `'use client'` o arquivo que usa estado, evento, hook de cliente (`useState`,
`useForm`, `usePathname`, `useRouter`, `useSearchParams`) ou API do navegador. Layouts e páginas
ficam no servidor e importam o pedaço interativo. Exceção obrigatória: `error.tsx` (ROTA-21).
**✅ Certo:**
```tsx
// components/MenuNavegacao.tsx
'use client'
import { usePathname } from 'next/navigation'
```
**❌ Errado:**
```tsx
// app/(painel)/layout.tsx
'use client'
```
**Como verificar:** `rg -l "^['\"]use client['\"]" app components` e conferir, arquivo por arquivo, que existe um hook de cliente ou evento; `rg -l "^['\"]use client['\"]" app -g layout.tsx` deve retornar vazio.

### ROTA-09: Segmentos dinâmicos com colchetes
**Fonte:** [SLIDE] ROTAS p. 16 ("Segmentos dinâmicos entre colchetes", `produtos/[id]` → `{ id: '42' }`, "Sempre string")
**Regra:** Detalhe de um registro usa pasta `[id]`. O valor chega como string.
**✅ Certo:**
```
app/(painel)/painel/ocorrencias/[id]/page.tsx   → /painel/ocorrencias/abc123
```
**❌ Errado:** `/painel/ocorrencia?id=abc123` para tela de detalhe.
**Como verificar:** telas de detalhe ficam em pastas `[id]`.

### ROTA-10: params e searchParams são Promise: sempre await
**Fonte:** [SLIDE] ROTAS p. 17 ("params é uma Promise. A partir do Next.js 15, use await params"), p. 18 (`await searchParams`), p. 22 (armadilha) + [DOCS] https://nextjs.org/docs/app/guides/upgrading/version-16 ("synchronous access is fully removed")
**Regra:** Tipar `params` e `searchParams` como `Promise<...>` e usar `await` antes de ler.
**✅ Certo:**
```tsx
type Props = { params: Promise<{ id: string }> }
export default async function DetalhePage({ params }: Props) {
  const { id } = await params // [ROTA-10]
```
**❌ Errado:**
```tsx
export default function DetalhePage({ params }: { params: { id: string } }) {
  const id = params.id
```
**Como verificar:** `rg -n "params: \{|searchParams: \{" app` deve retornar vazio; `rg -n "(params|searchParams)\.\w" app -g page.tsx -g layout.tsx` deve retornar vazio.
**Nota de versão:** o slide diz "a partir do Next.js 15". No Next 16 o acesso síncrono deixou de
existir: sem `await` o código quebra.

### ROTA-11: Validar params antes de usar
**Fonte:** [SLIDE] ROTAS p. 16 ("Sempre string. Converta com Number() ou valide com Zod — lembra do z.coerce?"); p. 22
**Regra:** Não confie no valor da URL. Para `id` do json-server (string) basta checar que não está
vazio; para número use `Number()` + `Number.isNaN` ou `z.coerce.number()`. Valor inválido →
`notFound()` (ROTA-12). Filtros de `searchParams` que são enum passam por `z.enum(...).safeParse`.
**✅ Certo:**
```tsx
const { status } = await searchParams
const filtro = statusSchema.safeParse(status) // [ROTA-11]
const statusValido = filtro.success ? filtro.data : undefined
```
**❌ Errado:** `listarOcorrencias({ status })` com o texto cru da URL.
**Como verificar:** todo `await params`/`await searchParams` é seguido de conversão/validação antes de ir para `lib/`.

### ROTA-12: notFound() quando o registro não existe
**Fonte:** [SLIDE] ROTAS p. 17 (`if (!produto) notFound()`), p. 21; APIS p. 5 ("404 Não encontrado — notFound()"), APIS p. 22
**Regra:** Se a API responde 404 ou o registro não existe, chame `notFound()` de `next/navigation`.
Isso mostra o `not-found.tsx` mais próximo.
**✅ Certo:**
```tsx
if (!ocorrencia) notFound() // [ROTA-12]
```
**❌ Errado:** renderizar `<p>Não achei</p>` com status 200, ou deixar estourar `undefined.titulo`.
**Como verificar:** toda página `[id]` tem `notFound()` ou trata `ApiError` 404 (API-12).

### ROTA-13: useParams/usePathname/useSearchParams/useRouter vêm de next/navigation
**Fonte:** [SLIDE] ROTAS p. 17 ("useParams() no cliente... importe de next/navigation"), p. 19, p. 20
**Regra:** Hooks de rota no cliente são importados de `next/navigation`. Em Server Components use
as props `params`/`searchParams`, não hooks.
**✅ Certo:**
```tsx
'use client'
import { useParams } from 'next/navigation'
const { id } = useParams<{ id: string }>()
```
**❌ Errado:** `import { useParams } from 'react-router'`.
**Como verificar:** `rg -n "from ['\"]react-router" app components` deve retornar vazio.

### ROTA-14: Filtros e paginação vivem na URL (searchParams), não em useState
**Fonte:** [SLIDE] ROTAS p. 18 ("Por que na URL e não no useState? Sobrevive ao F5, pode ser compartilhado e o botão voltar desfaz o filtro"); p. 22 (faça sempre e armadilha)
**Regra:** Filtro de ocorrências (status, gravidade, setor para o Guardião) e página atual ficam em
`?status=aberta&pagina=2`. A página lê com `await searchParams`; o componente de filtro (cliente)
escreve com `router.push(`?${q}`)`.
**✅ Certo:**
```tsx
'use client'
const params = useSearchParams()
const router = useRouter()
function filtrar(status: string) {
  const q = new URLSearchParams(params)
  q.set('status', status)
  router.push(`?${q}`) // [ROTA-14]
}
```
**❌ Errado:**
```tsx
const [status, setStatus] = useState('todas') // filtro some no F5
```
**Como verificar:** `rg -n "useState" app components` e conferir que nenhum guarda filtro, busca ou página.

### ROTA-15: useSearchParams dentro de Suspense
**Fonte:** [SLIDE] ROTAS p. 18 ("useSearchParams precisa de um `<Suspense>` acima dele em rotas pré-renderizadas")
**Regra:** O componente cliente que usa `useSearchParams` é renderizado dentro de `<Suspense>` na página.
**✅ Certo:**
```tsx
<Suspense fallback={null}><FiltroOcorrencias /></Suspense>
```
**❌ Errado:** `<FiltroOcorrencias />` solto em página estática (erro no build).
**Como verificar:** para cada arquivo com `useSearchParams`, achar quem o importa e conferir o `<Suspense>`.

### ROTA-16: Link para toda navegação interna; nunca a href nem window.location
**Fonte:** [SLIDE] ROTAS p. 19 ("Nunca `<a href>` interno. A tag `<a>` recarrega a página inteira e perde o estado"), p. 22 (faça sempre e armadilha); ROTAS p. 8
**Regra:** Navegação dentro do app usa `<Link href="...">` de `next/link`. `<a>` só para link externo.
Botão do shadcn que navega: use `<Link>` com as classes do botão (`buttonVariants`) em vez de `<a>`.
**✅ Certo:**
```tsx
import Link from 'next/link'
<Link href="/painel/ocorrencias/nova">Registrar ocorrência</Link>
```
**❌ Errado:**
```tsx
<a href="/painel/ocorrencias/nova">Registrar ocorrência</a>
window.location.href = '/painel'
```
**Como verificar:** `rg -n "<a [^>]*href=[\"'{]/" app components` e `rg -n "window\.location" app components` devem retornar vazio.

### ROTA-17: Link ativo com usePathname + aria-current
**Fonte:** [SLIDE] ROTAS p. 19 ("Link ativo: usePathname() + aria-current substitui o `<NavLink>`")
**Regra:** O menu marca o item atual com `aria-current="page"` e estiliza a partir disso.
**✅ Certo:**
```tsx
const atual = usePathname()
<Link href={href} aria-current={atual === href ? 'page' : undefined}
  className="aria-[current=page]:font-bold">{rotulo}</Link>
```
**❌ Errado:** só mudar a cor com uma classe condicional, sem `aria-current`.
**Como verificar:** `rg -n "aria-current" components app` acha o menu de navegação.

### ROTA-18: Nunca importar de next/router
**Fonte:** [SLIDE] ROTAS p. 20 ("Armadilha: next/router. Aquele é do Pages Router. No App Router, use next/navigation"); p. 22
**Regra:** Tudo de navegação vem de `next/navigation` (`useRouter`, `redirect`, `notFound`,
`usePathname`, `useSearchParams`, `useParams`).
**✅ Certo:** `import { useRouter } from 'next/navigation'`
**❌ Errado:** `import { useRouter } from 'next/router'`
**Como verificar:** `rg -n "next/router" app components lib` deve retornar vazio.

### ROTA-19: Depois do login, substituir o histórico (replace)
**Fonte:** [SLIDE] ROTAS p. 20 ("push empilha no histórico; replace substitui — ideal após o login", `router.replace('/painel')`) + [DOCS] https://nextjs.org/docs/app/api-reference/functions/redirect ("push (default in Server Actions)")
**Regra:** Após entrar, o usuário vai para `/painel` sem poder "voltar" para o login. Como o login
é uma Server Action (AUTH-08), use `redirect('/painel', RedirectType.replace)`: dentro de Server
Action o padrão do `redirect` é `push`, por isso o tipo é explícito.
**✅ Certo:**
```ts
redirect('/painel', RedirectType.replace) // [ROTA-19]
```
**❌ Errado:** `redirect('/painel')` na Server Action de login (empilha), ou `router.push('/painel')` no cliente.
**Como verificar:** `rg -n "redirect\('/painel'" app` na action de login mostra `RedirectType.replace`.

### ROTA-20: redirect() no servidor para navegar após ação ou bloquear acesso
**Fonte:** [SLIDE] ROTAS p. 20 (`if (!usuario) redirect('/login')`; "Depois que a Server Action salvar o formulário, chame redirect('/obrigado')"); APIS p. 21, p. 22 ("401 redirect('/login')") + [DOCS] https://nextjs.org/docs/app/api-reference/functions/redirect ("should be called outside the try block")
**Regra:** Em Server Component e Server Action, navegue com `redirect()` de `next/navigation`.
`redirect` lança um erro interno: chame fora de `try { }` (dentro de `catch` pode).
**✅ Certo:**
```ts
await salvarOcorrencia(parsed.data)
revalidatePath('/painel/ocorrencias')
redirect('/painel/ocorrencias') // [ROTA-20]
```
**❌ Errado:**
```ts
try { await salvarOcorrencia(d); redirect('/painel/ocorrencias') } catch { return { ok: false } } // engole o redirect
```
**Como verificar:** `rg -n -B6 "redirect\(" app lib` e conferir que não há `try {` aberto envolvendo a chamada.

### ROTA-21: loading.tsx e error.tsx em toda rota que busca dados
**Fonte:** [SLIDE] ROTAS p. 21 ("loading.tsx... é um `<Suspense>` automático"; "error.tsx... Precisa ser Client Component"); ROTAS p. 22; APIS p. 19, p. 23
**Regra:** Toda pasta cuja `page.tsx` faz `await` de dados tem `loading.tsx` (ou `<Suspense>`
explícito) e `error.tsx`. `error.tsx` começa com `'use client'`, recebe `reset` e mostra botão
"Tentar de novo" (API-11).
**✅ Certo:**
```tsx
// error.tsx
'use client'
export default function Erro({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert">
      <p>Não foi possível carregar as ocorrências.</p>
      <button onClick={() => reset()}>Tentar de novo</button>
    </div>
  )
}
```
**❌ Errado:** rota de listagem sem `loading.tsx` (tela congelada) ou `error.tsx` sem `'use client'`.
**Como verificar:** para cada `page.tsx` com `await listar|await buscar`, existe `loading.tsx` e `error.tsx` na mesma pasta ou em pasta ancestral do mesmo grupo; `rg -L "^['\"]use client['\"]" app -g error.tsx` deve retornar vazio.

### ROTA-22: not-found.tsx para 404 com saída clara
**Fonte:** [SLIDE] ROTAS p. 21 ("not-found.tsx: Exibido quando nenhuma rota casa com a URL ou quando você chama notFound()"); ROTAS p. 12
**Regra:** Existe `app/not-found.tsx` global com link para a homepage. Rotas de detalhe podem ter
um `not-found.tsx` próprio ("Ocorrência não encontrada" + link para a lista).
**✅ Certo:**
```tsx
export default function NotFound() {
  return <main><h1>Página não encontrada</h1><Link href="/">Voltar ao início</Link></main>
}
```
**❌ Errado:** depender da página padrão em inglês do Next.
**Como verificar:** `rg --files app -g not-found.tsx` acha pelo menos `app/not-found.tsx`.
