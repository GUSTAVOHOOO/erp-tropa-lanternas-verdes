# Links, hooks de rota e redirect

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
