# Estilo: Tailwind, shadcn/ui e HTML semântico (CSS)

Deck: CSS (`css_tailwind_web_development.pdf`). O deck ensina CSS puro e Tailwind em HTML
(`class=`). Em React o atributo é `className` (COMP-15). shadcn/ui não está nos slides: é decisão
do grupo (STACK-02).

---

### CSS-01: Tailwind utility-first; CSS próprio só no globals.css
**Fonte:** [SLIDE] CSS p. 13 ("Abordagem Utilitária: Não escreva CSS customizado"), p. 15 ("Nenhuma linha de CSS customizado foi escrita"), p. 16, p. 17
**Regra:** Estilo é feito com classes do Tailwind no `className`. O único arquivo `.css` é
`app/globals.css` (import do Tailwind, tema do shadcn, variáveis de cor). Nada de `.module.css`
nem arquivos `.css` por componente.
**✅ Certo:** `<section className="mx-auto max-w-5xl p-6">`
**❌ Errado:** `import styles from './Painel.module.css'`
**Como verificar:** `rg --files -g "*.css" app components` deve achar só `app/globals.css`.

### CSS-02: Sem estilo inline
**Fonte:** [SLIDE] CSS p. 4 ("1. Inline (na linha): Evitar. Difícil manutenção. Não reutilizável"); JS p. 12 ("Prefira sempre trocar classes (classList) ao invés de escrever CSS inline (style)"); CSS p. 16 ("Diferente do estilo Inline, o Tailwind permite media queries e pseudo-classes")
**Regra:** Não use `style={{ ... }}`. Estado visual muda trocando classes (ternário no `className`
ou a função `cn()` do shadcn).
**✅ Certo:**
```tsx
<span className={cn('rounded px-2 py-0.5 text-xs', nivel === 'critica' && 'bg-red-600 text-white')}>
```
**❌ Errado:** `<span style={{ backgroundColor: nivel === 'critica' ? 'red' : 'gray' }}>`
**Como verificar:** `rg -n "style=\{\{" app components` deve retornar vazio (fora de `components/ui/`).

### CSS-03: Mobile-first: classe base para celular, prefixos para telas maiores
**Fonte:** [SLIDE] CSS p. 11 ("Mobile-First: cria o layout para telas pequenas primeiro"), p. 12 ("Use min-width para Mobile-First"; breakpoints ≥ 768 px, ≥ 1024 px), p. 16 ("Prefixos como sm:, md: e lg:")
**Regra:** Escreva a classe sem prefixo para o celular e acrescente `md:`/`lg:` para telas maiores.
Toda tela precisa funcionar em 375 px de largura.
**✅ Certo:** `<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">`
**❌ Errado:** `<div className="grid grid-cols-3">` (três colunas espremidas no celular).
**Como verificar:** `rg -n "grid-cols-[2-9]" app components` e conferir que há `grid-cols-1` base com prefixo nos maiores; testar no DevTools em 375 px.

### CSS-04: Usar a escala do Tailwind; evitar valores mágicos
**Fonte:** [SLIDE] CSS p. 13 ("Sistema de Design (Constraints)... Em vez de valores mágicos (13px), você usa uma escala consistente"), p. 14 ("p-4 = 4 * 0.25rem = 1rem"), p. 16 ("evitando números mágicos arbitrários"); CSS p. 7 ("Use unidades relativas como rem")
**Regra:** Espaçamento, tamanho de fonte e cor vêm da escala (`p-4`, `text-sm`, `bg-primary`). Valor
arbitrário (`p-[13px]`, `text-[#123456]`) só com justificativa em comentário.
**✅ Certo:** `className="mt-8 text-xl font-bold"`
**❌ Errado:** `className="mt-[33px] text-[19px]"`
**Como verificar:** `rg -n "\w-\[[0-9#]" app components` deve retornar vazio ou com justificativa.

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

### CSS-09: Tema e cores no globals.css (Tailwind 4), não em tailwind.config.js
**Fonte:** [SLIDE] CSS p. 16 ("O arquivo tailwind.config.js permite definir suas próprias cores, fontes e espaçamentos") + [DOCS] https://ui.shadcn.com/docs/installation (tema via CSS variables)
**Regra:** Cores da Tropa (verde lanterna etc.) entram como variáveis CSS no `app/globals.css`, no
bloco gerado pelo shadcn (`--primary`, etc.), e são usadas pelos nomes semânticos (`bg-primary`,
`text-destructive`). Não crie `tailwind.config.js`.
**✅ Certo:** ajustar `--primary` no `:root` de `globals.css` e usar `bg-primary`.
**❌ Errado:** `bg-[#00ff66]` espalhado pelo código; criar `tailwind.config.js` só para isso.
**Como verificar:** `rg --files -g "tailwind.config.*"` deve retornar vazio; `rg -n "#[0-9a-fA-F]{6}" app components` deve retornar vazio (cores ficam em `globals.css`).
**Nota de versão:** o slide é do Tailwind 3. O create-next-app atual instala o Tailwind 4, em que
a configuração é feita no próprio CSS (`@import "tailwindcss"` e `@theme`) e o `tailwind.config.js`
deixou de ser necessário. A ideia do slide (personalizar a escala num lugar só) continua.

### CSS-10: Repetição de classes vira componente, não @apply
**Fonte:** [SLIDE] CSS p. 18 ("Diretiva @apply: O Tailwind permite extrair padrões repetitivos para classes CSS tradicionais quando o HTML fica muito poluído") + [DECISÃO] preferir componente React (COMP-03)
**Regra:** Se o mesmo conjunto de classes se repete, extraia um componente (`BadgeGravidade`,
`CampoTexto`) ou use as variantes do shadcn (`buttonVariants`). Não use `@apply`.
**✅ Certo:** `<BadgeGravidade nivel={o.gravidade} />`
**❌ Errado:** `.badge-critica { @apply bg-red-600 text-white ... }` em `globals.css`.
**Como verificar:** `rg -n "@apply" app` deve retornar vazio (fora do bloco base que o shadcn gera).

### CSS-11: Componentes de UI vêm do shadcn/ui (Base UI) em components/ui
**Fonte:** [DECISÃO] stack (STACK-02) + [DOCS] https://ui.shadcn.com/docs/cli
**Regra:** Botão, input, label, select, card, table, badge, alert etc. são adicionados com
`npx shadcn@latest add <nome>` e importados de `@/components/ui/<nome>`. Só altere esses arquivos
se for necessário e registre o motivo. Não instale outra biblioteca de componentes.
**✅ Certo:** `import { Button } from '@/components/ui/button'`
**❌ Errado:** `npm i @mui/material`; copiar à mão um botão de outro projeto.
**Como verificar:** `package.json` sem bibliotecas de UI fora da lista de STACK-06.
