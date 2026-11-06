# Contrato da API

Versão de 2026-11-06, decisões fechadas. Base em `API_URL` (porta 3001). Regras em [REGRAS-DE-NEGOCIO.md](REGRAS-DE-NEGOCIO.md), dados em [MODELO-DE-DADOS.md](MODELO-DE-DADOS.md). Padrões de envelope e status vêm da skill `backend-api`.

## Convenções

- **Autenticação:** `Authorization: Bearer <jwt>`. Rota nova nasce protegida; as públicas são marcadas explicitamente. Só o servidor do Next chama a API (ADR 0001).
- **JWT:** algoritmo fixo, expira em 8 h, payload com `sub`, `email` e `papel`. O guard recarrega o usuário do banco (RN-06).
- **Rotas:** substantivos plurais em minúsculas; rotas fixas antes de `:id`; ações de estado como sub-recurso (`/status`, `/responsavel`).
- **Corpo:** DTOs com `class-validator`, `whitelist` e `forbidNonWhitelisted`. Campo desconhecido é 400.
- **CORS:** só a origem do front. Cabeçalhos de proteção com Helmet.
- **Log:** middleware registra método, caminho, status e tempo; nunca senha, `Authorization` ou corpo.

### Envelope

```jsonc
// sucesso
{ "sucesso": true, "dados": { } }

// lista paginada
{ "sucesso": true, "dados": { "itens": [ ], "meta": { "total": 40, "pagina": 1, "limite": 20, "paginas": 2 } } }

// erro
{ "sucesso": false,
  "erro": { "status": 409, "mensagem": "Lanterna afastado", "codigo": "LANTERNA_AFASTADO", "detalhes": [ ] },
  "caminho": "/ocorrencias/…/responsavel", "timestamp": "2026-11-06T12:00:00Z" }
```

`detalhes` só existe em 400. `204` não tem corpo. O front trata erro pelo `codigo`, nunca pelo texto da `mensagem`.

### Paginação e ordenação

`?pagina=1&limite=20`; `limite` máximo 50. Ordenação por `?ordenar=` com lista permitida por rota e desempate pelo `id`; `?ordem=asc|desc`.

## Códigos de erro

| Status | Código | Quando |
|---|---|---|
| 400 | `DADOS_INVALIDOS` | Formato inválido, campo extra, conversão falhou. |
| 401 | `NAO_AUTENTICADO` | Sem token, expirado ou adulterado. |
| 401 | `CREDENCIAIS_INVALIDAS` | Login; mesma resposta para e-mail inexistente e senha errada. |
| 403 | `SEM_PERMISSAO` | Papel insuficiente. |
| 404 | `NAO_ENCONTRADO` | Não existe, ou é de outro Setor para o Lanterna (RN-05). |
| 409 | `EMAIL_JA_CADASTRADO`, `LANTERNA_JA_VINCULADA`, `LANTERNA_AFASTADO`, `LANTERNA_EM_MISSAO`, `SETOR_EM_USO`, `ULTIMO_GUARDIAO`, `OCORRENCIA_RESOLVIDA` | Conflito com o estado atual. |
| 422 | `TRANSICAO_INVALIDA`, `SEM_RESPONSAVEL`, `RESOLUCAO_OBRIGATORIA`, `MOTIVO_OBRIGATORIO`, `RESPONSAVEL_DE_OUTRO_SETOR`, `MENTOR_INVALIDO`, `SETOR_DIFERENTE` | Regra de domínio violada por dado válido. |
| 429 | `MUITAS_TENTATIVAS` | Limite de login. |
| 500 | `ERRO_INTERNO` | Mensagem genérica; detalhe só no log. |

## Rotas

Papéis: **Pub** = pública · **Aut** = qualquer autenticado · **G** = Guardião · **L** = Lanterna (dentro do próprio Setor, quando aplicável).

### Autenticação

| Método e rota | Acesso | Corpo | Sucesso | Erros |
|---|---|---|---|---|
| `POST /auth/cadastro` | Pub | `nome`, `email`, `senha` (8 a 72), `setorId` | 201 `usuario` | 400, 409 `EMAIL_JA_CADASTRADO` |
| `POST /auth/login` | Pub | `email`, `senha` | 200 `{ token, expiresIn, usuario }` | 400, 401 `CREDENCIAIS_INVALIDAS`, 429 |
| `GET /auth/me` | Aut | | 200 `usuario` com `papel`, `lanternaId`, `setorId` | 401 |

O cadastro **não** devolve token; o front chama o login em seguida. (D21)

### Usuários

| Método e rota | Acesso | Corpo | Sucesso | Erros |
|---|---|---|---|---|
| `GET /usuarios` | G | `?busca`, paginação | 200 lista | 401, 403 |
| `PATCH /usuarios/:id/papel` | G | `papel` | 200 `usuario` | 400, 401, 403, 404, 409 `ULTIMO_GUARDIAO` |
| `PATCH /usuarios/:id/lanterna` | G | `lanternaId` (slug ou `null`) | 200 `usuario` | 400, 401, 403, 404, 409 `LANTERNA_JA_VINCULADA`, 422 `SETOR_DIFERENTE` |

### Setores

| Método e rota | Acesso | Corpo | Sucesso | Erros |
|---|---|---|---|---|
| `GET /setores` | Pub | | 200 lista (sem paginação, são poucos) | |
| `GET /setores/:id` | Pub | | 200 | 404 |
| `POST /setores` | G | `id`, `nome`, `descricao` | 201 | 400, 401, 403, 409 (id repetido) |
| `PATCH /setores/:id` | G | `nome`, `descricao` | 200 | 400, 401, 403, 404 |
| `DELETE /setores/:id` | G | | 204 | 401, 403, 404, 409 `SETOR_EM_USO` |

### Lanternas

| Método e rota | Acesso | Corpo | Sucesso | Erros |
|---|---|---|---|---|
| `GET /lanternas` | Pub | `?setor`, `?status`, `?busca`, paginação | 200 lista | 400 |
| `GET /lanternas/:id` | Pub | | 200 **Ficha** (campos de D13 mais `estatisticas`, `mentor`, `aprendizes`) | 404 |
| `POST /lanternas` | G | campos da Ficha | 201 | 400, 401, 403, 409 (id repetido), 422 `MENTOR_INVALIDO` |
| `PATCH /lanternas/:id` | G | campos da Ficha | 200 | 400, 401, 403, 404, 422 `MENTOR_INVALIDO` |
| `PATCH /lanternas/:id/status` | G | `status` | 200 | 400, 401, 403, 404, 409 `LANTERNA_EM_MISSAO` |

`estatisticas` na Ficha: `resolvidas`, `emAndamento`, `tempoMedioResolucaoHoras`, `cargaAtual`. Os campos de `fontes` podem ser expostos na Ficha para mostrar "não verificado".

### Ocorrências

Lanterna é restrito ao próprio Setor em todas elas (RN-05). O servidor ignora `setor` na query para o Lanterna.

| Método e rota | Acesso | Corpo ou query | Sucesso | Erros |
|---|---|---|---|---|
| `GET /ocorrencias` | Aut | `?status`, `?gravidade`, `?setor`, `?responsavel`, `?vencida=true`, `?busca`, `?ordenar=prazo\|criadaEm\|gravidade`, paginação | 200 lista com `prazoEm` e `vencida` | 400, 401 |
| `GET /ocorrencias/minha-fila` | L | paginação | 200 lista atribuída ao usuário, por prazo e Gravidade | 401, 403 (G), 409 (conta sem Lanterna) |
| `GET /ocorrencias/:id` | Aut | | 200 com `prazoEm` e `vencida` | 401, 404 |
| `POST /ocorrencias` | Aut | `titulo`, `descricao`, `planeta`, `gravidade`, `envolvidos`, `setorId` (só G) | 201 | 400, 401, 404 (Setor) |
| `PATCH /ocorrencias/:id` | G ou L criador | `titulo`, `descricao`, `planeta`, `gravidade`, `envolvidos` | 200 | 400, 401, 403, 404, 409 `OCORRENCIA_RESOLVIDA` |
| `PATCH /ocorrencias/:id/status` | Aut | `status`, `resolucao`, `motivo` | 200 | 400, 401, 404, 409, 422 (`TRANSICAO_INVALIDA`, `SEM_RESPONSAVEL`, `RESOLUCAO_OBRIGATORIA`, `MOTIVO_OBRIGATORIO`) |
| `PATCH /ocorrencias/:id/responsavel` | G | `responsavelId` (ou `null` para liberar) | 200 | 400, 401, 403, 404, 409 (`LANTERNA_AFASTADO`, `OCORRENCIA_RESOLVIDA`), 422 `RESPONSAVEL_DE_OUTRO_SETOR` |
| `DELETE /ocorrencias/:id` | G | | 204 (soft delete) | 401, 403, 404 |

Reabrir é `PATCH …/status` com `status: aberta` e `motivo`; só o Guardião.

### Linha do tempo e comentários

| Método e rota | Acesso | Corpo | Sucesso | Erros |
|---|---|---|---|---|
| `GET /ocorrencias/:id/eventos` | Aut | paginação | 200 lista, mais antigo primeiro | 401, 404 |
| `GET /ocorrencias/:id/comentarios` | Aut | paginação | 200 lista | 401, 404 |
| `POST /ocorrencias/:id/comentarios` | G ou L do Setor | `texto` | 201 | 400, 401, 404 |
| `DELETE /comentarios/:id` | autor ou G | | 204; gera Evento | 401, 403, 404 |

### Dashboard

| Método e rota | Acesso | Query | Sucesso | Erros |
|---|---|---|---|---|
| `GET /dashboard` | Aut | `?setor` (só G), `?dias=30` (7 a 90) | 200 `{ porStatus, porGravidade, vencidas, tempoMedioResolucaoHoras, serie, ranking }` | 400, 401 |

`serie` é uma lista de `{ dia, abertas, resolvidas }`; `ranking`, de `{ lanternaId, codinome, resolvidas }`, limitado a 10.

### Sistema

| Método e rota | Acesso | Sucesso |
|---|---|---|
| `GET /saude` | Pub | 200 `{ status: "ok" }`, sem tocar em dados |

## Matriz de permissões

| Operação | Pub | Lanterna | Guardião |
|---|---|---|---|
| Ver Setores e Lanternas (lista e Ficha) | sim | sim | sim |
| Cadastrar-se e entrar | sim | | |
| Ver Ocorrências, eventos e comentários | | só o próprio Setor | todos |
| Registrar Ocorrência | | no próprio Setor | em qualquer Setor |
| Editar Ocorrência | | criador, no Setor, não resolvida | sim |
| Mudar Status | | no próprio Setor (sem reabrir) | sim, inclusive reabrir |
| Atribuir Responsável | | não | sim |
| Excluir Ocorrência | | não | sim |
| Comentar | | no próprio Setor | sim |
| Apagar Comentário | | o próprio | qualquer |
| Minha fila | | sim | não (409/403) |
| Dashboard | | próprio Setor | todos, com filtro |
| Gerir Setores e Lanternas | | não | sim |
| Listar Usuários e mudar Papel | | não | sim |

## Mudanças que o front precisa absorver

- Acesso a Ocorrência de outro Setor deixa de levar a `/acesso-negado` e passa a ser **404** (RN-05). A tela `/acesso-negado` fica só para 403 de papel.
- O front não cria sessão: o login guarda o JWT em cookie `httpOnly` (ADR 0001) e consulta `/auth/me` para papel e Setor.
- Todos os `id` de Ocorrência, Evento, Comentário e Usuário passam a ser UUID; `id` de Lanterna é o slug; `id` de Setor é o número.
- Listas passam a vir paginadas dentro de `dados.itens` e `dados.meta`.
