# Autenticação, sessão e controle de acesso (AUTH)

**Atenção para a apresentação:** os slides NÃO cobrem middleware/proxy, cookies de sessão nem
papéis. O enunciado exige "middleware ou equivalente". Quase tudo aqui é `[DOCS]` (Next.js 16) ou
`[DECISÃO]`. As poucas ligações com os slides são: ROTAS p. 20 (`redirect('/login')` quando não há
usuário; `replace` após login), APIS p. 5 e p. 21 (401 → login; 403 → explicar o bloqueio) e FORMS
p. 8 e p. 20 (validação no servidor; Server Action é endpoint público).

Modelo em três camadas (doc oficial: https://nextjs.org/docs/app/guides/authentication):

1. `proxy.ts`: checagem otimista, só lê o cookie e redireciona (AUTH-01).
2. `lib/dal.ts`: checagem de verdade, em cada página privada e cada Server Action (AUTH-04, AUTH-05).
3. `lib/<recurso>.ts` e Server Actions: filtro por papel/setor no servidor (AUTH-07).

Arquivos envolvidos: `proxy.ts`, `lib/sessao.ts` (assinatura e regras puras, sem `next/*`), `lib/dal.ts` (cookies, `criarSessao`, `apagarSessao`, `lerSessao`, `verificarSessao`, `exigirPapel`), `lib/usuarios.ts`, `lib/schemas/login.ts`, `app/(site)/login/actions.ts`, `app/(site)/login/_components/FormLogin.tsx`, `app/(painel)/actions.ts` (sair), `app/(site)/acesso-negado/page.tsx`.


Índice: AUTH-01 proxy.ts (não middleware.ts) protege /painel e redireciona para /login · AUTH-02 Sessão num cookie httpOnly criado no servidor · AUTH-03 Cookie assinado com HMAC (node:crypto) e SESSION_SECRET · AUTH-04 verificarSessao() no DAL, chamada em toda página privada · AUTH-05 Toda Server Action confere sessão (e papel) antes de agir · AUTH-06 Sem permissão é 403: exigirPapel redireciona para /acesso-negado · AUTH-07 Lanterna só vê o próprio setor: o filtro é aplicado no servidor · AUTH-08 Login com RHF + Server Action entrar · AUTH-09 Sair = Server Action que apaga o cookie e redireciona · AUTH-10 Não fazer a checagem de acesso no layout · AUTH-11 Limitações da API fake documentadas

---

### AUTH-01: proxy.ts (não middleware.ts) protege /painel e redireciona para /login
**Fonte:** [DOCS] https://nextjs.org/docs/app/api-reference/file-conventions/proxy e https://nextjs.org/docs/app/guides/upgrading/version-16 ("middleware... renamed to proxy"; runtime `nodejs`) + [DECISÃO] matcher só em `/painel` e `/login`
**Regra:** Arquivo `proxy.ts` na raiz do projeto (mesmo nível de `app/`), exportando a função
`proxy`. Ele só lê e confere o cookie (sem chamar a API). Sem sessão em `/painel/...` →
redireciona para `/login`. Com sessão em `/login` → redireciona para `/painel`.
**✅ Certo:**
```ts
// proxy.ts: o "middleware" pedido no enunciado (no Next.js 16 o middleware.ts foi renomeado para proxy.ts)
import { NextResponse, type NextRequest } from 'next/server'
import { decodificarSessao, NOME_COOKIE } from '@/lib/sessao'

export function proxy(request: NextRequest) {
  const sessao = decodificarSessao(request.cookies.get(NOME_COOKIE)?.value)
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/painel') && !sessao) {
    return NextResponse.redirect(new URL('/login', request.url)) // [AUTH-01]
  }
  if (pathname === '/login' && sessao) {
    return NextResponse.redirect(new URL('/painel', request.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/painel/:path*', '/login'] }
```
**❌ Errado:** `middleware.ts` com `export function middleware`; proxy que faz `fetch` na API a cada request; proxy como única proteção.
**Como verificar:** existe `proxy.ts` na raiz e não existe `middleware.ts` (`rg --files -g "middleware.ts" -g "proxy.ts" --max-depth 2`); `rg -n "export (default )?function proxy" proxy.ts`.
**Nota de versão:** até o Next 15 o arquivo era `middleware.ts` e é esse o nome que aparece no
enunciado ("middleware ou equivalente"). No Next 16 o nome é `proxy.ts`, roda em Node.js e o
codemod oficial é `npx @next/codemod@canary middleware-to-proxy .`.

### AUTH-02: Sessão num cookie httpOnly criado no servidor
**Fonte:** [DOCS] https://nextjs.org/docs/app/guides/authentication ("Setting cookies (recommended options)": HttpOnly, Secure, SameSite, Expires, Path; "Cookies should be set on the server")
**Regra:** A sessão é gravada só por Server Action, com `await cookies()` de `next/headers`, com
`httpOnly: true`, `sameSite: 'lax'`, `path: '/'`, `expires` e `secure` em produção. O conteúdo é o
mínimo: `id`, `nome`, `papel`, `setorId`, `lanternaId`, `expiraEm`. Nunca senha nem e-mail.
**✅ Certo:**
```ts
// lib/dal.ts
import { DURACAO_SESSAO_MS } from '@/lib/sessao'

export async function criarSessao(dados: Omit<Sessao, 'expiraEm'>) {
  const expiraEm = Date.now() + DURACAO_SESSAO_MS
  const cookieStore = await cookies()
  cookieStore.set(NOME_COOKIE, codificarSessao({ ...dados, expiraEm }), { // [AUTH-02]
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiraEm),
  })
}
```
**❌ Errado:** `localStorage.setItem('usuario', ...)`, `document.cookie = ...` no cliente, cookie sem `httpOnly`.
**Como verificar:** `rg -n "localStorage|sessionStorage|document\.cookie" app components lib` deve retornar vazio; `rg -n "httpOnly: true" lib`.

### AUTH-03: Cookie assinado com HMAC (node:crypto) e SESSION_SECRET
**Fonte:** [DECISÃO] assinar sem biblioteca extra (a doc sugere jose/iron-session; preferimos `node:crypto`, que já vem no Node) + [DOCS] https://nextjs.org/docs/app/guides/authentication ("Generate a secret key... store it as an environment variable")
**Regra:** O valor do cookie é `base64url(JSON) + "." + HMAC-SHA256`. Ler a sessão confere a
assinatura com `timingSafeEqual`, valida o formato com Zod e checa `expiraEm`. Sem isso, qualquer
pessoa editaria o cookie no DevTools e viraria Guardião. `SESSION_SECRET` fica em `.env.local`,
sem `NEXT_PUBLIC_` (API-08). Gere com `openssl rand -base64 32`.
`lib/sessao.ts` não importa nada de `next/*`: assim o `proxy.ts` e os testes usam o mesmo código. `setorId` e `lanternaId` são `null` para o Guardião; uma sessão de Lanterna sem `setorId` é rejeitada pelo schema.
**✅ Certo:**
```ts
// lib/sessao.ts
import { createHmac, timingSafeEqual } from 'node:crypto'
import * as z from 'zod'
import { PAPEIS } from '@/lib/schemas/usuario'

// Este arquivo não importa nada de next/*: o proxy.ts, o dal.ts e os testes usam o mesmo código.

export const NOME_COOKIE = 'sessao'
export const DURACAO_SESSAO_MS = 8 * 60 * 60 * 1000 // 8 horas

const sessaoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  papel: z.enum(PAPEIS),
  setorId: z.string().nullable(), // null para o Guardião
  lanternaId: z.string().nullable(),
  expiraEm: z.number(),
}).refine((s) => s.papel === 'guardiao' || s.setorId !== null) // Lanterna sempre tem setor

export type Sessao = z.infer<typeof sessaoSchema>

function assinar(texto: string): string {
  const segredo = process.env.SESSION_SECRET
  if (!segredo) throw new Error('SESSION_SECRET não definido no .env.local') // sem segredo, a assinatura não protege nada
  return createHmac('sha256', segredo).update(texto).digest('base64url')
}

/** Valor do cookie: dados em base64url + "." + assinatura HMAC. Editar os dados quebra a assinatura. */
export function codificarSessao(sessao: Sessao): string {
  const dados = Buffer.from(JSON.stringify(sessao)).toString('base64url')
  return `${dados}.${assinar(dados)}` // [AUTH-03]
}

/** Lê o cookie. Devolve null se faltar, se a assinatura não conferir, se o formato for outro ou se expirou. */
export function decodificarSessao(valor: string | undefined, agora = Date.now()): Sessao | null {
  if (!valor) return null
  const [dados, assinatura, sobra] = valor.split('.')
  if (!dados || !assinatura || sobra !== undefined) return null
  const recebida = Buffer.from(assinatura)
  const esperada = Buffer.from(assinar(dados))
  if (recebida.length !== esperada.length) return null // timingSafeEqual lança erro com tamanhos diferentes
  if (!timingSafeEqual(recebida, esperada)) return null // [AUTH-03]
  try {
    const resultado = sessaoSchema.safeParse(JSON.parse(Buffer.from(dados, 'base64url').toString()))
    if (!resultado.success || resultado.data.expiraEm < agora) return null
    return resultado.data
  } catch {
    return null
  }
}

/** Lanterna só acessa o próprio setor; Guardião acessa todos. [AUTH-07] */
export function podeAcessarSetor(sessao: Sessao, setorId: string): boolean {
  return sessao.papel === 'guardiao' || sessao.setorId === setorId
}

/** Setor usado nos filtros: o Lanterna fica preso ao próprio setor; o Guardião usa o da URL (ou todos). [AUTH-07] */
export function setorParaFiltro(sessao: Sessao, setorDaUrl?: string): string | undefined {
  if (sessao.papel === 'lanterna') return sessao.setorId ?? 'sem-setor'
  return setorDaUrl
}
```
**❌ Errado:** cookie `sessao=2` (só o id, sem assinatura); segredo escrito no código; `NEXT_PUBLIC_SESSION_SECRET`.
**Como verificar:** `rg -n "SESSION_SECRET" .` só aparece em `lib/sessao.ts` e `.env.local`/`.env.example`; `rg -n "timingSafeEqual" lib/sessao.ts`.

### AUTH-04: verificarSessao() no DAL, chamada em toda página privada
**Fonte:** [DOCS] https://nextjs.org/docs/app/guides/authentication ("Creating a Data Access Layer (DAL)", `verifySession` com `cache`) + [SLIDE] ROTAS p. 20 (`if (!usuario) redirect('/login')`); APIS p. 5 e p. 21 ("401 Não autenticado — mande ao login")
**Regra:** `lib/dal.ts` exporta `verificarSessao()` (envolvida em `cache` do React para não repetir
o trabalho na mesma renderização). Sem sessão válida → `redirect('/login')`. Toda `page.tsx` de
`app/(painel)/` chama `verificarSessao()` ou `exigirPapel()` na primeira linha, mesmo com o proxy:
o proxy é otimista e pode deixar passar (matcher errado, rota movida).
**✅ Certo:**
```ts
// lib/dal.ts
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Papel } from '@/lib/schemas/usuario'
import { codificarSessao, decodificarSessao, DURACAO_SESSAO_MS, NOME_COOKIE, type Sessao } from '@/lib/sessao'

/** Grava a sessão num cookie httpOnly. Só roda no servidor (Server Action). [AUTH-02] */
export async function criarSessao(dados: Omit<Sessao, 'expiraEm'>): Promise<void> {
  const expiraEm = Date.now() + DURACAO_SESSAO_MS
  const cookieStore = await cookies()
  cookieStore.set(NOME_COOKIE, codificarSessao({ ...dados, expiraEm }), { // [AUTH-02]
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiraEm),
  })
}

export async function apagarSessao(): Promise<void> {
  ;(await cookies()).delete(NOME_COOKIE) // [AUTH-09]
}

/** Lê a sessão sem redirecionar: o layout do painel usa só para mostrar o nome. [AUTH-10] */
export const lerSessao = cache(async (): Promise<Sessao | null> => {
  return decodificarSessao((await cookies()).get(NOME_COOKIE)?.value)
})

/** Primeira linha de toda página e action do painel. Sem sessão válida → /login. [AUTH-04] */
export const verificarSessao = cache(async (): Promise<Sessao> => {
  const sessao = await lerSessao()
  if (!sessao) redirect('/login') // [AUTH-04]
  return sessao
})

/** Logado mas sem o papel exigido → /acesso-negado (o "403" explicado). [AUTH-06] */
export async function exigirPapel(papel: Papel): Promise<Sessao> {
  const sessao = await verificarSessao()
  if (sessao.papel !== papel) redirect('/acesso-negado') // [AUTH-06]
  return sessao
}
```
```tsx
// app/(painel)/painel/page.tsx
export default async function PainelPage() {
  const sessao = await verificarSessao() // [AUTH-04]
```
**❌ Errado:** página do painel que confia só no `proxy.ts`.
**Como verificar:** `rg -L "verificarSessao|exigirPapel" "app/(painel)" -g page.tsx` deve retornar vazio.

### AUTH-05: Toda Server Action confere sessão (e papel) antes de agir
**Fonte:** [DOCS] https://nextjs.org/docs/app/api-reference/file-conventions/proxy ("Always verify authentication and authorization inside each Server Function rather than relying on Proxy alone") e https://nextjs.org/docs/app/guides/authentication ("Treat Server Actions with the same security considerations as public-facing API endpoints") + [SLIDE] FORMS p. 20 ("Uma Server Action é um endpoint público")
**Regra:** A primeira linha de toda Server Action do painel é `await verificarSessao()` ou
`await exigirPapel(...)`. Só depois vem o `safeParse` (FORM-17). Exceção: a action `entrar` do
login (o usuário ainda não tem sessão).
**✅ Certo:**
```ts
'use server'
export async function atribuirResponsavel(dados: unknown): Promise<Resultado> {
  await exigirPapel('guardiao') // [AUTH-05]
  const parsed = atribuicaoSchema.safeParse(dados) // [FORM-17]
```
**❌ Errado:** action que só valida os campos e grava.
**Como verificar:** em cada arquivo `actions.ts` sob `app/(painel)`, toda `export async function` contém `verificarSessao` ou `exigirPapel` (`rg -n -A3 "export async function" "app/(painel)" -g actions.ts`).

### AUTH-06: Sem permissão é 403: exigirPapel redireciona para /acesso-negado
**Fonte:** [DECISÃO] página `/acesso-negado` em vez de `forbidden()` + [SLIDE] APIS p. 5 ("403 Sem permissão — explique o bloqueio") + [DOCS] https://nextjs.org/docs/app/api-reference/functions/forbidden ("This feature is currently experimental... not recommended for production")
**Regra:** Logado sem permissão é diferente de não logado. `exigirPapel(papel)` chama
`verificarSessao()` e, se o papel não bate, faz `redirect('/acesso-negado')`. A página
`app/(site)/acesso-negado/page.tsx` explica o bloqueio ("Esta área é exclusiva dos Guardiões") e
oferece link de volta ao painel. Não usamos `forbidden()` porque exige flag experimental.
**✅ Certo:**
```ts
export async function exigirPapel(papel: Sessao['papel']): Promise<Sessao> {
  const sessao = await verificarSessao()
  if (sessao.papel !== papel) redirect('/acesso-negado') // [AUTH-06]
  return sessao
}
```
**❌ Errado:** mandar o Lanterna para `/login` (ele já está logado); esconder o botão e deixar a URL aberta; `experimental.authInterrupts` no `next.config.ts`.
**Como verificar:** `rg -n "acesso-negado" lib app` acha `exigirPapel` e a página; `rg -n "authInterrupts|forbidden\(" .` deve retornar vazio.
**Nota de versão (conferida no Next 16.4):** em rota com `loading.tsx`, o Next começa a enviar a resposta (status `200`) antes de a página terminar. Se a página depois chamar `notFound()`, o corpo traz o `not-found.tsx` com `<meta name="robots" content="noindex">`; se chamar `redirect()`, o corpo traz um `<meta http-equiv="refresh">` e o navegador segue para o destino. Para quem usa o site o resultado é o mesmo; só o status HTTP fica `200`. Pergunta provável da banca: "por que o 404 responde 200?" → por causa do streaming do `loading.tsx` (slide de APIs, p. 19: cada bloco chega no seu tempo).

### AUTH-07: Lanterna só vê o próprio setor: o filtro é aplicado no servidor
**Fonte:** [DECISÃO] regra de negócio dos dois papéis + [DOCS] https://nextjs.org/docs/app/guides/authentication ("client-side UI restrictions alone are not sufficient for security"; DTO)
**Regra:** A página decide o filtro a partir da sessão, nunca da URL, quando o usuário é Lanterna.
No detalhe, ocorrência de outro setor → `/acesso-negado`. Nas actions, Lanterna só grava no próprio
setor. Esconder botões na UI é só conveniência.
**✅ Certo:**
```tsx
const sessao = await verificarSessao()
const setorId = setorParaFiltro(sessao, filtro.setor) // [AUTH-07]
const ocorrencias = await listarOcorrencias({ setorId, status })
```
```tsx
if (!podeAcessarSetor(sessao, ocorrencia.setorId)) redirect('/acesso-negado') // [AUTH-07]
```
**❌ Errado:** buscar todas as ocorrências e filtrar com `.filter()` no componente cliente; aceitar `?setor=` da URL para o Lanterna.
**Como verificar:** `rg -n "setorParaFiltro|podeAcessarSetor" app lib`.

### AUTH-08: Login com RHF + Server Action entrar
**Fonte:** [DECISÃO] fluxo do login + [SLIDE] FORMS p. 16, p. 19, p. 20 (mesmo schema no cliente e no servidor; erro do servidor no formulário); ROTAS p. 20 (replace após login) + [DOCS] https://nextjs.org/docs/app/guides/authentication ("Sign-up and login functionality")
**Regra:** `FormLogin` (cliente) usa RHF + `loginSchema` e, no `onSubmit`, chama a action
`entrar(dados)`. A action: `safeParse` → busca usuário por e-mail em `lib/usuarios.ts` → compara
senha → `criarSessao` → `redirect('/painel', RedirectType.replace)`. Credencial errada devolve
mensagem genérica, sem dizer qual campo errou, e o form mostra com `setError('root', ...)`.
**✅ Certo:**
```ts
// app/(site)/login/actions.ts
'use server'
export async function entrar(dados: unknown): Promise<ResultadoAcao> {
  const parsed = loginSchema.safeParse(dados) // [FORM-17]
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors } // [FORM-18]
  const usuario = await buscarUsuarioPorEmail(parsed.data.email)
  if (!usuario || usuario.senha !== parsed.data.senha) {
    return { ok: false, erro: 'E-mail ou senha incorretos.' } // [AUTH-08]
  }
  await criarSessao({ id: usuario.id, nome: usuario.nome, papel: usuario.papel, setorId: usuario.setorId })
  redirect('/painel', RedirectType.replace) // [ROTA-19]
}
```
```tsx
// FormLogin.tsx (trecho)
async function onSubmit(dados: LoginData) {
  const resultado = await entrar(dados)
  if (resultado?.erro) setError('root', { type: 'server', message: resultado.erro }) // [FORM-19]
}
{errors.root && <p role="alert">{errors.root.message}</p>}
```
**❌ Errado:** comparar senha no cliente; mensagem "Senha incorreta para fulano@..."; guardar o usuário em `useState` global.
**Como verificar:** `rg -n "senha" app components` não acha comparação de senha em arquivo `'use client'`.

### AUTH-09: Sair = Server Action que apaga o cookie e redireciona
**Fonte:** [DOCS] https://nextjs.org/docs/app/guides/authentication ("Deleting the session", `logout`)
**Regra:** `app/(painel)/actions.ts` exporta `sair()`: `(await cookies()).delete(NOME_COOKIE)` e
`redirect('/login')`. O botão "Sair" do layout do painel é um `<form action={sair}>` com `<button>`
(funciona sem JavaScript e não precisa de `'use client'`).
**✅ Certo:**
```tsx
<form action={sair}><Button type="submit" variant="outline">Sair</Button></form>
```
**❌ Errado:** `<Link href="/login">Sair</Link>` (o cookie continua válido).
**Como verificar:** `rg -n "delete\(NOME_COOKIE\)" app lib`.

### AUTH-10: Não fazer a checagem de acesso no layout
**Fonte:** [DOCS] https://nextjs.org/docs/app/guides/authentication ("Layouts and auth checks": layouts não re-renderizam na navegação e não impedem a renderização das páginas)
**Regra:** O layout do painel pode ler a sessão para mostrar o nome do usuário, mas a proteção
fica na página (AUTH-04) e na action (AUTH-05). Não use `return null` no layout para "bloquear".
**✅ Certo:** layout mostra `sessao.nome`; cada `page.tsx` chama `verificarSessao()`.
**❌ Errado:** `if (!sessao) return null` no `app/(painel)/layout.tsx` e páginas sem checagem.
**Como verificar:** AUTH-04 passa; `rg -n "return null" app -g layout.tsx` deve retornar vazio.

### AUTH-11: Limitações da API fake documentadas
**Fonte:** [DECISÃO] json-server não tem autenticação; senhas em texto puro só para fins didáticos
**Regra:** `db.json` guarda `senha` em texto puro porque o json-server não autentica. Isso fica
declarado no README e na apresentação. `lib/usuarios.ts` é usado só no servidor e nunca devolve a
senha para componente. Na etapa de back-end: hash (ex.: bcrypt) e login feito pela API real, sem
mudar as telas (DEC-04).
**✅ Certo:** função `buscarUsuarioPorEmail` usada só em `actions.ts`; páginas recebem `Sessao` (sem senha).
**❌ Errado:** passar o objeto `usuario` inteiro (com `senha`) como prop para componente cliente.
**Como verificar:** `rg -n "buscarUsuarioPorEmail" app` aparece só em arquivos `actions.ts`.
