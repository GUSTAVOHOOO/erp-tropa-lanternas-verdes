# Migração do front-end para a API real

De 2026-11-06, esclarecido em 2026-11-09 (D29). A **ativação** da migração só ocorre quando a API correspondente existe e passa nos testes. A preparação independente pode começar antes, contra o [pacote de contrato](../contratos/README.md), seguindo o [plano FE](PLANO-IMPLEMENTACAO.md) e os [gates de integração](../INTEGRACAO.md). A lista abaixo foi feita lendo a estrutura atual; **confira cada arquivo antes de editar**. Destino em [ARQUITETURA.md](ARQUITETURA.md), sem afirmar que a troca já ocorreu.

Esta migração mexe em dependências, configuração e dados compartilhados; por isso precisa constar no escopo da tarefa, como `AGENTS.md` exige. Desde D28 (2026-11-09), a UI usa a base OANET oficial de [UI.md](../UI.md); não há uma frente de design concorrente que deva ser evitada. Atribua responsável para `components/oanet/` e `app/globals.css` quando extrair e integrar os componentes.

A dependência de API desta página se aplica à **ativação real da migração de dados e sessão**.
A adoção visual UI-01/UI-02 de [PLANO.md](../PLANO.md) preserva os fluxos atuais
até a API correspondente estar pronta e só começa quando o usuário encerrar a
pausa da implementação (DOC-03); a sequência está no [plano FE](PLANO-IMPLEMENTACAO.md)
e o [handoff](../agents/HANDOFF-OANET.md) é histórico. Nenhum dado simulado do
laboratório vira fonte da aplicação real.

## Antes de ativar a API real

- API rodando com seed e testes e2e passando (passos 1 a 4).
- Decisões já fechadas (D21): o usuário atual é `GET /auth/me`, o login devolve `expiresIn` e a ordenação é `?ordenar=` e `?ordem=`.
- `git status --short` conferido, com alterações existentes preservadas e responsáveis definidos; o pacote OANET local ainda pode estar sem commit.

## Camada de dados (`lib/`)

| Arquivo | Hoje | Muda para |
|---|---|---|
| `lib/api.ts` | `urlDaApi` monta URL; cada serviço chama `fetch` | Cliente HTTP único: `fetch` com `Authorization: Bearer` do cookie, abre o envelope `{ sucesso, dados }`, lança `ApiError` com `status`, `codigo` e `detalhes` (API-17, API-02, API-03) |
| `lib/api-error.ts` | `ApiError` com status | Acrescenta `codigo` e `detalhes` do envelope |
| `lib/erro-detalhe.ts` | 401/403 navegam, 404 `notFound` | 404 passa a cobrir "outro Setor"; 401 encerra a sessão pelo Route Handler (AUTH-13) |
| `lib/erros-formulario.ts` | Aplica `errors` por campo | Mapeia também `codigo` da API para campo ou erro geral (API-18) |
| `lib/sessao.ts` | Cookie assinado com HMAC e `SESSION_SECRET` | **Removido** (AUTH-03 foi aposentada). A sessão é o JWT da API. `podeAcessarSetor` e `setorParaFiltro` migram para `lib/escopo.ts` (novo, FE-02) com seus testes |
| `lib/dal.ts` | Cria e lê o cookie assinado; `verificarSessao` não consulta a API | Grava o JWT em cookie `httpOnly`; `verificarSessao` chama `GET /auth/me`; `exigirPapel` usa o que a API devolve |
| `lib/usuarios.ts` | `buscarUsuarioPorEmail` devolve senha para comparar no login | **Removido**. O login é `POST /auth/login`; nenhuma senha chega ao front |
| `lib/setores.ts`, `lib/lanternas.ts`, `lib/ocorrencias.ts` | Filtros do json-server, ids numéricos ou texto | Chamam o cliente único; abrem `dados.itens` e `dados.meta`; filtros e ordenação conforme `API.md` |
| `lib/filtro-ocorrencias.ts` | `status`, `gravidade`, `setor` | Acrescenta `responsavel`, `vencida`, `busca`, `ordenar`, `pagina`, `limite` |
| Novos serviços | | `eventos.ts`, `comentarios.ts`, `dashboard.ts` e funções de Setor e Lanterna para gestão |

## Schemas (`lib/schemas/`)

| Arquivo | Muda |
|---|---|
| `ocorrencia.ts` | `id` e datas conforme a API (UUID, ISO 8601); acrescenta `prazoEm`, `vencida`, `resolvidaEm`; schemas de motivo (reabrir), edição e filtros novos; remove `z.coerce.string()` que existia por causa do json-server |
| `lanterna.ts` | Ficha completa (D13), `estatisticas`, `mentor`, `aprendizes`, `fontes`; status continua `ativo`, `em_missao`, `afastado` |
| `setor.ts` | `id` passa a ser o número do Setor |
| `usuario.ts`, `login.ts` | Remove o schema da senha em texto; acrescenta `cadastroSchema` e o formato de `/auth/me` |
| Novos | `evento.ts`, `comentario.ts`, `dashboard.ts`, `paginacao.ts` (o envelope de lista) |

## Rotas, Actions e proxy

| Arquivo | Muda |
|---|---|
| `proxy.ts` | Continua só conferindo se o cookie existe (AUTH-01); passa a cobrir também as rotas novas do painel |
| `app/(site)/login/actions.ts` | Chama `POST /auth/login`, grava o JWT no cookie e redireciona com `replace`; trata 401 e 429 |
| `app/(painel)/actions.ts` | Sair apaga o cookie (continua) |
| `app/(painel)/painel/ocorrencias/actions.ts` | Trocar `PATCH`/`POST` do json-server pelas rotas de `API.md`; status, atribuição, edição, exclusão, comentar; mostrar `codigo` de erro de regra |
| Novas Actions | `cadastro`, `comentarios`, gestão de Lanternas e Setores, promoção de papel |
| Route Handler novo | Encerra a sessão em 401 da API (AUTH-13) |
| Páginas | Aplicam o filtro de escopo vindo de `verificarSessao` (AUTH-07); `params` e `searchParams` com `await` e validação (ROTA-10, ROTA-11); páginas novas de [TELAS.md](TELAS.md) |

## Configuração e remoções

| Item | Ação |
|---|---|
| `package.json` | Remover `json-server` e o script `api`; reavaliar `iniciar` |
| `scripts/iniciar.sh` | Reescrever para iniciar `backend/` e o Next, ou remover |
| `.env.example` | Remover `SESSION_SECRET`; manter `API_URL`; acrescentar o que PROD-01 exigir |
| `db.json` | Remover do repositório. Os dados passam para o seed da API |
| `app/(site)/page.tsx`, `lib/schemas/usuario.ts`, `lib/sessao.ts`, `lib/usuarios.ts`, `__tests__/configuracao.test.ts` | Têm marcadores de regras removidas (AUTH-03, AUTH-11, STACK-04, DEC-09); limpar na migração |
| `AGENTS.md` | A linha de `db.json` como fixture de testes deixa de valer; atualizar |
| `README.md`, `docs/agents/` | Trocar as instruções de execução e o mapa para o estado novo (ver "Documentação" abaixo) |

## Testes

| Arquivo | Muda |
|---|---|
| `__tests__/lib/servicos.test.ts`, `schemas.test.ts` | Deixam de importar `db.json`; usam fixtures próprias no formato do envelope |
| `__tests__/acoes/ocorrencias.test.ts`, `status-atribuicao.test.ts` | Idem; cobrem os códigos 409 e 422 novos |
| `__tests__/components/compartilhados.test.tsx`, `form-ocorrencia.test.tsx` | Fixtures próprias |
| `__tests__/configuracao.test.ts` | Reflete a configuração nova (sem json-server) |
| `__tests__/proxy.test.ts` | Rotas novas protegidas |
| Novos | Cadastro, fila, linha do tempo, comentários, dashboard, gestão; E2E com Playwright sobre o build e a API real (PROD-11) |

## Ordem sugerida

Esta é a ordem de **preparação**. A ativação real é um corte único: passos 1 a 3 e o dashboard entram juntos, sem publicação intermediária ([INTEGRACAO §3](../INTEGRACAO.md#3-matriz-de-recursos-e-gates)); passos 4 (exceto o dashboard) e 5 são aditivos depois dele.

1. Cliente HTTP, `ApiError`, sessão por JWT e login/cadastro/sair. Marco de preparação: entrar e sair demonstrados no consumidor contra o fake e no provedor isolado.
2. Setores, Lanternas e Ficha (leitura).
3. Ocorrências: lista, detalhe, registrar, status, atribuir.
4. Linha do tempo, Comentários, fila e dashboard.
5. Gestão de Setores, Lanternas e Usuários.
6. Remover json-server, `db.json` e os marcadores obsoletos; E2E.

Cada passo termina com `npm run test:run`, `npm run lint` e `npm run build` relatados; o fluxo é conferido no navegador contra a API real no corte integrado e em cada aditivo.

## Documentação

Ao fim de cada passo, atualize o que ele tornou verdade: `README.md` (tabela "Estado do projeto" e instruções de execução), `docs/agents/MAPA.md`, e a coluna "Estado" de [TELAS.md](TELAS.md). A migração só acaba quando `docs/` não diz mais "destino" para o que já existe.
