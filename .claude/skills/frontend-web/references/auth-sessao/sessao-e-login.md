# Cookie, login, logout e token no servidor

### AUTH-02: Sessão = JWT da API num cookie httpOnly gravado pelo servidor
**Fonte:** [DOCS] `node_modules/next/dist/docs/01-app/02-guides/authentication.md` ("Setting cookies (recommended options)": HttpOnly, Secure, SameSite, Expires, Path) e `.../03-api-reference/04-functions/cookies.md` (gravar só em Server Function ou Route Handler) + [DECISÃO] aprovada: o Next é a camada servidora, o navegador nunca vê o token
**Regra:** A Server Action de login (AUTH-08) chama `POST /auth/login` da API, recebe o JWT e o grava com `await cookies()` de `next/headers`: `httpOnly: true`, `secure` em produção, `sameSite: 'lax'`, `path: '/'` e expiração igual à do token. A expiração vem do campo de validade da resposta do login, se a API informar; sem ele, leia a claim `exp` do payload do JWT só para calcular o `expires` (leitura, nunca para decidir permissão). O cookie guarda **apenas o token**: papel e dados do usuário vêm da API (AUTH-04). O front não assina, não decodifica para autorizar e não verifica JWT.
**✅ Certo:**
```ts
// lib/cookie.ts → export const NOME_COOKIE = 'sessao' (sem server-only, o proxy importa)
// lib/auth.ts (import 'server-only' no topo: AUTH-12)
import { NOME_COOKIE } from '@/lib/cookie'

export async function criarSessao(token: string, expiraEm: Date) {
  ;(await cookies()).set(NOME_COOKIE, token, { // [AUTH-02]
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiraEm,
  })
}
```
**❌ Errado:** `localStorage.setItem('token', ...)`, `document.cookie = ...` no cliente, cookie sem `httpOnly`, cookie com `maxAge` de 30 dias para um token de 1 hora, cookie com papel ou nome do usuário que o código leia como verdade.
**Como verificar:** `rg -n "localStorage|sessionStorage|document\.cookie" app components lib` vazio; `rg -n "httpOnly: true" lib`; no DevTools o cookie aparece como HttpOnly e `document.cookie` não o mostra.

### AUTH-08: Login com RHF + Server Action que chama a API e grava o cookie
**Fonte:** [DECISÃO] fluxo do login + [SLIDE] FORMS p. 16, p. 19, p. 20 (mesmo schema no cliente e no servidor; erro do servidor no formulário); ROTAS p. 20 (replace após login) + [DOCS] `authentication.md` ("Sign-up and login functionality")
**Regra:** `FormLogin` (cliente) usa RHF + `loginSchema` e chama `entrar(dados)` no `onSubmit`. A action: `safeParse`, `POST /auth/login` pelo cliente (API-17), `criarSessao` (AUTH-02), `redirect('/painel', RedirectType.replace)` fora do `try` (ROTA-20). O front **não compara senha**. 401 vira mensagem genérica, sem dizer qual campo errou; 429 pede para aguardar; o resto vira a mensagem geral (API-13). O form mostra com `setError('root', ...)`.
**✅ Certo:**
```ts
// app/(site)/login/actions.ts
'use server'
export async function entrar(dados: unknown): Promise<ResultadoAcao> {
  const parsed = loginSchema.safeParse(dados) // [FORM-17]
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors } // [FORM-18]
  try {
    const { token, expiraEm } = await autenticar(parsed.data) // POST /auth/login (API-17)
    await criarSessao(token, expiraEm)
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return { ok: false, erro: 'E-mail ou senha incorretos.' } // [AUTH-08]
    if (e instanceof ApiError && e.status === 429) return { ok: false, erro: 'Muitas tentativas. Aguarde um minuto e tente de novo.' }
    console.error(e)
    return { ok: false, erro: MENSAGEM_GERAL } // [API-13]
  }
  redirect('/painel', RedirectType.replace) // [ROTA-19]
}
```
**❌ Errado:** comparar senha no cliente ou no front; mensagem "Senha incorreta para fulano@..."; guardar usuário em `useState` global; `redirect` dentro do `try`.
**Como verificar:** `rg -n "senha" app components` não acha comparação em arquivo `'use client'`; o token não aparece no retorno da action.

### AUTH-09: Sair = Server Action que apaga o cookie e redireciona
**Fonte:** [DOCS] `authentication.md` ("Deleting the session", `logout`)
**Regra:** `sair()` faz `(await cookies()).delete(NOME_COOKIE)` e `redirect('/login')`. O botão é um `<form action={sair}>` com `<button>` (funciona sem JavaScript, sem `'use client'`). O JWT é stateless: apagar o cookie encerra a sessão deste navegador, mas não invalida o token na API (`backend-api`, limites do JWT stateless); por isso o token tem vida curta.
**✅ Certo:**
```tsx
<form action={sair}><Button type="submit" variant="outline">Sair</Button></form>
```
**❌ Errado:** `<Link href="/login">Sair</Link>` (o cookie continua válido).
**Como verificar:** `rg -n "delete\(NOME_COOKIE\)" app lib`.

### AUTH-12: O token existe só no servidor
**Fonte:** [DECISÃO] aprovada: o navegador nunca vê o token nem chama a API + [DOCS] `.../02-guides/data-security.md` (`server-only`)
**Regra:** Os módulos que leem o cookie ou montam o `Authorization: Bearer` (`lib/auth.ts`, `lib/dal.ts`, `lib/api.ts`) começam com `import 'server-only'`. O token nunca vai em prop, retorno de Server Action, JSON de resposta, URL, `console.log` ou evento de monitoramento (PROD-05). Componente cliente recebe só os dados já filtrados pelo servidor. Nada chama a API pelo navegador.
**✅ Certo:** a action devolve `{ ok: true }`; a página passa `usuario.nome` ao menu.
**❌ Errado:** `return { token }` de uma action; `fetch(API_URL, { headers: { Authorization } })` em arquivo `'use client'`; `console.log(res.headers)`.
**Como verificar:** `rg -n "accessToken|token" app components` e confirme que nenhum aparece em arquivo `'use client'`; `rg -L "server-only" lib/auth.ts lib/dal.ts lib/api.ts` vazio; `rg -n "NEXT_PUBLIC_" .` (sem `node_modules`) vazio.

### AUTH-13: Token recusado pela API (401) encerra a sessão por um Route Handler
**Fonte:** [DOCS] `.../03-api-reference/04-functions/cookies.md` (cookie só se grava ou apaga em Server Function ou Route Handler, nunca durante a renderização) + [DECISÃO] evita o laço login → painel → 401
**Regra:** Uma página não consegue apagar o cookie ao descobrir um 401. Ela faz `redirect('/sessao-expirada')`, um Route Handler que apaga o cookie e redireciona para `/login?expirou=1`. Todo tratamento de 401 em leitura (API-12) usa essa rota; a tela de login mostra "Sua sessão expirou". Essa rota fica fora do matcher do proxy.
**✅ Certo:**
```ts
// app/sessao-expirada/route.ts
export async function GET(request: NextRequest) {
  ;(await cookies()).delete(NOME_COOKIE) // [AUTH-13]
  return NextResponse.redirect(new URL('/login?expirou=1', request.url))
}
```
**❌ Errado:** `redirect('/login')` com o cookie inválido ainda presente (o usuário volta ao painel e recebe 401 de novo); `cookies().delete` dentro do componente.
**Como verificar:** com um token adulterado no cookie, abrir uma página privada leva a `/login?expirou=1` e o cookie some; `rg -n "sessao-expirada" app lib`.
