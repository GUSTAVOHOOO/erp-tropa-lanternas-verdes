# Segmentos dinâmicos e params

### ROTA-09: Segmentos dinâmicos com colchetes
**Fonte:** [SLIDE] ROTAS p. 16 ("Segmentos dinâmicos entre colchetes", `produtos/[id]` → `{ id: '42' }`, "Sempre string")
**Regra:** Detalhe de um registro usa pasta `[id]`. O valor chega como string.
**✅ Certo:**
```
app/(painel)/painel/ocorrencias/[id]/page.tsx   → /painel/ocorrencias/abc123
```
**❌ Errado:** `/painel/ocorrencia?id=abc123` para tela de detalhe.
**Como verificar:** telas de detalhe ficam em pastas `[id]`.

### ROTA-10: params e searchParams são Promise: sempre await
**Fonte:** [SLIDE] ROTAS p. 17 ("params é uma Promise. A partir do Next.js 15, use await params"), p. 18 (`await searchParams`), p. 22 (armadilha) + [DOCS] https://nextjs.org/docs/app/guides/upgrading/version-16 ("synchronous access is fully removed")
**Regra:** Tipar `params` e `searchParams` como `Promise<...>` e usar `await` antes de ler.
**✅ Certo:**
```tsx
type Props = { params: Promise<{ id: string }> }
export default async function DetalhePage({ params }: Props) {
  const { id } = await params // [ROTA-10]
```
**❌ Errado:**
```tsx
export default function DetalhePage({ params }: { params: { id: string } }) {
  const id = params.id
```
**Como verificar:** `rg -n "params: \{|searchParams: \{" app` deve retornar vazio; `rg -n "(params|searchParams)\.\w" app -g page.tsx -g layout.tsx` deve retornar vazio.
**Nota de versão:** o slide diz "a partir do Next.js 15". No Next 16 o acesso síncrono deixou de
existir: sem `await` o código quebra.

### ROTA-11: Validar params antes de usar
**Fonte:** [SLIDE] ROTAS p. 16 ("Sempre string. Converta com Number() ou valide com Zod — lembra do z.coerce?"); p. 22
**Regra:** Não confie no valor da URL. Para `id` em texto basta checar que não está
vazio; para número use `Number()` + `Number.isNaN` ou `z.coerce.number()`. Valor inválido →
`notFound()` (ROTA-12). Filtros de `searchParams` que são enum passam por `z.enum(...).safeParse`.
**✅ Certo:**
```tsx
const { status } = await searchParams
const filtro = statusSchema.safeParse(status) // [ROTA-11]
const statusValido = filtro.success ? filtro.data : undefined
```
**❌ Errado:** `listarOcorrencias({ status })` com o texto cru da URL.
**Como verificar:** todo `await params`/`await searchParams` é seguido de conversão/validação antes de ir para `lib/`.

### ROTA-12: notFound() quando o registro não existe
**Fonte:** [SLIDE] ROTAS p. 17 (`if (!produto) notFound()`), p. 21; APIS p. 5 ("404 Não encontrado — notFound()"), APIS p. 22
**Regra:** Se a API responde 404 ou o registro não existe, chame `notFound()` de `next/navigation`.
Isso mostra o `not-found.tsx` mais próximo.
**✅ Certo:**
```tsx
if (!ocorrencia) notFound() // [ROTA-12]
```
**❌ Errado:** renderizar `<p>Não achei</p>` com status 200, ou deixar estourar `undefined.titulo`.
**Como verificar:** toda página `[id]` tem `notFound()` ou trata `ApiError` 404 (API-12).
**Nota de versão (conferida no Next 16.4):** em rota com `loading.tsx`, o Next começa a enviar a resposta (status `200`) antes de a página terminar. Se a página depois chamar `notFound()`, o corpo traz o `not-found.tsx` com `<meta name="robots" content="noindex">`; se chamar `redirect()`, o corpo traz um `<meta http-equiv="refresh">` e o navegador segue para o destino. Para quem usa o site o resultado é o mesmo; só o status HTTP fica `200`.
