# Mapeamento `padroes-wellington` para `frontend-web`

Data: 2026-11-06. Skill antiga: 130 regras em 9 arquivos planos. Skill nova: `.claude/skills/frontend-web/` com `SKILL.md` e 9 pastas de referência. Os IDs mantidos não foram renumerados, porque o app os usa em marcadores como `// [FORM-17]`.

## Totais

| Situação | Regras | O que significa |
|---|---|---|
| Manter | 97 | texto igual; em 14 deles só um exemplo ou termo mudou (ver "Ajuste leve") |
| Reescrever | 29 | mesmo ID, conteúdo novo para API real e produção |
| Remover | 4 | lápide em `references/removidas.md` |
| Novo | 17 | AUTH-12 a 14, API-17 a 19, PROD-01 a 11 |
| Fundir | 0 | nenhuma, ver nota abaixo |

Nota sobre fusão: as sobreposições (API-10 e ROTA-21; API-15 e DEC-02; API-02 e API-17) já eram remissões. Fundir exigiria renumerar IDs usados no código, então ficaram como estão.

## Tabela por ID

| ID | Situação | Destino em `references/` | Nota |
|---|---|---|---|
| COMP-01..16 | manter | `componentes/` (estrutura, props-e-tipos, estado-listas-jsx) | COMP-07: exemplo sem `localhost:3001` (ajuste leve) |
| JS-01..09 | manter | `componentes/javascript-base.md` | JS-02, JS-03: exemplos com papéis genéricos (ajuste leve) |
| ROTA-01..22 | manter | `rotas/` (6 arquivos) | ajuste leve: ROTA-07 (título sem "ERP da Tropa"), ROTA-11 (sem json-server), ROTA-12 (sem pergunta de banca), ROTA-14 (aponta PROD-06) |
| FORM-01..22 | manter | `formularios/` (4 arquivos) | tabela de checklist do slide e índice do arquivo antigo descartados |
| CSS-01..08, 10, 11, 15 | manter | `estilo/` | |
| CSS-09 | manter | `estilo/tema-e-tokens.md` | ajuste leve: "cores da marca" |
| CSS-12, 13, 14 | reescrever | `estilo/tema-e-tokens.md` | tokens, fontes e foco genéricos; nomes da Tropa viram ilustração |
| API-01, 16 | manter | `dados-api/camada-servico.md`, `cliente-http.md` | ajuste leve: sem json-server nem porta 3001; usa `env.API_URL` |
| API-05, 07, 09, 10, 11 | manter | `dados-api/leitura-e-cache.md`, `estados-da-tela.md` | |
| API-15 | manter | `dados-api/leitura-e-cache.md` | ajuste leve: "decisão do projeto" no lugar de "do MVP" |
| API-02 | reescrever | `dados-api/cliente-http.md` | checagem de `res.ok` em um só lugar |
| API-03 | reescrever | `dados-api/cliente-http.md` | `ApiError` com `codigo` e `detalhes`, lido de um formato só |
| API-04 | reescrever | `dados-api/camada-servico.md` | sem `z.coerce.string()` no `id`; abre o envelope de sucesso |
| API-06 | reescrever | `dados-api/leitura-e-cache.md` | sem cache de 60 s por ser API fake; `no-store` por padrão |
| API-08 | reescrever | `dados-api/cliente-http.md` | sem `SESSION_SECRET`; `lib/env.ts` validado (PROD-01) |
| API-12 | reescrever | `dados-api/erros.md` | tabela de status 400/401/403/404/409/422/429/5xx; sem nota do json-server |
| API-13 | reescrever | `dados-api/erros.md` | vale para 5xx, rede, 401, 403, 404; `mensagem` da API só em 4xx sem código conhecido |
| API-14 | reescrever | `dados-api/camada-servico.md` | sem "PUT apaga o resto"; escrita pelo cliente único |
| API-17 | novo | `dados-api/cliente-http.md` | cliente HTTP único, Bearer, timeout, envelope |
| API-18 | novo | `dados-api/erros.md` | código estável vira erro de campo ou geral |
| API-19 | novo | `dados-api/camada-servico.md` | paginação e ordenação conforme a API |
| AUTH-10 | manter | `auth-sessao/verificacao.md` | |
| AUTH-01 | reescrever | `auth-sessao/verificacao.md` | proxy só confere se há cookie; sem laço `/login` para a área privada |
| AUTH-02 | reescrever | `auth-sessao/sessao-e-login.md` | cookie com o JWT da API, expiração alinhada |
| AUTH-04 | reescrever | `auth-sessao/verificacao.md` | papel vem de `GET /auth/me` |
| AUTH-05 | reescrever | `auth-sessao/verificacao.md` | a API confere de novo; exemplo com papel genérico |
| AUTH-06 | reescrever | `auth-sessao/permissoes.md` | 403 da API também leva a `/acesso-negado`; `forbidden()` segue experimental no 16.4 |
| AUTH-07 | reescrever | `auth-sessao/permissoes.md` | "Lanterna só vê o próprio setor" vira escopo por papel |
| AUTH-08 | reescrever | `auth-sessao/sessao-e-login.md` | login chama `POST /auth/login`; 401 e 429 tratados; sem comparar senha |
| AUTH-09 | reescrever | `auth-sessao/sessao-e-login.md` | nota: logout não invalida o JWT na API |
| AUTH-03 | remover | `removidas.md` | cookie HMAC e `SESSION_SECRET`; substituído por AUTH-02, AUTH-04, AUTH-12 |
| AUTH-11 | remover | `removidas.md` | limitações da API fake |
| AUTH-12 | novo | `auth-sessao/sessao-e-login.md` | token só no servidor, `server-only` |
| AUTH-13 | novo | `auth-sessao/sessao-e-login.md` | 401 limpa o cookie por Route Handler |
| AUTH-14 | novo | `auth-sessao/permissoes.md` | CSRF: mutação só por Server Action |
| STACK-02, 03 | manter | `stack/bibliotecas.md` | STACK-02: "design system do projeto" (ajuste leve) |
| STACK-01 | reescrever | `stack/next-e-estrutura.md` | sem o roteiro de criação como `erp-tropa` |
| STACK-05 | reescrever | `stack/next-e-estrutura.md` | árvore genérica com `lib/api.ts`, `env.ts`, `instrumentation.ts` |
| STACK-06 | reescrever | `stack/bibliotecas.md` | sem `json-server`; opcionais `server-only`, Playwright, axe, Sentry |
| STACK-04 | remover | `removidas.md` | json-server, `db.json`, porta 3001 |
| DEC-01, 02 | manter | `stack/bibliotecas.md` | DEC-01 cita o cliente `lib/api.ts` (ajuste leve) |
| DEC-05, 07, 08 | manter | `stack/decisoes-de-produto.md`, `bibliotecas.md`, `next-e-estrutura.md` | |
| DEC-03 | reescrever | `stack/decisoes-de-produto.md` | papéis vêm da API; matriz vira ilustração |
| DEC-04 | reescrever | `stack/decisoes-de-produto.md` | "só troca `API_URL`" valia para a API fake |
| DEC-06 | reescrever | `testes/unitarios-vitest.md` | testa cliente HTTP e `resultadoDeErro`; E2E em PROD-11 |
| DEC-10 | reescrever | `stack/next-e-estrutura.md` | `headers()` e monitoramento permitidos no `next.config.ts` |
| DEC-11, 12 | reescrever | `stack/bibliotecas.md`, `decisoes-de-produto.md` | sem linguagem da Tropa |
| DEC-13 | reescrever | `stack/decisoes-de-produto.md` | tema por tokens; tema único escuro fica como decisão do projeto |
| DEC-09 | remover | `removidas.md` | mapa das áreas do enunciado acadêmico |
| PROD-01 | novo | `producao/ambiente-e-erros.md` | `.env` validado na subida |
| PROD-02, 03 | novo | `producao/seguranca-http.md` | cabeçalhos e CSP com nonce |
| PROD-04 | novo | `producao/seo.md` | metadata, robots, sitemap |
| PROD-05 | novo | `producao/ambiente-e-erros.md` | `onRequestError`, `global-error`, Sentry opcional |
| PROD-06, 07 | novo | `producao/listas-e-mutacoes.md` | listas na URL; `useOptimistic` |
| PROD-08 | novo | `producao/acessibilidade.md` | lint, axe, roteiro manual |
| PROD-09 | novo | `producao/performance.md` | Core Web Vitals; `preload` no lugar de `priority` |
| PROD-10 | novo | `producao/tema-escuro.md` | tokens, sem flash, `global-error` |
| PROD-11 | novo | `testes/e2e-playwright.md` | E2E sobre build de produção e API real |

Também foram descartados, sem ID: o índice e a introdução de cada arquivo antigo, as tabelas de checklist dos slides (ROTAS p. 22, FORMS p. 21, APIS p. 23) e `fontes-e-manutencao.md`, que voltou como `references/fontes-e-manutencao.md` com a tabela de decks e as regras de edição atualizadas.

## Pendências no app (fora do escopo desta tarefa)

O app ainda segue a skill antiga; nada do app foi alterado.

- Marcadores de IDs removidos: `AUTH-03` (1 arquivo), `AUTH-11` (2), `STACK-04` (1), `DEC-09` (1).
- Marcadores de regras reescritas, a revisar com a migração: AUTH-01, 02, 04 a 09; API-02, 03, 04, 06, 12, 13, 14; CSS-12 a 14.
- `lib/sessao.ts` ainda assina cookie com HMAC e lê `SESSION_SECRET`; `package.json` ainda tem o script `api` e `json-server`; `db.json` segue como fixture. Tudo isso contradiz a skill nova até a migração para a API real.
