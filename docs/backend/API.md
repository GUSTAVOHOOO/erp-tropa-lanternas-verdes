# Contrato da API

Contrato alvo **1.0.0 — 2026-11-09** (rascunho em revisão, ainda não liberado), com as decisões D1–D42. Base em `API_URL` (porta 3001). Este arquivo governa semântica HTTP, acesso e códigos; [openapi.json](../contratos/openapi.json) é a fonte normativa de todos os formatos de entrada/saída. [DTOS.md](DTOS.md) explica validação complementar, sem manter outro schema. Domínio em [REGRAS-DE-NEGOCIO.md](REGRAS-DE-NEGOCIO.md) e [ESCOPO.md](ESCOPO.md). Procedimento de mudança, exemplos e verificação no [pacote de contratos](../contratos/README.md). Este é o destino acordado; não afirma que a API NestJS já existe.

## Convenções

- **Autenticação:** `Authorization: Bearer <jwt>`. Rota nova nasce protegida; as públicas são marcadas explicitamente. Só o servidor do Next chama a API (ADR 0001).
- **JWT:** algoritmo fixo, expira em 8 h, payload com `sub`, `email` e `papel`. O guard recarrega o usuário do banco (RN-06).
- **Rotas:** substantivos plurais em minúsculas; rotas fixas antes de `:id`; ações de estado como sub-recurso (`/status`, `/responsavel`).
- **Corpo:** DTOs com `class-validator`, `whitelist` e `forbidNonWhitelisted`. Campo desconhecido é 400. Texto é aparado antes de medir, **exceto `senha`**, que preserva o conteúdo (D36).
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
  "erro": { "status": 409, "mensagem": "Lanterna afastado", "codigo": "LANTERNA_AFASTADO" },
  "caminho": "/ocorrencias/…/responsavel", "timestamp": "2026-11-06T12:00:00Z" }
```

`detalhes` é obrigatório somente em 400: lista de `{ campo, mensagens: string[] }`. Está ausente em todos os demais erros. `204` não tem corpo. O front trata erro pelo `codigo`, nunca pelo texto da `mensagem`. `caminho` é o *pathname* da requisição, sem query string.

Rota ou método sem correspondência responde **404 `NAO_ENCONTRADO`** com este mesmo envelope (o guard de autenticação não executa; nada indica se a rota existe para outro método). Não há 405 neste contrato: nenhuma implementação o promete.

### Paginação e ordenação

`?pagina=1&limite=20`; `limite` máximo 50. `meta.paginas = ceil(total/limite)`, zero quando total é zero. Página além do fim retorna `itens: []`, preservando a página pedida e os totais. Ordenação por `?ordenar=` com lista permitida por rota e desempate pelo `id`; `?ordem=asc|desc`. Ordenação textual (`nome`, `codinome`) usa a forma normalizada de busca (abaixo). Nas ordenações por `setor` e `anoIngresso` os valores nulos ficam no fim, em `asc` e em `desc`.

### Busca (`?busca=`)

Determinística (D35). Campos: **Usuários** por nome OU e-mail; **Lanternas** por codinome; **Ocorrências** por título (nunca pela descrição). Substring literal do termo aparado; busca vazia (ou só espaços) é ignorada. Texto armazenado e termo passam pela mesma normalização Unicode: NFD, remoção das marcas combinantes (categoria Mn), minúsculas. `%`, `_` e `\` são caracteres comuns, nunca curingas. A consulta é parametrizada e filtrada no banco, sobre campos auxiliares de busca normalizada (ver [modelo de dados](MODELO-DE-DADOS.md)), que não aparecem em nenhuma resposta.

## Códigos de erro

| Status | Código | Quando |
|---|---|---|
| 400 | `DADOS_INVALIDOS` | Formato inválido, campo extra, conversão falhou. |
| 401 | `NAO_AUTENTICADO` | Sem token, expirado ou adulterado. |
| 401 | `CREDENCIAIS_INVALIDAS` | Login; mesma resposta para e-mail inexistente e senha errada. |
| 403 | `SEM_PERMISSAO` | Papel insuficiente. |
| 404 | `NAO_ENCONTRADO` | Não existe, ou é de outro Setor para o Lanterna (RN-05). |
| 409 | `SETOR_JA_CADASTRADO`, `LANTERNA_JA_CADASTRADA`, `CONTA_SEM_LANTERNA`, `LANTERNA_EM_USO`, `EMAIL_JA_CADASTRADO`, `LANTERNA_JA_VINCULADA`, `LANTERNA_AFASTADO`, `LANTERNA_EM_MISSAO`, `SETOR_EM_USO`, `ULTIMO_GUARDIAO`, `OCORRENCIA_RESOLVIDA` | Conflito com o estado atual. |
| 422 | `TRANSICAO_INVALIDA`, `SEM_RESPONSAVEL`, `RESOLUCAO_OBRIGATORIA`, `MOTIVO_OBRIGATORIO`, `RESPONSAVEL_DE_OUTRO_SETOR`, `MENTOR_INVALIDO`, `SETOR_DIFERENTE`, `SETOR_OBRIGATORIO`, `VINCULO_NAO_PERMITIDO` | Regra de domínio violada por dado válido. |
| 429 | `MUITAS_TENTATIVAS` | Limite de login. |
| 500 | `ERRO_INTERNO` | Mensagem genérica; detalhe só no log. |

Corpo JSON acima do limite do servidor (100 kB) responde 413 `CORPO_MUITO_GRANDE`: erro transversal acrescentado em 2026-11-11 (antes saía com o código `ERRO_INTERNO`), mantido fora da tabela e do `openapi.json` para não alterar o contrato aceito (G-1). Outro erro 4xx do cliente sem código próprio responde `REQUISICAO_NAO_ACEITA`; nenhum 4xx usa `ERRO_INTERNO`. Em 400, `detalhes` traz **um item por campo** (`campo` e a lista de `mensagens` daquele campo); o corpo vazio em `PATCH` parcial usa `campo: "corpo"`. Parâmetro de query desconhecido é 400 em **qualquer** rota, inclusive nas que não declaram query (`/saude`, `/auth/me`, `/setores`, `/lanternas/:id`...).

Todas as operações podem responder 500 `ERRO_INTERNO` com mensagem genérica; esse erro transversal está explicitado em cada operação do OpenAPI. Query/path malformado e campo desconhecido são 400. Sem autenticação é 401; papel insuficiente é 403; recurso fora do Setor é 404.

### Ordem de avaliação (esteira)

D40. Cada requisição passa pelas etapas abaixo e responde na **primeira** que falha:

1. autenticação (401);
2. papel exigido pela rota (403);
3. formato do DTO, dos params e da query (400): UUID ou slug inválido é 400 sem consultar o recurso; inclui as regras de formato que dependem do papel ou do destino (Lanterna enviando `setorId` ou Guardião omitindo-o em `POST /ocorrencias`, `setorId` com destino `guardiao` em `/papel`), sempre 400 com detalhe do campo;
4. existência e escopo do **recurso da rota** (`:id`): inexistente, excluído ou de outro Setor para o Lanterna é 404;
5. autoria ou permissão da ação sobre aquele recurso (403);
6. regras de estado e de domínio (409/422), incluindo a existência das referências do corpo (Setor, Ficha, Responsável, mentor), na ordem descrita em cada operação.

Consequências: Lanterna que não é criador, em Ocorrência **resolvida** do próprio Setor, recebe 403 ao editar (o estado só decide para quem é autorizado: 409); em outro Setor recebe 404 antes da autoria. Lanterna que pede `aberta` sobre Ocorrência `resolvida` tenta reabrir (403); se ela não está resolvida, é transição inválida (422).

## Rotas

Papéis: **Pub** = pública · **Aut** = qualquer autenticado · **G** = Guardião · **L** = Lanterna (dentro do próprio Setor, quando aplicável).

### Autenticação

| Método e rota | Acesso | Corpo | Sucesso | Erros |
|---|---|---|---|---|
| `POST /auth/cadastro` | Pub | `nome`, `email`, `senha` (8 caracteres a 72 bytes UTF-8), `setorId` | 201 `usuario` | 400, 404 (Setor), 409 `EMAIL_JA_CADASTRADO` |
| `POST /auth/login` | Pub | `email`, `senha` | 200 `{ token, expiresIn, usuario }` | 400, 401 `CREDENCIAIS_INVALIDAS`, 429 |
| `GET /auth/me` | Aut | | 200 `usuario` com `papel`, `lanternaId`, `setorId` | 400, 401 |

O cadastro **não** devolve token nem cria sessão; após o 201, o front redireciona para `/login`. Entrar é uma ação posterior explícita do usuário. (D21)

Senha (D36): o conteúdo é preservado, sem trim. Cadastro exige no mínimo 8 caracteres Unicode, login no mínimo 1; ambos aceitam no máximo 72 caracteres **e** 72 bytes UTF-8 (limite do bcrypt), sem truncamento silencioso. O excesso é 400 `DADOS_INVALIDOS` com detalhe no campo `senha`, também no login, antes de qualquer comparação com o hash.

### Usuários

| Método e rota | Acesso | Corpo | Sucesso | Erros |
|---|---|---|---|---|
| `GET /usuarios` | G | `?busca` (nome ou e-mail), paginação, `?ordenar=nome\|criadoEm` | 200 lista | 400, 401, 403 |
| `PATCH /usuarios/:id/papel` | G | `papel`, `setorId` condicional | 200 `usuario` | 400, 401, 403, 404, 409 `ULTIMO_GUARDIAO`, 422 `SETOR_OBRIGATORIO`, `SETOR_DIFERENTE` |
| `PATCH /usuarios/:id/lanterna` | G | `lanternaId` (slug ou `null`) | 200 `usuario` | 400, 401, 403, 404, 409 `LANTERNA_JA_VINCULADA`, 422 `VINCULO_NAO_PERMITIDO`, `SETOR_DIFERENTE` |

Promoção preserva `setorId`/`lanternaId`, mas o Guardião ignora o escopo. Para rebaixar, `setorId` é opcional se já houver Setor na conta; sem ele, 422 `SETOR_OBRIGATORIO`. Referência inexistente é 404; Setor incompatível com Ficha, 422 `SETOR_DIFERENTE`. Enviar `setorId` com destino Guardião é 400. Após validar o formato e achar a conta da rota, a proteção do último Guardião (409) precede as regras de Setor, e os 404/422 de Setor precedem `SETOR_DIFERENTE`. Destino `lanterna` em conta que já é Lanterna, com `setorId`, troca o Setor da conta sob as mesmas restrições (conta com Ficha vinculada só aceita o Setor da Ficha; fora disso, desvincule antes). Não há rota nova; só o Guardião opera. (RN-08, D38)

`PATCH /usuarios/:id/lanterna` (D38): `null` desvincula, inclusive Guardião promovido que preservou o vínculo, e é 200 sem mudança se a conta já estava desvinculada. Valor não nulo, nesta ordem: conta da rota inexistente (404), Ficha inexistente (404), **alvo Guardião (422 `VINCULO_NAO_PERMITIDO`, mesmo com Setor preservado)**, conta ou Ficha sem Setor ou com Setores diferentes (422 `SETOR_DIFERENTE`), Ficha já vinculada a outra conta (409 `LANTERNA_JA_VINCULADA`). Revincular a mesma Ficha à mesma conta é 200 sem mudança; vincular outra Ficha a uma conta que já tem uma substitui o vínculo. Vínculo nunca habilita Minha fila para Guardião (403). Conta Lanterna sem Setor não é estado persistido válido e não tem cenário.

### Setores

| Método e rota | Acesso | Corpo | Sucesso | Erros |
|---|---|---|---|---|
| `GET /setores` | Pub | | 200 lista (sem paginação, são poucos) | 400 |
| `GET /setores/:id` | Pub | | 200 | 400, 404 |
| `POST /setores` | G | `id`, `nome`, `descricao` | 201 | 400, 401, 403, 409 `SETOR_JA_CADASTRADO` |
| `PATCH /setores/:id` | G | `nome`, `descricao` | 200 | 400, 401, 403, 404 |
| `DELETE /setores/:id` | G | | 204 | 400, 401, 403, 404, 409 `SETOR_EM_USO` |

`SETOR_EM_USO` inclui referências de Usuários, Lanternas e Ocorrências, inclusive históricas/excluídas: não apagar um Setor ainda referenciado. Setor retorna `{ id, nome, descricao }`; lista é array em `dados`, sem paginação.

### Lanternas

| Método e rota | Acesso | Corpo | Sucesso | Erros |
|---|---|---|---|---|
| `GET /lanternas` | Pub | `?setor`, `?status`, `?busca`, paginação | 200 lista | 400 |
| `GET /lanternas/:id` | Pub | | 200 **Ficha** (campos de D13 mais `estatisticas`, `mentor`, `aprendizes`) | 400, 404 |
| `POST /lanternas` | G | `LanternaCriacao` | 201 Ficha completa | 400, 401, 403, 404 (Setor), 409 `LANTERNA_JA_CADASTRADA`, 422 `MENTOR_INVALIDO` |
| `PATCH /lanternas/:id` | G | `LanternaEdicao` | 200 Ficha completa | 400, 401, 403, 404, 409 `LANTERNA_EM_USO`, 422 `MENTOR_INVALIDO` |
| `PATCH /lanternas/:id/status` | G | `status` | 200 Ficha completa | 400, 401, 403, 404, 409 `LANTERNA_EM_MISSAO` |

Trocar ou limpar `setorId` da Ficha é 409 `LANTERNA_EM_USO` se deixaria uma conta vinculada ou qualquer Ocorrência sob responsabilidade incompatível, inclusive resolvidas/excluídas. Sem troca de Setor, outros campos continuam editáveis (RN-34). Limitação deliberada: depois que uma Ficha acumula histórico em um Setor, este escopo não tem fluxo de remanejamento entre Setores.

`PATCH /lanternas/:id` com `fontes` **substitui o objeto inteiro** quando enviado; omitido, preserva o existente. `estado: nao_verificado` com `url` é aceito como referência não atestada. `PATCH …/status` com `ativo` ou `afastado` sobre Ficha `em_missao` é 409 `LANTERNA_EM_MISSAO`: o estado calculado não pode ser apagado (RN-20/22); `em_missao` nunca é aceito no corpo.

`estatisticas` na Ficha: `resolvidas`, `emAndamento`, `tempoMedioResolucaoHoras`, `cargaAtual`. `fontes` está sempre presente na Ficha (objeto possivelmente vazio), para indicar "não verificado". Lista usa `LanternaLista`; Ficha usa `LanternaFicha`, incluindo `mentorId`, `mentor` como resumo não recursivo e `aprendizes` como lista de resumos. Média sem resolvidas é `null`; com amostra é arredondada a 2 casas decimais, metade para cima (valores não negativos). `cargaAtual` conta abertas + em andamento não excluídas.

### Ocorrências

Lanterna é restrito ao próprio Setor em todas elas (RN-05). O servidor ignora `setor` na query para o Lanterna.

| Método e rota | Acesso | Corpo ou query | Sucesso | Erros |
|---|---|---|---|---|
| `GET /ocorrencias` | Aut | `?status`, `?gravidade`, `?setor`, `?responsavel`, `?vencida=true`, `?busca` (título), `?ordenar=prazo\|criadaEm\|gravidade`, paginação | 200 lista com `prazoEm` e `vencida` | 400, 401 |
| `GET /ocorrencias/minha-fila` | L | paginação | 200 lista pendente atribuída ao usuário, por prazo e Gravidade | 400, 401, 403 (G), 409 `CONTA_SEM_LANTERNA` |
| `GET /ocorrencias/:id` | Aut | | 200 com `prazoEm` e `vencida` | 400, 401, 404 |
| `POST /ocorrencias` | Aut | `titulo`, `descricao`, `planeta`, `gravidade`, `envolvidos`, `setorId` (obrigatório para G, proibido para L: 400 com detalhe `setorId`) | 201 | 400, 401, 404 (Setor) |
| `PATCH /ocorrencias/:id` | G ou L criador | `titulo`, `descricao`, `planeta`, `gravidade`, `envolvidos` | 200 | 400, 401, 403, 404, 409 `OCORRENCIA_RESOLVIDA` |
| `PATCH /ocorrencias/:id/status` | Aut | `status`, `resolucao`, `motivo` | 200 | 400, 401, 403 (reabrir por L), 404, 422 (`TRANSICAO_INVALIDA`, `SEM_RESPONSAVEL`, `RESOLUCAO_OBRIGATORIA`, `MOTIVO_OBRIGATORIO`) |
| `PATCH /ocorrencias/:id/responsavel` | G | `responsavelId` (ou `null` para liberar) | 200 | 400, 401, 403, 404, 409 (`LANTERNA_AFASTADO`, `OCORRENCIA_RESOLVIDA`), 422 (`SEM_RESPONSAVEL`, `RESPONSAVEL_DE_OUTRO_SETOR`) |
| `DELETE /ocorrencias/:id` | G | | 204 (soft delete) | 400, 401, 403, 404 |

Reabrir é `PATCH …/status` com `status: aberta` e `motivo`; só o Guardião (L recebe 403). Limpa resolução/data, mantém Prazo e Responsável, exceto afastado que é liberado (RN-14).

`PATCH …/responsavel` (D34, D39), nesta ordem: Ocorrência inexistente ou fora do escopo (404); `resolvida` (409 `OCORRENCIA_RESOLVIDA`, também ao liberar); `responsavelId: null` em `em_andamento` (**422 `SEM_RESPONSAVEL`**, sem mudar status, vínculo, carga nem Eventos; a Ocorrência não volta a `aberta` e não existe transição nova); `null` em `aberta` libera; Ficha inexistente (404); Ficha sem Setor ou de outro Setor (422 `RESPONSAVEL_DE_OUTRO_SETOR`); Ficha `afastado` (409 `LANTERNA_AFASTADO`). Reatribuir direto uma `em_andamento` para outro Responsável válido é permitido. Um Lanterna pode acumular várias Ocorrências; não há limite de uma por Lanterna. Atribuir quem já é Responsável, ou liberar uma aberta já sem Responsável, é 200 sem mudança e sem Evento; só atribuição, reatribuição ou liberação efetivas geram o Evento `atribuida`. Listas, detalhe e mutações devolvem `Ocorrencia` completa; `setorId`, `criadaPorId`, `responsavelId` são referências, sem relações expandidas.

Minha fila contém somente Ocorrências **não resolvidas e não excluídas**, atribuídas ao `lanternaId` do usuário. Ordem fixa: `prazoEm` asc, Gravidade crítica→baixa, `id` asc. Sem vínculo dá 409 `CONTA_SEM_LANTERNA`; isso não impede registrar/comentar no próprio Setor.

### Linha do tempo e comentários

| Método e rota | Acesso | Corpo | Sucesso | Erros |
|---|---|---|---|---|
| `GET /ocorrencias/:id/eventos` | Aut | paginação | 200 lista, mais antigo primeiro | 400, 401, 404 |
| `GET /ocorrencias/:id/comentarios` | Aut | paginação | 200 lista | 400, 401, 404 |
| `POST /ocorrencias/:id/comentarios` | G ou L do Setor | `texto` | 201 | 400, 401, 404 |
| `DELETE /comentarios/:id` | autor ou G | | 204; gera Evento | 400, 401, 403, 404 |

Comentário de Ocorrência excluída, já excluído, inexistente ou de outro Setor (para o Lanterna) não é alcançável pelo `DELETE`: 404.

Eventos e Comentários usam `criadoEm` asc e `id` asc. O autor vem como `autorId` e `autor: { id, nome, papel }`, sem email; `autor` é o resumo da conta **atual** do autor (uma promoção posterior muda o `papel` exibido, sem reescrever o Evento ou o Comentário). O payload `dados` de Evento é discriminado por `tipo` no OpenAPI: `criada` tem `de:null/para:aberta`; `atribuida` tem slugs `de/para` anuláveis; `status_alterado` representa só aberta→em andamento; `resolvida` tem `de/para/resolucao`; `reaberta` tem `de/para/motivo/responsavelAnteriorId/responsavelId`; `comentario_apagado` contém somente `comentarioId`. Um Evento por ação, sem Evento genérico extra ao resolver/reabrir. Criar Comentário não gera Evento. Comentário apagado não expõe seu texto na linha do tempo.

### Dashboard

| Método e rota | Acesso | Query | Sucesso | Erros |
|---|---|---|---|---|
| `GET /dashboard` | Aut | `?setor` (só G), `?dias=30` (7 a 90) | 200 `{ porStatus, porGravidade, vencidas, tempoMedioResolucaoHoras, serie, ranking }` | 400, 401 |

`serie` é uma lista de `{ dia, abertas, resolvidas }` em ordem crescente, com zeros nos dias sem movimento. `dias` limita somente essa série: dias corridos em UTC, incluindo hoje e os `dias−1` anteriores. `abertas` conta criações no dia e `resolvidas` conta `resolvidaEm` atual. As demais métricas consideram todo o histórico não excluído no escopo autorizado.

`porStatus` e `porGravidade` têm todas as chaves dos enums, inclusive com zero; `tempoMedioResolucaoHoras` é `null` sem resolvidas. `ranking` contém `{ lanternaId, codinome, resolvidas }`, somente Lanternas com resolvidas, no máximo 10, ordenado por resolvidas desc e `lanternaId` asc.

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
| Minha fila | | pendentes; sem vínculo 409 | não (403) |
| Dashboard | | próprio Setor | todos, com filtro |
| Gerir Setores e Lanternas | | não | sim |
| Listar Usuários e mudar Papel | | não | sim |

## Mudanças que o front precisa absorver

- Acesso a Ocorrência de outro Setor deixa de levar a `/acesso-negado` e passa a ser **404** (RN-05). A tela `/acesso-negado` fica só para 403 de papel.
- O front não cria sessão: o login guarda o JWT em cookie `httpOnly` (ADR 0001) e consulta `/auth/me` para papel e Setor.
- Todos os `id` de Ocorrência, Evento, Comentário e Usuário passam a ser UUID; `id` de Lanterna é o slug; `id` de Setor é o número.
- Listas passam a vir paginadas dentro de `dados.itens` e `dados.meta`.
