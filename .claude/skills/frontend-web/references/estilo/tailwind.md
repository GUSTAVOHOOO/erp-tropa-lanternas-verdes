# Tailwind utility-first

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
<span className={cn('size-2.5 rotate-45 rounded-xs', corPorGravidade[gravidade])} />
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

### CSS-10: Repetição de classes vira componente, não @apply
**Fonte:** [SLIDE] CSS p. 18 ("Diretiva @apply: O Tailwind permite extrair padrões repetitivos para classes CSS tradicionais quando o HTML fica muito poluído") + [DECISÃO] preferir componente React (COMP-03)
**Regra:** Se o mesmo conjunto de classes se repete, extraia um componente (`BadgeGravidade`,
`CampoTexto`) ou use as variantes do shadcn (`buttonVariants`). Não use `@apply`.
**✅ Certo:** `<BadgeGravidade nivel={o.gravidade} />`
**❌ Errado:** `.badge-critica { @apply bg-gravidade-critica ... }` em `globals.css`.
**Como verificar:** `rg -n "@apply" app` deve retornar vazio (fora do bloco base que o shadcn gera).
