# Pastas, arquivos especiais e grupos

### ROTA-01: Pasta é segmento de URL; page.tsx só onde há tela
**Fonte:** [SLIDE] ROTAS p. 11 ("Pasta = segmento da URL", "A pasta só vira URL acessível quando contém um page.tsx"); p. 22
**Regra:** Cada pasta dentro de `app/` é um pedaço da URL. Só existe rota onde existe `page.tsx`.
Pasta sem `page.tsx` dá 404.
**✅ Certo:**
```
app/(painel)/painel/ocorrencias/page.tsx   → /painel/ocorrencias
app/(painel)/painel/ocorrencias/nova/page.tsx → /painel/ocorrencias/nova
```
**❌ Errado:** criar `app/painel/relatorios/` com só um componente dentro e linkar para `/painel/relatorios`.
**Como verificar:** todo `href` usado em `<Link>` corresponde a uma pasta com `page.tsx` (`rg -n "href=\"/" app components` e comparar com `rg --files app -g page.tsx`).

### ROTA-02: Arquivos especiais por convenção
**Fonte:** [SLIDE] ROTAS p. 12 (tabela "Mesmo conceito, outro endereço"), p. 13 (page.tsx), p. 14 (layout.tsx), p. 21 (loading, error, not-found)
**Regra:** Use os nomes que o Next reconhece: `page.tsx` (tela), `layout.tsx` (casca),
`loading.tsx`, `error.tsx`, `not-found.tsx`. A página exporta o componente com `export default`.
**✅ Certo:**
```tsx
export default async function OcorrenciasPage() { ... }
```
**❌ Errado:** `app/ocorrencias/Ocorrencias.tsx` esperando virar rota, ou página com export nomeado só.
**Como verificar:** `rg --files-without-match "export default" -g "page.tsx" -g "layout.tsx" -g "loading.tsx" -g "error.tsx" -g "not-found.tsx" app` deve retornar vazio; confira se a exportação é o componente esperado.

### ROTA-03: Pastas com _ são privadas (colocation)
**Fonte:** [SLIDE] ROTAS p. 11 ("_pasta = privada", "Colocation segura", `_components/Header.tsx`)
**Regra:** Componentes usados por uma rota só ficam em `_components/` dentro da pasta da rota. O `_`
tira a pasta do roteamento. Componentes usados em várias áreas ficam em `components/` na raiz (STACK-05).
**✅ Certo:**
```
app/(painel)/painel/ocorrencias/_components/FormOcorrencia.tsx
```
**❌ Errado:** `app/(painel)/painel/ocorrencias/components/FormOcorrencia.tsx` sem `_` (fica sujeita a virar segmento se alguém criar `page.tsx` ali).
**Como verificar:** `rg --files app | rg "/components/"` deve retornar vazio (só `_components/`).

### ROTA-04: Grupos de rotas (site) e (painel), sem URLs repetidas
**Fonte:** [SLIDE] ROTAS p. 15 ("Grupos de rotas: layouts sem mudar a URL", exemplo com `(site)/` e `(painel)/`, "Cuidado com conflitos"); p. 22
**Regra:** A área pública fica em `app/(site)/` e a privada em `app/(painel)/`, cada uma com seu
`layout.tsx`. Os parênteses não aparecem na URL. Nunca crie a mesma URL nos dois grupos. Por isso
as telas privadas ficam sob o segmento `painel/` (`app/(painel)/painel/...`): isso evita conflito e
dá um prefixo único para o `proxy.ts` proteger (AUTH-01).
**✅ Certo:**
```
app/(site)/page.tsx                → /
app/(site)/sobre/page.tsx          → /sobre
app/(painel)/painel/page.tsx       → /painel
```
**❌ Errado:**
```
app/(site)/ocorrencias/page.tsx
app/(painel)/ocorrencias/page.tsx  ← ambos resolvem para /ocorrencias: erro de build
```
**Como verificar:** listar as rotas de cada grupo (`rg --files "app/(site)" -g page.tsx`, idem `(painel)`) e conferir que nenhum caminho relativo se repete.
