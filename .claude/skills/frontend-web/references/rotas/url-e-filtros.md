# Filtros e paginação na URL

### ROTA-14: Filtros e paginação vivem na URL (searchParams), não em useState
**Fonte:** [SLIDE] ROTAS p. 18 ("Por que na URL e não no useState? Sobrevive ao F5, pode ser compartilhado e o botão voltar desfaz o filtro"); p. 22 (faça sempre e armadilha)
**Regra:** Filtro de ocorrências (status, busca, ordenação; campos de ilustração) e página atual ficam em
`?status=aberta&pagina=2`. A página lê com `await searchParams`; o componente de filtro (cliente)
escreve com `router.push(`?${q}`)`. Busca, paginação e ordenação completas: PROD-06.
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
