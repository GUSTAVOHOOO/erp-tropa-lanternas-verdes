# Tema, tokens, fontes e foco

### CSS-09: Tema e cores no globals.css (Tailwind 4), não em tailwind.config.js
**Fonte:** [SLIDE] CSS p. 16 ("O arquivo tailwind.config.js permite definir suas próprias cores, fontes e espaçamentos") + [DOCS] https://ui.shadcn.com/docs/installation (tema via CSS variables)
**Regra:** Cores da marca entram como variáveis CSS no `app/globals.css`, no
bloco gerado pelo shadcn (`--primary`, etc.), e são usadas pelos nomes semânticos (`bg-primary`,
`text-destructive`). Não crie `tailwind.config.js`.
**✅ Certo:** ajustar `--primary` no `:root` de `globals.css` e usar `bg-primary`.
**❌ Errado:** `bg-[#00ff66]` espalhado pelo código; criar `tailwind.config.js` só para isso.
**Como verificar:** `rg --files -g "tailwind.config.*"` deve retornar vazio; `rg -n "#[0-9a-fA-F]{6}" app components -g "!*.svg"` deve retornar vazio (cores ficam em `globals.css`; o favicon `app/icon.svg` é arquivo de imagem, não estilo de código).
**Nota de versão:** o slide é do Tailwind 3. O create-next-app atual instala o Tailwind 4, em que
a configuração é feita no próprio CSS (`@import "tailwindcss"` e `@theme`) e o `tailwind.config.js`
deixou de ser necessário. A ideia do slide (personalizar a escala num lugar só) continua.

### CSS-11: Componentes de UI vêm do shadcn/ui (Base UI) em components/ui
**Fonte:** [DECISÃO] stack (STACK-02) + [DOCS] https://ui.shadcn.com/docs/cli
**Regra:** Botão, input, label, select, card, table, badge, alert etc. são adicionados com
`npx shadcn@latest add <nome>` e importados de `@/components/ui/<nome>`. Só altere esses arquivos
se for necessário e registre o motivo. Não instale outra biblioteca de componentes.
**✅ Certo:** `import { Button } from '@/components/ui/button'`
**❌ Errado:** `npm i @mui/material`; copiar à mão um botão de outro projeto.
**Como verificar:** `package.json` sem bibliotecas de UI fora da lista de STACK-06.

### CSS-12: Tokens do tema: cor só por nome semântico; estado nunca só por cor
**Fonte:** [DECISÃO] design system do projeto + [SLIDE] CSS p. 13 ("Sistema de Design (Constraints)")
**Regra:** As cores do tema e as de estado (ex.: gravidade baixa a crítica) são variáveis em `app/globals.css`, expostas como classes (`bg-primary`, `text-texto-terciario`, `bg-gravidade-critica`). A cor de um estado nunca aparece sozinha: vem sempre com rótulo em texto (acessibilidade: PROD-08). Mapas de classe por valor usam objeto `as const` com a classe inteira (o Tailwind só gera a classe que encontra escrita por completo). Os nomes de token e a escala de gravidade são ilustração; use os do design system do projeto.
**✅ Certo:** `const corPorGravidade = { critica: 'bg-gravidade-critica', ... } as const`
**❌ Errado:** `` `bg-gravidade-${gravidade}` `` (classe montada não é gerada); losango colorido sem texto; listra colorida lateral (`border-l-4`) para marcar destaque.
**Como verificar:** `rg -n 'gravidade-\$\{' app components` vazio; `rg -n "border-[lr]-[2-8]" app components` vazio; o componente de estado sempre renderiza o rótulo.

### CSS-13: Poucas famílias com next/font, cada uma com um papel
**Fonte:** [DOCS] `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md` + [DECISÃO] design system do projeto
**Regra:** `app/layout.tsx` carrega as fontes com `next/font/google` (auto-hospedadas, sem requisição ao Google no navegador) e expõe variáveis CSS no `@theme` de `globals.css`. Cada família tem um papel: texto da interface, títulos, dados em monoespaçada. Fonte de título condensada nunca em botão, rótulo, menu ou célula de tabela. Pesos só os usados. No projeto atual (ilustração): Barlow (interface), Barlow Condensed (títulos, `font-heading`), IBM Plex Mono (dados, `font-mono`).
**✅ Certo:** `<h1 className="font-heading text-4xl font-bold">`
**❌ Errado:** `<Button className="font-heading uppercase">`; `<link href="https://fonts.googleapis.com/...">` no layout.
**Como verificar:** `rg -n "fonts.googleapis" app` vazio; `rg -n "font-heading" components/ui` vazio.

### CSS-14: O foco do teclado é um token único
**Fonte:** [DECISÃO] design system + [SLIDE] CSS p. 15 (pseudo-classes) — complementa CSS-08
**Regra:** O indicador de foco é um token (no projeto, `--shadow-anel`, classe `shadow-anel`), usado como único brilho da interface. Todo componente interativo de `components/ui` usa `outline-none focus-visible:<token>`. Links (`<a>`, inclusive `<Link>`) recebem o mesmo indicador por uma regra única em `@layer base` de `globals.css`. O indicador precisa de contraste mínimo de 3:1 com o fundo (PROD-08).
**✅ Certo:** `buttonVariants` com `focus-visible:shadow-anel`.
**❌ Errado:** `outline-none` sem substituto; o token de foco usado como enfeite em cartão.
**Como verificar:** `rg -n "focus-visible:shadow-anel" components/ui` acha button, input, textarea e select; navegue por todo o app só com Tab e veja o foco em cada elemento.

### CSS-15: Movimento só para mudança de estado, e respeitando reduced-motion
**Fonte:** [DECISÃO] design system + [DOCS] https://developer.mozilla.org/docs/Web/CSS/@media/prefers-reduced-motion
**Regra:** Transições de cor, borda, sombra e brilho com `duration-150 ease-out`. Nada de animar
largura/altura nem animação de entrada de página. `globals.css` tem um bloco
`@media (prefers-reduced-motion: reduce)` que zera transições e animações.
**✅ Certo:** `transition-colors duration-150 ease-out hover:bg-secondary`
**❌ Errado:** `transition-all duration-700`; `animate-bounce`.
**Como verificar:** `rg -n "prefers-reduced-motion" app/globals.css` acha o bloco; `rg -n "transition-all|duration-[5-9]00" app components` vazio.
