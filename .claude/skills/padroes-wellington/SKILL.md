---
name: padroes-wellington
description: Regras de código do projeto "ERP da Tropa dos Lanternas Verdes" (disciplina Desenvolvimento Web com React & Next.js, Prof. Wellington), cada uma com ID e fonte (slide e página, doc oficial ou decisão do grupo). Use SEMPRE que for escrever, revisar, refatorar ou explicar qualquer código desse projeto (componentes, páginas, rotas, layouts, proxy, login, sessão, formulários, schemas Zod, Server Actions, chamadas à API json-server, estilos Tailwind/shadcn, estrutura de pastas), mesmo que o pedido não cite "padrões" nem o professor. Também use para responder "isso está de acordo com o que o professor ensinou?" ou "qual biblioteca devo usar?".
---

# Padrões Wellington

Fonte única das regras de código do projeto. O trabalho vai ser apresentado e o grupo vai
precisar justificar cada linha com o que foi ensinado. Por isso toda regra tem um ID estável e
uma fonte verificável, e o código marca onde cada regra foi aplicada.

## Como usar

1. Antes de escrever código, identifique o assunto e leia só o arquivo de referência dele:

| Assunto | Arquivo | Prefixo |
|---|---|---|
| Componentes, props, estado, JSX | `references/componentes-props-state.md` | COMP |
| Rotas, layouts, navegação, loading/error/not-found | `references/rotas-layouts.md` | ROTA |
| Login, sessão, proxy.ts, papéis, 403 | `references/autenticacao.md` | AUTH |
| Formulários, RHF, Zod, Server Actions | `references/formularios-rhf-zod.md` | FORM |
| fetch, camada de serviço, cache, erros, 4 estados | `references/consumo-apis.md` | API |
| Tailwind, shadcn/ui, responsividade, HTML semântico | `references/estilo-tailwind.md` | CSS |
| JavaScript de base aplicável em React | `references/javascript-base.md` | JS |
| Stack, versões, pastas, json-server, decisões | `references/stack-e-decisoes.md` | STACK / DEC |

2. Ao revisar, confira o código contra o bloco "Como verificar" de cada regra relevante.
3. Ao explicar uma escolha, cite o ID e a fonte exatamente como estão na regra. Nunca diga
   "o professor ensinou X" se a regra não tiver etiqueta `[SLIDE]`.

## Etiquetas de origem (auditabilidade)

Cada regra tem uma linha `**Fonte:**` que começa com uma etiqueta. A primeira etiqueta é a origem
principal; as seguintes são complementos.

- `[SLIDE]`: está nos slides do professor. Sempre com sigla do deck e página.
- `[DOCS]`: vem da documentação oficial atual (Next.js 16, Zod 4, RHF, shadcn, json-server). Não é do professor.
- `[DECISÃO]`: escolha do grupo, para simplificar ou para cobrir algo que os slides não cobrem.

Quando o slide está desatualizado em relação à doc atual, a regra traz `**Nota de versão:**`
explicando a diferença e o que o projeto faz.

Siglas dos decks (páginas = número da página no PDF, capa = p. 1). Os PDFs estão em
`../skill-welinton/` (pasta irmã de `TrabalhoWeb`, dentro de `Desenvolvimento web`):

| Sigla | Arquivo |
|---|---|
| JS | `javascript_fundamentos_dom.pdf` (18 p.) |
| CSS | `css_tailwind_web_development.pdf` (20 p.) |
| JSX | `react_intro_componentes_jsx.pdf` (16 p.) |
| PROPS | `react_props_state_components.pdf` (12 p.) |
| ROTAS | `Rotas, Layouts e Navegação — React Router Next.js App Router.pdf` (23 p.) |
| FORMS | `formularios-validacao-rhf-zod.pdf` (22 p.) |
| APIS | `Consumo de APIs — Fetch, Axios, Loading e Erros no Next.js App Router.pdf` (24 p.) |

## Convenção de IDs

- Formato `PREFIXO-NN` (dois dígitos): `FORM-02`, `API-12`, `DEC-03`.
- IDs são permanentes. Não renumere: se uma regra cair, marque `(removida)` no título e mantenha o número.
- Regra nova entra no fim do arquivo com o próximo número livre.

## Convenção de comentário no código

Marque com o ID só a linha onde a regra é aplicada de fato, para a auditoria achar por busca:

```ts
const parsed = ocorrenciaSchema.safeParse(dados) // [FORM-17]
if (!res.ok) throw new ApiError(res.status) // [API-02][API-03]
```

```tsx
{/* [FORM-10] */}
<p id="titulo-erro" role="alert">{errors.titulo?.message}</p>
```

- Curto: só o ID entre colchetes. A explicação está na regra, não no comentário.
- Não marque o óbvio (todo `const`, todo `className`). Marque a linha que alguém da banca
  apontaria perguntando "por que assim?".
- Uma marcação por aplicação. Se a mesma regra se repete em 10 arquivos iguais, marque todas
  as ocorrências mesmo assim: a auditoria conta por arquivo.
- Nunca invente ID. Se a regra não existe, crie-a primeiro no arquivo de referência.

## Regra geral: simplicidade

O enunciado pede simplicidade e funcionalidade, e cada linha vai ser explicada ao vivo.

- Use só as bibliotecas da stack decidida (`references/stack-e-decisoes.md`, STACK-06):
  Next.js 16, React 19, TypeScript, Tailwind, ESLint, shadcn/ui (Base UI), react-hook-form,
  @hookform/resolvers, zod 4, json-server. Qualquer outra precisa virar regra `[DECISÃO]` antes.
- Axios e TanStack Query aparecem nos slides (APIS p. 8, 9, 15) como opções. A decisão do grupo é
  `fetch` em Server Components (DEC-01, DEC-02).
- Prefira o padrão que aparece no slide quando ele ainda vale na versão atual. Quando não vale,
  siga a doc e registre a nota de versão.
- Um jeito só de fazer cada coisa (um padrão de formulário, um padrão de fetch, um padrão de
  checagem de sessão). Variação dificulta a explicação.
- Não adicione abstração "para o futuro" além do que DEC-04 prevê (trocar `API_URL`).

## Checklist rápido antes de entregar um arquivo

- O arquivo está na pasta prevista em STACK-05?
- `'use client'` só se o componente tem estado, evento ou hook de cliente (ROTA-08)?
- Toda busca passa por `lib/<recurso>.ts` com `res.ok`, `ApiError`, Zod e cache explícito (API-01..06)?
- Todo formulário segue FORM-01..FORM-11 e a Server Action segue FORM-17 e AUTH-05?
- Rota privada chama `verificarSessao()` ou `exigirPapel()` na página (AUTH-04, AUTH-06)?
- Os marcadores `[ID]` estão nas linhas certas?
