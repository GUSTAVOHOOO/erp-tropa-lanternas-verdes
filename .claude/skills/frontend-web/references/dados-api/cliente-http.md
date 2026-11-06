# Cliente HTTP único

### API-17: Um único cliente HTTP em lib/api.ts
**Fonte:** [DECISÃO] aprovada: um só ponto de contato com a API; contrato descrito na `backend-api` (`references/http-erros.md`, "Envelope"; `references/auth-seguranca.md`, "Authorization: Bearer") + [SLIDE] APIS p. 14 (uma camada de serviço)
**Regra:** `lib/api.ts` (com `import 'server-only'`) é o único arquivo que chama `fetch` e conhece o envelope de sucesso. Ele: (1) monta a URL com `new URL(caminho, env.API_URL)` (API-16); (2) lê o token do cookie e manda `Authorization: Bearer`, sem lançar se não houver (rotas públicas e login); (3) usa `cache: 'no-store'` por padrão (API-06); (4) aplica `AbortSignal.timeout`; (5) em `!res.ok` lança `ApiError.deResposta` (API-02); (6) em `204` devolve `undefined`; (7) abre `{ sucesso: true, dados }`, valida `dados` com o schema recebido (API-04) e devolve. Rede ou timeout viram `ApiError(0, ..., 'REDE')`. Expõe `get`, `post`, `patch`, `delete`. Nada de retry automático em escrita.
**✅ Certo:**
```ts
// lib/api.ts (esqueleto)
import 'server-only'
async function requisitar<T>(metodo: string, caminho: string, schema: z.ZodType<T>, corpo?: unknown): Promise<T> {
  const token = (await cookies()).get(NOME_COOKIE)?.value
  let res: Response
  try {
    res = await fetch(new URL(caminho, env.API_URL), {
      method: metodo,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      cache: 'no-store', // [API-06]
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new ApiError(0, 'Sem conexão com a API', 'REDE')
  }
  if (!res.ok) throw await ApiError.deResposta(res) // [API-02]
  if (res.status === 204) return undefined as T
  const { dados } = envelopeSchema.parse(await res.json()) // única leitura do envelope
  return schema.parse(dados) // [API-04]
}
export const api = {
  get: <T>(c: string, s: z.ZodType<T>) => requisitar('GET', c, s),
  post: <T>(c: string, corpo: unknown, s: z.ZodType<T>) => requisitar('POST', c, s, corpo),
}
```
**❌ Errado:** `fetch` em `page.tsx` ou em cada `lib/<recurso>.ts`; cada recurso lendo o envelope a seu modo; `API_URL` com `NEXT_PUBLIC_`; token vindo de parâmetro de componente.
**Como verificar:** `rg -n "fetch\(" app components lib` acha só `lib/api.ts`; `rg -n "Authorization" app components lib` acha só `lib/api.ts`; `rg -n "\.dados\b|sucesso" app components lib` acha só `lib/api.ts` e `lib/api-error.ts`.

### API-02: Checar a resposta em um lugar só, o cliente HTTP
**Fonte:** [SLIDE] APIS p. 7 ("res.ok é obrigatório"; "Regra de ouro do fetch: ele só rejeita quando a rede falha. Um 404 ou 500 chega como resposta normal"), p. 9, p. 23 (faça sempre e armadilha) + [DECISÃO] centralizar no cliente (API-17)
**Regra:** Logo depois do `await fetch(...)` vem `if (!res.ok) throw await ApiError.deResposta(res)`. Isso fica **uma vez**, em `lib/api.ts`; as funções de `lib/<recurso>.ts` chamam o cliente e nunca `fetch` direto.
**✅ Certo:**
```ts
const res = await fetch(url, { ...init, cache: 'no-store' }) // [API-06]
if (!res.ok) throw await ApiError.deResposta(res) // [API-02][API-03]
```
**❌ Errado:**
```ts
const res = await fetch(url)
return res.json() // um 404 vira "dado"
```
**Como verificar:** `rg -n "fetch\(" app components lib` acha só `lib/api.ts`; nele, `rg -n "res\.ok" lib/api.ts`.

### API-03: ApiError com status, código e detalhes, lido de um único formato
**Fonte:** [SLIDE] APIS p. 22 (`lib/api-error.ts`: `export class ApiError extends Error { constructor(public status: number) {...} }`), p. 14 (`throw new ApiError(res.status)`) + [DECISÃO] estende o slide com `codigo` e `detalhes`; formato do erro definido na `backend-api` (`references/http-erros.md`, "Envelope")
**Regra:** Um único arquivo `lib/api-error.ts`. Toda falha HTTP vira `ApiError` com o status e, quando a API os manda, `codigo` estável (ex.: `SEM_SALDO`) e `detalhes`. **Só este arquivo conhece o desenho do corpo de erro**; se o contrato da API mudar, muda aqui. Corpo fora do contrato (HTML de um proxy, 502) vira `ApiError` só com o status. Falha de rede ou timeout vira `ApiError` com `status: 0` e `codigo: 'REDE'` (API-17).
**✅ Certo:**
```ts
// lib/api-error.ts
import * as z from 'zod'
const corpoErroSchema = z.object({ erro: z.object({
  mensagem: z.string(), codigo: z.string().optional(), detalhes: z.array(z.string()).optional(),
}) })

export class ApiError extends Error {
  constructor(public status: number, mensagem?: string, public codigo?: string, public detalhes: string[] = []) {
    super(mensagem ?? `A API respondeu ${status}`)
  }
  static async deResposta(res: Response) {
    const corpo = corpoErroSchema.safeParse(await res.json().catch(() => null))
    if (!corpo.success) return new ApiError(res.status)
    const { mensagem, codigo, detalhes } = corpo.data.erro
    return new ApiError(res.status, mensagem, codigo, detalhes)
  }
}
```
**❌ Errado:** `throw new Error('deu ruim')` (a página não distingue 404 de 500); `if (e.message.includes('saldo'))` (compare `codigo`, não texto).
**Como verificar:** `rg -n "class ApiError" lib` acha só `lib/api-error.ts`; `rg -n "throw new Error\(" lib` vazio; `rg -n "\.message\.(includes|startsWith)" app lib` vazio.
**Nota de versão:** `constructor(public status: number)` usa "parameter properties" do TypeScript. Se o projeto ligar `erasableSyntaxOnly` no `tsconfig.json`, isso dá erro: declare os campos na classe e atribua no construtor.

### API-08: Endereço da API em variável de ambiente do servidor, sem NEXT_PUBLIC_
**Fonte:** [SLIDE] APIS p. 17 ("Sem prefixo = servidor. No navegador, a variável simplesmente não existe"; "NEXT_PUBLIC_ = público. Qualquer pessoa lê no DevTools"), p. 23 (armadilha), p. 11 ("Segredos ficam no servidor") + [DOCS] `.../02-guides/environment-variables.md` (`NEXT_PUBLIC_` é gravada no bundle em tempo de build)
**Regra:** `API_URL` fica em `.env.local` (fora do Git); `.env.example` (no Git) lista as chaves sem valor. Sem prefixo `NEXT_PUBLIC_`, porque o navegador nunca chama a API (AUTH-12). Só `lib/env.ts` lê `process.env`, e ele valida a presença na subida (PROD-01); o resto do código importa `env`.
**✅ Certo:** `import { env } from '@/lib/env'` e `new URL(caminho, env.API_URL) // [API-08]`
**❌ Errado:** `NEXT_PUBLIC_API_URL`; `process.env.API_URL!` espalhado; `process.env` lido em arquivo `'use client'`.
**Como verificar (PowerShell):** `rg -n 'NEXT_PUBLIC_' app components lib` vazio; `rg -n "process\.env" app components lib` acha só `lib/env.ts` (e `NODE_ENV` onde for preciso); `rg -l 'use client' app components | ForEach-Object { rg -n -F 'process.env' -- $_ }` vazio.

### API-16: Endereços de API montados com new URL a partir de API_URL
**Fonte:** [SLIDE] APIS p. 17 (`new URL('/busca', process.env.API_URL)`; `url.searchParams.set('q', q)`) + [DECISÃO] padronizar em toda a camada de serviço
**Regra:** Monte a URL com `new URL(caminho, API_URL)` e filtros com `url.searchParams.set`. Nunca
concatene query string à mão.
**✅ Certo:**
```ts
const url = new URL('/ocorrencias', env.API_URL)
if (filtro.setorId) url.searchParams.set('setorId', filtro.setorId) // [API-16]
if (filtro.status) url.searchParams.set('status', filtro.status)
```
**❌ Errado:** `fetch(API_URL + '/ocorrencias?setorId=' + setorId + '&status=' + status)`.
**Como verificar:** `rg -n 'fetch\(.*(\+|\$\{)' lib` deve retornar vazio (template string ou `+` dentro do fetch).
