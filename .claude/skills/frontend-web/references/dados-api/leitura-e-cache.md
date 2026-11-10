# Leitura de dados e cache

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
**Fonte:** [SLIDE] APIS p. 12 (tabela de opções; "Nota de versão: no Next.js 14 o fetch guardava as respostas por padrão; a partir do 15, não guarda. Deixe a opção sempre explícita"), p. 23 + [DECISÃO] valores
**Regra:** Todo `fetch` declara `cache` ou `next.revalidate`. O cliente (API-17) usa `cache: 'no-store'` por padrão: com `Authorization`, a resposta depende de quem está logado e nunca deve ser compartilhada. Dado público, igual para todos e que pode ficar velho por um tempo conhecido (ex.: lista de categorias) usa `next: { revalidate: N, tags: [...] }`, e a escrita que o muda chama `revalidateTag`/`revalidatePath` (API-14). O valor de `N` é o prazo que o produto aceita; não existe valor "padrão".
**✅ Certo:** `await fetch(url, { next: { revalidate: 300, tags: ['categorias'] } }) // [API-06]`
**❌ Errado:** `await fetch(url)` sem opção; cache de rota autenticada.
**Como verificar:** `rg -n -A3 "fetch\(" lib | rg "cache:|revalidate"` confere cada chamada.
**Nota de versão:** o Next 16 tem o modelo opcional "Cache Components" (`cacheComponents: true`, `'use cache'`). O projeto não o liga (DEC-10); vale a tabela do slide.

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

### API-15: Não buscar dados no cliente (decisão do projeto)
**Fonte:** [SLIDE] APIS p. 10 ("O cliente entra quando a busca depende de interação do usuário"), p. 15 ("Por que não só useEffect: condição de corrida, sem cache e sem retry") + [DECISÃO] DEC-02
**Regra:** O projeto não tem busca disparada pelo cliente. Filtros mudam a URL (ROTA-14) e a página
busca de novo no servidor. Se um dia for preciso buscar no cliente, a decisão tem que ser
registrada (TanStack Query, como o slide sugere), em vez de `useEffect` + `fetch`.
**✅ Certo:** filtro → `router.push('?status=aberta')` → `page.tsx` refaz a busca.
**❌ Errado:** `useEffect(() => { fetch(...) }, [status])` com spinner controlado por `useState`.
**Como verificar:** `rg -n "useEffect|@tanstack|swr" app components` deve retornar vazio.
