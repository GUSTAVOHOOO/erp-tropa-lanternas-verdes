---
name: frontend-web
description: Regras e armadilhas verificadas de front-end Next.js (App Router, React, TypeScript, Tailwind) em produção, cobrindo componentes, rotas, consumo de uma API real, sessão por cookie, formulários, estilo, ambiente, segurança HTTP, SEO, monitoramento, acessibilidade, desempenho e testes. Usar ao criar, alterar, revisar ou depurar páginas, componentes, formulários, Server Actions, login e permissões no front, ou a ligação do front com a API. Fora de escopo são o back-end, o banco, o hash de senha e a validação de JWT (ver backend-api).
---

# Front-end web em produção

A página decide o que mostrar, a API decide o que é permitido. O navegador nunca vê o token nem chama a API.

## Antes de começar

**Escolha o modo:**

- **Código existente (alterar ou revisar):** preserve helpers, rotas, nomes e os marcadores `// [FORM-17]`. Mude o que o pedido exige; melhoria de estilo ou de arquitetura vira sugestão separada. Divergência entre o código e uma regra é achado: liste, não reescreva por conta própria.
- **Código novo:** siga o padrão do projeto e aplique as regras abaixo onde ele não tiver padrão.

Falha de segurança ou de dados prevalece sobre convenção: corrija, ou avise se estiver fora do pedido.

**Versões:** este Next tem mudanças incompatíveis. Antes de afirmar uma API do Next, leia o guia pertinente em `node_modules/next/dist/docs/` e confira a versão no `package.json`. Se a doc local faltar, diga que usou a oficial e qual versão. Entregue o pedido; extras viram uma linha de sugestão. Nomes como `ocorrencia` e `setor` nas referências são ilustração.

## Regras

Cada linha traz o ID da regra completa (`node .claude/skills/frontend-web/scripts/consultar.mjs ID...`).

### Dados e API

| Errado | Certo |
|---|---|
| `fetch` em página, componente ou em cada `lib/<recurso>.ts` | cliente único `lib/api.ts` (API-17); serviço por recurso (API-01) |
| Resposta da API usada com `as Tipo` | `schema.parse(dados)` com o tipo exato que a API devolve (API-04) |
| `fetch` sem `res.ok`; `catch {}` vazio | `ApiError` com status e `codigo`; cada status tem destino (API-02, API-03, API-12) |
| Comparar texto de erro; mostrar `e.message` ou stack | código estável mapeado para campo ou erro geral; detalhe só no log (API-18, API-13) |
| Lista sem `pagina` e `limite` | paginação conforme o contrato (API-19; interface: PROD-06) |
| `useEffect` + `fetch` no cliente | buscar em Server Component (API-05, API-15) |
| Cache implícito; cache de dado por usuário | `no-store` ou `revalidate` explícito (API-06) |
| `NEXT_PUBLIC_API_URL`; `process.env` espalhado; servidor sobe sem `.env` completo | `lib/env.ts` validado, falha ao iniciar (API-08, PROD-01) |
| Tela com dados sem loading, vazio ou erro | quatro estados; `error.tsx` com `retry` (API-09, API-10, API-11, ROTA-21) |

Envelope, códigos e status vêm da `backend-api` (`references/http-erros.md`); só `lib/api.ts` e `lib/api-error.ts` os conhecem.

### Sessão e permissões

| Errado | Certo |
|---|---|
| Token em `localStorage`, prop, retorno de action ou log | cookie `httpOnly` gravado pelo servidor (AUTH-02, AUTH-12) |
| Cookie ou papel fabricado pelo front; `proxy.ts` como única proteção | papel vem da API; `verificarSessao()` em toda página privada (AUTH-04, AUTH-01) |
| Server Action sem checar sessão | sessão e papel na primeira linha; a API confere de novo (AUTH-05) |
| Comparar senha no front | a action chama o login da API; 401 genérico, 429 com espera (AUTH-08) |
| 401 tratado como 403, ou `redirect('/login')` com cookie inválido | `/sessao-expirada` apaga o cookie (AUTH-13); 403 vai a `/acesso-negado` (AUTH-06) |
| Filtro de escopo vindo da URL ou aplicado no cliente | filtro pelo usuário da sessão, no servidor (AUTH-07) |
| Mutação em `GET` ou em route handler | só Server Action (AUTH-14) |

### Rotas e componentes

| Errado | Certo |
|---|---|
| `'use client'` em layout ou página | só nas folhas interativas (ROTA-08) |
| `params` ou `searchParams` sem `await`, sem validar | `await` e schema; inválido vira padrão ou `notFound()` (ROTA-10, ROTA-11) |
| Filtro e página em `useState`; `<a href>` interno | na URL (ROTA-14, PROD-06); `Link` (ROTA-16) |
| `redirect()` dentro de `try` | fora do `try` (ROTA-20) |
| Componente que busca, valida e desenha; `key={index}`; HTML cru | lógica fora da apresentação, props tipadas, key estável, sem `dangerouslySetInnerHTML` (COMP-02, COMP-06, COMP-07, COMP-13, COMP-16) |

### Formulários

| Errado | Certo |
|---|---|
| `useState` por campo; `onSubmit` sem `handleSubmit`; número sem coerção | RHF + `zodResolver`; `z.coerce` na entrada (FORM-01, FORM-06, FORM-13) |
| Validar só no cliente | mesmo schema, `safeParse` na action (FORM-17, FORM-18) |
| Erro da API perdido ou genérico | erro de campo com `setError`, geral em `root` (FORM-19, API-18) |
| Campo sem label ou sem `aria-invalid`; duplo envio | label, `aria-describedby`, botão desabilitado (FORM-09, FORM-10, FORM-08) |

### Estilo e produção

| Errado | Certo |
|---|---|
| CSS próprio, `style={{}}`, valor mágico, `@apply` | Tailwind pela escala; componente para repetição (CSS-01, CSS-02, CSS-04, CSS-10) |
| Layout só para desktop; cor como único sinal; `outline-none` | mobile-first; rótulo junto da cor; foco visível (CSS-03, CSS-12, CSS-14) |
| Sem cabeçalhos de segurança nem CSP | `headers()` e CSP em modo relatório antes de impor (PROD-02, PROD-03) |
| `<title>` à mão; área privada indexável | `metadata` com template, `robots`, `sitemap` (PROD-04) |
| "Acessível" sem medir; desempenho medido no `dev` | lint, axe e roteiro de teclado; Lighthouse em build (PROD-08, PROD-09) |

## Prove

Teste o erro tanto quanto o sucesso, e relate o que foi realmente executado (lint, `npm run test:run`, `npm run build`, E2E, navegador).

| Cenário | Esperado no front |
|---|---|
| Sem cookie em rota privada | `/login` |
| API responde 401 | `/sessao-expirada`, depois `/login`, cookie apagado |
| 403 | `/acesso-negado` |
| 404 | `notFound()` |
| 409 ou 422 com `codigo` | erro no campo ou mensagem geral, em português |
| 429 | mensagem de aguardar, sem repetir sozinho |
| 5xx ou API fora do ar | `error.tsx` com "Tentar de novo" que funciona |
| Lista vazia, `?pagina=abc` | estado vazio com ação; padrões, sem quebrar |
| Variável de ambiente ausente | a aplicação não sobe |
| Celular (375 px), só teclado | usável; foco sempre visível |

## Referências

As regras acima bastam para a maioria das tarefas. Abra **no máximo duas ou três** referências, as da sua maior dúvida: leia o `README.md` da pasta, escolha **um** arquivo e, se só precisar de uma regra, extraia-a com o script. `consultar.mjs ID...` mostra regras completas; `--listar PREFIXO` (COMP, JS, ROTA, API, AUTH, FORM, CSS, PROD, STACK, DEC) mostra só os títulos.

| Dúvida | Pasta |
|---|---|
| Estrutura de componente, props, estado, JSX, JavaScript | [componentes/](references/componentes/README.md) |
| Pastas de rota, layouts, params, links, loading e erro | [rotas/](references/rotas/README.md) |
| Cliente HTTP, schemas de resposta, cache, erros da API | [dados-api/](references/dados-api/README.md) |
| Cookie, login, logout, papéis, escopo | [auth-sessao/](references/auth-sessao/README.md) |
| RHF, Zod, mensagens, validação no servidor | [formularios/](references/formularios/README.md) |
| Tailwind, tokens, fontes, foco | [estilo/](references/estilo/README.md) |
| Ambiente, headers, CSP, SEO, monitoramento, listas, a11y, desempenho, tema | [producao/](references/producao/README.md) |
| Vitest, Playwright | [testes/](references/testes/README.md) |
| Bibliotecas permitidas, árvore de pastas, decisões | [stack/](references/stack/README.md) |

IDs removidos: [removidas.md](references/removidas.md). Fontes (`[SLIDE]` curso, `[DOCS]` documentação, `[DECISÃO]` projeto) e manutenção: [fontes-e-manutencao.md](references/fontes-e-manutencao.md). Cite ID e origem sem tratar decisão local como exigência externa. Para deploy e hospedagem, siga a documentação oficial da versão instalada e avise quem pediu.

## Antes de entregar

- **Contrato e marcadores:** em código existente, compare cada página e action com a original (rota, props, retorno); diferença sem defeito vira sugestão. Marque a escolha relevante com `// [FORM-17]` ou `{/* [CSS-03] */}`, só com IDs existentes.
- **Segurança:** item ausente das tabelas "Dados e API" e "Sessão e permissões" é defeito: corrija, ou liste se exigir pacote novo (STACK-06).
