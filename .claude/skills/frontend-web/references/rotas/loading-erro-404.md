# loading, error e not-found

### ROTA-21: loading.tsx e error.tsx em toda rota que busca dados
**Fonte:** [SLIDE] ROTAS p. 21 ("loading.tsx... é um `<Suspense>` automático"; "error.tsx... Precisa ser Client Component"); ROTAS p. 22; APIS p. 19, p. 23
**Regra:** Toda pasta cuja `page.tsx` faz `await` de dados tem `loading.tsx` (ou `<Suspense>`
explícito) e `error.tsx`. `error.tsx` começa com `'use client'`, recebe `retry` e mostra botão
"Tentar de novo" (API-11).
**✅ Certo:**
```tsx
// error.tsx
'use client'
export default function Erro({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div role="alert">
      <p>Não foi possível carregar as ocorrências.</p>
      <button onClick={() => retry()}>Tentar de novo</button>
    </div>
  )
}
```
**❌ Errado:** rota de listagem sem `loading.tsx` (tela congelada) ou `error.tsx` sem `'use client'`.
**Nota de versão:** o slide (ROTAS p. 21) usa `reset()`. No Next 16.4 a doc recomenda `retry()`:
`reset()` só re-renderiza, sem buscar os dados de novo, então o "Tentar de novo" não funcionaria
depois que a API voltasse. Fonte: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`.
**Como verificar:** para cada `page.tsx` com busca de dados, confira a fronteira de loading/error na pasta ou ancestral do mesmo grupo; `rg --files-without-match 'use client' app -g error.tsx` deve retornar vazio. Confira que é a diretiva no início do arquivo e teste o botão de nova tentativa.

### ROTA-22: not-found.tsx para 404 com saída clara
**Fonte:** [SLIDE] ROTAS p. 21 ("not-found.tsx: Exibido quando nenhuma rota casa com a URL ou quando você chama notFound()"); ROTAS p. 12
**Regra:** Existe `app/not-found.tsx` global com link para a homepage. Rotas de detalhe podem ter
um `not-found.tsx` próprio ("Ocorrência não encontrada" + link para a lista).
**✅ Certo:**
```tsx
export default function NotFound() {
  return <main><h1>Setor desconhecido</h1><Link href="/">Voltar ao início</Link></main>
}
```
**❌ Errado:** depender da página padrão em inglês do Next.
**Como verificar:** `rg --files app -g not-found.tsx` acha pelo menos `app/not-found.tsx`.
