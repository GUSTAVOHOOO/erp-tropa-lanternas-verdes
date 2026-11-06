# Tema escuro

### PROD-10: Tema escuro por tokens, sem flash e com contraste
**Fonte:** [DECISÃO] aprovada + [DOCS] `.../02-guides/preventing-flash-before-hydration.md` e `error.md` (`global-error` não herda o tema)
**Regra:** Cores só por token (CSS-09, CSS-12). Tema único escuro: `color-scheme: dark` em `html` e nenhum seletor de tema (DEC-13). Dois temas: os tokens têm valores para ambos (`prefers-color-scheme` como padrão e atributo `data-theme` para a escolha do usuário); a escolha é aplicada **antes da primeira pintura**, seguindo o guia, para não piscar o tema errado. Contraste AA nos dois temas (PROD-08). `global-error.tsx` renderiza o próprio `<html>` e deve aplicar o tema por conta própria.
**✅ Certo:** `:root { color-scheme: dark; --fundo: ... }` em `globals.css` e `bg-fundo` nos componentes.
**❌ Errado:** `dark:bg-[#111]` espalhado; tema lido de `localStorage` em `useEffect` (pisca claro e depois escuro); cinza sobre cinza sem medir contraste.
**Como verificar:** recarregue com cache vazio e veja se há flash; confira contraste dos tokens (par texto/fundo) numa ferramenta e abra a página de erro global.
