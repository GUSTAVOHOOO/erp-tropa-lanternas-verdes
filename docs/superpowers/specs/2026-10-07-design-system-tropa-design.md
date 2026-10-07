# Design system da Tropa — spec

Data: 2026-10-07. Aprovado no brainstorming (direção visual "B revisado", tema Noite).
Projeto base: `docs/superpowers/specs/2026-10-07-erp-tropa-design.md`.

## 1. Objetivo

Trocar a aparência padrão do shadcn por um design system próprio, inspirado na Tropa dos
Lanternas Verdes, sem mudar o comportamento do ERP. Toda tela continua fazendo exatamente o
que faz hoje (mesmas rotas, formulários, actions, testes de lógica). Muda só o visual.

Critérios de sucesso:

1. Todas as telas usam os tokens e componentes deste documento; nenhuma cor, fonte ou espaçamento solto.
2. Cada escolha é rastreável a uma regra com ID (padroes-wellington) e o código marca `// [ID]`.
3. `npm run test:run`, `npm run lint` e `npm run build` passam ao fim de cada tarefa.
4. A rota `/design-system` mostra o sistema inteiro rodando, para a apresentação.
5. Nenhuma dependência nova no `package.json` (STACK-06).

Fora do escopo: tema claro, troca de tema, animações de entrada de página, imagem Open Graph,
qualquer mudança de regra de negócio, rotas de API ou dados.

## 2. Pesquisa que fundamenta as escolhas

| Elemento do universo | Vira no design system |
|---|---|
| Verde = força de vontade; uniforme verde, preto e branco | Base escura neutra, verde reservado para ação primária, seleção e foco |
| Espectro emocional (azul esperança, amarelo medo, laranja ganância, vermelho fúria) | Escala de **gravidade**: baixa azul, média amarelo, alta laranja, crítica vermelho |
| "No dia mais claro, na noite mais densa" | Tema único escuro ("Noite"); o juramento é peça central da home e do Sobre |
| O anel cria construtos de luz | O **foco do teclado** é o brilho do anel (`shadow-anel`), único brilho da UI além do emblema |
| Emblema: anel com duas barras horizontais | Emblema **próprio** em SVG (anel + núcleo + duas barras), não o logo registrado da DC |
| Logo de 1969 (Gaspar Saladino / Gil Kane): letras de bloco altas e verticais | Barlow Condensed nos títulos |
| Tropa como força policial de 3600 setores; série *Lanterns* (2026) com visual tátil e funcional | Barlow (origem em placas de sinalização) na UI; número do setor em mono, como dado de sistema |

Fontes da pesquisa: Wikipedia "Green Lantern Corps"; 13th Dimension, "13 groovy Silver Age Gaspar
Saladino DC Comics logos" (comentário de Todd Klein); DCU Guide, "Oaths"; Animation Magazine e AWN
sobre os efeitos do filme de 2011; matérias sobre o figurino da série *Lanterns* (HBO, 2026).

Proibições herdadas da skill impeccable (o "AI slop" que motivou a revisão): linha pequena em
caixa alta acima de títulos, navegação numerada `[01]`, listra colorida na lateral de cartões
(`border-l-4` etc.), cantos chanfrados decorativos, fonte display em botões e rótulos, grade de
cartões idênticos onde uma lista serve, cartões de "número grande" no resumo.

## 3. Fundação (tokens)

Tudo em `app/globals.css` (CSS-01, CSS-09). Tema único no `:root`; o bloco `.dark` e o
`@custom-variant dark` saem (DEC-13). Neutros com croma baixo puxado para o verde (hue 155).

### 3.1 Cores (nomes do shadcn mantidos para os componentes continuarem funcionando)

| Token | Valor | Uso |
|---|---|---|
| `--background` | `oklch(0.165 0.012 155)` | fundo das páginas |
| `--foreground` | `oklch(0.955 0.008 155)` | texto principal |
| `--card` / `--card-foreground` | `oklch(0.205 0.014 155)` / foreground | superfícies (cartão, campo, painel) |
| `--popover` / `--popover-foreground` | `oklch(0.225 0.016 155)` / foreground | lista do select |
| `--primary` / `--primary-foreground` | `oklch(0.80 0.19 150)` / `oklch(0.17 0.04 150)` | botão primário |
| `--primary-texto` (novo) | `oklch(0.85 0.17 150)` | texto e ícone verdes sobre fundo escuro |
| `--secondary`, `--muted`, `--accent` | `oklch(0.235 0.016 155)` | hover, item ativo, botão secundário |
| `--secondary-foreground`, `--accent-foreground` | foreground | |
| `--muted-foreground` | `oklch(0.775 0.014 155)` | texto secundário (contraste ≥ 4.5:1) |
| `--texto-terciario` (novo) | `oklch(0.66 0.014 155)` | cabeçalho de tabela, "sem responsável" |
| `--destructive` | `oklch(0.70 0.19 25)` | erros de formulário |
| `--border` | `oklch(0.29 0.014 155)` | bordas e linhas de tabela |
| `--input` | `oklch(0.32 0.014 155)` | borda de campo |
| `--ring` | `oklch(0.80 0.19 150)` | base do foco |
| `--sidebar`, `--sidebar-foreground`, `--sidebar-border` | `oklch(0.135 0.010 155)`, foreground, border | coluna lateral do painel |
| `--gravidade-baixa` | `oklch(0.72 0.13 245)` | azul (esperança) |
| `--gravidade-media` | `oklch(0.84 0.16 92)` | amarelo (medo) |
| `--gravidade-alta` | `oklch(0.73 0.17 55)` | laranja (ganância) |
| `--gravidade-critica` | `oklch(0.64 0.22 25)` | vermelho (fúria) |

Os tokens de gráfico (`--chart-*`) e os de sidebar que ninguém usa (`--sidebar-primary*`,
`--sidebar-accent*`, `--sidebar-ring`) saem. Cor de gravidade nunca aparece sozinha: vem sempre
com o texto do rótulo.

### 3.2 Outros tokens (`@theme`)

- `--radius: 0.5rem` (a escala `--radius-*` do shadcn continua derivada dele).
- `--shadow-anel: 0 0 0 1px oklch(0.80 0.19 150 / 0.9), 0 0 18px oklch(0.80 0.19 150 / 0.35)` → classe `shadow-anel`.
- `--drop-shadow-anel: 0 0 6px oklch(0.80 0.19 150 / 0.55)` → classe `drop-shadow-anel` (só no emblema).
- Fontes: `--font-sans: var(--font-barlow)`, `--font-heading: var(--font-barlow-condensed)`, `--font-mono: var(--font-plex-mono)`.

### 3.3 Tipografia

Carregada em `app/layout.tsx` com `next/font/google` (já faz parte do Next): Barlow 400/500/600,
Barlow Condensed 600/700, IBM Plex Mono 500. Geist e Geist Mono saem.

| Papel | Classes |
|---|---|
| h1 de página | `font-heading text-4xl font-bold leading-none` |
| h1 da home | `font-heading text-5xl font-bold leading-none md:text-6xl` |
| h2 | `font-heading text-2xl font-semibold` |
| h3 | `text-lg font-semibold` (Barlow) |
| corpo | `text-base`; em tabela e formulário `text-sm` |
| dado (setor, ids) | `font-mono text-xs` (12px) com `tabular-nums` |

Regra base em `globals.css`: `h1, h2, h3 { text-wrap: balance }`. Fonte condensada nunca em botão,
rótulo, menu ou célula de tabela.

### 3.4 Espaço, layout e movimento

- Escala do Tailwind (CSS-04). Página: `p-4 md:p-8`. Entre blocos da página: `gap-8`. Dentro de um bloco: `gap-3`. Campos de formulário: `gap-5` entre campos, `gap-1.5` entre rótulo, campo e erro.
- Largura máxima do conteúdo: `max-w-6xl` (já usada). Texto corrido: `max-w-prose`.
- Transições: `duration-150 ease-out` em cor, borda, sombra e brilho; nunca em largura/altura.
- `@media (prefers-reduced-motion: reduce)` em `globals.css` zera `transition-duration` e `animation-duration` (CSS-15).

## 4. Marca e assets

- `components/Emblema.tsx`: SVG 32×32, `currentColor`, `aria-hidden` por padrão, prop `className`.
  Desenho: anel `r=13.5` traço 2.5; barras `x=7 y=7 w=18 h=3 rx=1` e `y=22`; núcleo `r=4.5` traço 2.5.
- `app/icon.svg`: o mesmo desenho, verde sobre quadrado arredondado escuro. Substitui `app/favicon.ico` (apagado).
- Ícones: `lucide-react`, `strokeWidth` 2, `size-4` em botões e `size-4.5` (18px) no menu. Nenhum valor arbitrário
  `[...]` em todo o design system (CSS-04). Mapa:
  Resumo `LayoutDashboard`, Ocorrências `List`, Registrar `CirclePlus`, Sair `LogOut`,
  Início `House`, Lanternas `Users`, Sobre `BookOpen`, erro `CircleAlert`, vazio `Inbox`, seta `ArrowRight`.
- `components/IconeStatus.tsx`: SVG próprio de 14px. Aberta = círculo vazio; Em andamento = meio
  cheio; Resolvida = cheio com check.
- Apagar `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` (não usados).

## 5. Componentes

### 5.1 `components/ui/` (visual reescrito, API mantida, Base UI por baixo — DEC-11)

Mesmos nomes de exportação, variantes e tamanhos. Nenhuma tela muda por causa da API.

| Componente | Visual |
|---|---|
| `button` | Altura `h-9`, `px-3.5`, `rounded-md`, `text-sm font-semibold`. `default`: verde com `hover:brightness-110`. `outline`: `bg-card border-border`, hover `bg-secondary`. `secondary`: `bg-secondary`. `ghost`: texto `muted-foreground`, hover `bg-secondary text-foreground`. `destructive`: `bg-destructive/15 text-destructive`. `link`: `text-primary-texto` com sublinhado no hover. Tamanhos `sm` (`h-8`), `lg` (`h-10`), `icon` (`size-9`) e os `xs`/`icon-*` existentes. Foco `focus-visible:shadow-anel`. Desabilitado `opacity-50`. |
| `input`, `textarea` | `bg-card border-input rounded-md h-9 px-3 text-sm`; placeholder `text-texto-terciario`; foco `shadow-anel` e borda `ring`; `aria-invalid:border-destructive`. |
| `select` | Gatilho igual ao input, com `ChevronDown`. Lista `bg-popover border-border rounded-md shadow-lg`. Item ativo `bg-secondary`. Item selecionado com `Check` em `text-primary-texto`. |
| `label` | `text-sm font-medium text-foreground`. |
| `card` | `bg-card border border-border rounded-lg`, sem sombra. Título em Barlow `text-lg font-semibold`. |
| `table` | Sem fundo próprio. Cabeçalho `text-sm font-medium text-texto-terciario`, linha `border-b border-border`, hover de linha `bg-secondary/60`, célula `py-3 px-3`, `tabular-nums`. |
| `badge` | `rounded-sm px-1.5 py-0.5 text-xs font-medium`; variantes neutras (`bg-secondary`, `outline`). |
| `alert` | `bg-card border rounded-md p-4` com ícone à esquerda; `destructive` com borda e ícone `text-destructive`. |
| `skeleton` | `bg-secondary rounded-md animate-pulse` (pulse desligado com reduced-motion). |

### 5.2 Compartilhados (`components/`)

| Componente | Mudança |
|---|---|
| `BadgeGravidade` | Para de usar `Badge`. Losango `size-2.5 rotate-45 rounded-xs` com `bg-gravidade-*` + rótulo `text-sm font-medium`. Mapa de classes em objeto `as const` com as strings completas (o Tailwind precisa achar a classe inteira no código). |
| `BadgeStatus` | `IconeStatus` + rótulo `text-sm text-muted-foreground`; resolvida em `text-primary-texto`. |
| `MenuNavegacao` | Aceita `icone` opcional por link. Item atual: `bg-card` + `ring-1 ring-border` + ícone `text-primary-texto` (sem listra lateral). Hover `bg-secondary`. Mantém toda a lógica (ROTA-13, ROTA-17, COMP-09). |
| `TabelaOcorrencias` | Colunas: Ocorrência (título em link + planeta abaixo, `text-muted-foreground`), Setor (`font-mono`), Gravidade, Status, Responsável ("Sem responsável" em `text-texto-terciario`). |
| `CampoTexto`, `CampoSelect` | Mesmas props. Erro com `CircleAlert size-4` + texto `text-destructive`. |
| `EstadoVazio` | Ícone `Inbox`, título, descrição, ação `outline`. Borda tracejada `border-border`. |
| `TelaDeErro` | Ícone `CircleAlert`, mesma cópia, botão primário "Tentar de novo". |
| `EsqueletoLista` | Esqueleto com o formato da tabela (cabeçalho + linhas). |

### 5.3 Novos

| Componente | Responsabilidade |
|---|---|
| `components/Emblema.tsx` | Marca em SVG (seção 4). |
| `components/IconeStatus.tsx` | Ícone de carga por status (seção 4). |
| `components/BarraStatus.tsx` | Resumo do painel: barra com **um segmento por ocorrência** (`flex-1`, cor por status, sem `style`; CSS-02) + legenda com links `?status=` mostrando o total de cada status. A barra é `aria-hidden`; a informação acessível está na legenda. |
| `components/CabecalhoPagina.tsx` | Cabeçalho padrão das páginas: `h1`, descrição opcional e ação opcional (`children`), em `flex flex-wrap items-end justify-between gap-4`. Um jeito só de abrir uma página. |

## 6. Telas

Comportamento, dados e regras ficam iguais; só muda a marcação visual.

**Painel** (`app/(painel)/layout.tsx`): `flex md:flex-row` com a sidebar em `md:w-52` (como hoje, só
mais estreita). Sidebar `bg-sidebar border-r`: Emblema + "Central de Oa", bloco do usuário
(nome + papel), `MenuNavegacao` vertical com ícones, Sair no rodapé da coluna (`ghost`, `LogOut`).
No celular a sidebar vira barra superior com o menu recolhível que já existe.

- **Resumo**: `CabecalhoPagina` ("Bem-vindo, {nome}" + ação "Registrar ocorrência" com `Plus`), `BarraStatus`, h2 "Mais recentes", `TabelaOcorrencias`. Saem os três cartões de número.
- **Ocorrências**: `CabecalhoPagina` + filtros numa linha (`flex flex-wrap gap-3`) + tabela.
- **Detalhe**: `CabecalhoPagina` com o título; gravidade e status logo abaixo; dados em `<dl>` em grade de 2 colunas no `md:`; descrição em `max-w-prose`; formulários de status e de responsável em `<section>` separadas, cada uma com h2.
- **Nova / Atribuir**: formulário de uma coluna `max-w-xl`, botões alinhados à direita.

**Área pública** (`app/(site)/layout.tsx`): header com Emblema + "Central de Oa" e menu horizontal com
ícones. Rodapé: "No dia mais claro, na noite mais densa." + link "Design system" + crédito acadêmico.

- **Home** (único lugar com mais expressão): duas colunas no `md:`. À esquerda: h1 grande condensado, parágrafo, botões "Entrar na Central de Comando" (primário) e "Conhecer os lanternas" (outline). À direita: Emblema `size-40` em `text-primary-texto` com `drop-shadow-anel`. Abaixo: o juramento em `<figure><blockquote>` (Barlow Condensed `text-3xl`, uma linha por verso) com `<figcaption>`. Depois: as três áreas como lista `<ul>` com linhas divididas por `border-b` (título, descrição, `ArrowRight`), não cartões.
- **Lanternas**: filtro de setor como links `buttonVariants` (`outline`/`default`, `sm`); grade de `CartaoLanterna` (nome em `font-heading text-2xl`, espécie · planeta, setor em mono, status). O cartão se justifica aqui porque cada lanterna é uma entidade navegável.
- **Detalhe do lanterna**: `CabecalhoPagina` + `<dl>`.
- **Sobre**: juramento em destaque como na home (sem `border-l-4`), seções com h2.
- **Login**: painel centralizado `max-w-sm bg-card border rounded-lg p-6` com Emblema no topo.
- **Acesso negado / 404 / not-found de detalhe**: Emblema em `text-texto-terciario`, título, texto e ação; o 404 diz "Setor desconhecido".
- **loading / error**: usam `EsqueletoLista` e `TelaDeErro` reescritos.

**Vitrine** (`app/(site)/design-system/page.tsx`, Server Component estático, DEC-12): seções com h2 —
Cores (amostras com nome do token e valor), Tipografia, Emblema e ícones, Botões (todas as variantes e
tamanhos, normal e desabilitado), Campos (normal, com erro, desabilitado), Select, Selos de gravidade
e status, Tabela, Alerta, Esqueleto, Estado vazio, Barra de status. Dados de exemplo em constantes no
próprio arquivo. Um aviso no topo: "Use Tab para ver o foco". Link só no rodapé.

## 7. Regras novas e alteradas (antes do código)

Em `.claude/skills/padroes-wellington/references/`:

- `estilo-tailwind.md`
  - **CSS-12 Tokens da Tropa**: cores só pelos nomes semânticos; gravidade só por `bg-gravidade-*`/`text-gravidade-*` e sempre com texto. Fonte: [DECISÃO] + CSS p. 13 (sistema de design).
  - **CSS-13 Fontes com next/font**: três famílias, papéis fixos (seção 3.3). Fonte: [DOCS] `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md`.
  - **CSS-14 Foco é o anel**: `focus-visible:shadow-anel` em todo elemento interativo; complementa CSS-08.
  - **CSS-15 Movimento**: só transição de estado, 150 ms ease-out, e bloco `prefers-reduced-motion` no `globals.css`.
  - CSS-09: o comando de verificação passa a ignorar `*.svg` (o favicon é um arquivo de imagem, não estilo de código).
- `stack-e-decisoes.md`
  - **DEC-11 Visual próprio sobre Base UI**: `components/ui/*` tem o visual reescrito e a mesma API; o comportamento (teclado, foco, ARIA) continua do Base UI. Complementa STACK-02 e CSS-11.
  - **DEC-12 Vitrine `/design-system`**: rota pública fora do menu, link no rodapé. Atualiza DEC-09.
  - **DEC-13 Tema único escuro**: sem `.dark`, sem troca de tema, sem estado de cliente para isso.
  - STACK-05: árvore atualizada com `Emblema`, `IconeStatus`, `BarraStatus`, `CabecalhoPagina`, `app/icon.svg`, `design-system/page.tsx`.

O check de auditoria (`.claude/skills/auditoria-apresentacao`) e `docs/AUDITORIA.md` são atualizados na
última tarefa para incluir as regras novas.

## 8. Testes e verificação

- Testes existentes continuam passando sem alterar o que testam (texto, papéis ARIA, comportamento).
  Se algum teste depender de classe CSS antiga, ajusta-se a asserção para o comportamento.
- Testes novos (React Testing Library, `__tests__/components/`):
  - `BadgeGravidade` mostra o rótulo para as quatro gravidades.
  - `BadgeStatus`/`IconeStatus` mostram o rótulo; o SVG é `aria-hidden`.
  - `BarraStatus` renderiza um segmento por ocorrência e a legenda com os totais e links `?status=`.
  - `CabecalhoPagina` renderiza um único `h1` e a ação quando passada.
  - `Emblema` é `aria-hidden` por padrão.
- A cada tarefa: `npm run test:run`, `npm run lint`, `npm run build`.
- Revisão visual pelo orquestrador no navegador (375 px e 1280 px) após cada tarefa de tela.
- Verificações de regra: `rg -n "style=\{\{" app components` vazio; `rg -n "border-l-[2-9]" app components` vazio;
  `rg -n "#[0-9a-fA-F]{6}" app components -g "!*.svg"` vazio; `rg -n "\.dark|dark:" app components` vazio.

## 9. Execução

Ordem: regras (seção 7) → fundação (tokens, fontes) → marca e assets → `components/ui` um por um →
compartilhados e novos → telas do painel → telas públicas → vitrine → auditoria. Um commit por tarefa.
Tarefas executadas por subagentes (`model: haiku`); o orquestrador revisa código e tela antes da
próxima. `db.json` nunca entra em commit (é estado de execução do json-server).
