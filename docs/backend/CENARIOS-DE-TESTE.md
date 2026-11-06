# Cenários de teste

Versão de 2026-11-06. Um cenário para cada regra de [REGRAS-DE-NEGOCIO.md](REGRAS-DE-NEGOCIO.md), no formato **dado, quando, então**. Servem de roteiro para os testes unitários dos services e para os e2e (`supertest`, SQLite em memória). Cada regra tem pelo menos um caminho feliz e um de erro. Além dos cenários abaixo, a suíte e2e cobre a tabela "Prove" da skill `backend-api`.

Nomes: **G** Guardião, **L2814** Lanterna do Setor 2814, **L674** Lanterna do Setor 674. Ocorrência **O1** é do Setor 2814.

## Acesso

| Regra | Dado | Quando | Então |
|---|---|---|---|
| RN-01 | visitante | `POST /auth/cadastro` com `papel: "guardiao"` | 400, nada criado |
| RN-01 | visitante | cadastro válido | 201; `papel` do usuário é `lanterna` |
| RN-02 | e-mail já cadastrado | cadastro repetindo o e-mail (com caixa diferente) | 409 `EMAIL_JA_CADASTRADO` |
| RN-02 | `setorId` inexistente | cadastro | 404 |
| RN-03 | G e um Lanterna | G promove o Lanterna | 200; o Lanterna passa a ser `guardiao` |
| RN-03 | L2814 | L2814 chama `PATCH /usuarios/:id/papel` | 403 |
| RN-04 | um único G no sistema | G se rebaixa | 409 `ULTIMO_GUARDIAO` |
| RN-05 | O1 do Setor 2814 | L674 faz `GET /ocorrencias/:id` | 404 |
| RN-05 | O1 | L674 lista ocorrências | não vê O1; `?setor=2814` é ignorado |
| RN-06 | L2814 promovido a G enquanto tem token válido | usa o mesmo token em rota de G | 200 sem novo login |
| RN-06 | G rebaixado, token antigo | usa rota de G | 403 |
| RN-07 | conta de L2814 sem Ficha | G vincula a Ficha `hal-jordan` | 200; a conta passa a ter Minha fila |
| RN-07 | Ficha do Setor 674 | G a vincula a conta do Setor 2814 | 422 `SETOR_DIFERENTE` |
| RN-07 | Ficha já vinculada a outra conta | G a vincula a mais uma | 409 `LANTERNA_JA_VINCULADA` |
| RN-07 | conta sem Ficha | L chama `GET /ocorrencias/minha-fila` | 409 |
| Login | e-mail inexistente e senha errada | `POST /auth/login` | mesma resposta 401 `CREDENCIAIS_INVALIDAS` nos dois |
| Login | tentativas além de `LOGIN_LIMITE` dentro da janela | próxima tentativa | 429 `MUITAS_TENTATIVAS` |
| Token | token adulterado ou expirado | qualquer rota privada | 401 `NAO_AUTENTICADO` |

## Ocorrência

| Regra | Dado | Quando | Então |
|---|---|---|---|
| RN-10 | L2814 | `POST /ocorrencias` válido | 201; `status = aberta`, sem Responsável, `setorId = 2814`, criador é o usuário do token |
| RN-10 | L2814 | `POST /ocorrencias` enviando `setorId` | 400 |
| RN-10 | G | `POST /ocorrencias` com `setorId = 674` | 201 no Setor 674 |
| RN-10 | G | `setorId` inexistente | 404 |
| RN-11 | O1 `aberta` | muda para `resolvida` | 422 `TRANSICAO_INVALIDA` |
| RN-11 | O1 `em_andamento` | muda para `aberta` por L2814 | 422 `TRANSICAO_INVALIDA` |
| RN-12 | O1 `aberta` sem Responsável | muda para `em_andamento` | 422 `SEM_RESPONSAVEL` |
| RN-12 | O1 `aberta` com Responsável | muda para `em_andamento` | 200 |
| RN-13 | O1 `em_andamento` | resolve com `resolucao` de 5 caracteres | 422 `RESOLUCAO_OBRIGATORIA` |
| RN-13 | O1 `em_andamento` | resolve com 10 ou mais | 200; `resolvidaEm` gravado |
| RN-14 | O1 `resolvida` | G reabre sem `motivo` | 422 `MOTIVO_OBRIGATORIO` |
| RN-14 | O1 `resolvida` | G reabre com `motivo` | 200; `aberta`, `resolucao` e `resolvidaEm` nulos, Responsável mantido |
| RN-14 | O1 `resolvida`, Responsável depois afastado | G reabre | 200; Responsável liberado (`null`) |
| RN-14 | O1 `resolvida` | L2814 tenta reabrir | 403 |
| RN-15 | O1 do 2814 | L2814 tenta atribuir | 403 |
| RN-15 | O1 do 2814 | G atribui Lanterna do Setor 674 | 422 `RESPONSAVEL_DE_OUTRO_SETOR` |
| RN-15 | Lanterna `afastado` do 2814 | G atribui | 409 `LANTERNA_AFASTADO` |
| RN-15 | Lanterna sem Setor (D25) | G atribui | 422 `RESPONSAVEL_DE_OUTRO_SETOR` |
| RN-16 | O1 `resolvida` | G atribui ou edita | 409 `OCORRENCIA_RESOLVIDA` |
| RN-17 | O1 criada por L2814 `aberta` | L2814 edita o título | 200 |
| RN-17 | O1 criada por outro Lanterna do 2814 | L2814 edita | 403 |
| RN-17 | O1 `aberta` `media` | G muda a gravidade para `critica` | 200; `prazoEm` recalculado a partir de `criadaEm` |
| RN-18 | O1 | G exclui | 204; some das listas; `GET` dá 404; Eventos e Comentários permanecem no banco |
| RN-18 | O1 | L2814 exclui | 403 |

## Lanterna e Ocorrência

| Regra | Dado | Quando | Então |
|---|---|---|---|
| RN-20 | Lanterna `ativo` | G o atribui a O1 `aberta` | 200; Lanterna passa a `em_missao`, na mesma transação |
| RN-20 | Lanterna com 1 ocorrência não resolvida | essa ocorrência é resolvida | Lanterna volta a `ativo` |
| RN-20 | Lanterna com 2 ocorrências não resolvidas (`aberta` e `em_andamento`) | uma é resolvida | continua `em_missao` |
| RN-20 | ocorrência não resolvida | é excluída (G) | o Responsável é recalculado; volta a `ativo` se não restar outra |
| RN-20 | O1 resolvida com Responsável `ativo` | G a reabre | Responsável volta a `em_missao` |
| RN-21 | O1 com Responsável A | G reatribui para B | A é reavaliado (volta a `ativo` se livre); B passa a `em_missao` |
| RN-22 | Lanterna `em_missao` | G o afasta | 409 `LANTERNA_EM_MISSAO` |
| RN-22 | Lanterna `ativo` | G o afasta | 200 |
| RN-23 | dois pedidos simultâneos atribuindo o mesmo Lanterna `afastado` | executados juntos | nenhum vence; ambos 409 |
| RN-23 | falha ao gravar o Evento no meio da atribuição | erro injetado | nada muda: Ocorrência, Lanterna e Eventos intactos |

## Prazo

| Regra | Dado | Quando | Então |
|---|---|---|---|
| D9 | O `critica` criada há 25 horas, não resolvida | `GET` | `vencida = true` |
| D9 | O `critica` criada há 23 horas | `GET` | `vencida = false` |
| D9 | O `alta`, `media`, `baixa` com 3, 7 e 14 dias mais 1 minuto | `GET` | `vencida = true` em todas |
| D9 | O vencida e resolvida | `GET` | `vencida = false` |
| D19 | O reaberta | `GET` | `prazoEm` igual ao anterior à reabertura |
| Filtro | 3 ocorrências, 1 vencida | `?vencida=true` | só ela |

## Setores e Lanternas

| Regra | Dado | Quando | Então |
|---|---|---|---|
| RN-30 | L2814 | `POST /setores`, `PATCH /lanternas/:id` | 403 |
| RN-31 | Setor 2814 com Lanternas | G tenta excluir | 409 `SETOR_EM_USO` |
| RN-31 | Setor sem Lanternas nem Ocorrências | G exclui | 204 |
| RN-32 | Lanterna A | `mentorId = A` | 422 `MENTOR_INVALIDO` |
| RN-32 | A mentor de B | A recebe `mentorId = B` | 422 `MENTOR_INVALIDO` |
| RN-32 | A mentor de B, B mentor de C | C recebe `mentorId = A` | 422 `MENTOR_INVALIDO` (ciclo longo) |
| RN-32 | `mentorId` inexistente | `PATCH` | 422 `MENTOR_INVALIDO` |
| RN-33 | qualquer Lanterna | `DELETE /lanternas/:id` | 404 (a rota não existe) |
| Ficha | Lanterna com 3 resolvidas | `GET /lanternas/:id` | `estatisticas.resolvidas = 3`; `mentor` e `aprendizes` preenchidos |
| Ficha | Lanterna só com campos nulos | `GET` | 200 com campos `null` e `fontes` indicando `nao_verificado` |

## Evento e Comentário

| Regra | Dado | Quando | Então |
|---|---|---|---|
| RN-40 | ocorrência nova | criar | 1 Evento `criada` |
| RN-40 | atribuição, mudança de Status, reabertura, resolução | cada ação | 1 Evento do tipo correspondente, com `de` e `para` |
| RN-40 | Evento existente | qualquer tentativa de alterar ou apagar | rota inexistente (404/405) |
| RN-41 | L674 | comenta em O1 (Setor 2814) | 404 |
| RN-41 | L2814 e G | comentam em O1 | 201 |
| RN-41 | comentário existente | tentativa de editar | rota inexistente |
| RN-42 | comentário de L2814 | outro Lanterna do 2814 tenta apagar | 403 |
| RN-42 | comentário de L2814 | o autor apaga | 204; Evento `comentario_apagado`; some da lista |
| RN-42 | comentário de L2814 | G apaga | 204 |
| RN-43 | O1 `resolvida` | L2814 comenta | 201 |

## Dashboard

| Regra | Dado | Quando | Então |
|---|---|---|---|
| RN-50 | ocorrências em 3 Setores | G chama `GET /dashboard` | totais dos 3 Setores |
| RN-50 | idem | G com `?setor=2814` | só o Setor 2814 |
| RN-50 | idem | L2814 com `?setor=674` | só o 2814; o filtro é ignorado |
| RN-51 | 4 resolvidas com durações conhecidas | `GET` | `tempoMedioResolucaoHoras` é a média esperada |
| RN-51 | ocorrências em 30 dias | `GET` | `serie` tem 30 pontos, com zeros nos dias vazios |
| RN-51 | ranking | `GET` | ordenado por resolvidas, no máximo 10 |
| RN-52 | 1 ocorrência excluída | `GET` | não conta em nada |
| Validação | — | `?dias=3` ou `?dias=200` | 400 |

## Contrato e esteira

| Dado | Quando | Então |
|---|---|---|
| qualquer erro esperado | qualquer rota | envelope `{ sucesso: false, erro: { status, mensagem, codigo } }` |
| erro inesperado | qualquer rota | 500 `ERRO_INTERNO` sem stack nem detalhe de banco |
| rota nova sem decorator | chamada sem token | 401 (protegida por padrão) |
| `GET /saude` | sem token | 200 |
| qualquer requisição | — | o log registra método, caminho, status e tempo, sem `Authorization` nem corpo |
| lista | `limite = 51` | 400 |
| lista | `ordenar = senhaHash` | 400 |
