# SEO e metadata

### PROD-04: SEO: metadata raiz, título com template, robots e sitemap
**Fonte:** [DECISÃO] aprovada + [DOCS] `.../03-api-reference/04-functions/generate-metadata.md` (`metadataBase`, `title.template`), `.../03-api-reference/03-file-conventions/01-metadata/robots.md` e `sitemap.md`
**Regra:** O `layout.tsx` raiz exporta `metadata` com `metadataBase: new URL(env.SITE_URL)`, `title: { default, template: '%s | Nome' }`, `description` e `openGraph`. Cada página exporta só o `title` próprio (ROTA-07); detalhe dinâmico usa `generateMetadata` (com `await params`: ROTA-10). `app/robots.ts` bloqueia as rotas privadas e `app/sitemap.ts` lista só as públicas. Página privada ou de vitrine leva `robots: { index: false }`. Um único `<h1>` por página (CSS-07); `lang="pt-BR"` (ROTA-05).
**✅ Certo:**
```ts
export const metadata: Metadata = {
  metadataBase: new URL(env.SITE_URL),
  title: { default: 'Nome do produto', template: '%s | Nome do produto' }, // [PROD-04]
  description: 'O que o produto faz, em uma frase.',
}
```
**❌ Errado:** `<title>` escrito à mão em cada página; mesma `description` em todas; área privada indexável; `metadataBase` ausente (links de OG relativos quebram).
**Como verificar:** `curl -s http://localhost:3000/ | rg -o "<title>[^<]*|<meta name=\"description\"[^>]*"`; `curl -s http://localhost:3000/robots.txt`.
