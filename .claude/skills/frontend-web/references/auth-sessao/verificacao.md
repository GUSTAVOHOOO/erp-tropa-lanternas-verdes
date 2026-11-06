# Quem é você: proxy, DAL e actions

### AUTH-01: proxy.ts (não middleware.ts) só confere se existe cookie de sessão
**Fonte:** [DOCS] `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` e `.../02-guides/upgrading/version-16.md` ("middleware" renomeado para "proxy"; runtime `nodejs`) + [DECISÃO] matcher só nas rotas privadas
**Regra:** Arquivo `proxy.ts` na raiz (mesmo nível de `app/`), exportando `proxy`. O front não tem o segredo do JWT e não o verifica: o proxy só olha se o cookie **existe**. Sem cookie em rota privada, redireciona para `/login`. Quem decide se o token vale é a API (401, ver AUTH-04 e AUTH-13). Não redirecione `/login` para a área privada só porque há cookie: um cookie vencido ou revogado causaria laço de redirecionamentos. Se a CSP com nonce estiver ativa (PROD-03), ela vive neste mesmo arquivo.
**✅ Certo:**
```ts
import { NextResponse, type NextRequest } from 'next/server'
import { NOME_COOKIE } from '@/lib/cookie' // arquivo só com a constante: o proxy não importa `next/headers` nem `server-only`

export function proxy(request: NextRequest) {
  if (!request.cookies.has(NOME_COOKIE)) {
    return NextResponse.redirect(new URL('/login', request.url)) // [AUTH-01]
  }
  return NextResponse.next()
}

export const config = { matcher: ['/painel/:path*'] } // ilustração: as rotas privadas do app
```
**❌ Errado:** `middleware.ts` com `export function middleware`; proxy que faz `fetch` na API a cada request; proxy como única proteção; ler papel de um cookie legível e confiar nele.
**Como verificar:** `rg --files -g "middleware.ts" -g "proxy.ts" --max-depth 2` acha só `proxy.ts`; `rg -n "export (default )?function proxy" proxy.ts`.
**Nota de versão:** até o Next 15 o arquivo era `middleware.ts`. No Next 16 é `proxy.ts`, roda em Node.js, e o codemod oficial é `npx @next/codemod@canary middleware-to-proxy .`.

### AUTH-04: verificarSessao() no DAL consulta a API e roda em toda página privada
**Fonte:** [DOCS] `.../02-guides/authentication.md` ("Creating a Data Access Layer (DAL)", `verifySession` com `cache`) + [SLIDE] ROTAS p. 20 (`if (!usuario) redirect('/login')`); APIS p. 5 e p. 21 ("401 Não autenticado — mande ao login") + [DECISÃO] papel e escopo vêm da API
**Regra:** `lib/dal.ts` exporta `verificarSessao()`, envolvida em `cache` do React (uma consulta por renderização). Sem cookie, `redirect('/login')`. Com cookie, consulta o usuário atual na API (`GET /auth/me`, definido na `backend-api`) pelo cliente HTTP (API-17) e devolve papel e dados dali. Resposta 401 significa token vencido ou inválido: `redirect` para a rota que encerra a sessão (AUTH-13). Toda `page.tsx` privada chama `verificarSessao()` ou `exigirPapel()` na primeira linha, mesmo com o proxy: o proxy só viu que existe cookie.
**✅ Certo:**
```ts
// lib/dal.ts
import 'server-only'
export const verificarSessao = cache(async (): Promise<Usuario> => {
  if (!(await cookies()).has(NOME_COOKIE)) redirect('/login') // [AUTH-04]
  try {
    return await buscarUsuarioAtual() // GET /auth/me pelo cliente (API-17)
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect('/sessao-expirada') // [AUTH-13]
    throw e
  }
})

export async function exigirPapel(papel: Papel): Promise<Usuario> {
  const usuario = await verificarSessao()
  if (usuario.papel !== papel) redirect('/acesso-negado') // [AUTH-06]
  return usuario
}
```
```tsx
export default async function PainelPage() {
  const usuario = await verificarSessao() // [AUTH-04]
```
**❌ Errado:** página privada que confia só no `proxy.ts`; papel lido de cookie sem consulta à API; `try/catch` em volta de `verificarSessao()` (engole o `redirect`).
**Como verificar:** `rg --files-without-match "verificarSessao|exigirPapel" "app/(painel)" -g page.tsx` vazio (ajuste o caminho do grupo privado); confirme que o helper é chamado no corpo, não só importado.

### AUTH-05: Toda Server Action confere sessão (e papel) antes de agir
**Fonte:** [DOCS] `proxy.md` ("Always verify authentication and authorization inside each Server Function rather than relying on Proxy alone") e `authentication.md` ("Treat Server Actions with the same security considerations as public-facing API endpoints") + [SLIDE] FORMS p. 20 ("Uma Server Action é um endpoint público")
**Regra:** A primeira linha de toda Server Action privada é `await verificarSessao()` ou `await exigirPapel(...)`. Só depois vem o `safeParse` (FORM-17). Exceção: a action `entrar` (o usuário ainda não tem sessão). Essa checagem poupa chamadas inúteis e dá o redirecionamento certo; a **autoridade** é a API, que confere de novo (`backend-api`, seção de permissões).
**✅ Certo:**
```ts
'use server'
export async function atribuirResponsavel(dados: unknown): Promise<ResultadoAcao> {
  await exigirPapel('admin') // [AUTH-05] (papel de ilustração)
  const parsed = atribuicaoSchema.safeParse(dados) // [FORM-17]
```
**❌ Errado:** action que só valida os campos e grava.
**Como verificar:** em cada `actions.ts` privado, toda `export async function` contém `verificarSessao` ou `exigirPapel` (`rg -n -A3 "export async function" app -g actions.ts`).

### AUTH-10: Não fazer a checagem de acesso no layout
**Fonte:** [DOCS] `authentication.md` ("Layouts and auth checks": layouts não re-renderizam na navegação e não impedem a renderização das páginas)
**Regra:** O layout privado pode ler o usuário para mostrar o nome, mas a proteção fica na página (AUTH-04) e na action (AUTH-05). Não use `return null` no layout para "bloquear".
**✅ Certo:** layout mostra `usuario.nome`; cada `page.tsx` chama `verificarSessao()`.
**❌ Errado:** `if (!usuario) return null` no layout privado e páginas sem checagem.
**Como verificar:** AUTH-04 passa; `rg -n "return null" app -g layout.tsx` vazio.
