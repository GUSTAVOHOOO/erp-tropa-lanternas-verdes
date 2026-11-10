# Layout, semântica e estados

### CSS-05: Flexbox para alinhar em uma direção, com gap
**Fonte:** [SLIDE] CSS p. 8 ("Unidimensional"), p. 9 (`justify-content`, `align-items`, `flex-direction`, `gap`; "Cria espaço entre itens sem adicionar margens externas indesejadas"), p. 10 (navbar com `space-between`)
**Regra:** Barras e linhas de itens usam `flex` + `items-center` + `justify-between`/`gap-*`.
Espaço entre irmãos é `gap`, não margem em cada filho.
**✅ Certo:** `<header className="flex items-center justify-between gap-4 p-4">`
**❌ Errado:** `<a className="mr-4">` repetido em cada link do menu.
**Como verificar:** revisão visual do header público e da sidebar.

### CSS-06: Grid para listas de cartões
**Fonte:** [SLIDE] CSS p. 12 ("Transformando uma lista vertical (mobile) em um grid de 3 colunas (desktop)"), p. 14 (`grid-cols-3`)
**Regra:** Coleções de cartões (setores, ocorrências em modo cartão) usam `grid` com colunas
responsivas (CSS-03) e `gap-4`.
**✅ Certo:** `<ul className="grid grid-cols-1 gap-4 md:grid-cols-3">`
**❌ Errado:** cartões com `float` ou `inline-block` e larguras fixas.
**Como verificar:** `rg -n "float-|inline-block" app components` deve retornar vazio.

### CSS-07: HTML semântico e hierarquia de títulos
**Fonte:** [SLIDE] CSS p. 2 ("Elementos como `<header>`, `<main>`, `<section>` e `<footer>` dão significado às partes da página, essenciais para SEO e acessibilidade"; "Hierarquia clara através de títulos (h1-h6)"), p. 19
**Regra:** Layouts usam `<header>`, `<nav>`, `<main>`, `<footer>`; páginas têm um único `<h1>`;
listas são `<ul>/<li>`; botões que fazem ação são `<button>`, navegação é `<Link>` (ROTA-16).
**✅ Certo:**
```tsx
<main><h1>Ocorrências</h1><section aria-labelledby="filtros">...</section></main>
```
**❌ Errado:** `<div onClick={...}>` fazendo papel de botão; página sem `<h1>` ou com dois.
**Como verificar:** `rg -n "<div[^>]*onClick" app components` deve retornar vazio; contar `<h1` por `page.tsx` (`rg -c "<h1" app -g page.tsx`).

### CSS-08: Estados interativos com prefixos (hover:, focus-visible:, disabled:)
**Fonte:** [SLIDE] CSS p. 15 ("hover:bg-blue-600 (Pseudo-classe para interação)"), p. 16 ("pseudo-classes (hover:bg-red-500)") + [DECISÃO] foco visível para teclado
**Regra:** Elementos clicáveis têm `hover:` e foco visível (`focus-visible:`). Os componentes do
shadcn já trazem isso: não remova `outline`/`ring` sem colocar outro indicador.
**✅ Certo:** `className="rounded-md px-3 py-2 hover:bg-muted focus-visible:ring-2"`
**❌ Errado:** `className="outline-none"` sem substituto.
**Como verificar:** `rg -n "outline-none" app components` e conferir que há `focus-visible:` junto.
