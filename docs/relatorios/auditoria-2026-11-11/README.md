# Auditoria de 2026-11-11: back-end e front-end contra o contrato

**Base:** branch local `integracao/back-front` (`main` em `df08c5c` + front do Caio `front/ui-02-bloco-c-gestao-estados` + back `back/tudo` em `af0a6e6`).
**Objetivo:** conferir se o back e o front seguem a documentação e o contrato v1 (30 operações, 310 cenários), nos casos de sucesso e de erro.
**Método:** cinco agentes (modelo Haiku) em paralelo, cada um com escopo próprio; o back foi exercitado por API real em instâncias isoladas (porta e SQLite temporários próprios), o front só por leitura de código e suítes. Um agente único anterior foi interrompido e substituído por esta divisão. Os achados mais graves foram conferidos por amostragem antes de entrar aqui (marcados **conferido**); os demais são relato do agente.

## Relatórios

| Escopo | Arquivo |
|---|---|
| Back: `saude`, `auth`, `usuarios`, `setores` | [back-auth-usuarios-setores.md](back-auth-usuarios-setores.md) |
| Back: `lanternas`, `dashboard` | [back-lanternas-dashboard.md](back-lanternas-dashboard.md) |
| Back: `ocorrencias`, `eventos`, `comentarios` | [back-ocorrencias-comentarios.md](back-ocorrencias-comentarios.md) |
| Front: camada de acesso à API contra o contrato | [front-api.md](front-api.md) |
| Front: telas, estados, suítes de teste e documentação | [front-telas-suites.md](front-telas-suites.md) |

## Resultado em uma página

- **Back-end:** nenhuma operação do contrato está ausente e não houve falha de autorização nem de regra de negócio. Os defeitos eram de validação de entrada, ordenação e formato de erro. **Todos os defeitos corrigíveis foram corrigidos** (tabela abaixo) e cobertos por testes de regressão.
- **Front-end:** das 30 operações, 0 são consumidas do jeito certo, 3 parcialmente, 5 no estilo `json-server` e 22 não são chamadas. O login ainda depende de `GET /usuarios?email=` e de senha em texto, o que o back real recusa. A ligação (Corte 1) é trabalho do front e **não foi feita** nesta rodada.
- **Documentação:** havia marcadores de conflito de merge commitados em `docs/frontend/TELAS.md` e vários documentos afirmavam que o back não existia. Ambos foram corrigidos.

## Defeitos do back-end e situação

Teste de regressão: [`backend/test/correcoes-auditoria.e2e-spec.ts`](../../../backend/test/correcoes-auditoria.e2e-spec.ts) (23 casos; falhavam 20 antes das correções).

| # | Gravidade | Defeito | Situação |
|---|---|---|---|
| 1 | P1 | `GET /lanternas?setor=N` respondia 400 sempre (o filtro recebia número já convertido e o validava como texto). **Conferido.** | **Corrigido** |
| 2 | P2 | Corpo JSON sofria coerção de tipo (`codinome: {"a":1}` gravado como `"[object Object]"`, `titulo: 12345678`, `setorId: "2814"` aceitos). Causa: `enableImplicitConversion` global e `@Type(() => Number)` em corpos. | **Corrigido**: sem conversão implícita; query e path convertidos explicitamente |
| 3 | P2 | Texto só de espaços aceito (título, descrição, planeta, comentário); resolução, motivo e busca sem trim. | **Corrigido** (`@Aparar()` antes da validação de tamanho) |
| 4 | P2 | Parâmetro de query desconhecido aceito em rotas sem DTO (`/saude`, `/auth/me`, `/setores`, `/setores/:id`, `/lanternas/:id`, escritas). | **Corrigido**: interceptor global; 401/403 continuam antes do 400 |
| 5 | P2 | `?pagina=` gigante dava 500 (`datatype mismatch` no SQLite) em `/lanternas` (**conferido**), `/usuarios` e outras listas. | **Corrigido**: 400 `DADOS_INVALIDOS` |
| 6 | P2 | `ordenar=gravidade` de `GET /ocorrencias` saía invertido nas duas direções. A Minha fila (crítica→baixa) estava certa. | **Corrigido** (ordem de domínio baixa→crítica em `asc`) |
| 7 | P2 | Corpo > 100 kB respondia 413 com `codigo: ERRO_INTERNO`. | **Corrigido**: `CORPO_MUITO_GRANDE`; outros 4xx usam `REQUISICAO_NAO_ACEITA` |
| 8 | P2 | Troca de papel para Guardião com `setorId` devolvia `campo: "geral"` e mensagem vazia. | **Corrigido**: `campo: "setorId"` |
| 9 | P2 | JWT sem `exp` era aceito. | **Corrigido**: `exp` obrigatório |
| 10 | P3 | `detalhes` repetia o campo (um item por regra violada). | **Corrigido**: um item por campo, com a lista de mensagens |
| 11 | P3 | Corpo vazio em `PATCH` saía como `campo: "body"`; o contrato usa `corpo`. | **Corrigido** |
| 12 | P3 | Mensagens com acentos quebrados (`UsuÃ¡rio`...) em `usuarios.service.ts` e `id-usuario.pipe.ts`, e títulos de teste. | **Corrigido** |
| 13 | P2 | `npm test` do back também executava os e2e (o `testRegex` casava `*.e2e-spec.ts`). | **Corrigido** (`testPathIgnorePatterns`) |

### Não corrigidos (com o motivo)

| Item | Motivo |
|---|---|
| JWT com validade de 9 h (acima do `JWT_EXPIRES_IN` de 8 h) é aceito | Só se forja com o segredo do servidor, e o guard não conhece a configuração. Risco baixo. |
| UUID em maiúsculas de registro existente dá 404 | O contrato não define normalização de caixa; decisão de produto. |
| Eventos com o mesmo `criadoEm` são desempatados por UUID aleatório | O código cumpre o contrato (`criadoEm asc, id asc`). Não reproduzido pela API com relógio real (0 em 40). Vale decidir um critério determinístico de produto. |
| Login com corpo inválido consome a cota do rate limit | Comportamento do throttler; sem decisão no contrato. |
| Códigos 422 `TRANSICAO_INVALIDA` (atribuir) e `SETOR_OBRIGATORIO` (criar) inalcançáveis e não documentados nessas operações | Documentação/código mortos; remover ou documentar é decisão do dono do contrato. |
| Precedência `afastado` × `em_missao` e resumo de mentor/aprendiz com status armazenado | Latentes: não reproduzidos pela API. |
| `docs/contratos/openapi.json` não lista o 413 `CORPO_MUITO_GRANDE` | Alterar o OpenAPI muda o hash G-1 e exige novo registro. Descrito em `API.md`, fora da tabela de códigos (o validador do contrato exige que a tabela bata com o OpenAPI). |
| `seed-minimo` e `seed-dominio` (e2e) estouram o tempo quando rodam em paralelo com as outras suítes | Já falhavam antes das correções (um dos agentes viu o timeout de `seed-minimo` no `npm test` original). Cada uma passa isolada (cerca de 20 s). Rodar com menos workers (`--maxWorkers=2`) ou aumentar o `testTimeout` resolve; não mexi na configuração de teste do dono do back. |

## Divergências entre documentos (sem escolher lado)

- **409 de "Ficha livre"** em `PATCH /usuarios/:id/lanterna`: o `openapi.json` (`VinculoEntrada`) e a decisão D38 descrevem 409; a RN-07 e a `API.md` dizem 409 apenas se a Ficha já estiver em outra conta. O código segue a RN-07.
- **`consultarSaude.500`** exige falha de repositório em `/saude`, mas a própria documentação diz que `/saude` não toca dados.
- **Ordem 404 × 409** no `POST /lanternas` e **dashboard com Setor inexistente** não estão definidos.
- **Marcador de conflito** em `TELAS.md` e documentos que diziam "back não existe" (corrigidos).

## Front-end: o que falta (resumo; detalhes em [front-api.md](front-api.md) e [front-telas-suites.md](front-telas-suites.md))

- Cliente HTTP único com `Authorization: Bearer`, desembrulhando `{sucesso, dados}` e `dados.itens/meta`.
- Login via `POST /auth/login` com JWT em cookie `httpOnly` (ADR 0001) e `GET /auth/me`; remover o cookie HMAC e a comparação de senha no front.
- Reescrever `lib/ocorrencias.ts`, `lib/lanternas.ts`, `lib/setores.ts`, `lib/usuarios.ts` e os schemas Zod conforme o contrato; usar `PATCH /ocorrencias/:id/status` e `/responsavel`.
- Mapear 409, 422 e 429 por `codigo`; tratar 401 limpando a sessão (há risco de laço `/login` ↔ `/painel`).
- Telas ausentes: `/cadastro`, minha fila, gestão de lanternas/setores/usuários, comentários, linha do tempo, editar/excluir ocorrência.
- `.env.example` versiona um `SESSION_SECRET` fixo; a porta 3001 é compartilhada com o `json-server`.

## Verificação posterior às correções (2026-11-11)

Ver a seção "Registro de execução" abaixo.

## Registro de execução

| Comando | Resultado |
|---|---|
| `npm run build` (backend) | exit 0 |
| `node --experimental-vm-modules … jest-e2e.json test/correcoes-auditoria` | 23/23 passam (antes das correções: 20 falhavam, 3 passavam) |
| `npm test` (backend, unitários) | 9 suítes, 27 testes passam |
| `npm run test:e2e` (backend) | 17 suítes; 16 passam, 1 estoura o tempo na execução paralela (`seed-minimo` na última execução, `seed-dominio` na anterior). Isoladas, as duas passam (1/1 cada, cerca de 20 s) |
| `npx tsc --noEmit`, `npx eslint`, `npm run test:run` (front, raiz) | exit 0; 40 arquivos, 204 testes |

Limites desta auditoria: modelo pequeno nos agentes; erros 500 provocados renomeando tabelas, não por falha injetada no código; concorrência, contraste e acessibilidade não testados.

## Hash G-1

Depois das correções, o validador do contrato rodou com Python 3.14 (`py -3`): `validar.py --hash` exit 0 (30 operações, 310 cenários), `unittest` do pacote exit 0 (120 testes) e a verificação de âncoras da documentação exit 0. O hash do conjunto mudou de `cd91fef5…` para `4e5dfad5…`; o OpenAPI e os cenários são idênticos. O registro foi atualizado em [INTEGRACAO §2](../../INTEGRACAO.md#g-1--aceite-do-contrato).
