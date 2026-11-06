# Quatro estados da tela

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
**Regra:** `error.tsx` (cliente) mostra mensagem humana e um botão que chama `retry()`. Não mostra
`error.message` (em produção vem genérica; em desenvolvimento pode ser técnica).
**✅ Certo:** ver exemplo em ROTA-21.
**❌ Errado:** `<p>{error.message}</p>` ou `error.tsx` sem botão.
**Nota de versão:** o slide (ROTAS p. 21) usa `reset()`. No Next 16.4 a doc recomenda `retry()`:
`reset()` só re-renderiza, sem buscar os dados de novo, então o "Tentar de novo" não funcionaria
depois que a API voltasse. Fonte: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`.
**Como verificar:** `rg -n "retry\(\)" app -g error.tsx` acha todos; `rg -n "error\.message" app -g error.tsx` deve retornar vazio.
