# Consumo de APIs (API)

Deck: APIS (`Consumo de APIs — Fetch, Axios, Loading e Erros no Next.js App Router.pdf`).
A API do projeto é o json-server (`db.json`) na porta 3001 (STACK-04). Checklist do professor (APIS p. 23):

| Item do checklist (p. 23) | Regra |
|---|---|
| Checar res.ok em todo fetch | API-02 |
| Uma camada de serviço em lib/ por recurso | API-01 |
| Validar a resposta com Zod | API-04 |
| loading.tsx ou Suspense em toda rota com dados | API-10 (e ROTA-21) |
| error.tsx com um botão "Tentar de novo" | API-11 (e ROTA-21) |
| Promise.all para buscas independentes | API-07 |
| Cache e revalidate sempre explícitos | API-06 |
| Armadilha: achar que fetch lança erro em 404 ou 500 | API-02 |
| Armadilha: token da API em NEXT_PUBLIC_ ou no cliente | API-08 |
| Armadilha: useEffect + fetch sem cancelar a anterior | API-05, API-15 |
| Armadilha: buscas em cascata sem necessidade | API-07 |
| Armadilha: spinner eterno, esquecer o finally | API-15 (não se aplica: não buscamos no cliente) |
| Armadilha: mostrar a mensagem técnica ao usuário | API-13 |
| Armadilha: esperar que o Axios use o cache do Next.js | DEC-01 (não usamos Axios) |


Índice: API-01 Camada de serviço: uma função por operação em lib/<recurso>.ts · API-02 Checar res.ok em todo fetch · API-03 ApiError com status em lib/api-error.ts · API-04 Validar a resposta da API com Zod · API-05 Buscar dados em Server Components, sem useEffect · API-06 Cache explícito em todo fetch · API-07 Promise.all para buscas independentes · API-08 Endereço e segredos sem NEXT_PUBLIC_ · API-09 Toda tela com dados tem quatro estados · API-10 loading.tsx ou Suspense em toda rota com dados · API-11 error.tsx com "Tentar de novo" · API-12 Classificar o erro e escolher a saída · API-13 Mensagem para humanos; detalhe técnico só no log · API-14 Escrita: método HTTP certo, JSON, revalidatePath depois · API-15 Não buscar dados no cliente (decisão do MVP) · API-16 Endereços de API montados com new URL a partir de API_URL

---

### API-01: Camada de serviço: uma função por operação em lib/<recurso>.ts
**Fonte:** [SLIDE] APIS p. 14 ("Uma função por operação. Componentes chamam buscarProdutos(), nunca a URL direto"), p. 3 ("1 camada de serviço por recurso"), p. 23
**Regra:** `lib/ocorrencias.ts`, `lib/setores.ts`, `lib/usuarios.ts`. Cada operação é uma função
nomeada com verbo (JS-04): `listarOcorrencias`, `buscarOcorrencia`, `salvarOcorrencia`,
`atualizarOcorrencia`. Páginas e Server Actions chamam essas funções; nenhum outro lugar chama
`fetch` nem conhece a URL da API. É isso que permite trocar o json-server pelo back-end real sem
mexer nas telas (DEC-04).
**✅ Certo:**
```tsx
import { listarOcorrencias } from '@/lib/ocorrencias'
const ocorrencias = await listarOcorrencias({ setorId, status })
```
**❌ Errado:** `await fetch('http://localhost:3001/ocorrencias')` dentro de `page.tsx`.
**Como verificar:** `rg -n "fetch\(" app components` deve retornar vazio; `rg -n "localhost:3001" app components lib` deve retornar vazio (a URL vem de `API_URL`).

### API-02: Checar res.ok em todo fetch
**Fonte:** [SLIDE] APIS p. 7 ("res.ok é obrigatório"; "Regra de ouro do fetch: ele só rejeita quando a rede falha. Um 404 ou 500 chega como resposta normal"), p. 9, p. 23 (faça sempre e armadilha)
**Regra:** Logo depois de todo `await fetch(...)` vem `if (!res.ok) throw new ApiError(res.status)`.
**✅ Certo:**
```ts
const res = await fetch(url, { cache: 'no-store' }) // [API-06]
if (!res.ok) throw new ApiError(res.status) // [API-02][API-03]
```
**❌ Errado:**
```ts
const res = await fetch(url)
return res.json() // um 404 vira "dado"
```
**Como verificar:** `rg -l "fetch\(" lib | xargs rg -L "res\.ok"` deve retornar vazio; para cada fetch, `rg -n -A3 "await fetch\(" lib` mostra o `if (!res.ok)` nas linhas seguintes.

### API-03: ApiError com status em lib/api-error.ts
**Fonte:** [SLIDE] APIS p. 22 (`lib/api-error.ts`: `export class ApiError extends Error { constructor(public status: number) {...} }`), p. 14 (`throw new ApiError(res.status)`)
**Regra:** Um único arquivo `lib/api-error.ts`, igual ao do slide. Toda falha HTTP vira `ApiError`
com o status, para a página decidir a saída (API-12).
**✅ Certo:**
```ts
// lib/api-error.ts
export class ApiError extends Error {
  constructor(public status: number) {
    super(`A API respondeu ${status}`)
  }
}
```
**❌ Errado:** `throw new Error('deu ruim')` (a página não consegue distinguir 404 de 500).
**Como verificar:** `rg -n "class ApiError" lib` acha só `lib/api-error.ts`; `rg -n "throw new Error\(" lib` deve retornar vazio.
**Nota de versão:** `constructor(public status: number)` usa "parameter properties" do TypeScript.
Se o projeto ligar `erasableSyntaxOnly` no `tsconfig.json`, isso dá erro; o create-next-app não liga
essa opção. Se ligar, troque por `status: number` declarado na classe e `this.status = status`.

### API-04: Validar a resposta da API com Zod
**Fonte:** [SLIDE] APIS p. 14 ("Não confie na API. Se o formato mudar, o erro aparece aqui", `z.array(produtoSchema).parse(await res.json())`, `preco: z.coerce.number()`), p. 21 ("Formato inválido... Zod acusa"), p. 23 + [DOCS] json-server ("`id` is always a string" na v1)
**Regra:** O JSON da API passa por `schema.parse(...)` antes de sair da camada de serviço. O schema
de resposta fica em `lib/schemas/<entidade>.ts` (FORM-02) e o tipo vem do `z.infer` (FORM-03).
`id` usa `z.coerce.string()`: o json-server pode devolver número ou string conforme a versão, e o
back-end futuro pode usar número.
**✅ Certo:**
```ts
// lib/schemas/ocorrencia.ts
export const ocorrenciaSchema = z.object({
  id: z.coerce.string(),
  titulo: z.string(),
  descricao: z.string(),
  setorId: z.string(),
  gravidade: z.enum(GRAVIDADES),
  status: z.enum(STATUS),
  envolvidos: z.coerce.number(),
  responsavelId: z.string().nullable(),
  criadaEm: z.string(),
})
export type Ocorrencia = z.infer<typeof ocorrenciaSchema>
```
```ts
return z.array(ocorrenciaSchema).parse(await res.json()) // [API-04]
```
**❌ Errado:** `return (await res.json()) as Ocorrencia[]` (o `as` não valida nada).
**Como verificar:** `rg -n "res\.json\(\)" lib` e conferir que cada um está dentro de `.parse(`; `rg -n " as \w+(\[\])?$" lib` deve retornar vazio.

### API-05: Buscar dados em Server Components, sem useEffect
**Fonte:** [SLIDE] APIS p. 10 ("No App Router, o lugar padrão para buscar dados é o servidor"), p. 11 ("Sem useEffect e useState. A página espera os dados e já chega pronta"), p. 9 ("prefira fetch nos Server Components"); ROTAS p. 13
**Regra:** A `page.tsx` (async) chama a camada de serviço. Nenhum `useEffect` para buscar dados.
**✅ Certo:**
```tsx
export default async function SetoresPage() {
  const setores = await listarSetores() // [API-05]
  return <ListaSetores setores={setores} />
}
```
**❌ Errado:**
```tsx
'use client'
useEffect(() => { fetch('/api/setores').then((r) => r.json()).then(setSetores) }, [])
```
**Como verificar:** `rg -n "useEffect" app components` deve retornar vazio ou só usos sem busca de dados.

### API-06: Cache explícito em todo fetch
**Fonte:** [SLIDE] APIS p. 12 (tabela de opções; "Nota de versão: no Next.js 14 o fetch guardava as respostas por padrão; a partir do 15, não guarda. Deixe a opção sempre explícita"), p. 23 + [DECISÃO] valores por recurso
**Regra:** Todo `fetch` declara `cache` ou `next.revalidate`. Decisão do grupo:
- ocorrências e usuários (mudam sempre, dependem de quem está logado): `cache: 'no-store'`;
- setores (lista pública, quase estática): `next: { revalidate: 60 }`;
- escrita (POST/PATCH/PUT/DELETE): `cache: 'no-store'`.
**✅ Certo:** `await fetch(url, { next: { revalidate: 60 } }) // [API-06]`
**❌ Errado:** `await fetch(url)` sem opção.
**Como verificar:** `rg -n "fetch\(" lib` e conferir `cache:` ou `revalidate` em cada chamada (`rg -n -A3 "fetch\(" lib | rg "cache:|revalidate"`).
**Nota de versão:** o Next 16 tem o modelo opcional "Cache Components" (`cacheComponents: true`,
`'use cache'`). O projeto não liga essa opção (DEC-10); vale a tabela do slide.

### API-07: Promise.all para buscas independentes
**Fonte:** [SLIDE] APIS p. 13 ("Requisições em paralelo com Promise.all"; "Só se forem independentes"), p. 23
**Regra:** Quando a página precisa de duas buscas que não dependem uma da outra, dispare as duas juntas.
**✅ Certo:**
```ts
const [ocorrencia, setores] = await Promise.all([buscarOcorrencia(id), listarSetores()]) // [API-07]
```
**❌ Errado:**
```ts
const ocorrencia = await buscarOcorrencia(id)
const setores = await listarSetores() // espera a primeira à toa
```
**Como verificar:** páginas com dois ou mais `await listar|await buscar` seguidos e independentes devem usar `Promise.all` (`rg -n -A2 "= await (listar|buscar)" app`).

### API-08: Endereço e segredos sem NEXT_PUBLIC_
**Fonte:** [SLIDE] APIS p. 17 ("Sem prefixo = servidor. No navegador, a variável simplesmente não existe"; "NEXT_PUBLIC_ = público. Qualquer pessoa lê no DevTools. Nada de segredos aqui"), p. 23 (armadilha), p. 11 ("Segredos ficam no servidor")
**Regra:** `.env.local` tem `API_URL=http://localhost:3001` e `SESSION_SECRET=...`, ambos sem
prefixo, lidos só em `lib/` (servidor). `.env.local` não vai para o Git; um `.env.example` com as
chaves vazias vai. O projeto não precisa de nenhuma variável `NEXT_PUBLIC_`.
**✅ Certo:** `const API_URL = process.env.API_URL // [API-08]` em `lib/ocorrencias.ts`
**❌ Errado:** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SESSION_SECRET`, `process.env` lido em arquivo `'use client'`.
**Como verificar:** `rg -n "NEXT_PUBLIC_" .` (fora de `node_modules`) deve retornar vazio; `rg -l "^['\"]use client['\"]" app components | xargs rg -n "process\.env"` deve retornar vazio.

### API-09: Toda tela com dados tem quatro estados
**Fonte:** [SLIDE] APIS p. 20 ("Toda tela com dados tem quatro estados": Carregando, Vazio, Erro, Sucesso; "Regra de projeto: desenhe os quatro estados antes de escrever o fetch")
**Regra:** Para cada listagem/detalhe:
- Carregando: `loading.tsx` com skeleton no formato do conteúdo (API-10);
- Vazio: componente `EstadoVazio` com explicação e uma ação ("Limpar filtros", "Registrar ocorrência");
- Erro: `error.tsx` com mensagem humana e "Tentar de novo" (API-11);
- Sucesso: só os dados.
**✅ Certo:**
```tsx
if (ocorrencias.length === 0) return <EstadoVazio mensagem="Nenhuma ocorrência com esses filtros." acao={<Link href="?">Limpar filtros</Link>} /> // [API-09]
return <ListaOcorrencias itens={ocorrencias} />
```
**❌ Errado:** lista vazia renderizando uma tabela sem linhas e sem explicação.
**Como verificar:** cada rota de listagem tem `loading.tsx`, `error.tsx` e um ramo `length === 0`.

### API-10: loading.tsx ou Suspense em toda rota com dados
**Fonte:** [SLIDE] APIS p. 19 ("loading.tsx e Suspense: nunca a tela em branco"; "loading.tsx: a rota inteira"; "`<Suspense>`: um pedaço"), p. 23; ROTAS p. 21
**Regra:** Use `loading.tsx` na pasta da rota. Use `<Suspense fallback>` só quando um pedaço da
página é lento e o resto pode aparecer antes (ex.: painel com contadores).
**✅ Certo:**
```tsx
// app/(painel)/painel/ocorrencias/loading.tsx
export default function Loading() {
  return <SkeletonLista linhas={5} />
}
```
**❌ Errado:** `return <p>Carregando...</p>` dentro da própria página (nunca aparece: a página só renderiza depois do `await`).
**Como verificar:** ver ROTA-21.

### API-11: error.tsx com "Tentar de novo"
**Fonte:** [SLIDE] APIS p. 21 ("5xx do servidor: error.tsx com reset() para tentar de novo"), p. 23; ROTAS p. 21
**Regra:** `error.tsx` (cliente) mostra mensagem humana e um botão que chama `reset()`. Não mostra
`error.message` (em produção vem genérica; em desenvolvimento pode ser técnica).
**✅ Certo:** ver exemplo em ROTA-21.
**❌ Errado:** `<p>{error.message}</p>` ou `error.tsx` sem botão.
**Como verificar:** `rg -n "reset\(\)" app -g error.tsx` acha todos; `rg -n "error\.message" app -g error.tsx` deve retornar vazio.

### API-12: Classificar o erro e escolher a saída
**Fonte:** [SLIDE] APIS p. 5 (tabela de status: "401 Não autenticado — mande ao login"; "403 Sem permissão — explique o bloqueio"; "404 Não encontrado — notFound()"; "500/503 tentar de novo"), p. 21, p. 22 (código "Classificar o erro e escolher a saída"; "Relance o que você não sabe tratar. Engolir o erro com um catch vazio esconde o problema")
**Regra:** Na página de detalhe, trate `ApiError`: 404 → `notFound()`; 401 → `redirect('/login')`;
403 → `redirect('/acesso-negado')` (AUTH-06); qualquer outro → `throw e` (vai para `error.tsx`).
Nunca `catch {}` vazio.
**✅ Certo:**
```tsx
let ocorrencia: Ocorrencia
try {
  ocorrencia = await buscarOcorrencia(id)
} catch (e) {
  const status = e instanceof ApiError ? e.status : 0
  if (status === 404) notFound() // [API-12]
  if (status === 401) redirect('/login')
  if (status === 403) redirect('/acesso-negado')
  throw e
}
```
**❌ Errado:** `catch (e) {}` ou `catch (e) { return null }`.
**Como verificar:** `rg -n -U "catch\s*(\([^)]*\))?\s*\{\s*\}" app lib` deve retornar vazio; páginas `[id]` têm o bloco de classificação.
**Nota de versão:** o json-server devolve 404 para id inexistente. Ele nunca devolve 401/403 (não
tem autenticação); esses ramos ficam prontos para o back-end real (DEC-04).

### API-13: Mensagem para humanos; detalhe técnico só no log
**Fonte:** [SLIDE] APIS p. 21 ("Mensagem para humanos: 'Sem conexão. Verifique a internet e tente de novo.' em vez de 'TypeError: Failed to fetch'"; "Detalhes ficam no log"), p. 23 (armadilha "Mostrar a mensagem técnica ao usuário")
**Regra:** Texto exibido ao usuário é escrito por nós, em português. `ApiError.message`,
`e.message` e stack nunca vão para a tela. Na action, `console.error(e)` e devolver
`{ ok: false, erro: 'Não foi possível salvar a ocorrência. Tente de novo.' }`.
**✅ Certo:**
```ts
try {
  await salvarOcorrencia(parsed.data)
} catch (e) {
  console.error(e)
  return { ok: false, erro: 'Não foi possível salvar a ocorrência. Tente de novo.' } // [API-13]
}
redirect('/painel/ocorrencias') // fora do try (ROTA-20)
```
**❌ Errado:** `return { ok: false, erro: String(e) }`.
**Como verificar:** `rg -n "erro: (String\(|e\.message|error\.message)" app lib` deve retornar vazio.

### API-14: Escrita: método HTTP certo, JSON, revalidatePath depois
**Fonte:** [SLIDE] APIS p. 5 (métodos: POST cria, PATCH atualiza parte, DELETE remove; "201 Criado"), p. 16 (`method: 'POST'`, `headers: { 'Content-Type': 'application/json' }`, `body: JSON.stringify(novo)`; "Ou via Server Action: Formulário → Action → API → revalidatePath()"); FORMS p. 20 (`revalidatePath('/usuarios')`)
**Regra:** Funções de escrita ficam em `lib/<recurso>.ts` e são chamadas só por Server Actions.
Criar = `POST`, mudar status/responsável = `PATCH`, com `Content-Type: application/json`. Depois de
gravar, a action chama `revalidatePath` da listagem afetada e então `redirect` (ROTA-20).
**✅ Certo:**
```ts
export async function salvarOcorrencia(dados: NovaOcorrenciaData & { status: Status; criadaEm: string; responsavelId: null }) {
  const res = await fetch(new URL('/ocorrencias', API_URL), {
    method: 'POST', // [API-14]
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
    cache: 'no-store',
  })
  if (!res.ok) throw new ApiError(res.status) // [API-02]
  return ocorrenciaSchema.parse(await res.json()) // [API-04]
}
```
**❌ Errado:** `PUT` mandando só um campo (apaga o resto no json-server); esquecer `revalidatePath` e a lista mostrar dado velho.
**Como verificar:** `rg -n "method: '(POST|PUT|PATCH|DELETE)'" lib` só em `lib/`; `rg -n "revalidatePath" app` aparece em toda action de escrita.
**Nota de versão:** o slide cita `revalidateTag` como próximo passo (APIS p. 12, p. 23). No Next 16,
`revalidateTag` exige um segundo argumento (`revalidateTag('ocorrencias', 'max')`). O projeto usa só
`revalidatePath`, que aparece nos slides e não mudou.

### API-15: Não buscar dados no cliente (decisão do MVP)
**Fonte:** [SLIDE] APIS p. 10 ("O cliente entra quando a busca depende de interação do usuário"), p. 15 ("Por que não só useEffect: condição de corrida, sem cache e sem retry") + [DECISÃO] DEC-02
**Regra:** O projeto não tem busca disparada pelo cliente. Filtros mudam a URL (ROTA-14) e a página
busca de novo no servidor. Se um dia for preciso buscar no cliente, a decisão tem que ser
registrada (TanStack Query, como o slide sugere), em vez de `useEffect` + `fetch`.
**✅ Certo:** filtro → `router.push('?status=aberta')` → `page.tsx` refaz a busca.
**❌ Errado:** `useEffect(() => { fetch(...) }, [status])` com spinner controlado por `useState`.
**Como verificar:** `rg -n "useEffect|@tanstack|swr" app components` deve retornar vazio.

### API-16: Endereços de API montados com new URL a partir de API_URL
**Fonte:** [SLIDE] APIS p. 17 (`new URL('/busca', process.env.API_URL)`; `url.searchParams.set('q', q)`) + [DECISÃO] padronizar em toda a camada de serviço
**Regra:** Monte a URL com `new URL(caminho, API_URL)` e filtros com `url.searchParams.set`. Nunca
concatene query string à mão.
**✅ Certo:**
```ts
const url = new URL('/ocorrencias', API_URL)
if (filtro.setorId) url.searchParams.set('setorId', filtro.setorId) // [API-16]
if (filtro.status) url.searchParams.set('status', filtro.status)
```
**❌ Errado:** `fetch(API_URL + '/ocorrencias?setorId=' + setorId + '&status=' + status)`.
**Como verificar:** `rg -n 'fetch\(.*(\+|\$\{)' lib` deve retornar vazio (template string ou `+` dentro do fetch).
