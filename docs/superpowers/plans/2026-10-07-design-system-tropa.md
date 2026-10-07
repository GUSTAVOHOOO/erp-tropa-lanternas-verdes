# Design system da Tropa — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o visual padrão do shadcn por um design system próprio da Tropa (tema Noite), sem mudar o comportamento do ERP.

**Architecture:** Tokens em `app/globals.css` → componentes de `components/ui` com visual reescrito e API mantida → componentes compartilhados e novos em `components/` → telas. A rota `/design-system` mostra tudo rodando.

**Tech Stack:** Next.js 16.4 (App Router), React 19, Tailwind CSS 4, shadcn/ui sobre Base UI, lucide-react, next/font/google, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-07-design-system-tropa-design.md`

## Global Constraints

- Siga a skill `padroes-wellington` (arquivo `.claude/skills/padroes-wellington/SKILL.md` e as referências citadas em cada tarefa). Marque com `// [ID]` (ou `{/* [ID] */}` em JSX) a linha onde uma regra é aplicada. Nunca invente ID.
- Nenhuma dependência nova no `package.json` (STACK-06). `next/font/google` faz parte do `next`.
- Sem `style={{...}}` (CSS-02). Sem valor arbitrário de Tailwind (`p-[13px]`, `grid-cols-[1fr_auto]`, `text-[#123]`) (CSS-04). Variantes com colchetes como `aria-[current=page]:` e `[&_svg]:` são permitidas: são seletores, não valores.
- Sem cor hex em `.ts/.tsx/.css` (CSS-09). Cor só pelos nomes semânticos (`bg-primary`, `text-muted-foreground`, `bg-gravidade-critica`).
- Sem `dark:` e sem `.dark` (DEC-13: tema único).
- Proibido: listra colorida lateral (`border-l-2`…`border-l-8`, `border-r-*` como enfeite), texto pequeno em caixa alta com espaçamento largo acima de títulos, fonte condensada (`font-heading`) em botão, rótulo, menu ou célula de tabela.
- Português no domínio (DEC-08): nomes de componentes, props e textos em português, sem acento em identificadores.
- Não mude comportamento: rotas, Server Actions, schemas, `lib/` e regras de acesso ficam iguais. Só muda marcação visual.
- `db.json` NUNCA entra em commit (é estado do json-server). Use sempre `git add <arquivos da tarefa>`, nunca `git add .` nem `git add -A`.
- Todo commit termina com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Ao fim de cada tarefa: `npm run test:run`, `npm run lint` e `npm run build` precisam passar. Se `npm run build` falhar por falta de rede ao baixar fontes do Google, informe isso no relatório em vez de mudar o código.
- Ícones: `lucide-react`, importados com o sufixo `Icon` (ex.: `HouseIcon`), sempre com `aria-hidden`.

## Review Focus

1. **Título longo de ocorrência em tela de 375 px**: a tabela rola dentro do próprio contêiner e a página não ganha rolagem horizontal. Verificação visual do orquestrador (Tarefa 9).
2. **Nenhuma ocorrência no painel**: `BarraStatus` não desenha a barra e a legenda mostra 0 em cada status. Teste na Tarefa 6.
3. **Navegação só com teclado**: todo botão, campo, select e link mostra o anel ao receber foco. Testes nas Tarefas 2, 4 e 5 (classe `focus-visible:shadow-anel` e regra base de `a:focus-visible`).
4. **Usuário com `prefers-reduced-motion`**: transições e o pulse do esqueleto param. Teste na Tarefa 2.
5. **Ocorrência sem responsável**: aparece "Sem responsável", nunca célula vazia ou "—". Teste na Tarefa 6.

---

### Task 1: Regras novas na padroes-wellington

**Files:**
- Modify: `.claude/skills/padroes-wellington/references/estilo-tailwind.md` (fim do arquivo + CSS-09)
- Modify: `.claude/skills/padroes-wellington/references/stack-e-decisoes.md` (índice, STACK-02, STACK-05, DEC-09, fim do arquivo)

**Interfaces:**
- Produces: IDs `CSS-12`, `CSS-13`, `CSS-14`, `CSS-15`, `DEC-11`, `DEC-12`, `DEC-13`, usados nos marcadores `// [ID]` de todas as tarefas seguintes.

- [ ] **Step 1: Ajustar o "Como verificar" da CSS-09**

Em `estilo-tailwind.md`, na regra CSS-09, troque a linha que começa com `**Como verificar:**` por:

```markdown
**Como verificar:** `rg --files -g "tailwind.config.*"` deve retornar vazio; `rg -n "#[0-9a-fA-F]{6}" app components -g "!*.svg"` deve retornar vazio (cores ficam em `globals.css`; o favicon `app/icon.svg` é arquivo de imagem, não estilo de código).
```

- [ ] **Step 2: Acrescentar CSS-12 a CSS-15 no fim de `estilo-tailwind.md`**

```markdown

### CSS-12: Tokens da Tropa: cor só por nome semântico, gravidade com texto
**Fonte:** [DECISÃO] design system (`docs/superpowers/specs/2026-10-07-design-system-tropa-design.md`) + [SLIDE] CSS p. 13 ("Sistema de Design (Constraints)")
**Regra:** As cores do tema Noite e a escala de gravidade são variáveis em `app/globals.css`, expostas
como classes (`bg-primary`, `text-primary-texto`, `text-texto-terciario`, `bg-gravidade-baixa`…`bg-gravidade-critica`).
A gravidade segue o espectro emocional dos Lanternas: baixa azul (esperança), média amarelo (medo),
alta laranja (ganância), crítica vermelho (fúria). A cor da gravidade nunca aparece sozinha: sempre
vem com o rótulo em texto. Mapas de classe por valor usam objeto `as const` com a classe inteira
(o Tailwind só gera a classe que encontra escrita por completo).
**✅ Certo:** `const corPorGravidade = { critica: 'bg-gravidade-critica', ... } as const`
**❌ Errado:** `` `bg-gravidade-${gravidade}` `` (classe montada não é gerada); losango colorido sem texto.
**Como verificar:** `rg -n "bg-gravidade-\\$\{" app components` deve retornar vazio; `BadgeGravidade` sempre renderiza `rotuloGravidade`.

### CSS-13: Três famílias com next/font, cada uma com um papel
**Fonte:** [DOCS] `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md` + [DECISÃO] design system
**Regra:** `app/layout.tsx` carrega com `next/font/google`: Barlow (400/500/600) para a interface,
Barlow Condensed (600/700) só para `h1`, `h2` e a marca (`font-heading`), IBM Plex Mono (500) só para
dados como número de setor (`font-mono`). As variáveis CSS entram no `@theme` de `globals.css`.
Fonte condensada nunca em botão, rótulo, menu ou célula de tabela.
**✅ Certo:** `<h1 className="font-heading text-4xl font-bold">`
**❌ Errado:** `<Button className="font-heading uppercase">`; `<link href="https://fonts.googleapis.com/...">` no layout.
**Como verificar:** `rg -n "fonts.googleapis" app` vazio; `rg -n "font-heading" components/ui` vazio.

### CSS-14: O foco do teclado é o brilho do anel
**Fonte:** [DECISÃO] design system + [SLIDE] CSS p. 15 (pseudo-classes) — complementa CSS-08
**Regra:** O token `--shadow-anel` (classe `shadow-anel`) é o único brilho da interface, além do
emblema (`drop-shadow-anel`). Todo componente interativo de `components/ui` usa
`outline-none focus-visible:shadow-anel`. Links (`<a>`, inclusive `<Link>`) recebem o mesmo brilho
por uma regra única em `@layer base` de `globals.css`, para não repetir classe em cada link.
**✅ Certo:** `buttonVariants` com `focus-visible:shadow-anel`.
**❌ Errado:** `outline-none` sem `focus-visible:` substituto; `shadow-anel` como enfeite em cartão.
**Como verificar:** `rg -n "focus-visible:shadow-anel" components/ui` acha button, input, textarea e select; `rg -n "drop-shadow-anel" app components` só onde há Emblema.

### CSS-15: Movimento só para mudança de estado, e respeitando reduced-motion
**Fonte:** [DECISÃO] design system + [DOCS] https://developer.mozilla.org/docs/Web/CSS/@media/prefers-reduced-motion
**Regra:** Transições de cor, borda, sombra e brilho com `duration-150 ease-out`. Nada de animar
largura/altura nem animação de entrada de página. `globals.css` tem um bloco
`@media (prefers-reduced-motion: reduce)` que zera transições e animações.
**✅ Certo:** `transition-colors duration-150 ease-out hover:bg-secondary`
**❌ Errado:** `transition-all duration-700`; `animate-bounce`.
**Como verificar:** `rg -n "prefers-reduced-motion" app/globals.css` acha o bloco; `rg -n "transition-all|duration-[5-9]00" app components` vazio.
```

- [ ] **Step 3: Atualizar `stack-e-decisoes.md`**

3a. Na linha `Índice:` do topo, acrescente ao final: ` · DEC-11 Visual próprio sobre Base UI · DEC-12 Vitrine /design-system · DEC-13 Tema único escuro`.

3b. Em STACK-02, logo depois da linha `**❌ Errado:** instalar ...`, acrescente:

```markdown
**Nota:** o visual dos arquivos gerados em `components/ui/` foi reescrito para o design system da Tropa, mantendo a API e o Base UI por baixo. Ver DEC-11.
```

3c. Em STACK-05, dentro do bloco da árvore, troque a linha `│   ├── layout.tsx                   <html lang="pt-BR"> (ROTA-05)` por:

```
│   ├── layout.tsx                   <html lang="pt-BR"> (ROTA-05), fontes (CSS-13)
│   ├── icon.svg                     favicon com o emblema (DEC-11)
```

e troque a linha `│   │   └── acesso-negado/page.tsx                                      403 explicado (AUTH-06)` por:

```
│   │   ├── acesso-negado/page.tsx                                      403 explicado (AUTH-06)
│   │   └── design-system/page.tsx, _components/SecaoVitrine.tsx        vitrine do design system (DEC-12)
```

e troque as linhas

```
│   ├── CampoTexto, MenuNavegacao, EstadoVazio, TelaDeErro, EsqueletoLista,
│   │   BadgeGravidade, BadgeStatus, TabelaOcorrencias     CampoTexto (FORM-22); MenuNavegacao 'use client', usePathname (ROTA-17); EstadoVazio (API-09)
│   └── CampoSelect
```

por

```
│   ├── CampoTexto, MenuNavegacao, EstadoVazio, TelaDeErro, EsqueletoLista,
│   │   BadgeGravidade, BadgeStatus, TabelaOcorrencias     CampoTexto (FORM-22); MenuNavegacao 'use client', usePathname (ROTA-17); EstadoVazio (API-09)
│   ├── CampoSelect
│   └── Emblema, Marca, IconeStatus, BarraStatus, CabecalhoPagina,
│       LinkVoltar, MensagemErro, PaginaAviso, Juramento   design system (DEC-11, CSS-10)
```

3d. Em DEC-09, no fim do parágrafo `**Regra:**`, acrescente a frase: ` Vitrine do design system = `/design-system` (DEC-12), fora do menu, com link no rodapé público.`

3e. No fim do arquivo, acrescente:

```markdown

### DEC-11: Visual próprio sobre Base UI
**Fonte:** [DECISÃO] design system (`docs/superpowers/specs/2026-10-07-design-system-tropa-design.md`) — complementa STACK-02 e CSS-11
**Regra:** Os arquivos de `components/ui/` continuam vindo do shadcn e usando o Base UI (teclado, foco,
ARIA, posicionamento do select). O que foi reescrito é só o visual (as classes), para seguir os
tokens da Tropa. Nomes exportados, variantes (`default`, `outline`, `secondary`, `ghost`,
`destructive`, `link`) e tamanhos não mudam, para nenhuma tela precisar mudar por causa da API.
Componentes novos do design system ficam em `components/` (fora de `ui/`).
**✅ Certo:** trocar as classes de `buttonVariants` mantendo `variant="outline"`.
**❌ Errado:** apagar o Base UI e reescrever o select com `<div>` e `useState`; criar `components/tropa/Button.tsx` paralelo.
**Como verificar:** `rg -n "@base-ui/react" components/ui` continua achando button, input, select e badge.

### DEC-12: Vitrine do design system em /design-system
**Fonte:** [DECISÃO]
**Regra:** `app/(site)/design-system/page.tsx` é um Server Component estático que mostra cores,
tipografia, emblema, ícones e cada componente em todos os estados (normal, foco, erro, desabilitado).
Fica fora do menu principal; o link está no rodapé público. Os dados de exemplo são constantes no
próprio arquivo (não chama a API).
**Como verificar:** `rg -n "listar|buscar" "app/(site)/design-system"` vazio.

### DEC-13: Tema único escuro ("Noite")
**Fonte:** [DECISÃO] (o juramento: "na noite mais densa"; e menos código para explicar)
**Regra:** Só existe o tema escuro, definido no `:root` de `globals.css`. Não há bloco `.dark`,
variante `dark:`, botão de troca de tema nem estado de cliente para isso. `color-scheme: dark` no
`html` faz os controles nativos do navegador seguirem o tema.
**Como verificar:** `rg -n "\.dark|dark:" app components` vazio.
```

- [ ] **Step 4: Verificar**

Run: `grep -c "^### CSS-1[2-5]" .claude/skills/padroes-wellington/references/estilo-tailwind.md`
Expected: `4`

Run: `grep -c "^### DEC-1[1-3]" .claude/skills/padroes-wellington/references/stack-e-decisoes.md`
Expected: `3`

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/padroes-wellington/references/estilo-tailwind.md .claude/skills/padroes-wellington/references/stack-e-decisoes.md
git commit -m "docs(skills): regras do design system (CSS-12..15, DEC-11..13)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Fundação — tokens, fontes e regras base

**Files:**
- Modify (reescrever inteiro): `app/globals.css`
- Modify: `app/layout.tsx`
- Create: `__tests__/design-system.test.ts`

**Interfaces:**
- Consumes: IDs da Tarefa 1.
- Produces: classes `bg-background`, `bg-card`, `bg-popover`, `bg-primary`, `text-primary-foreground`, `text-primary-texto`, `bg-secondary`, `text-muted-foreground`, `text-texto-terciario`, `text-destructive`, `border-border`, `border-input`, `bg-sidebar`, `border-sidebar-border`, `bg-gravidade-baixa|media|alta|critica`, `shadow-anel`, `drop-shadow-anel`, `font-sans`, `font-heading`, `font-mono`.

- [ ] **Step 1: Escrever o teste que falha**

Crie `__tests__/design-system.test.ts`:

```ts
// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'

const css = readFileSync('app/globals.css', 'utf8')
const layout = readFileSync('app/layout.tsx', 'utf8')

describe('fundação do design system', () => {
  test('tema único escuro: sem bloco .dark nem variante dark (DEC-13)', () => {
    expect(css).not.toMatch(/\.dark\b/)
    expect(css).not.toMatch(/@custom-variant dark/)
    expect(css).toMatch(/color-scheme: dark/)
  })

  test('escala de gravidade do espectro emocional existe como token (CSS-12)', () => {
    for (const nivel of ['baixa', 'media', 'alta', 'critica']) {
      expect(css).toContain(`--color-gravidade-${nivel}: var(--gravidade-${nivel})`)
    }
  })

  test('foco é o anel, inclusive em links (CSS-14)', () => {
    expect(css).toMatch(/--shadow-anel:/)
    expect(css).toMatch(/a:focus-visible/)
  })

  test('movimento respeita prefers-reduced-motion (CSS-15)', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
  })

  test('fontes da Tropa via next/font, sem Geist (CSS-13)', () => {
    expect(layout).toMatch(/Barlow, Barlow_Condensed, IBM_Plex_Mono/)
    expect(layout).not.toMatch(/Geist/)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run __tests__/design-system.test.ts`
Expected: FAIL (o CSS atual tem `.dark` e o layout usa Geist).

- [ ] **Step 3: Reescrever `app/globals.css` inteiro**

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

/* Design system da Tropa, tema único "Noite". Spec: docs/superpowers/specs/2026-10-07-design-system-tropa-design.md */
/* [CSS-09][DEC-13] todas as cores do projeto ficam neste arquivo */

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary-texto: var(--primary-texto);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-texto-terciario: var(--texto-terciario);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-border: var(--sidebar-border);

  /* [CSS-12] espectro emocional: esperança, medo, ganância, fúria */
  --color-gravidade-baixa: var(--gravidade-baixa);
  --color-gravidade-media: var(--gravidade-media);
  --color-gravidade-alta: var(--gravidade-alta);
  --color-gravidade-critica: var(--gravidade-critica);

  /* [CSS-13] variáveis criadas pelo next/font em app/layout.tsx */
  --font-sans: var(--font-barlow);
  --font-heading: var(--font-barlow-condensed);
  --font-mono: var(--font-plex-mono);

  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);

  /* [CSS-14] o brilho do anel: foco do teclado e emblema, nada mais */
  --shadow-anel: 0 0 0 1px oklch(0.80 0.19 150 / 0.9), 0 0 18px oklch(0.80 0.19 150 / 0.35);
  --drop-shadow-anel: 0 0 6px oklch(0.80 0.19 150 / 0.55);
}

:root {
  --radius: 0.5rem;

  /* neutros com um leve tom de verde (hue 155) */
  --background: oklch(0.165 0.012 155);
  --foreground: oklch(0.955 0.008 155);
  --card: oklch(0.205 0.014 155);
  --card-foreground: oklch(0.955 0.008 155);
  --popover: oklch(0.225 0.016 155);
  --popover-foreground: oklch(0.955 0.008 155);
  --secondary: oklch(0.235 0.016 155);
  --secondary-foreground: oklch(0.955 0.008 155);
  --muted: oklch(0.235 0.016 155);
  --muted-foreground: oklch(0.775 0.014 155);
  --texto-terciario: oklch(0.66 0.014 155);
  --accent: oklch(0.235 0.016 155);
  --accent-foreground: oklch(0.955 0.008 155);
  --border: oklch(0.29 0.014 155);
  --input: oklch(0.32 0.014 155);
  --sidebar: oklch(0.135 0.010 155);
  --sidebar-foreground: oklch(0.955 0.008 155);
  --sidebar-border: oklch(0.29 0.014 155);

  /* verde da força de vontade: só ação primária, seleção e foco */
  --primary: oklch(0.80 0.19 150);
  --primary-foreground: oklch(0.17 0.04 150);
  --primary-texto: oklch(0.85 0.17 150);
  --ring: oklch(0.80 0.19 150);

  --destructive: oklch(0.70 0.19 25);

  --gravidade-baixa: oklch(0.72 0.13 245);
  --gravidade-media: oklch(0.84 0.16 92);
  --gravidade-alta: oklch(0.73 0.17 55);
  --gravidade-critica: oklch(0.64 0.22 25);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  html {
    @apply font-sans;
    color-scheme: dark; /* [DEC-13] controles nativos do navegador no tema escuro */
  }
  body {
    @apply bg-background text-foreground;
  }
  h1,
  h2,
  h3 {
    text-wrap: balance;
  }
  /* [CSS-14] todo link ganha o anel no foco do teclado, sem repetir classe em cada <Link> */
  a:focus-visible {
    outline: none;
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-anel);
  }
}

/* [CSS-15] quem pede menos movimento não vê transição nem animação */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Trocar as fontes em `app/layout.tsx`**

Arquivo inteiro:

```tsx
import type { Metadata } from 'next'
import { Barlow, Barlow_Condensed, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

// [CSS-13] três famílias, cada uma com um papel: interface, títulos e dados
const barlow = Barlow({ variable: '--font-barlow', subsets: ['latin'], weight: ['400', '500', '600'] })
const barlowCondensed = Barlow_Condensed({ variable: '--font-barlow-condensed', subsets: ['latin'], weight: ['600', '700'] })
const plexMono = IBM_Plex_Mono({ variable: '--font-plex-mono', subsets: ['latin'], weight: ['500'] })

export const metadata: Metadata = {
  title: 'Central de Oa | Tropa dos Lanternas Verdes',
  description: 'Registro e acompanhamento de ocorrências intergalácticas da Tropa dos Lanternas Verdes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${barlow.variable} ${barlowCondensed.variable} ${plexMono.variable} h-full antialiased`}> {/* [ROTA-05] */}
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
```

- [ ] **Step 5: Rodar o teste e a suíte**

Run: `npx vitest run __tests__/design-system.test.ts`
Expected: PASS (5 testes)

Run: `npm run test:run && npm run lint && npm run build`
Expected: tudo passa.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css app/layout.tsx __tests__/design-system.test.ts
git commit -m "feat: tokens do tema Noite, fontes da Tropa e foco do anel

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Marca — Emblema, Marca, IconeStatus e favicon

**Files:**
- Create: `components/Emblema.tsx`, `components/Marca.tsx`, `components/IconeStatus.tsx`, `app/icon.svg`
- Delete: `app/favicon.ico`, `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`
- Create: `__tests__/components/marca.test.tsx`

**Interfaces:**
- Consumes: classes da Tarefa 2.
- Produces:
  - `Emblema({ className }: { className?: string })` — SVG `aria-hidden`, cor por `currentColor`, tamanho padrão `size-8`.
  - `Marca({ href }: { href: string })` — link com Emblema + "Central de Oa".
  - `IconeStatus({ status, className }: { status: StatusOcorrencia; className?: string })` — SVG `aria-hidden`.

- [ ] **Step 1: Escrever os testes que falham**

`__tests__/components/marca.test.tsx`:

```tsx
import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Emblema } from '@/components/Emblema'
import { Marca } from '@/components/Marca'
import { IconeStatus } from '@/components/IconeStatus'

test('Emblema é decorativo para leitores de tela', () => {
  const { container } = render(<Emblema />)
  expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
})

test('Marca leva ao endereço pedido com o nome da Central', () => {
  render(<Marca href="/" />)
  expect(screen.getByRole('link', { name: 'Central de Oa' }).getAttribute('href')).toBe('/')
})

describe('IconeStatus', () => {
  test('aberta é um círculo vazio', () => {
    const { container } = render(<IconeStatus status="aberta" />)
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelector('[fill="currentColor"]')).toBeNull()
  })

  test('em andamento e resolvida têm parte preenchida', () => {
    for (const status of ['em_andamento', 'resolvida'] as const) {
      const { container, unmount } = render(<IconeStatus status={status} />)
      expect(container.querySelector('[fill="currentColor"]')).not.toBeNull()
      unmount()
    }
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run __tests__/components/marca.test.tsx`
Expected: FAIL ("Failed to resolve import @/components/Emblema").

- [ ] **Step 3: Criar `components/Emblema.tsx`**

```tsx
import { cn } from '@/lib/utils'

/** Emblema próprio da Tropa (anel, núcleo e duas barras). Não é o logo registrado da DC. */
export function Emblema({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" aria-hidden="true" className={cn('size-8 shrink-0', className)}>
      <circle cx="16" cy="16" r="13.5" strokeWidth="2.5" />
      <rect x="7" y="7" width="18" height="3" rx="1" fill="currentColor" stroke="none" />
      <rect x="7" y="22" width="18" height="3" rx="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="4.5" strokeWidth="2.5" />
    </svg>
  )
}
```

- [ ] **Step 4: Criar `components/Marca.tsx`**

```tsx
import Link from 'next/link'
import { Emblema } from '@/components/Emblema'

/** Marca "Central de Oa" do header público e da sidebar do painel. [CSS-10] */
export function Marca({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5"> {/* [ROTA-16] */}
      <Emblema className="size-7 text-primary-texto drop-shadow-anel" /> {/* [CSS-14] */}
      <span className="font-heading text-xl leading-none font-bold">Central de Oa</span> {/* [CSS-13] */}
    </Link>
  )
}
```

- [ ] **Step 5: Criar `components/IconeStatus.tsx`**

```tsx
import type { StatusOcorrencia } from '@/lib/schemas/ocorrencia'
import { cn } from '@/lib/utils'

/** Ícone de "carga" do status: vazio (aberta), meio (em andamento), cheio com check (resolvida). */
export function IconeStatus({ status, className }: { status: StatusOcorrencia; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={cn('size-3.5 shrink-0', className)}>
      {status === 'resolvida' ? ( // [COMP-14]
        <>
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <path d="M5 8.2l2 2 4-4.2" fill="none" className="stroke-background" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          {status === 'em_andamento' && <path d="M8 1.5a6.5 6.5 0 0 1 0 13z" fill="currentColor" />}
        </>
      )}
    </svg>
  )
}
```

- [ ] **Step 6: Criar o favicon `app/icon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#111a14"/>
  <g fill="none" stroke="#52e08a" stroke-width="2.5">
    <circle cx="16" cy="16" r="11"/>
    <circle cx="16" cy="16" r="3.8"/>
  </g>
  <rect x="8.5" y="8.5" width="15" height="2.6" rx="0.8" fill="#52e08a"/>
  <rect x="8.5" y="20.9" width="15" height="2.6" rx="0.8" fill="#52e08a"/>
</svg>
```

- [ ] **Step 7: Apagar os arquivos padrão do create-next-app**

Antes, confirme que ninguém usa: `grep -rn "favicon\|file.svg\|globe.svg\|next.svg\|vercel.svg\|window.svg" app components lib` deve retornar vazio.

```bash
git rm app/favicon.ico public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

- [ ] **Step 8: Rodar testes, lint e build**

Run: `npx vitest run __tests__/components/marca.test.tsx` → PASS (5 testes)
Run: `npm run test:run && npm run lint && npm run build` → tudo passa.

- [ ] **Step 9: Commit**

```bash
git add components/Emblema.tsx components/Marca.tsx components/IconeStatus.tsx app/icon.svg __tests__/components/marca.test.tsx
git commit -m "feat: emblema próprio, marca, ícone de status e favicon

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: components/ui — Button, Badge, Label, Input, Textarea

**Files:**
- Modify (reescrever inteiro): `components/ui/button.tsx`, `components/ui/badge.tsx`, `components/ui/label.tsx`, `components/ui/input.tsx`, `components/ui/textarea.tsx`
- Create: `__tests__/components/ui.test.tsx`

**Interfaces:**
- Consumes: tokens da Tarefa 2.
- Produces (mesma API de antes): `Button`, `buttonVariants({ variant?: 'default'|'outline'|'secondary'|'ghost'|'destructive'|'link', size?: 'default'|'xs'|'sm'|'lg'|'icon'|'icon-xs'|'icon-sm'|'icon-lg', className? })`, `Badge`, `badgeVariants`, `Label`, `Input`, `Textarea`.

- [ ] **Step 1: Escrever os testes que falham**

`__tests__/components/ui.test.tsx`:

```tsx
import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const VARIANTES = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const

test('toda variante de botão usa o anel no foco (CSS-14)', () => {
  for (const variant of VARIANTES) {
    expect(buttonVariants({ variant })).toContain('focus-visible:shadow-anel')
  }
})

test('botão desabilitado continua sendo um botão desabilitado', () => {
  render(<Button disabled>Salvar</Button>)
  expect(screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(true)
})

test('Input e Textarea usam o anel e marcam erro pela borda', () => {
  render(<><Input aria-label="Título" /><Textarea aria-label="Descrição" /></>)
  for (const campo of [screen.getByLabelText('Título'), screen.getByLabelText('Descrição')]) {
    expect(campo.className).toContain('focus-visible:shadow-anel')
    expect(campo.className).toContain('aria-invalid:border-destructive')
  }
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run __tests__/components/ui.test.tsx`
Expected: FAIL (as classes atuais não têm `shadow-anel`).

- [ ] **Step 3: Reescrever `components/ui/button.tsx`**

```tsx
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// [DEC-11] visual da Tropa; teclado, foco e disabled continuam vindo do Base UI
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent text-sm font-semibold whitespace-nowrap transition duration-150 ease-out outline-none select-none focus-visible:shadow-anel disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", // [CSS-08][CSS-14][CSS-15]
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:brightness-110 active:brightness-95",
        outline: "border-border bg-card text-foreground hover:bg-secondary aria-expanded:bg-secondary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-border aria-expanded:bg-border",
        ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground aria-expanded:bg-secondary aria-expanded:text-foreground",
        destructive: "bg-destructive/15 text-destructive hover:bg-destructive/25",
        link: "text-primary-texto underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5",
        xs: "h-6 gap-1 rounded-sm px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3",
        lg: "h-10 px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-sm [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

- [ ] **Step 4: Reescrever `components/ui/badge.tsx`**

```tsx
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// [DEC-11] selo neutro e discreto; gravidade e status têm componentes próprios (BadgeGravidade, BadgeStatus)
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-sm border border-transparent px-1.5 py-0.5 text-xs font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/15 text-destructive",
        outline: "border-border text-foreground",
        ghost: "text-muted-foreground",
        link: "text-primary-texto underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
```

- [ ] **Step 5: Reescrever `components/ui/label.tsx`**

```tsx
"use client"

import * as React from "react"
import { cn } from "cn"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium text-foreground select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50", // [DEC-11]
        className
      )}
      {...props}
    />
  )
}

export { Label }
```

- [ ] **Step 6: Reescrever `components/ui/input.tsx`**

```tsx
import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // [DEC-11][CSS-14] text-base no celular evita o zoom automático do iOS; md:text-sm no desktop
        "h-9 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base text-foreground transition duration-150 ease-out outline-none placeholder:text-texto-terciario file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:border-ring focus-visible:shadow-anel disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
```

- [ ] **Step 7: Reescrever `components/ui/textarea.tsx`**

```tsx
import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-md border border-input bg-card px-3 py-2 text-base text-foreground transition duration-150 ease-out outline-none placeholder:text-texto-terciario focus-visible:border-ring focus-visible:shadow-anel disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm", // [DEC-11][CSS-14]
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
```

- [ ] **Step 8: Rodar testes, lint e build**

Run: `npx vitest run __tests__/components/ui.test.tsx` → PASS (3 testes)
Run: `npm run test:run && npm run lint && npm run build` → tudo passa.

- [ ] **Step 9: Commit**

```bash
git add components/ui/button.tsx components/ui/badge.tsx components/ui/label.tsx components/ui/input.tsx components/ui/textarea.tsx __tests__/components/ui.test.tsx
git commit -m "feat(ui): botão, selo, rótulo e campos no visual da Tropa

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: components/ui — Select, Card, Table, Alert, Skeleton

**Files:**
- Modify (reescrever inteiro): `components/ui/select.tsx`, `components/ui/card.tsx`, `components/ui/table.tsx`, `components/ui/alert.tsx`, `components/ui/skeleton.tsx`
- Modify: `__tests__/components/ui.test.tsx` (acrescentar testes)

**Interfaces:**
- Produces (mesma API de antes): `Select`, `SelectContent`, `SelectGroup`, `SelectItem`, `SelectLabel`, `SelectScrollDownButton`, `SelectScrollUpButton`, `SelectSeparator`, `SelectTrigger`, `SelectValue`; `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardAction`, `CardDescription`, `CardContent`; `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableHead`, `TableRow`, `TableCell`, `TableCaption`; `Alert`, `AlertTitle`, `AlertDescription`, `AlertAction`; `Skeleton`.
- Mudança de uso do `Alert` (ele não é usado em nenhuma tela hoje): o conteúdo vai em `<Alert><Icone /><div><AlertTitle/><AlertDescription/></div></Alert>`.

- [ ] **Step 1: Acrescentar os testes que falham** no fim de `__tests__/components/ui.test.tsx`

Acrescente estes imports no topo do arquivo (junto dos outros):

```tsx
import { Select, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
```

E no fim do arquivo:

```tsx
test('gatilho do select usa o anel e marca erro pela borda', () => {
  render(
    <Select items={{ baixa: 'Baixa' }}>
      <SelectTrigger aria-label="Gravidade"><SelectValue placeholder="Escolha" /></SelectTrigger>
    </Select>,
  )
  const gatilho = screen.getByRole('combobox', { name: 'Gravidade' }) // sem <Label>, o Base UI expõe o gatilho como combobox
  expect(gatilho.className).toContain('focus-visible:shadow-anel')
  expect(gatilho.className).toContain('aria-invalid:border-destructive')
})

test('cabeçalho da tabela usa o texto terciário e números alinhados', () => {
  render(
    <Table>
      <TableHeader><TableRow><TableHead>Setor</TableHead></TableRow></TableHeader>
      <TableBody><TableRow><TableCell>2814</TableCell></TableRow></TableBody>
    </Table>,
  )
  expect(screen.getByRole('columnheader', { name: 'Setor' }).className).toContain('text-texto-terciario')
  expect(screen.getByRole('table').className).toContain('tabular-nums')
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run __tests__/components/ui.test.tsx`
Expected: FAIL nos 2 testes novos.

- [ ] **Step 3: Reescrever `components/ui/select.tsx`**

```tsx
"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { cn } from "cn"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"

// [DEC-11] visual da Tropa; abrir, fechar, teclado e posicionamento continuam do Base UI
const Select = SelectPrimitive.Root

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left", className)}
      {...props}
    />
  )
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-2 rounded-md border border-input bg-card py-2 pr-2.5 pl-3 text-sm whitespace-nowrap text-foreground transition duration-150 ease-out outline-none select-none hover:border-texto-terciario focus-visible:border-ring focus-visible:shadow-anel disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-placeholder:text-texto-terciario data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", // [CSS-14]
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
        }
      />
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            "relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg duration-150 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", // [CSS-15]
            className
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("px-2 py-1 text-xs text-texto-terciario", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-secondary focus:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center text-primary-texto" />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
```

- [ ] **Step 4: Reescrever `components/ui/card.tsx`**

```tsx
import * as React from "react"
import { cn } from "cn"

// [DEC-11] superfície plana com borda, sem sombra; título em Barlow (a condensada é só de h1/h2)
function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-5 overflow-hidden rounded-lg border border-border bg-card py-5 text-sm text-card-foreground has-data-[slot=card-footer]:pb-0 data-[size=sm]:gap-3 data-[size=sm]:py-3",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1 px-5 group-data-[size=sm]/card:px-3", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-lg leading-snug font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("self-end", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-5 group-data-[size=sm]/card:px-3", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center border-t border-border p-5 group-data-[size=sm]/card:p-3", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
```

- [ ] **Step 5: Reescrever `components/ui/table.tsx`**

```tsx
"use client"

import * as React from "react"
import { cn } from "cn"

// [DEC-11] tabela sem fundo próprio: linhas finas, cabeçalho discreto, números alinhados
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm tabular-nums", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b [&_tr]:hover:bg-transparent", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("border-t border-border font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-border transition-colors duration-150 ease-out hover:bg-secondary/60 data-[state=selected]:bg-secondary", // [CSS-15]
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-3 text-left align-middle text-sm font-medium whitespace-nowrap text-texto-terciario",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-3 py-3 align-middle", className)}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
```

- [ ] **Step 6: Reescrever `components/ui/alert.tsx`**

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// [DEC-11] uso: <Alert><Icone /><div><AlertTitle/><AlertDescription/></div></Alert>
const alertVariants = cva(
  "relative flex w-full gap-3 rounded-md border bg-card p-4 text-left text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-border text-card-foreground [&>svg]:text-muted-foreground",
        destructive: "border-destructive/50 text-foreground [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("font-semibold", className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("mt-1 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-3 right-3", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
```

- [ ] **Step 7: Reescrever `components/ui/skeleton.tsx`**

```tsx
import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-secondary", className)} // [DEC-11] o pulse para com reduced-motion [CSS-15]
      {...props}
    />
  )
}

export { Skeleton }
```

- [ ] **Step 8: Rodar testes, lint e build**

Run: `npx vitest run __tests__/components/ui.test.tsx` → PASS (5 testes)
Run: `npm run test:run && npm run lint && npm run build` → tudo passa.

- [ ] **Step 9: Commit**

```bash
git add components/ui/select.tsx components/ui/card.tsx components/ui/table.tsx components/ui/alert.tsx components/ui/skeleton.tsx __tests__/components/ui.test.tsx
git commit -m "feat(ui): select, cartão, tabela, alerta e esqueleto no visual da Tropa

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Dados na tela — BadgeGravidade, BadgeStatus, TabelaOcorrencias, BarraStatus, CabecalhoPagina

**Files:**
- Modify (reescrever inteiro): `components/BadgeGravidade.tsx`, `components/BadgeStatus.tsx`, `components/TabelaOcorrencias.tsx`
- Create: `components/BarraStatus.tsx`, `components/CabecalhoPagina.tsx`
- Modify: `__tests__/components/compartilhados.test.tsx` (uma asserção)
- Create: `__tests__/components/dados.test.tsx`

**Interfaces:**
- Consumes: `IconeStatus` (Tarefa 3); `Table*` (Tarefa 5); `rotuloGravidade`, `rotuloStatus`, `STATUS_OCORRENCIA`, `Gravidade`, `StatusOcorrencia`, `Ocorrencia` de `@/lib/schemas/ocorrencia`.
- Produces:
  - `BadgeGravidade({ gravidade }: { gravidade: Gravidade })` (sem mudança de props)
  - `BadgeStatus({ status }: { status: StatusOcorrencia })` (sem mudança de props)
  - `TabelaOcorrencias({ ocorrencias, nomeSetor, nomeLanterna })` (sem mudança de props; não tem mais `mt-6`: o espaço vem da página)
  - `BarraStatus({ ocorrencias }: { ocorrencias: Pick<Ocorrencia, 'id' | 'status'>[] })`
  - `CabecalhoPagina({ titulo, descricao, children }: { titulo: string; descricao?: string; children?: React.ReactNode })`

- [ ] **Step 1: Escrever os testes que falham**

`__tests__/components/dados.test.tsx`:

```tsx
import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BadgeGravidade } from '@/components/BadgeGravidade'
import { BadgeStatus } from '@/components/BadgeStatus'
import { BarraStatus } from '@/components/BarraStatus'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { GRAVIDADES, rotuloGravidade } from '@/lib/schemas/ocorrencia'

test('BadgeGravidade sempre mostra o texto, nunca só a cor (CSS-12)', () => {
  for (const gravidade of GRAVIDADES) {
    const { unmount } = render(<BadgeGravidade gravidade={gravidade} />)
    expect(screen.getByText(rotuloGravidade[gravidade])).toBeDefined()
    unmount()
  }
})

test('BadgeStatus mostra o rótulo e o ícone é decorativo', () => {
  const { container } = render(<BadgeStatus status="em_andamento" />)
  expect(screen.getByText('Em andamento')).toBeDefined()
  expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
})

test('BarraStatus acende um segmento por ocorrência e a legenda filtra', () => {
  const ocorrencias = [
    { id: 'a', status: 'aberta' as const },
    { id: 'b', status: 'aberta' as const },
    { id: 'c', status: 'resolvida' as const },
  ]
  const { container } = render(<BarraStatus ocorrencias={ocorrencias} />)
  expect(container.querySelectorAll('[data-status]')).toHaveLength(3)
  expect(screen.getByRole('link', { name: /2\s*abertas/ }).getAttribute('href')).toBe('/painel/ocorrencias?status=aberta')
  expect(screen.getByRole('link', { name: /0\s*em andamento/ }).getAttribute('href')).toBe('/painel/ocorrencias?status=em_andamento')
  expect(screen.getByRole('link', { name: /1\s*resolvidas/ }).getAttribute('href')).toBe('/painel/ocorrencias?status=resolvida')
})

test('BarraStatus sem ocorrências não desenha a barra e mostra zeros', () => {
  const { container } = render(<BarraStatus ocorrencias={[]} />)
  expect(container.querySelectorAll('[data-status]')).toHaveLength(0)
  expect(screen.getByRole('link', { name: /0\s*abertas/ })).toBeDefined()
})

test('CabecalhoPagina tem um único h1, descrição e ação', () => {
  render(
    <CabecalhoPagina titulo="Ocorrências" descricao="Todas as ocorrências da Tropa.">
      <a href="/painel/ocorrencias/nova">Registrar ocorrência</a>
    </CabecalhoPagina>,
  )
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  expect(screen.getByRole('heading', { level: 1, name: 'Ocorrências' })).toBeDefined()
  expect(screen.getByText('Todas as ocorrências da Tropa.')).toBeDefined()
  expect(screen.getByRole('link', { name: 'Registrar ocorrência' })).toBeDefined()
})
```

Em `__tests__/components/compartilhados.test.tsx`, no teste `'TabelaOcorrencias mostra nomes e "—" sem responsável'`, troque o nome do teste e a asserção do traço:

```tsx
test('TabelaOcorrencias mostra nomes e "Sem responsável"', () => {
```

e

```tsx
  expect(screen.getByText('Sem responsável')).toBeDefined()
```

(no lugar de `expect(screen.getByText('—')).toBeDefined()`). As outras linhas do teste ficam iguais.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run __tests__/components/dados.test.tsx __tests__/components/compartilhados.test.tsx`
Expected: FAIL (componentes novos não existem; tabela ainda mostra "—").

- [ ] **Step 3: Reescrever `components/BadgeGravidade.tsx`**

```tsx
import { rotuloGravidade, type Gravidade } from '@/lib/schemas/ocorrencia'
import { cn } from '@/lib/utils'

// [CSS-12] classe inteira por valor: o Tailwind só gera a classe que encontra escrita por completo
const corPorGravidade = {
  baixa: 'bg-gravidade-baixa',
  media: 'bg-gravidade-media',
  alta: 'bg-gravidade-alta',
  critica: 'bg-gravidade-critica',
} as const

/** Gravidade no espectro emocional da Tropa: losango colorido + texto (nunca só a cor). */
export function BadgeGravidade({ gravidade }: { gravidade: Gravidade }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap">
      <span aria-hidden="true" className={cn('size-2.5 shrink-0 rotate-45 rounded-xs', corPorGravidade[gravidade])} />
      {rotuloGravidade[gravidade]}
    </span>
  )
}
```

- [ ] **Step 4: Reescrever `components/BadgeStatus.tsx`**

```tsx
import { IconeStatus } from '@/components/IconeStatus'
import { rotuloStatus, type StatusOcorrencia } from '@/lib/schemas/ocorrencia'
import { cn } from '@/lib/utils'

/** Status da ocorrência: ícone de carga + texto. Resolvida ganha o verde da Tropa. */
export function BadgeStatus({ status }: { status: StatusOcorrencia }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm whitespace-nowrap', status === 'resolvida' ? 'text-primary-texto' : 'text-muted-foreground')}> {/* [CSS-02] */}
      <IconeStatus status={status} />
      {rotuloStatus[status]}
    </span>
  )
}
```

- [ ] **Step 5: Reescrever `components/TabelaOcorrencias.tsx`**

```tsx
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BadgeGravidade } from '@/components/BadgeGravidade'
import { BadgeStatus } from '@/components/BadgeStatus'
import type { Ocorrencia } from '@/lib/schemas/ocorrencia'

type TabelaOcorrenciasProps = {
  ocorrencias: Ocorrencia[]
  nomeSetor: Record<string, string>
  nomeLanterna: Record<string, string>
}

/** Tabela de ocorrências usada no resumo e na lista do painel. */
export function TabelaOcorrencias({ ocorrencias, nomeSetor, nomeLanterna }: TabelaOcorrenciasProps) { // [COMP-03]
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ocorrência</TableHead>
          <TableHead>Setor</TableHead>
          <TableHead>Gravidade</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Responsável</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ocorrencias.map((o) => (
          <TableRow key={o.id}> {/* [COMP-13] */}
            <TableCell className="min-w-56">
              <Link href={`/painel/ocorrencias/${o.id}`} className="font-semibold text-foreground underline-offset-4 hover:underline"> {/* [ROTA-16] */}
                {o.titulo}
              </Link>
              <span className="block text-sm text-muted-foreground">{o.planeta}</span>
            </TableCell>
            <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">{nomeSetor[o.setorId] ?? o.setorId}</TableCell> {/* [CSS-13] */}
            <TableCell><BadgeGravidade gravidade={o.gravidade} /></TableCell>
            <TableCell><BadgeStatus status={o.status} /></TableCell>
            <TableCell className="whitespace-nowrap">
              {(o.responsavelId && nomeLanterna[o.responsavelId]) || <span className="text-texto-terciario">Sem responsável</span>}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

- [ ] **Step 6: Criar `components/BarraStatus.tsx`**

```tsx
import Link from 'next/link'
import { STATUS_OCORRENCIA, type Ocorrencia } from '@/lib/schemas/ocorrencia'
import { cn } from '@/lib/utils'

// Mesma metáfora do IconeStatus: vazio, meio carregado, cheio. [CSS-12]
const corPorStatus = {
  aberta: 'bg-texto-terciario',
  em_andamento: 'bg-primary/50',
  resolvida: 'bg-primary',
} as const

const rotuloPlural = {
  aberta: 'abertas',
  em_andamento: 'em andamento',
  resolvida: 'resolvidas',
} as const

type BarraStatusProps = { ocorrencias: Pick<Ocorrencia, 'id' | 'status'>[] }

/** Resumo do painel: cada ocorrência acende um segmento da barra; a legenda leva à lista filtrada. */
export function BarraStatus({ ocorrencias }: BarraStatusProps) {
  const porStatus = STATUS_OCORRENCIA.map((status) => ({
    status,
    itens: ocorrencias.filter((o) => o.status === status), // [JS-09]
  }))

  return (
    <div className="grid gap-3">
      {ocorrencias.length > 0 && ( // [COMP-14]
        // [CSS-02] um segmento flex-1 por ocorrência: a proporção sai sem style inline
        <div aria-hidden="true" className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-border">
          {porStatus.flatMap(({ itens }) => itens).map((o) => (
            <span key={o.id} data-status={o.status} className={cn('flex-1', corPorStatus[o.status])} /> // [COMP-13]
          ))}
        </div>
      )}
      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {porStatus.map(({ status, itens }) => (
          <li key={status}>
            <Link href={`/painel/ocorrencias?status=${status}`} className="group flex items-baseline gap-2 text-muted-foreground"> {/* [ROTA-14] */}
              <strong className="text-xl font-semibold text-foreground">{itens.length}</strong>
              <span className="underline-offset-4 group-hover:text-foreground group-hover:underline">{rotuloPlural[status]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 7: Criar `components/CabecalhoPagina.tsx`**

```tsx
type CabecalhoPaginaProps = {
  titulo: string
  descricao?: string
  /** Ação principal da página (link ou botão), alinhada à direita no desktop. */
  children?: React.ReactNode
}

/** Abertura padrão de toda página: um único h1, descrição opcional e ação opcional. [CSS-07][COMP-03] */
export function CabecalhoPagina({ titulo, descricao, children }: CabecalhoPaginaProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-2">
        <h1 className="font-heading text-4xl leading-none font-bold">{titulo}</h1> {/* [CSS-13] */}
        {descricao && <p className="max-w-prose text-muted-foreground">{descricao}</p>}
      </div>
      {children}
    </header>
  )
}
```

- [ ] **Step 8: Rodar testes, lint e build**

Run: `npx vitest run __tests__/components/dados.test.tsx __tests__/components/compartilhados.test.tsx` → PASS
Run: `npm run test:run && npm run lint && npm run build` → tudo passa.

- [ ] **Step 9: Commit**

```bash
git add components/BadgeGravidade.tsx components/BadgeStatus.tsx components/TabelaOcorrencias.tsx components/BarraStatus.tsx components/CabecalhoPagina.tsx __tests__/components/dados.test.tsx __tests__/components/compartilhados.test.tsx
git commit -m "feat: gravidade no espectro emocional, status com carga, barra do resumo e cabeçalho de página

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Formulários e estados — MensagemErro, campos, vazio, erro, esqueleto

**Files:**
- Create: `components/MensagemErro.tsx`
- Modify (reescrever inteiro): `components/CampoTexto.tsx`, `components/CampoSelect.tsx`, `components/EstadoVazio.tsx`, `components/TelaDeErro.tsx`, `components/EsqueletoLista.tsx`
- Modify: `app/(site)/login/_components/FormLogin.tsx`, `app/(painel)/painel/ocorrencias/_components/FormOcorrencia.tsx`, `app/(painel)/painel/ocorrencias/_components/FormStatus.tsx`, `app/(painel)/painel/ocorrencias/_components/FormAtribuir.tsx`
- Modify: `__tests__/components/compartilhados.test.tsx` (acrescentar teste)

**Interfaces:**
- Consumes: `Input`, `Textarea`, `Label`, `Select*`, `Button`, `buttonVariants`, `Skeleton` (Tarefas 4 e 5).
- Produces:
  - `MensagemErro({ id, children }: { id?: string; children: React.ReactNode })` — `<p role="alert">` com ícone.
  - `CampoTexto`, `CampoSelect`, `EstadoVazio`, `TelaDeErro`, `EsqueletoLista`: props iguais às de hoje. `EstadoVazio` e `EsqueletoLista` não têm mais `mt-6` (o espaço vem da página).

- [ ] **Step 1: Escrever o teste que falha**

No fim de `__tests__/components/compartilhados.test.tsx`, acrescente o import `import { MensagemErro } from '@/components/MensagemErro'` no topo e este teste no fim:

```tsx
test('MensagemErro é um alerta com texto e ícone decorativo', () => {
  const { container } = render(<MensagemErro id="email-erro">Informe um e-mail válido.</MensagemErro>)
  const alerta = screen.getByRole('alert')
  expect(alerta.id).toBe('email-erro')
  expect(alerta.textContent).toBe('Informe um e-mail válido.')
  expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run __tests__/components/compartilhados.test.tsx`
Expected: FAIL ("Failed to resolve import @/components/MensagemErro").

- [ ] **Step 3: Criar `components/MensagemErro.tsx`**

```tsx
import { CircleAlertIcon } from 'lucide-react'

type MensagemErroProps = {
  id?: string
  children: React.ReactNode
}

/** Erro de formulário: texto + ícone (nunca só a cor), anunciado pelo leitor de tela. [FORM-10][CSS-10] */
export function MensagemErro({ id, children }: MensagemErroProps) {
  return (
    <p id={id} role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
      <CircleAlertIcon aria-hidden className="size-4 shrink-0" />
      {children}
    </p>
  )
}
```

- [ ] **Step 4: Reescrever `components/CampoTexto.tsx`**

```tsx
import type { UseFormRegisterReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MensagemErro } from '@/components/MensagemErro'

type CampoTextoProps = {
  id: string
  rotulo: string
  registro: UseFormRegisterReturn
  erro?: string
  type?: string
  autoComplete?: string
  inputMode?: 'text' | 'numeric' | 'email'
  multilinha?: boolean
}

/** Campo de texto com label, mensagem de erro acessível e integração com o React Hook Form. */
export function CampoTexto({ id, rotulo, registro, erro, type = 'text', autoComplete, inputMode, multilinha = false }: CampoTextoProps) { // [FORM-22]
  const idErro = `${id}-erro`
  const acessibilidade = {
    'aria-invalid': erro ? true : undefined, // [FORM-10]
    'aria-describedby': erro ? idErro : undefined,
  }
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{rotulo}</Label> {/* [FORM-09] */}
      {multilinha ? (
        <Textarea id={id} rows={4} {...registro} {...acessibilidade} />
      ) : (
        <Input id={id} type={type} autoComplete={autoComplete} inputMode={inputMode} {...registro} {...acessibilidade} />
      )}
      {erro && <MensagemErro id={idErro}>{erro}</MensagemErro>}
    </div>
  )
}
```

- [ ] **Step 5: Reescrever `components/CampoSelect.tsx`**

```tsx
'use client'

import type { Ref } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MensagemErro } from '@/components/MensagemErro'

type CampoSelectProps = {
  id: string
  rotulo: string
  itens: Record<string, string>
  valor: string | null | undefined
  aoMudar: (valor: string | null) => void
  aoSair?: () => void
  refCampo?: Ref<HTMLButtonElement>
  erro?: string
  placeholder?: string
}

/** Select controlado com label e erro acessível. */
export function CampoSelect({ id, rotulo, itens, valor, aoMudar, aoSair, refCampo, erro, placeholder = 'Escolha uma opção' }: CampoSelectProps) {
  const idErro = `${id}-erro`
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      <Select items={itens} value={valor || null} onValueChange={(novo) => aoMudar(novo)}> {/* [FORM-16] */}
        <SelectTrigger
          id={id}
          ref={refCampo}
          onBlur={aoSair}
          aria-invalid={erro ? true : undefined} // [FORM-10]
          aria-describedby={erro ? idErro : undefined}
          className="w-full"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(itens).map(([valorItem, rotuloItem]) => (
            <SelectItem key={valorItem} value={valorItem}>{rotuloItem}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {erro && <MensagemErro id={idErro}>{erro}</MensagemErro>}
    </div>
  )
}
```

- [ ] **Step 6: Reescrever `components/EstadoVazio.tsx`**

```tsx
import Link from 'next/link'
import { InboxIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

type EstadoVazioProps = {
  titulo: string
  descricao: string
  acao?: { href: string; rotulo: string }
}

/** Estado "deu certo, mas não há dados": explica e oferece uma saída. */
export function EstadoVazio({ titulo, descricao, acao }: EstadoVazioProps) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-10 text-center"> {/* [API-09] */}
      <InboxIcon aria-hidden className="size-6 text-texto-terciario" />
      <div className="grid gap-1">
        <p className="font-semibold">{titulo}</p>
        <p className="max-w-prose text-sm text-muted-foreground">{descricao}</p>
      </div>
      {acao && (
        <Link href={acao.href} className={buttonVariants({ variant: 'outline' })}>
          {acao.rotulo}
        </Link>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Reescrever `components/TelaDeErro.tsx`**

```tsx
'use client'

import { useEffect } from 'react'
import { CircleAlertIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type TelaDeErroProps = {
  error: Error & { digest?: string }
  retry: () => void
}

/** Conteúdo dos error.tsx: mensagem para humanos e "Tentar de novo". O detalhe vai só para o console. */
export function TelaDeErro({ error, retry }: TelaDeErroProps) {
  useEffect(() => {
    console.error(error) // [API-13]
  }, [error])

  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-destructive/50 bg-card px-6 py-10 text-center">
      <CircleAlertIcon aria-hidden className="size-6 text-destructive" />
      <div className="grid gap-1">
        <p className="font-semibold">Não foi possível falar com a Central de Oa.</p>
        <p className="max-w-prose text-sm text-muted-foreground">Verifique sua conexão (ou se a API está ligada) e tente de novo.</p>
      </div>
      <Button type="button" onClick={() => retry()}> {/* [API-11] */}
        Tentar de novo
      </Button>
    </div>
  )
}
```

- [ ] **Step 8: Reescrever `components/EsqueletoLista.tsx`**

```tsx
import { Skeleton } from '@/components/ui/skeleton'

/** Formato da página enquanto os dados chegam: título e linhas de tabela, nunca a tela em branco. */
export function EsqueletoLista({ linhas = 6 }: { linhas?: number }) { // [API-10]
  const ids = Array.from({ length: linhas }, (_, i) => `linha-${i + 1}`) // lista fixa: o id nunca muda de posição
  return (
    <div aria-busy="true" aria-label="Carregando" className="grid gap-6">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-2">
        <Skeleton className="h-5 w-full" />
        {ids.map((id) => (
          <Skeleton key={id} className="h-12 w-full" /> // [COMP-13]
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 9: Usar `MensagemErro` no erro geral dos quatro formulários**

Em cada um dos quatro arquivos abaixo:
1. acrescente o import `import { MensagemErro } from '@/components/MensagemErro'` junto dos outros imports de `@/components/`;
2. troque a linha do erro geral (ou o bloco de 3 linhas no `FormLogin`) por `{errors.root && <MensagemErro>{errors.root.message}</MensagemErro>}`;
3. troque a `className` do `<form>` conforme indicado (os marcadores `{/* [FORM-06][FORM-07] */}` continuam na mesma linha).

`app/(site)/login/_components/FormLogin.tsx`:
- `<form ... className="mt-6 grid gap-4">` → `<form ... className="grid gap-5">`
- bloco
  ```tsx
      {errors.root && (
        <p role="alert" className="text-sm text-destructive">{errors.root.message}</p>
      )}
  ```
  vira `      {errors.root && <MensagemErro>{errors.root.message}</MensagemErro>}`
- o `<Button type="submit" ...>` fica como está (no grid ele ocupa a largura toda, que é o desejado no login).

`app/(painel)/painel/ocorrencias/_components/FormOcorrencia.tsx`:
- `className="mt-6 grid gap-4"` → `className="grid gap-5"`
- `{errors.root && <p role="alert" className="text-sm text-destructive">{errors.root.message}</p>}` → `{errors.root && <MensagemErro>{errors.root.message}</MensagemErro>}`
- `<Button type="submit" disabled={isSubmitting}>` → `<Button type="submit" disabled={isSubmitting} className="sm:justify-self-end">`

`app/(painel)/painel/ocorrencias/_components/FormAtribuir.tsx`: as mesmas três trocas do `FormOcorrencia`.

`app/(painel)/painel/ocorrencias/_components/FormStatus.tsx`:
- `className="mt-8 grid gap-4 rounded-xl border p-4"` → `className="grid gap-5 rounded-lg border border-border bg-card p-5"`
- `<h2 className="font-semibold">Atualizar status</h2>` → `<h2 className="font-heading text-2xl font-semibold">Atualizar status</h2>`
- a linha do erro geral → `{errors.root && <MensagemErro>{errors.root.message}</MensagemErro>}`
- `<p role="status" className="text-sm text-primary">Status atualizado.</p>` → `<p role="status" className="text-sm text-primary-texto">Status atualizado.</p>`
- `<Button type="submit" disabled={isSubmitting}>` → `<Button type="submit" disabled={isSubmitting} className="sm:justify-self-end">`

- [ ] **Step 10: Rodar testes, lint e build**

Run: `npm run test:run && npm run lint && npm run build` → tudo passa (os testes de formulário em `__tests__/components/form-*.test.tsx` continuam passando: o texto e o `role="alert"` são os mesmos).

- [ ] **Step 11: Commit**

```bash
git add components/MensagemErro.tsx components/CampoTexto.tsx components/CampoSelect.tsx components/EstadoVazio.tsx components/TelaDeErro.tsx components/EsqueletoLista.tsx "app/(site)/login/_components/FormLogin.tsx" "app/(painel)/painel/ocorrencias/_components/FormOcorrencia.tsx" "app/(painel)/painel/ocorrencias/_components/FormStatus.tsx" "app/(painel)/painel/ocorrencias/_components/FormAtribuir.tsx" __tests__/components/compartilhados.test.tsx
git commit -m "feat: mensagem de erro única, campos e estados vazio/erro/carregando no visual da Tropa

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Navegação e cascas — MenuNavegacao, LinkVoltar, PaginaAviso, Juramento e layouts

**Files:**
- Modify (reescrever inteiro): `components/MenuNavegacao.tsx`, `app/(site)/layout.tsx`, `app/(painel)/layout.tsx`, `app/not-found.tsx`
- Create: `components/LinkVoltar.tsx`, `components/PaginaAviso.tsx`, `components/Juramento.tsx`
- Create: `__tests__/components/navegacao.test.tsx`

**Interfaces:**
- Consumes: `Marca`, `Emblema` (Tarefa 3); `Button`, `buttonVariants` (Tarefa 4).
- Produces:
  - `type LinkMenu = { href: string; rotulo: string; icone?: React.ReactNode }` e `MenuNavegacao({ links, orientacao })` (props iguais + `icone` opcional). O ícone vai como elemento (`<HouseIcon aria-hidden />`), não como componente, porque o layout é Server Component e o menu é Client Component: funções não atravessam essa fronteira, elementos sim.
  - `LinkVoltar({ href, children }: { href: string; children: React.ReactNode })`
  - `PaginaAviso({ titulo, descricao, acao }: { titulo: string; descricao: string; acao: { href: string; rotulo: string } })`
  - `Juramento()` — sem props.

- [ ] **Step 1: Escrever os testes que falham**

`__tests__/components/navegacao.test.tsx`:

```tsx
import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HouseIcon } from 'lucide-react'
import { MenuNavegacao } from '@/components/MenuNavegacao'
import { LinkVoltar } from '@/components/LinkVoltar'
import { PaginaAviso } from '@/components/PaginaAviso'
import { Juramento } from '@/components/Juramento'

vi.mock('next/navigation', () => ({ usePathname: () => '/' }))

test('MenuNavegacao mostra o ícone sem mudar o nome acessível do link', () => {
  render(<MenuNavegacao links={[{ href: '/', rotulo: 'Início', icone: <HouseIcon aria-hidden /> }]} />)
  const link = screen.getByRole('link', { name: 'Início' })
  expect(link.getAttribute('aria-current')).toBe('page')
  expect(link.querySelector('svg')).not.toBeNull()
})

test('LinkVoltar aponta para onde foi pedido', () => {
  render(<LinkVoltar href="/painel/ocorrencias">Voltar à lista</LinkVoltar>)
  expect(screen.getByRole('link', { name: 'Voltar à lista' }).getAttribute('href')).toBe('/painel/ocorrencias')
})

test('PaginaAviso tem um h1, explica e oferece uma saída', () => {
  render(<PaginaAviso titulo="Setor desconhecido" descricao="Este endereço não existe." acao={{ href: '/', rotulo: 'Voltar ao início' }} />)
  expect(screen.getByRole('heading', { level: 1, name: 'Setor desconhecido' })).toBeDefined()
  expect(screen.getByRole('link', { name: 'Voltar ao início' }).getAttribute('href')).toBe('/')
})

test('Juramento cita o primeiro verso numa citação', () => {
  render(<Juramento />)
  expect(screen.getByText(/No dia mais claro, na noite mais densa/).closest('blockquote')).not.toBeNull()
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run __tests__/components/navegacao.test.tsx`
Expected: FAIL (componentes novos não existem).

- [ ] **Step 3: Reescrever `components/MenuNavegacao.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useId, useState } from 'react'
import { MenuIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** `icone` é um elemento (ex.: <HouseIcon aria-hidden />): o layout é Server Component e não pode passar função para cá. */
export type LinkMenu = { href: string; rotulo: string; icone?: React.ReactNode }

type MenuNavegacaoProps = {
  links: LinkMenu[]
  orientacao?: 'horizontal' | 'vertical'
}

/** Menu com o link da página atual marcado e botão de abrir/fechar no celular. */
export function MenuNavegacao({ links, orientacao = 'horizontal' }: MenuNavegacaoProps) {
  const atual = usePathname() // [ROTA-13]
  const [aberto, setAberto] = useState(false) // [COMP-09] só este componente precisa saber se o menu está aberto
  const idLista = useId()

  return (
    <nav aria-label="Navegação principal">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-expanded={aberto}
        aria-controls={idLista}
        onClick={() => setAberto((estava) => !estava)} // [COMP-10]
      >
        {aberto ? <XIcon aria-hidden /> : <MenuIcon aria-hidden />}
        <span className="sr-only">{aberto ? 'Fechar menu' : 'Abrir menu'}</span>
      </Button>
      <ul
        id={idLista}
        className={cn(
          aberto ? 'flex' : 'hidden',
          'mt-2 flex-col gap-1 md:mt-0 md:flex',
          orientacao === 'horizontal' && 'md:flex-row md:items-center',
        )}
      >
        {links.map((link) => (
          <li key={link.href}> {/* [COMP-13] */}
            <Link
              href={link.href} // [ROTA-16]
              aria-current={atual === link.href ? 'page' : undefined} // [ROTA-17]
              onClick={() => setAberto(false)}
              // [CSS-08][CSS-15] página atual: fundo de superfície + contorno, sem listra lateral
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-out hover:bg-secondary hover:text-foreground aria-[current=page]:bg-card aria-[current=page]:text-foreground aria-[current=page]:ring-1 aria-[current=page]:ring-border [&_svg]:size-4.5 [&_svg]:shrink-0 [&_svg]:text-texto-terciario aria-[current=page]:[&_svg]:text-primary-texto"
            >
              {link.icone}
              {link.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
```

- [ ] **Step 4: Criar `components/LinkVoltar.tsx`**

```tsx
import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'

type LinkVoltarProps = {
  href: string
  children: React.ReactNode
}

/** "Voltar" das telas de detalhe e de formulário. [CSS-10][ROTA-16] */
export function LinkVoltar({ href, children }: LinkVoltarProps) {
  return (
    <Link href={href} className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground">
      <ArrowLeftIcon aria-hidden className="size-4" />
      {children}
    </Link>
  )
}
```

- [ ] **Step 5: Criar `components/PaginaAviso.tsx`**

```tsx
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Emblema } from '@/components/Emblema'

type PaginaAvisoProps = {
  titulo: string
  descricao: string
  acao: { href: string; rotulo: string }
}

/** Páginas de aviso (404, 403): emblema apagado, título, explicação e uma saída. [CSS-10] */
export function PaginaAviso({ titulo, descricao, acao }: PaginaAvisoProps) {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center gap-4 py-12 text-center">
      <Emblema className="size-12 text-texto-terciario" />
      <h1 className="font-heading text-4xl leading-none font-bold">{titulo}</h1> {/* [CSS-07][CSS-13] */}
      <p className="text-muted-foreground">{descricao}</p>
      <Link href={acao.href} className={buttonVariants({ className: 'mt-2' })}>{acao.rotulo}</Link> {/* [ROTA-16] */}
    </section>
  )
}
```

- [ ] **Step 6: Criar `components/Juramento.tsx`**

```tsx
const VERSOS = [
  'No dia mais claro, na noite mais densa,',
  'o mal sucumbirá diante da minha presença.',
  'Todo aquele que venera o mal há de penar',
  'quando o poder do Lanterna Verde enfrentar!',
]

/** O juramento da Tropa, um verso por linha. Usado na home e no Sobre. [CSS-10] */
export function Juramento() {
  return (
    <figure className="grid gap-3">
      <blockquote className="font-heading text-2xl leading-tight font-semibold md:text-3xl"> {/* [CSS-13] */}
        {VERSOS.map((verso) => (
          <span key={verso} className="block">{verso} </span> // [COMP-13] cada verso é único e serve de key
        ))}
      </blockquote>
      <figcaption className="text-sm text-muted-foreground">Juramento da Tropa dos Lanternas Verdes</figcaption>
    </figure>
  )
}
```

- [ ] **Step 7: Reescrever `app/(site)/layout.tsx`**

```tsx
import Link from 'next/link'
import { BookOpenIcon, HouseIcon, LayoutDashboardIcon, UsersIcon } from 'lucide-react'
import { Marca } from '@/components/Marca'
import { MenuNavegacao, type LinkMenu } from '@/components/MenuNavegacao'

const LINKS_SITE: LinkMenu[] = [
  { href: '/', rotulo: 'Início', icone: <HouseIcon aria-hidden /> },
  { href: '/lanternas', rotulo: 'Lanternas', icone: <UsersIcon aria-hidden /> },
  { href: '/sobre', rotulo: 'Sobre', icone: <BookOpenIcon aria-hidden /> },
  { href: '/painel', rotulo: 'Central de Comando', icone: <LayoutDashboardIcon aria-hidden /> },
]

/** Casca da área pública: header e rodapé ficam montados entre as páginas. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-sidebar-border bg-sidebar"> {/* [ROTA-06] */}
        <div className="mx-auto flex w-full max-w-6xl items-start justify-between gap-4 p-4 md:items-center"> {/* [CSS-05] */}
          <Marca href="/" />
          <MenuNavegacao links={LINKS_SITE} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 p-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:p-8">
          <p className="font-heading text-lg font-semibold text-foreground">No dia mais claro, na noite mais densa.</p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link href="/design-system" className="underline-offset-4 hover:text-foreground hover:underline">Design system</Link> {/* [DEC-12] */}
            <span>Tropa dos Lanternas Verdes · trabalho acadêmico de Desenvolvimento Web</span>
          </p>
        </div>
      </footer>
    </>
  )
}
```

- [ ] **Step 8: Reescrever `app/(painel)/layout.tsx`**

```tsx
import { CirclePlusIcon, LayoutDashboardIcon, ListIcon, LogOutIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Marca } from '@/components/Marca'
import { MenuNavegacao, type LinkMenu } from '@/components/MenuNavegacao'
import { lerSessao } from '@/lib/dal'
import { sair } from '@/app/(painel)/actions'

const LINKS_PAINEL: LinkMenu[] = [
  { href: '/painel', rotulo: 'Resumo', icone: <LayoutDashboardIcon aria-hidden /> },
  { href: '/painel/ocorrencias', rotulo: 'Ocorrências', icone: <ListIcon aria-hidden /> },
  { href: '/painel/ocorrencias/nova', rotulo: 'Registrar ocorrência', icone: <CirclePlusIcon aria-hidden /> },
]

/** Casca da Central de Comando. Lê a sessão só para mostrar o nome: a proteção fica nas páginas. */
export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const sessao = await lerSessao() // [AUTH-10]
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="flex flex-col gap-5 border-b border-sidebar-border bg-sidebar p-4 md:sticky md:top-0 md:h-dvh md:w-56 md:shrink-0 md:border-r md:border-b-0">
        <Marca href="/" />
        {sessao && (
          <p className="grid gap-0.5 rounded-md border border-border bg-card p-3 text-sm">
            <span className="font-semibold">{sessao.nome}</span>
            <span className="text-muted-foreground">
              {sessao.papel === 'guardiao' ? 'Guardião · todos os setores' : `Lanterna · Setor ${sessao.setorId}`}
            </span>
          </p>
        )}
        <MenuNavegacao links={LINKS_PAINEL} orientacao="vertical" />
        <form action={sair} className="md:mt-auto"> {/* [AUTH-09] funciona sem JavaScript */}
          <Button type="submit" variant="ghost" className="w-full justify-start">
            <LogOutIcon aria-hidden />
            Sair
          </Button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 9: Reescrever `app/not-found.tsx`**

```tsx
import { PaginaAviso } from '@/components/PaginaAviso'

/** 404 global: nenhuma rota casou com a URL. */
export default function NaoEncontrada() {
  return (
    <main className="flex-1 p-4 md:p-8"> {/* [ROTA-22] */}
      <PaginaAviso
        titulo="Setor desconhecido"
        descricao="Este endereço não existe em nenhum dos 3600 setores."
        acao={{ href: '/', rotulo: 'Voltar ao início' }}
      />
    </main>
  )
}
```

- [ ] **Step 10: Rodar testes, lint e build**

Run: `npx vitest run __tests__/components/navegacao.test.tsx` → PASS (4 testes)
Run: `npm run test:run && npm run lint && npm run build` → tudo passa.

- [ ] **Step 11: Commit**

```bash
git add components/MenuNavegacao.tsx components/LinkVoltar.tsx components/PaginaAviso.tsx components/Juramento.tsx "app/(site)/layout.tsx" "app/(painel)/layout.tsx" app/not-found.tsx __tests__/components/navegacao.test.tsx
git commit -m "feat: menu com ícones, cascas pública e do painel, avisos e juramento

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Telas do painel

**Files:**
- Modify (reescrever inteiro): `app/(painel)/painel/page.tsx`, `app/(painel)/painel/ocorrencias/page.tsx`, `app/(painel)/painel/ocorrencias/[id]/page.tsx`, `app/(painel)/painel/ocorrencias/nova/page.tsx`, `app/(painel)/painel/ocorrencias/[id]/atribuir/page.tsx`, `app/(painel)/painel/ocorrencias/[id]/not-found.tsx`
- Modify: `app/(painel)/painel/ocorrencias/_components/FiltroOcorrencias.tsx` (só classes do contêiner)

**Interfaces:**
- Consumes: `CabecalhoPagina`, `BarraStatus`, `TabelaOcorrencias`, `BadgeGravidade`, `BadgeStatus` (Tarefa 6); `EstadoVazio` (Tarefa 7); `LinkVoltar`, `PaginaAviso` (Tarefa 8); `buttonVariants` (Tarefa 4).
- Lógica de dados, sessão e acesso: copiar exatamente como está hoje (os blocos estão repetidos abaixo).

- [ ] **Step 1: Reescrever `app/(painel)/painel/page.tsx` (Resumo)**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { PlusIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { BarraStatus } from '@/components/BarraStatus'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { EstadoVazio } from '@/components/EstadoVazio'
import { TabelaOcorrencias } from '@/components/TabelaOcorrencias'
import { verificarSessao } from '@/lib/dal'
import { listarLanternas } from '@/lib/lanternas'
import { listarOcorrencias } from '@/lib/ocorrencias'
import { setorParaFiltro } from '@/lib/sessao'
import { listarSetores } from '@/lib/setores'

export const metadata: Metadata = { title: 'Resumo | Central de Comando' }

/** Resumo: barra de status e as 5 ocorrências mais recentes (do setor, para o Lanterna). */
export default async function PainelPage() {
  const sessao = await verificarSessao() // [AUTH-04]
  const [ocorrencias, setores, lanternas] = await Promise.all([ // [API-07]
    listarOcorrencias({ setorId: setorParaFiltro(sessao) }), // [AUTH-07]
    listarSetores(),
    listarLanternas(),
  ])

  return (
    <section className="grid gap-8">
      <CabecalhoPagina
        titulo={`Bem-vindo, ${sessao.nome}`}
        descricao={sessao.papel === 'guardiao' ? 'Visão de todos os setores.' : `Ocorrências do Setor ${sessao.setorId}.`}
      >
        <Link href="/painel/ocorrencias/nova" className={buttonVariants()}> {/* [ROTA-16] */}
          <PlusIcon aria-hidden />
          Registrar ocorrência
        </Link>
      </CabecalhoPagina>
      <BarraStatus ocorrencias={ocorrencias} />
      <section aria-labelledby="mais-recentes" className="grid gap-3">
        <h2 id="mais-recentes" className="font-heading text-2xl font-semibold">Mais recentes</h2> {/* [CSS-07] */}
        {ocorrencias.length === 0 ? ( // [API-09]
          <EstadoVazio titulo="Nenhuma ocorrência registrada" descricao="Quando algo acontecer no setor, registre aqui." acao={{ href: '/painel/ocorrencias/nova', rotulo: 'Registrar ocorrência' }} />
        ) : (
          <TabelaOcorrencias
            ocorrencias={ocorrencias.slice(0, 5)}
            nomeSetor={Object.fromEntries(setores.map((s) => [s.id, s.nome]))}
            nomeLanterna={Object.fromEntries(lanternas.map((l) => [l.id, l.nome]))}
          />
        )}
      </section>
    </section>
  )
}
```

- [ ] **Step 2: Reescrever `app/(painel)/painel/ocorrencias/page.tsx`**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { PlusIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { EstadoVazio } from '@/components/EstadoVazio'
import { TabelaOcorrencias } from '@/components/TabelaOcorrencias'
import { verificarSessao } from '@/lib/dal'
import { normalizarFiltroOcorrencias } from '@/lib/filtro-ocorrencias'
import { listarLanternas } from '@/lib/lanternas'
import { listarOcorrencias } from '@/lib/ocorrencias'
import { setorParaFiltro } from '@/lib/sessao'
import { listarSetores } from '@/lib/setores'
import { FiltroOcorrencias } from '@/app/(painel)/painel/ocorrencias/_components/FiltroOcorrencias'

export const metadata: Metadata = { title: 'Ocorrências | Central de Comando' }

type OcorrenciasPageProps = { searchParams: Promise<{ status?: string | string[]; gravidade?: string | string[]; setor?: string | string[] }> }

/** Lista de ocorrências com filtros na URL. */
export default async function OcorrenciasPage({ searchParams }: OcorrenciasPageProps) {
  const sessao = await verificarSessao() // [AUTH-04]
  const parametros = await searchParams // [ROTA-10]
  const [setores, lanternas] = await Promise.all([listarSetores(), listarLanternas()]) // [API-07]
  const filtro = normalizarFiltroOcorrencias(parametros, setores.map((s) => s.id)) // [ROTA-11]
  const ocorrencias = await listarOcorrencias({ setorId: setorParaFiltro(sessao, filtro.setor), status: filtro.status, gravidade: filtro.gravidade }) // [AUTH-07]
  const temFiltro = Boolean(filtro.status || filtro.gravidade || (sessao.papel === 'guardiao' && filtro.setor))

  return (
    <section className="grid gap-6">
      <CabecalhoPagina
        titulo="Ocorrências"
        descricao={sessao.papel === 'guardiao' ? 'Todas as ocorrências da Tropa.' : `Ocorrências do Setor ${sessao.setorId}.`}
      >
        <Link href="/painel/ocorrencias/nova" className={buttonVariants()}> {/* [ROTA-16] */}
          <PlusIcon aria-hidden />
          Registrar ocorrência
        </Link>
      </CabecalhoPagina>
      <Suspense fallback={null}> {/* [ROTA-15] */}
        <FiltroOcorrencias setores={sessao.papel === 'guardiao' ? setores : []} />
      </Suspense>
      {ocorrencias.length === 0 ? ( // [API-09]
        <EstadoVazio
          titulo="Nenhuma ocorrência encontrada"
          descricao={temFiltro ? 'Nenhuma ocorrência combina com esses filtros.' : 'Ainda não há ocorrências registradas.'}
          acao={temFiltro ? { href: '/painel/ocorrencias', rotulo: 'Limpar filtros' } : undefined}
        />
      ) : (
        <TabelaOcorrencias
          ocorrencias={ocorrencias}
          nomeSetor={Object.fromEntries(setores.map((s) => [s.id, s.nome]))}
          nomeLanterna={Object.fromEntries(lanternas.map((l) => [l.id, l.nome]))}
        />
      )}
    </section>
  )
}
```

- [ ] **Step 3: Ajustar `FiltroOcorrencias.tsx`**

Troque `<div className="mt-4 flex flex-wrap gap-4">` por `<div className="flex flex-wrap gap-3">` e as três ocorrências de `<div className="w-56">` por `<div className="w-full sm:w-56">` (CSS-03: largura total no celular). Acrescente `{/* [CSS-03] */}` na primeira delas. Nada mais muda nesse arquivo.

- [ ] **Step 4: Reescrever `app/(painel)/painel/ocorrencias/[id]/page.tsx`**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'
import { BadgeGravidade } from '@/components/BadgeGravidade'
import { BadgeStatus } from '@/components/BadgeStatus'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { LinkVoltar } from '@/components/LinkVoltar'
import { verificarSessao } from '@/lib/dal'
import { tratarErroDetalhe } from '@/lib/erro-detalhe'
import { formatarData } from '@/lib/formatar'
import { listarLanternas } from '@/lib/lanternas'
import { buscarOcorrencia } from '@/lib/ocorrencias'
import { podeAcessarSetor } from '@/lib/sessao'
import { listarSetores } from '@/lib/setores'
import { FormStatus } from '@/app/(painel)/painel/ocorrencias/_components/FormStatus'

export const metadata: Metadata = { title: 'Ocorrência | Central de Comando' }

type OcorrenciaPageProps = { params: Promise<{ id: string }> }

/** Detalhe da ocorrência com o formulário de status. */
export default async function OcorrenciaPage({ params }: OcorrenciaPageProps) {
  const sessao = await verificarSessao() // [AUTH-04]
  const { id } = await params // [ROTA-10]
  let ocorrencia, setores, lanternas
  try {
    ;[ocorrencia, setores, lanternas] = await Promise.all([buscarOcorrencia(id), listarSetores(), listarLanternas()]) // [API-07]
  } catch (erro) {
    tratarErroDetalhe(erro) // [API-12]
  }
  if (!ocorrencia) notFound() // [ROTA-12]
  if (!podeAcessarSetor(sessao, ocorrencia.setorId)) redirect('/acesso-negado') // [AUTH-07]

  const setor = setores.find((s) => s.id === ocorrencia.setorId)
  const responsavel = lanternas.find((l) => l.id === ocorrencia.responsavelId)

  return (
    <article className="grid max-w-3xl gap-8">
      <div className="grid gap-4">
        <LinkVoltar href="/painel/ocorrencias">Voltar à lista</LinkVoltar>
        <CabecalhoPagina titulo={ocorrencia.titulo}>
          {sessao.papel === 'guardiao' && ( // [COMP-14]
            <Link href={`/painel/ocorrencias/${ocorrencia.id}/atribuir`} className={buttonVariants({ variant: 'outline' })}>
              Atribuir responsável
            </Link>
          )}
        </CabecalhoPagina>
        <div className="flex flex-wrap items-center gap-4">
          <BadgeGravidade gravidade={ocorrencia.gravidade} />
          <BadgeStatus status={ocorrencia.status} />
        </div>
      </div>
      <p className="max-w-prose">{ocorrencia.descricao}</p>
      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2"> {/* [CSS-03][CSS-06] */}
        <div className="grid gap-1">
          <dt className="text-sm text-texto-terciario">Planeta</dt>
          <dd>{ocorrencia.planeta}</dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-sm text-texto-terciario">Setor</dt>
          <dd className="font-mono text-sm">{setor?.nome ?? `Setor ${ocorrencia.setorId}`}</dd> {/* [CSS-13] */}
        </div>
        <div className="grid gap-1">
          <dt className="text-sm text-texto-terciario">Seres envolvidos</dt>
          <dd className="tabular-nums">{ocorrencia.envolvidos}</dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-sm text-texto-terciario">Responsável</dt>
          <dd>{responsavel?.nome ?? <span className="text-texto-terciario">Sem responsável</span>}</dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-sm text-texto-terciario">Registrada em</dt>
          <dd>{formatarData(ocorrencia.criadaEm)}</dd>
        </div>
        {ocorrencia.resolucao && ( // [COMP-14]
          <div className="grid gap-1 sm:col-span-2">
            <dt className="text-sm text-texto-terciario">Resolução</dt>
            <dd className="max-w-prose">{ocorrencia.resolucao}</dd>
          </div>
        )}
      </dl>
      <FormStatus
        key={`${ocorrencia.status}-${ocorrencia.resolucao ?? ''}`}
        ocorrenciaId={ocorrencia.id}
        statusAtual={ocorrencia.status}
        resolucaoAtual={ocorrencia.resolucao ?? ''}
      />
    </article>
  )
}
```

- [ ] **Step 5: Reescrever `app/(painel)/painel/ocorrencias/nova/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { LinkVoltar } from '@/components/LinkVoltar'
import { verificarSessao } from '@/lib/dal'
import { listarSetores } from '@/lib/setores'
import { FormOcorrencia } from '@/app/(painel)/painel/ocorrencias/_components/FormOcorrencia'

export const metadata: Metadata = { title: 'Registrar ocorrência | Central de Comando' }

export default async function NovaOcorrenciaPage() {
  const sessao = await verificarSessao() // [AUTH-04]
  const setores = sessao.papel === 'guardiao' ? await listarSetores() : []
  return (
    <section className="grid max-w-xl gap-6">
      <LinkVoltar href="/painel/ocorrencias">Voltar à lista</LinkVoltar>
      <CabecalhoPagina
        titulo="Registrar ocorrência"
        descricao={sessao.papel === 'lanterna' ? `A ocorrência será registrada no Setor ${sessao.setorId}.` : undefined}
      />
      <FormOcorrencia setores={setores} setorFixo={sessao.papel === 'lanterna' ? sessao.setorId : null} />
    </section>
  )
}
```

- [ ] **Step 6: Reescrever `app/(painel)/painel/ocorrencias/[id]/atribuir/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { EstadoVazio } from '@/components/EstadoVazio'
import { LinkVoltar } from '@/components/LinkVoltar'
import { exigirPapel } from '@/lib/dal'
import { tratarErroDetalhe } from '@/lib/erro-detalhe'
import { listarLanternas } from '@/lib/lanternas'
import { buscarOcorrencia } from '@/lib/ocorrencias'
import { FormAtribuir } from '@/app/(painel)/painel/ocorrencias/_components/FormAtribuir'

export const metadata: Metadata = { title: 'Atribuir responsável | Central de Comando' }

type AtribuirPageProps = { params: Promise<{ id: string }> }

/** Só Guardião. Um Lanterna que digitar esta URL vai para /acesso-negado. */
export default async function AtribuirPage({ params }: AtribuirPageProps) {
  await exigirPapel('guardiao') // [AUTH-06]
  const { id } = await params // [ROTA-10]
  let ocorrencia
  try {
    ocorrencia = await buscarOcorrencia(id)
  } catch (erro) {
    tratarErroDetalhe(erro) // [API-12]
  }
  if (!ocorrencia) notFound() // [ROTA-12]
  let lanternas
  try {
    lanternas = await listarLanternas({ setorId: ocorrencia.setorId })
  } catch (erro) {
    tratarErroDetalhe(erro) // [API-12]
  }

  return (
    <section className="grid max-w-xl gap-6">
      <LinkVoltar href={`/painel/ocorrencias/${ocorrencia.id}`}>Voltar à ocorrência</LinkVoltar>
      <CabecalhoPagina titulo="Atribuir responsável" descricao={ocorrencia.titulo} />
      {lanternas.length === 0 ? (
        <EstadoVazio titulo="Nenhum lanterna neste setor" descricao="Não há lanternas designados no setor desta ocorrência." />
      ) : (
        <FormAtribuir ocorrenciaId={ocorrencia.id} lanternas={lanternas} responsavelAtual={ocorrencia.responsavelId} />
      )}
    </section>
  )
}
```

- [ ] **Step 7: Reescrever `app/(painel)/painel/ocorrencias/[id]/not-found.tsx`**

```tsx
import { PaginaAviso } from '@/components/PaginaAviso'

export default function OcorrenciaNaoEncontrada() {
  return (
    <PaginaAviso
      titulo="Ocorrência não encontrada"
      descricao="Ela pode ter sido removida ou o endereço está errado."
      acao={{ href: '/painel/ocorrencias', rotulo: 'Ver ocorrências' }}
    />
  )
}
```

- [ ] **Step 8: Rodar testes, lint e build**

Run: `npm run test:run && npm run lint && npm run build` → tudo passa.

- [ ] **Step 9: Commit**

```bash
git add "app/(painel)/painel/page.tsx" "app/(painel)/painel/ocorrencias/page.tsx" "app/(painel)/painel/ocorrencias/_components/FiltroOcorrencias.tsx" "app/(painel)/painel/ocorrencias/[id]/page.tsx" "app/(painel)/painel/ocorrencias/nova/page.tsx" "app/(painel)/painel/ocorrencias/[id]/atribuir/page.tsx" "app/(painel)/painel/ocorrencias/[id]/not-found.tsx"
git commit -m "feat: telas do painel no design system da Tropa

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Telas públicas

**Files:**
- Modify (reescrever inteiro): `app/(site)/page.tsx`, `app/(site)/sobre/page.tsx`, `app/(site)/lanternas/page.tsx`, `app/(site)/lanternas/_components/CartaoLanterna.tsx`, `app/(site)/lanternas/[id]/page.tsx`, `app/(site)/lanternas/[id]/not-found.tsx`, `app/(site)/login/page.tsx`, `app/(site)/acesso-negado/page.tsx`

**Interfaces:**
- Consumes: `Emblema` (Tarefa 3); `buttonVariants`, `Badge` (Tarefa 4); `Card*` (Tarefa 5); `CabecalhoPagina` (Tarefa 6); `EstadoVazio` (Tarefa 7); `LinkVoltar`, `PaginaAviso`, `Juramento` (Tarefa 8).
- Os testes de `__tests__/app/paginas-publicas.test.tsx` continuam valendo sem mudança: a home leva a `/lanternas`, `/sobre` e `/painel`; o Sobre tem h1 "Sobre a Tropa" e o texto "No dia mais claro, na noite mais densa".

- [ ] **Step 1: Reescrever `app/(site)/page.tsx` (home)**

```tsx
import Link from 'next/link'
import { ArrowRightIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Emblema } from '@/components/Emblema'
import { Juramento } from '@/components/Juramento'

const AREAS = [
  { href: '/lanternas', titulo: 'Lanternas da Tropa', descricao: 'Conheça os membros e filtre por setor.' },
  { href: '/sobre', titulo: 'Sobre a Tropa', descricao: 'O juramento, Oa e os Guardiões do Universo.' },
  { href: '/painel', titulo: 'Central de Comando', descricao: 'Área restrita: registre e acompanhe ocorrências.' },
]

/** Homepage: o único lugar com mais expressão; leva a todas as áreas. */
export default function HomePage() { // [DEC-09]
  return (
    <div className="grid gap-16 md:gap-20">
      <section className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between"> {/* [CSS-03][CSS-05] */}
        <div className="grid max-w-2xl gap-6">
          <h1 className="font-heading text-5xl leading-none font-bold md:text-6xl">Central de Ocorrências da Tropa dos Lanternas Verdes</h1> {/* [CSS-13] */}
          <p className="max-w-prose text-lg text-muted-foreground">
            De Oa, os Guardiões acompanham o que acontece nos 3600 setores do universo. Aqui a Tropa registra
            cada ocorrência intergaláctica e decide quem vai atendê-la.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/painel" className={buttonVariants({ size: 'lg' })}>Entrar na Central de Comando</Link> {/* [ROTA-16] */}
            <Link href="/lanternas" className={buttonVariants({ variant: 'outline', size: 'lg' })}>Conhecer os lanternas</Link>
          </div>
        </div>
        <Emblema className="size-32 self-center text-primary-texto drop-shadow-anel md:size-48" /> {/* [CSS-14] */}
      </section>
      <Juramento />
      <section aria-labelledby="areas" className="grid gap-4">
        <h2 id="areas" className="font-heading text-2xl font-semibold">Para onde ir</h2>
        <ul className="border-t border-border"> {/* lista, não cartões iguais: cada área é uma linha */}
          {AREAS.map((area) => (
            <li key={area.href} className="border-b border-border"> {/* [COMP-13] */}
              <Link href={area.href} className="group flex items-center justify-between gap-4 py-5 transition-colors duration-150 ease-out hover:bg-secondary/60 md:px-3">
                <span className="grid gap-1">
                  <span className="text-lg font-semibold">{area.titulo}</span>
                  <span className="text-muted-foreground">{area.descricao}</span>
                </span>
                <ArrowRightIcon aria-hidden className="size-5 shrink-0 text-texto-terciario transition-colors duration-150 group-hover:text-primary-texto" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Reescrever `app/(site)/sobre/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { Juramento } from '@/components/Juramento'

export const metadata: Metadata = { // [ROTA-07]
  title: 'Sobre a Tropa | Central de Oa',
  description: 'O juramento, Oa e a organização da Tropa dos Lanternas Verdes.',
}

/** Página institucional estática: Server Component sem busca de dados. */
export default function SobrePage() {
  return (
    <article className="grid max-w-3xl gap-12">
      <CabecalhoPagina titulo="Sobre a Tropa" descricao="O juramento, Oa e a organização da Tropa dos Lanternas Verdes." />
      <section aria-labelledby="juramento" className="grid gap-4">
        <h2 id="juramento" className="font-heading text-2xl font-semibold">O juramento</h2>
        <Juramento />
      </section>
      <section aria-labelledby="oa" className="grid gap-3">
        <h2 id="oa" className="font-heading text-2xl font-semibold">Oa e os Guardiões</h2>
        <p className="max-w-prose text-muted-foreground">
          Oa fica no centro do universo, no Setor 0. Dali os Guardiões coordenam a Tropa, distribuem os anéis
          de poder e acompanham as ocorrências registradas em cada setor.
        </p>
      </section>
      <section aria-labelledby="setores" className="grid gap-3">
        <h2 id="setores" className="font-heading text-2xl font-semibold">Os setores</h2>
        <p className="max-w-prose text-muted-foreground">
          O universo é dividido em 3600 setores. Cada lanterna protege o seu setor e responde pelas ocorrências
          que acontecem nele.
        </p>
      </section>
    </article>
  )
}
```

- [ ] **Step 3: Reescrever `app/(site)/lanternas/page.tsx`**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { EstadoVazio } from '@/components/EstadoVazio'
import { listarLanternas } from '@/lib/lanternas'
import { listarSetores } from '@/lib/setores'
import { filtroLanternasSchema } from '@/lib/schemas/lanterna'
import { CartaoLanterna } from '@/app/(site)/lanternas/_components/CartaoLanterna'

export const metadata: Metadata = {
  title: 'Lanternas | Central de Oa',
  description: 'Membros da Tropa dos Lanternas Verdes, por setor.',
}

type LanternasPageProps = { searchParams: Promise<{ setor?: string }> }

/** Listagem pública com filtro por setor na URL (?setor=2814). */
export default async function LanternasPage({ searchParams }: LanternasPageProps) {
  const { setor } = filtroLanternasSchema.parse(await searchParams) // [ROTA-10][ROTA-11][ROTA-14]
  const [setores, lanternas] = await Promise.all([listarSetores(), listarLanternas({ setorId: setor })]) // [API-07]
  const nomeSetor = Object.fromEntries(setores.map((s) => [s.id, s.nome]))

  return (
    <section className="grid gap-6">
      <CabecalhoPagina titulo="Lanternas da Tropa" descricao="Membros da Tropa, por setor." />
      <nav aria-label="Filtrar por setor" className="flex flex-wrap gap-2">
        <Link
          href="/lanternas"
          aria-current={!setor ? 'page' : undefined}
          className={buttonVariants({ variant: !setor ? 'default' : 'outline', size: 'sm' })}
        >
          Todos
        </Link>
        {setores.map((s) => (
          <Link
            key={s.id}
            href={`/lanternas?setor=${s.id}`}
            aria-current={setor === s.id ? 'page' : undefined}
            className={buttonVariants({ variant: setor === s.id ? 'default' : 'outline', size: 'sm' })}
          >
            {s.nome}
          </Link>
        ))}
      </nav>
      {lanternas.length === 0 ? ( // [COMP-14][API-09]
        <EstadoVazio
          titulo="Nenhum lanterna neste setor"
          descricao="Este setor ainda não tem lanterna designado. Escolha outro setor ou veja todos."
          acao={{ href: '/lanternas', rotulo: 'Ver todos' }}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"> {/* [CSS-03][CSS-06] */}
          {lanternas.map((l) => (
            <li key={l.id}>
              <CartaoLanterna lanterna={l} nomeSetor={nomeSetor[l.setorId] ?? `Setor ${l.setorId}`} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
```

- [ ] **Step 4: Reescrever `app/(site)/lanternas/_components/CartaoLanterna.tsx`**

```tsx
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { rotuloStatusLanterna, type Lanterna } from '@/lib/schemas/lanterna'

type CartaoLanternaProps = {
  lanterna: Lanterna
  nomeSetor: string
}

/** Cartão de um lanterna na listagem pública: aqui o cartão se justifica, cada lanterna é uma ficha navegável. */
export function CartaoLanterna({ lanterna, nomeSetor }: CartaoLanternaProps) {
  return (
    <Link href={`/lanternas/${lanterna.id}`} className="group block h-full rounded-lg"> {/* [ROTA-16] */}
      <Card className="h-full gap-4 transition-colors duration-150 ease-out group-hover:border-texto-terciario">
        <CardHeader>
          <CardTitle className="font-heading text-2xl leading-none font-bold">{lanterna.nome}</CardTitle> {/* [CSS-13] */}
          <CardDescription>{lanterna.especie} · {lanterna.planetaNatal}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-muted-foreground">{nomeSetor}</span>
          <Badge variant="secondary">{rotuloStatusLanterna[lanterna.status]}</Badge>
        </CardContent>
      </Card>
    </Link>
  )
}
```

- [ ] **Step 5: Reescrever `app/(site)/lanternas/[id]/page.tsx`**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { LinkVoltar } from '@/components/LinkVoltar'
import { tratarErroDetalhe } from '@/lib/erro-detalhe'
import { buscarLanterna } from '@/lib/lanternas'
import { listarSetores } from '@/lib/setores'
import { rotuloStatusLanterna } from '@/lib/schemas/lanterna'

export const metadata: Metadata = { title: 'Ficha do lanterna | Central de Oa' }

type LanternaPageProps = { params: Promise<{ id: string }> }

/** Ficha pública de um lanterna. */
export default async function LanternaPage({ params }: LanternaPageProps) {
  const { id } = await params // [ROTA-10]
  let lanterna, setores
  try {
    ;[lanterna, setores] = await Promise.all([buscarLanterna(id), listarSetores()]) // [API-07]
  } catch (erro) {
    tratarErroDetalhe(erro) // [API-12]
  }
  if (!lanterna) notFound() // [ROTA-12]
  const setor = setores.find((s) => s.id === lanterna.setorId)

  return (
    <article className="grid max-w-2xl gap-8">
      <div className="grid gap-4">
        <LinkVoltar href="/lanternas">Voltar à lista</LinkVoltar>
        <CabecalhoPagina titulo={lanterna.nome} descricao={`${lanterna.especie} · ${lanterna.planetaNatal}`} />
      </div>
      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2"> {/* [CSS-03] */}
        <div className="grid gap-1">
          <dt className="text-sm text-texto-terciario">Espécie</dt>
          <dd>{lanterna.especie}</dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-sm text-texto-terciario">Planeta natal</dt>
          <dd>{lanterna.planetaNatal}</dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-sm text-texto-terciario">Setor</dt>
          <dd className="grid gap-1">
            <Link href={`/lanternas?setor=${lanterna.setorId}`} className="w-fit font-mono text-sm text-primary-texto underline-offset-4 hover:underline">
              {setor?.nome ?? `Setor ${lanterna.setorId}`}
            </Link>
            {setor && <span className="text-sm text-muted-foreground">{setor.descricao}</span>}
          </dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-sm text-texto-terciario">Status</dt>
          <dd>{rotuloStatusLanterna[lanterna.status]}</dd>
        </div>
      </dl>
    </article>
  )
}
```

- [ ] **Step 6: Reescrever `app/(site)/lanternas/[id]/not-found.tsx`**

```tsx
import { PaginaAviso } from '@/components/PaginaAviso'

export default function LanternaNaoEncontrado() {
  return (
    <PaginaAviso
      titulo="Lanterna não encontrado"
      descricao="Não há lanterna com este endereço na Tropa."
      acao={{ href: '/lanternas', rotulo: 'Ver todos os lanternas' }}
    />
  )
}
```

- [ ] **Step 7: Reescrever `app/(site)/login/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { Emblema } from '@/components/Emblema'
import { FormLogin } from '@/app/(site)/login/_components/FormLogin'

export const metadata: Metadata = { title: 'Entrar | Central de Oa' }

export default function LoginPage() {
  return (
    <section className="mx-auto grid w-full max-w-sm gap-6 rounded-lg border border-border bg-card p-6 md:mt-8">
      <Emblema className="size-10 text-primary-texto drop-shadow-anel" /> {/* [CSS-14] */}
      <div className="grid gap-2">
        <h1 className="font-heading text-3xl leading-none font-bold">Entrar na Central de Comando</h1> {/* [CSS-13] */}
        <p className="text-sm text-muted-foreground">Acesso restrito a membros da Tropa.</p>
      </div>
      <FormLogin />
    </section>
  )
}
```

- [ ] **Step 8: Reescrever `app/(site)/acesso-negado/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { PaginaAviso } from '@/components/PaginaAviso'

export const metadata: Metadata = { title: 'Acesso negado | Central de Oa' }

/** Logado, mas sem permissão: o "403" explicado (APIS p. 5). */
export default function AcessoNegadoPage() { // [AUTH-06]
  return (
    <PaginaAviso
      titulo="Acesso negado"
      descricao="Você está conectado, mas seu papel não permite abrir esta página. Atribuir responsáveis é exclusivo dos Guardiões, e cada Lanterna só acessa as ocorrências do próprio setor."
      acao={{ href: '/painel', rotulo: 'Voltar ao painel' }}
    />
  )
}
```

- [ ] **Step 9: Rodar testes, lint e build**

Run: `npm run test:run && npm run lint && npm run build` → tudo passa (inclusive `__tests__/app/paginas-publicas.test.tsx`).

- [ ] **Step 10: Commit**

```bash
git add "app/(site)/page.tsx" "app/(site)/sobre/page.tsx" "app/(site)/lanternas/page.tsx" "app/(site)/lanternas/_components/CartaoLanterna.tsx" "app/(site)/lanternas/[id]/page.tsx" "app/(site)/lanternas/[id]/not-found.tsx" "app/(site)/login/page.tsx" "app/(site)/acesso-negado/page.tsx"
git commit -m "feat: telas públicas no design system da Tropa

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Vitrine /design-system

**Files:**
- Create: `app/(site)/design-system/page.tsx`, `app/(site)/design-system/_components/SecaoVitrine.tsx`
- Create: `__tests__/app/design-system.test.tsx`

**Interfaces:**
- Consumes: todos os componentes das Tarefas 3 a 8.
- Produces: rota `/design-system` (DEC-12).
- `SecaoVitrine({ id, titulo, descricao, children }: { id: string; titulo: string; descricao?: string; children: React.ReactNode })`.

- [ ] **Step 1: Escrever o teste que falha**

`__tests__/app/design-system.test.tsx`:

```tsx
import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import DesignSystemPage from '@/app/(site)/design-system/page'

test('vitrine tem um h1 e uma seção para cada parte do sistema', () => {
  render(<DesignSystemPage />)
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  const secoes = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
  expect(secoes).toEqual(['Cores', 'Gravidade', 'Tipografia', 'Emblema e ícones', 'Botões', 'Campos', 'Selos', 'Tabela e resumo', 'Alerta, vazio e carregando'])
})

test('vitrine mostra as quatro gravidades com texto', () => {
  render(<DesignSystemPage />)
  for (const rotulo of ['Baixa', 'Média', 'Alta', 'Crítica']) {
    expect(screen.getAllByText(rotulo).length).toBeGreaterThan(0)
  }
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run __tests__/app/design-system.test.tsx`
Expected: FAIL ("Failed to resolve import").

- [ ] **Step 3: Criar `app/(site)/design-system/_components/SecaoVitrine.tsx`**

```tsx
type SecaoVitrineProps = {
  id: string
  titulo: string
  descricao?: string
  children: React.ReactNode
}

/** Uma seção da vitrine: h2 ligado à section por aria-labelledby. [CSS-07] */
export function SecaoVitrine({ id, titulo, descricao, children }: SecaoVitrineProps) {
  return (
    <section aria-labelledby={id} className="grid gap-5 border-t border-border pt-8">
      <div className="grid gap-1">
        <h2 id={id} className="font-heading text-2xl font-semibold">{titulo}</h2>
        {descricao && <p className="max-w-prose text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {children}
    </section>
  )
}
```

- [ ] **Step 4: Criar `app/(site)/design-system/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { ArrowLeftIcon, ArrowRightIcon, BookOpenIcon, CircleAlertIcon, CirclePlusIcon, HouseIcon, InboxIcon, LayoutDashboardIcon, ListIcon, LogOutIcon, PlusIcon, UsersIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { BadgeGravidade } from '@/components/BadgeGravidade'
import { BadgeStatus } from '@/components/BadgeStatus'
import { BarraStatus } from '@/components/BarraStatus'
import { CabecalhoPagina } from '@/components/CabecalhoPagina'
import { Emblema } from '@/components/Emblema'
import { EstadoVazio } from '@/components/EstadoVazio'
import { IconeStatus } from '@/components/IconeStatus'
import { MensagemErro } from '@/components/MensagemErro'
import { TabelaOcorrencias } from '@/components/TabelaOcorrencias'
import { GRAVIDADES, rotuloGravidade, STATUS_OCORRENCIA, type Ocorrencia } from '@/lib/schemas/ocorrencia'
import { SecaoVitrine } from '@/app/(site)/design-system/_components/SecaoVitrine'

export const metadata: Metadata = {
  title: 'Design system | Central de Oa',
  description: 'Tokens, tipografia, emblema, ícones e componentes da Central de Oa.',
}

// [DEC-12] dados de exemplo fixos: a vitrine não chama a API
const CORES = [
  { token: '--background', classe: 'bg-background', uso: 'Fundo das páginas' },
  { token: '--sidebar', classe: 'bg-sidebar', uso: 'Coluna do painel e header' },
  { token: '--card', classe: 'bg-card', uso: 'Superfícies: cartão, campo, painel' },
  { token: '--secondary', classe: 'bg-secondary', uso: 'Hover e item ativo' },
  { token: '--border', classe: 'bg-border', uso: 'Bordas e linhas de tabela' },
  { token: '--primary', classe: 'bg-primary', uso: 'Ação primária, seleção e foco' },
  { token: '--destructive', classe: 'bg-destructive', uso: 'Erros de formulário' },
]

const TEXTOS = [
  { token: '--foreground', classe: 'text-foreground', uso: 'Texto principal' },
  { token: '--muted-foreground', classe: 'text-muted-foreground', uso: 'Texto secundário' },
  { token: '--texto-terciario', classe: 'text-texto-terciario', uso: 'Cabeçalho de tabela, ausências' },
  { token: '--primary-texto', classe: 'text-primary-texto', uso: 'Verde sobre fundo escuro' },
]

const SIGNIFICADO_GRAVIDADE = {
  baixa: 'Azul: esperança. A situação tem solução.',
  media: 'Amarelo: medo. Pede atenção.',
  alta: 'Laranja: ganância. Alguém está tirando proveito.',
  critica: 'Vermelho: fúria. Ação imediata.',
} as const

const ICONES = [
  { nome: 'Resumo', icone: <LayoutDashboardIcon aria-hidden /> },
  { nome: 'Ocorrências', icone: <ListIcon aria-hidden /> },
  { nome: 'Registrar', icone: <CirclePlusIcon aria-hidden /> },
  { nome: 'Sair', icone: <LogOutIcon aria-hidden /> },
  { nome: 'Início', icone: <HouseIcon aria-hidden /> },
  { nome: 'Lanternas', icone: <UsersIcon aria-hidden /> },
  { nome: 'Sobre', icone: <BookOpenIcon aria-hidden /> },
  { nome: 'Erro', icone: <CircleAlertIcon aria-hidden /> },
  { nome: 'Vazio', icone: <InboxIcon aria-hidden /> },
  { nome: 'Avançar', icone: <ArrowRightIcon aria-hidden /> },
  { nome: 'Voltar', icone: <ArrowLeftIcon aria-hidden /> },
]

const VARIANTES = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const

const EXEMPLOS: Ocorrencia[] = [
  { id: 'exemplo-1', titulo: 'Ataque de Parallax em Coast City', descricao: 'Exemplo.', planeta: 'Terra', setorId: '2814', gravidade: 'critica', status: 'em_andamento', envolvidos: 3, responsavelId: 'hal-jordan', resolucao: null, criadaPor: 'u1', criadaEm: '2026-10-01T12:00:00.000Z' },
  { id: 'exemplo-2', titulo: 'Nave de Sinestro avistada perto de Marte', descricao: 'Exemplo.', planeta: 'Marte', setorId: '2814', gravidade: 'alta', status: 'aberta', envolvidos: 1, responsavelId: null, resolucao: null, criadaPor: 'u1', criadaEm: '2026-10-02T12:00:00.000Z' },
  { id: 'exemplo-3', titulo: 'Contrabando de anéis falsificados', descricao: 'Exemplo.', planeta: 'Terra', setorId: '2814', gravidade: 'media', status: 'resolvida', envolvidos: 4, responsavelId: 'guy-gardner', resolucao: 'Anéis apreendidos.', criadaPor: 'u1', criadaEm: '2026-10-03T12:00:00.000Z' },
  { id: 'exemplo-4', titulo: 'Tempestade de energia amarela', descricao: 'Exemplo.', planeta: 'Lua', setorId: '2814', gravidade: 'baixa', status: 'aberta', envolvidos: 1, responsavelId: null, resolucao: null, criadaPor: 'u1', criadaEm: '2026-10-04T12:00:00.000Z' },
]

/** Vitrine do design system: tudo o que as telas usam, num lugar só, para a apresentação. */
export default function DesignSystemPage() {
  return (
    <div className="grid gap-10">
      <CabecalhoPagina
        titulo="Design system da Tropa"
        descricao="Tokens, tipografia, emblema, ícones e componentes da Central de Oa. Use Tab para ver o foco: o brilho do anel."
      />

      <SecaoVitrine id="cores" titulo="Cores" descricao="Tema único Noite. Neutros com um leve tom de verde; o verde forte é reservado para ação, seleção e foco.">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CORES.map((cor) => (
            <li key={cor.token} className="flex items-center gap-3">
              <span aria-hidden="true" className={`size-10 shrink-0 rounded-md border border-border ${cor.classe}`} />
              <span className="grid">
                <code className="font-mono text-xs">{cor.token}</code>
                <span className="text-sm text-muted-foreground">{cor.uso}</span>
              </span>
            </li>
          ))}
        </ul>
        <ul className="grid gap-2 sm:grid-cols-2">
          {TEXTOS.map((texto) => (
            <li key={texto.token} className={texto.classe}>
              <code className="font-mono text-xs">{texto.token}</code> · {texto.uso}
            </li>
          ))}
        </ul>
      </SecaoVitrine>

      <SecaoVitrine id="gravidade" titulo="Gravidade" descricao="O espectro emocional dos Lanternas. A cor nunca aparece sem o texto.">
        <ul className="grid gap-3 sm:grid-cols-2">
          {GRAVIDADES.map((gravidade) => (
            <li key={gravidade} className="grid gap-1 rounded-md border border-border bg-card p-4">
              <BadgeGravidade gravidade={gravidade} />
              <span className="text-sm text-muted-foreground">{SIGNIFICADO_GRAVIDADE[gravidade]}</span>
            </li>
          ))}
        </ul>
      </SecaoVitrine>

      <SecaoVitrine id="tipografia" titulo="Tipografia" descricao="Barlow para a interface, Barlow Condensed só em títulos e marca, IBM Plex Mono só para dados.">
        <div className="grid gap-4">
          <p className="font-heading text-4xl leading-none font-bold">Barlow Condensed 700 · título de página</p>
          <p className="font-heading text-2xl font-semibold">Barlow Condensed 600 · título de seção</p>
          <p className="text-lg font-semibold">Barlow 600 · subtítulo e nome em destaque</p>
          <p className="max-w-prose">Barlow 400 · texto corrido. De Oa, os Guardiões acompanham o que acontece nos 3600 setores do universo.</p>
          <p className="font-mono text-xs text-muted-foreground">IBM Plex Mono 500 · Setor 2814</p>
        </div>
      </SecaoVitrine>

      <SecaoVitrine id="emblema" titulo="Emblema e ícones" descricao="Emblema próprio (anel, núcleo e duas barras). Ícones do lucide-react com traço 2.">
        <div className="flex flex-wrap items-end gap-6">
          <Emblema className="size-24 text-primary-texto drop-shadow-anel" />
          <Emblema className="size-12 text-primary-texto" />
          <Emblema className="size-8 text-texto-terciario" />
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {ICONES.map((item) => (
            <li key={item.nome} className="flex items-center gap-2 text-sm text-muted-foreground [&_svg]:size-4.5">
              {item.icone}
              {item.nome}
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap gap-6">
          {STATUS_OCORRENCIA.map((status) => (
            <li key={status} className="flex items-center gap-2 text-sm">
              <IconeStatus status={status} className="size-5" />
              <BadgeStatus status={status} />
            </li>
          ))}
        </ul>
      </SecaoVitrine>

      <SecaoVitrine id="botoes" titulo="Botões" descricao="Mesmas variantes do shadcn, visual da Tropa. Linha de cima normal, linha de baixo desabilitado.">
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-3">
            {VARIANTES.map((variant) => (
              <Button key={variant} type="button" variant={variant}>{variant}</Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {VARIANTES.map((variant) => (
              <Button key={variant} type="button" variant={variant} disabled>{variant}</Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" size="sm">Pequeno</Button>
            <Button type="button">Padrão</Button>
            <Button type="button" size="lg">Grande</Button>
            <Button type="button" size="icon" aria-label="Registrar ocorrência"><PlusIcon aria-hidden /></Button>
            <Button type="button"><PlusIcon aria-hidden />Com ícone</Button>
          </div>
        </div>
      </SecaoVitrine>

      <SecaoVitrine id="campos" titulo="Campos" descricao="Normal, com erro e desabilitado. O erro tem texto e ícone, nunca só a borda vermelha.">
        <div className="grid max-w-xl gap-5">
          <div className="grid gap-1.5">
            <Label htmlFor="ds-titulo">Título</Label>
            <Input id="ds-titulo" placeholder="Ex.: Ataque em Coast City" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ds-planeta">Planeta</Label>
            <Input id="ds-planeta" aria-invalid aria-describedby="ds-planeta-erro" defaultValue="T" />
            <MensagemErro id="ds-planeta-erro">Informe o planeta onde a ocorrência aconteceu.</MensagemErro>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ds-setor">Setor</Label>
            <Input id="ds-setor" disabled defaultValue="Setor 2814" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ds-descricao">Descrição</Label>
            <Textarea id="ds-descricao" rows={3} placeholder="O que aconteceu?" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ds-gravidade">Gravidade</Label>
            <Select items={rotuloGravidade} defaultValue="media">
              <SelectTrigger id="ds-gravidade" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {GRAVIDADES.map((gravidade) => (
                  <SelectItem key={gravidade} value={gravidade}>{rotuloGravidade[gravidade]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SecaoVitrine>

      <SecaoVitrine id="selos" titulo="Selos" descricao="Gravidade e status têm componentes próprios; o Badge neutro serve para o resto (ex.: status do lanterna).">
        <div className="flex flex-wrap items-center gap-4">
          <Badge>Padrão</Badge>
          <Badge variant="secondary">Em missão</Badge>
          <Badge variant="outline">Contorno</Badge>
          <Badge variant="destructive">Afastado</Badge>
        </div>
      </SecaoVitrine>

      <SecaoVitrine id="tabela" titulo="Tabela e resumo" descricao="A barra acende um segmento por ocorrência: vazio, meio carregado e cheio, como o ícone de status.">
        <BarraStatus ocorrencias={EXEMPLOS} />
        <TabelaOcorrencias
          ocorrencias={EXEMPLOS}
          nomeSetor={{ '2814': 'Setor 2814' }}
          nomeLanterna={{ 'hal-jordan': 'Hal Jordan', 'guy-gardner': 'Guy Gardner' }}
        />
      </SecaoVitrine>

      <SecaoVitrine id="estados" titulo="Alerta, vazio e carregando">
        <Alert>
          <InboxIcon aria-hidden />
          <div>
            <AlertTitle>Ocorrência registrada</AlertTitle>
            <AlertDescription>O Guardião do setor já pode atribuir um responsável.</AlertDescription>
          </div>
        </Alert>
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden />
          <div>
            <AlertTitle>Não foi possível salvar</AlertTitle>
            <AlertDescription>Verifique sua conexão e tente de novo.</AlertDescription>
          </div>
        </Alert>
        <EstadoVazio titulo="Nenhum lanterna neste setor" descricao="Este setor ainda não tem lanterna designado." acao={{ href: '/lanternas', rotulo: 'Ver todos' }} />
        <div className="grid gap-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </SecaoVitrine>
    </div>
  )
}
```

Observação para o executor: a amostra de cor usa uma template string (`` `size-10 ... ${cor.classe}` ``). Isso é permitido pela CSS-12 porque `cor.classe` é sempre uma classe completa escrita no array `CORES` (o Tailwind a encontra no código). Não troque por `` `bg-${...}` ``.

- [ ] **Step 5: Rodar testes, lint e build**

Run: `npx vitest run __tests__/app/design-system.test.tsx` → PASS (2 testes)
Run: `npm run test:run && npm run lint && npm run build` → tudo passa.

- [ ] **Step 6: Commit**

```bash
git add "app/(site)/design-system/page.tsx" "app/(site)/design-system/_components/SecaoVitrine.tsx" __tests__/app/design-system.test.tsx
git commit -m "feat: vitrine do design system em /design-system

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Auditoria — checks novos e verificação final

**Files:**
- Modify: `.claude/skills/auditoria-apresentacao/references/checks.md` (tabela "Automáticas", depois da linha do C-58)
- Modify: `.claude/skills/auditoria-apresentacao/scripts/verificar.sh` (depois da linha do C-55)

**Interfaces:**
- Consumes: regras da Tarefa 1 e o código das Tarefas 2 a 11.

- [ ] **Step 1: Acrescentar os checks em `checks.md`**

Depois da linha que começa com `| C-58 |`, acrescente:

```markdown
| C-59 | DEC-13 | variante `dark:` ou seletor `.dark` (tema único) | `rg -n "\.dark\|dark:" app components` |
| C-60 | CSS-12 | listra colorida lateral (`border-l-2`…`border-l-8`, `border-r-2`…`border-r-8`) | `rg -n "border-[lr]-[2-8]" app components` |
| C-61 | CSS-12 | classe de gravidade montada por interpolação (o Tailwind não gera) | `rg -n "gravidade-\$\{" app components` |
| C-62 | CSS-13 | fonte condensada dentro de `components/ui` (botão, campo, menu) | `rg -n "font-heading" components/ui` |
```

- [ ] **Step 2: Acrescentar os checks em `verificar.sh`**

Logo depois da linha `relatar VIOLACAO C-55 CSS-07 ...`, acrescente:

```bash
relatar VIOLACAO C-59 DEC-13 "tema escuro duplicado (dark: ou .dark)" "$(g "\.dark|dark:")"
relatar VIOLACAO C-60 CSS-12 "listra colorida lateral" "$(g "border-[lr]-[2-8]")"
relatar VIOLACAO C-61 CSS-12 "classe de gravidade montada por interpolação" "$(g "gravidade-\\\$\{")"
relatar VIOLACAO C-62 CSS-13 "fonte condensada em components/ui" "$(grep -rn "font-heading" components/ui 2>/dev/null)"
```

Atenção: a função `g` do script ignora `components/ui/`; por isso o C-62 usa `grep` direto.

- [ ] **Step 3: Rodar as verificações de regra da spec (seção 8)**

Run cada comando; todos devem retornar vazio:

```bash
grep -rnE "style=\{\{" app components
grep -rnE "border-[lr]-[2-8]" app components
grep -rnE "#[0-9a-fA-F]{6}" app components --include=*.ts --include=*.tsx --include=*.css
grep -rnE "\.dark|dark:" app components
grep -rnE "[a-z]-\[[0-9#]" app components
grep -rn "font-heading" components/ui
```

Se algum comando achar algo, corrija o arquivo apontado (seguindo a regra citada) antes de seguir.

- [ ] **Step 4: Rodar o script de auditoria e a suíte completa**

Run: `bash .claude/skills/auditoria-apresentacao/scripts/verificar.sh .`
Expected: nenhuma linha `VIOLACAO` nova (C-59 a C-62 sem achados). Copie o resumo no relatório.

Run: `npm run test:run && npm run lint && npm run build` → tudo passa.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/auditoria-apresentacao/references/checks.md .claude/skills/auditoria-apresentacao/scripts/verificar.sh
git commit -m "docs(skills): checks de auditoria do design system (C-59..C-62)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
