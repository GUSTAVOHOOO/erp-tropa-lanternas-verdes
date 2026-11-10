# Cenários de teste

Versão de 2026-11-06, ampliada em 2026-11-09 (rodada 2 do contrato). Um cenário para cada regra de [REGRAS-DE-NEGOCIO.md](REGRAS-DE-NEGOCIO.md), no formato **dado, quando, então**. Servem de roteiro para os testes unitários dos services e para os e2e (`supertest`, SQLite em memória). Cada regra tem pelo menos um caminho feliz e um de erro. Além dos cenários abaixo, a suíte e2e cobre a tabela "Prove" da skill `backend-api`.

**Oráculo comum.** O estado inicial, o request e o resultado exatos de cada operação×código estão em [cenarios.json](../contratos/exemplos/cenarios.json) (mundos reutilizáveis, ajustes, efeitos; ver o [README do pacote](../contratos/README.md)). As tabelas abaixo dizem *o que provar por regra*; o JSON diz *com que dados*. Quando uma linha abaixo e um cenário divergirem, corrija os dois na mesma tarefa. Este arquivo não tem prova de execução: nenhum teste do provedor existe ainda.

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
| RN-07 | Ficha sem Setor (D25) | G a vincula a conta Lanterna do 2814 | 422 `SETOR_DIFERENTE` |
| RN-07 | Ficha já vinculada a outra conta do mesmo Setor | G a vincula a mais uma | 409 `LANTERNA_JA_VINCULADA` |
| RN-07 | Ficha de outro Setor já vinculada a outra conta | G a vincula | 422 `SETOR_DIFERENTE` (precede o 409) |
| RN-07 | conta Guardião sem Setor | G vincula uma Ficha | 422 `VINCULO_NAO_PERMITIDO` |
| RN-07 | Guardião promovido com Setor 2814 preservado | G vincula Ficha livre do 2814 | 422 `VINCULO_NAO_PERMITIDO` |
| RN-07 | Guardião e Ficha sem Setor | G vincula | 422 `VINCULO_NAO_PERMITIDO` (precede `SETOR_DIFERENTE`) |
| RN-07 | Guardião e Ficha inexistente | G vincula | 404 (precede `VINCULO_NAO_PERMITIDO`) |
| RN-07 | Guardião promovido que preservou a Ficha | G envia `lanternaId: null` | 200; vínculo desfeito |
| RN-07 | mesma conta, mesma Ficha | G revincula | 200 sem mudança |
| RN-07 | Guardião promovido com `lanternaId` preservado | chama `GET /ocorrencias/minha-fila` | 403 |
| RN-07 | conta sem Ficha | L chama `GET /ocorrencias/minha-fila` | 409 `CONTA_SEM_LANTERNA` |
| Login | e-mail inexistente e senha errada | `POST /auth/login` | mesma resposta 401 `CREDENCIAIS_INVALIDAS` nos dois |
| Login | tentativas além de `LOGIN_LIMITE` dentro da janela | próxima tentativa | 429 `MUITAS_TENTATIVAS` |
| Token | token adulterado ou expirado | qualquer rota privada | 401 `NAO_AUTENTICADO` |
| Senha | senha de 37 caracteres `ç` (74 bytes) | cadastro ou login | 400 `DADOS_INVALIDOS`, detalhe `senha`; no login, antes do bcrypt |
| Senha | senha de 36 caracteres `ç` (72 bytes) | cadastro | 201 (limite inclusivo) |
| Senha | senha com espaços nas pontas | cadastro | 201; o conteúdo e o tamanho contam os espaços (sem trim) |
| Senha | 73 bytes ASCII; 19 emojis (76 bytes); `senha` vazia no login | cadastro/login | 400 |

## Ocorrência

Os esclarecimentos contratuais também exigem estes cenários de acesso/integridade:

| Regra | Dado | Quando | Então |
|---|---|---|---|
| RN-08 | G com outro Guardião e sem Setor próprio | rebaixa sem `setorId` | 422 `SETOR_OBRIGATORIO`; conta preservada |
| RN-08 | mesma conta e Setor 2814 existente | rebaixa com `setorId: 2814` | 200; papel Lanterna, escopo 2814 |
| RN-08 | conta vinculada à Ficha de 2814 | rebaixa informando 674 | 422 `SETOR_DIFERENTE`; vínculo e papel preservados |
| RN-08 | conta Lanterna de 2814 | promove e usa token anterior | 200; preserva Setor, acesso de Guardião sem limitação de escopo |
| RN-08 | conta Lanterna de 2814 sem Ficha | G envia `papel: lanterna`, `setorId: 674` | 200; Setor da conta passa a 674 |
| RN-08 | conta Lanterna de 2814 com Ficha do 2814 | G envia `papel: lanterna`, `setorId: 674` | 422 `SETOR_DIFERENTE`; nada muda |
| RN-08 | único G, sem Setor | se rebaixa sem `setorId` | 409 `ULTIMO_GUARDIAO` (precede `SETOR_OBRIGATORIO`) |
| RN-08 | destino `guardiao` com `setorId` | `PATCH …/papel` | 400, detalhe `setorId` |
| RN-08 | `setorId` inexistente | rebaixa | 404 |
| RN-31 | Setor apenas com Usuário ligado, sem Lanternas/Ocorrências | G remove Setor | 409 `SETOR_EM_USO`; FK e conta preservadas |
| RN-34 | Ficha 2814 com conta vinculada ou Ocorrência responsável de 2814 | G muda Setor para 674 ou null | 409 `LANTERNA_EM_USO`; todos os vínculos preservados |
| RN-34 | Mesma Ficha com vínculos existentes | G altera apenas biografia | 200; alteração aplicada sem mudar Setor |


| Regra | Dado | Quando | Então |
|---|---|---|---|
| RN-10 | L2814 | `POST /ocorrencias` válido | 201; `status = aberta`, sem Responsável, `setorId = 2814`, criador é o usuário do token |
| RN-10 | L2814 | `POST /ocorrencias` enviando `setorId` | 400, detalhe `setorId` |
| RN-10 | G | `POST /ocorrencias` sem `setorId` | 400, detalhe `setorId` |
| RN-10 | G | `POST /ocorrencias` com `setorId = 674` | 201 no Setor 674 |
| RN-10 | G | `setorId` inexistente | 404 |
| RN-11 | O1 `aberta` | muda para `resolvida` | 422 `TRANSICAO_INVALIDA` |
| RN-11 | O1 `em_andamento` | muda para `aberta` por L2814 | 422 `TRANSICAO_INVALIDA` |
| RN-12 | O1 `aberta` sem Responsável | muda para `em_andamento` | 422 `SEM_RESPONSAVEL` |
| RN-12 | O1 `aberta` com Responsável | muda para `em_andamento` | 200 |
| RN-12 | O1 `em_andamento` com Responsável | G envia `responsavelId: null` | 422 `SEM_RESPONSAVEL`; status, Responsável, `cargaAtual` e Eventos inalterados |
| RN-12 | O1 `aberta` com Responsável | G envia `responsavelId: null` | 200; Responsável `null`; Evento `atribuida` (`de` o anterior, `para` null) |
| RN-12 | O1 `em_andamento` | G reatribui a outro Lanterna válido | 200; Evento `atribuida`; o anterior é reavaliado (RN-20) |
| RN-13 | O1 `em_andamento` | resolve com `resolucao` de 5 caracteres | 422 `RESOLUCAO_OBRIGATORIA` |
| RN-13 | O1 `em_andamento` | resolve com 10 ou mais | 200; `resolvidaEm` gravado |
| RN-14 | O1 `resolvida` | G reabre sem `motivo` | 422 `MOTIVO_OBRIGATORIO` |
| RN-14 | O1 `resolvida` | G reabre com `motivo` | 200; `aberta`, `resolucao` e `resolvidaEm` nulos, Responsável mantido |
| RN-14 | O1 `resolvida`, Responsável depois afastado | G reabre | 200; Responsável liberado (`null`) |
| RN-14 | O1 `resolvida` | L2814 tenta reabrir | 403 |
| RN-14 | O1 `em_andamento` | L2814 pede `aberta` | 422 `TRANSICAO_INVALIDA` (não é reabertura) |
| RN-15 | O1 do 2814 | L2814 tenta atribuir | 403 |
| RN-15 | O1 do 2814 | G atribui Lanterna do Setor 674 | 422 `RESPONSAVEL_DE_OUTRO_SETOR` |
| RN-15 | Lanterna `afastado` do 2814 | G atribui | 409 `LANTERNA_AFASTADO` |
| RN-15 | Lanterna sem Setor (D25) | G atribui | 422 `RESPONSAVEL_DE_OUTRO_SETOR` |
| RN-15 | Lanterna `afastado` de outro Setor | G atribui | 422 `RESPONSAVEL_DE_OUTRO_SETOR` (precede o 409) |
| RN-15 | Ficha inexistente | G atribui | 404 |
| RN-15 | Lanterna já Responsável | G atribui o mesmo | 200 sem mudança e sem Evento |
| RN-15 | Lanterna com várias Ocorrências pendentes | G atribui mais uma | 200; carga múltipla é permitida |
| RN-16 | O1 `resolvida` | G atribui ou edita | 409 `OCORRENCIA_RESOLVIDA` |
| RN-16 | O1 `resolvida` | G libera (`null`) | 409 `OCORRENCIA_RESOLVIDA` |
| RN-16 | O1 `resolvida` e Ficha de outro Setor | G atribui | 409 (o estado precede a Ficha) |
| RN-16 | O1 `resolvida` | criador L2814 edita | 409 |
| RN-17 | O1 criada por L2814 `aberta` | L2814 edita o título | 200 |
| RN-17 | O1 criada por outro Lanterna do 2814 | L2814 edita | 403 |
| RN-17 | O1 `resolvida` criada por outro Lanterna do 2814 | L2814 edita | 403 (a autoria precede o estado) |
| RN-17 | O1 do Setor 2814 | L674 não criador edita | 404 (o escopo precede a autoria) |
| RN-17 | O1 `aberta` `media` | G muda a gravidade para `critica` | 200; `prazoEm` recalculado a partir de `criadaEm` |
| RN-18 | O1 | G exclui | 204; some das listas; `GET` dá 404; Eventos e Comentários permanecem no banco |
| RN-18 | O1 | L2814 exclui | 403 |

## Lanterna e Ocorrência

| Regra | Dado | Quando | Então |
|---|---|---|---|
| RN-20 | Lanterna `ativo` | G o atribui a O1 `aberta` | 200; Lanterna passa a `em_missao`, na mesma transação |
| RN-20 | Lanterna `em_missao` | G envia `status: ativo` | 409 `LANTERNA_EM_MISSAO`; o estado calculado não é apagado |
| RN-20 | corpo com `status: em_missao` | `PATCH …/status` | 400 |
| RN-20 | Lanterna com 1 ocorrência não resolvida | essa ocorrência é resolvida | Lanterna volta a `ativo` |
| RN-20 | Lanterna com 2 ocorrências não resolvidas (`aberta` e `em_andamento`) | uma é resolvida | continua `em_missao` |
| RN-20 | ocorrência não resolvida | é excluída (G) | o Responsável é recalculado; volta a `ativo` se não restar outra |
| RN-20 | O1 resolvida com Responsável `ativo` | G a reabre | Responsável volta a `em_missao` |
| RN-21 | O1 com Responsável A | G reatribui para B | A é reavaliado (volta a `ativo` se livre); B passa a `em_missao` |
| RN-22 | Lanterna `em_missao` | G o afasta | 409 `LANTERNA_EM_MISSAO` |
| RN-22 | Lanterna `ativo` | G o afasta | 200 |
| RN-23 | Lanterna `ativo` sem pendências | G atribui uma Ocorrência e outro G o afasta, ao mesmo tempo | exatamente uma de duas saídas: atribuição 200 e afastamento 409 `LANTERNA_EM_MISSAO`, ou afastamento 200 e atribuição 409 `LANTERNA_AFASTADO`; nunca Responsável `afastado` |
| RN-23 | duas atribuições simultâneas, de Ocorrências diferentes, ao mesmo Lanterna `ativo` | executadas juntas | ambas 200 (carga múltipla); `em_missao`; dois Eventos `atribuida`; sem estado parcial |
| RN-23 | duas atribuições simultâneas da **mesma** Ocorrência a Lanternas diferentes | executadas juntas | uma ordem serial válida: o Responsável final é o da última, o outro volta a `ativo`, Eventos `atribuida` encadeados (`de` = Responsável anterior) |
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
| RN-33 | qualquer Lanterna | `DELETE /lanternas/:id` | 404 `NAO_ENCONTRADO` (a rota não existe; não é 405) |
| RN-34 | Ficha sem conta e sem pendências, Responsável de Ocorrência excluída | G muda o Setor | 409 `LANTERNA_EM_USO` (histórico conta) |
| Ficha | Lanterna com 3 resolvidas | `GET /lanternas/:id` | `estatisticas.resolvidas = 3`; `mentor` e `aprendizes` preenchidos |
| Ficha | Lanterna só com campos nulos | `GET` | 200 com campos `null` e `fontes` indicando `nao_verificado` |

## Evento e Comentário

| Regra | Dado | Quando | Então |
|---|---|---|---|
| RN-40 | ocorrência nova | criar | 1 Evento `criada` |
| RN-40 | atribuição, mudança de Status, reabertura, resolução | cada ação | 1 Evento do tipo correspondente, com `de` e `para` |
| RN-40 | Evento existente | qualquer tentativa de alterar ou apagar | rota inexistente: 404 `NAO_ENCONTRADO` |
| RN-41 | L674 | comenta em O1 (Setor 2814) | 404 |
| RN-41 | L2814 e G | comentam em O1 | 201 |
| RN-41 | comentário existente | tentativa de editar | rota inexistente |
| RN-42 | comentário de L2814 | outro Lanterna do 2814 tenta apagar | 403 |
| RN-42 | comentário de L2814 | o autor apaga | 204; Evento `comentario_apagado`; some da lista |
| RN-42 | comentário de L2814 | G apaga | 204 |
| RN-42 | comentário de Ocorrência excluída | G apaga | 404 |
| RN-42 | comentário já apagado | G apaga | 404 |
| RN-42 | comentário do 2814 | L674 apaga | 404 (escopo antes da autoria) |
| RN-43 | O1 `resolvida` | L2814 comenta | 201 |

## Minha fila (RN-19)

| Regra | Dado | Quando | Então |
|---|---|---|---|
| RN-19 | L2814 vinculado a `hal-jordan` com 4 pendentes de prazos e Gravidades diferentes e uma Ocorrência resolvida, uma excluída | `GET /ocorrencias/minha-fila` | só as 4 pendentes não excluídas; ordem `prazoEm` asc, Gravidade crítica→baixa, `id` asc |
| RN-19 | duas pendentes com o mesmo `prazoEm` e Gravidades diferentes | idem | a mais grave primeiro |
| RN-19 | duas pendentes com mesmo `prazoEm` e mesma Gravidade | idem | menor `id` primeiro |
| RN-19 | Ocorrência atribuída é resolvida, reaberta ou excluída | idem | sai da fila ao resolver ou excluir; volta ao reabrir (Responsável mantido) |
| RN-19 | Ocorrência liberada ou reatribuída | idem | sai da fila do anterior e entra na do novo Responsável |
| RN-19 | G | idem | 403 `SEM_PERMISSAO` |
| RN-19 | conta Lanterna sem Ficha | idem | 409 `CONTA_SEM_LANTERNA` |
| RN-19 | Ficha vinculada sem pendências | idem | 200 com `itens: []`, `total: 0`, `paginas: 0` |
| RN-19 | 3 pendentes | `?pagina=2&limite=2` | 1 item; `meta` com `total 3`, `paginas 2` |
| RN-19 | 3 pendentes | `?pagina=9` | `itens: []`, `total` e `pagina` preservados |
| RN-19 | qualquer | `?setor=2814` | 400 (parâmetro desconhecido) |

## Busca e paginação (RN-60)

| Regra | Dado | Quando | Então |
|---|---|---|---|
| RN-60 | conta "Conta sem vínculo" | `GET /usuarios?busca=vinculo` | a conta aparece (sem acento) |
| RN-60 | contas "Guardião de teste" e "Guardião com Setor de teste" | `?busca=GUARDIÃO` | as duas (caixa e acento) |
| RN-60 | conta `l2814@example.invalid` | `?busca=%20%20L2814@EXAMPLE%20%20` | a conta (trim; busca também no e-mail) |
| RN-60 | qualquer | `?busca=%20%20%20` | busca ignorada: lista completa |
| RN-60 | qualquer | `?busca=zzz-inexistente` | `itens: []`, `total 0`, `paginas 0` |
| RN-60 | conta "Conta 100% a_b\c" e as demais | `?busca=%` , `?busca=_`, `?busca=a_b`, `?busca=\` | só essa conta (curingas literais); `a_b` não casa `axb` |
| RN-60 | 5 contas com "teste", nomes ordenados | `?busca=teste&ordenar=nome&ordem=asc&limite=2&pagina=2` | a 3ª e a 4ª pelo nome normalizado; `total 5`, `paginas 3` |
| RN-60 | Ficha "Lanterna Ágil" | `GET /lanternas?busca=AGIL` e `?busca=ágil` | a Ficha |
| RN-60 | Ocorrências "…O1" e "…O10" | `?busca=ocorrencia de contrato o1` (L2814) | as duas (substring); descrição não é pesquisada |
| RN-60 | Fichas com e sem Setor | `GET /lanternas?ordenar=setor` (asc e desc) e `?ordenar=anoIngresso` | nulos no fim nas duas direções |
| Paginação | 8 Fichas | `?limite=51`, `?pagina=0`, `?ordenar=senhaHash` | 400 |
| Paginação | lista | `?pagina` além do fim | `itens: []`; `total` e `paginas` preservados |

## Precedência (D40)

| Dado | Quando | Então |
|---|---|---|
| O1 do 2814, L2814B não criador | edita | 403 |
| O1 `resolvida`, L2814B não criador do mesmo Setor | edita | 403 (autoria antes do estado) |
| O1 `resolvida`, criador L2814 ou G | edita | 409 |
| O1 do 2814, L674 não criador | edita | 404 (escopo antes da autoria) |
| qualquer rota protegida | sem token e corpo inválido | 401 |
| rota de G | L e corpo inválido | 403 |
| UUID ou slug malformado | qualquer rota com `:id` | 400, sem consultar o recurso |
| `POST /ocorrencias` | L com `setorId`; G sem `setorId` | 400, detalhe `setorId` |

## Dashboard

| Regra | Dado | Quando | Então |
|---|---|---|---|
| RN-50 | ocorrências em 3 Setores | G chama `GET /dashboard` | totais dos 3 Setores |
| RN-50 | idem | G com `?setor=2814` | só o Setor 2814 |
| RN-50 | idem | L2814 com `?setor=674` | só o 2814; o filtro é ignorado |
| RN-51 | 4 resolvidas com durações conhecidas | `GET` | `tempoMedioResolucaoHoras` é a média esperada |
| RN-51 | ocorrências em 30 dias | `GET` | `serie` tem 30 pontos, com zeros nos dias vazios |
| RN-51 | `?dias=7` e relógio 2026-11-09T12:00Z | `GET` | `serie` de 2026-11-03 a 2026-11-09 em ordem crescente, dias UTC, incluindo hoje; totais e média usam todo o histórico |
| RN-51 | Ocorrência com `resolvidaEm` fora da janela de `dias` | `GET` | conta em `porStatus`, média e ranking, mas não em `serie.resolvidas` |
| RN-51 | resoluções de 24 h e 48 h | `GET` | `tempoMedioResolucaoHoras = 36.0` (2 casas decimais, metade para cima) |
| RN-51 | Setor sem Ocorrências | `GET` | contagens zero, média `null`, `ranking` vazio |
| RN-51 | 12 Lanternas com resolvidas | `GET` | `ranking` com 10, resolvidas desc e `lanternaId` asc nos empates |
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
| rota ou método sem correspondência | qualquer chamada, com ou sem token | 404 `NAO_ENCONTRADO` com o envelope padrão e o `caminho` pedido |
| sem token e corpo inválido | `POST /setores` | 401 (a autenticação precede o formato) |
| L2814 e corpo inválido | `POST /setores` | 403 (o papel precede o formato) |
| UUID malformado no path, ator L674 | `GET /ocorrencias/nao-e-uuid` | 400 (o formato precede a consulta do recurso) |
| erro 500 injetado | qualquer rota | corpo genérico `ERRO_INTERNO`, sem stack nem detalhe de banco |
| lista | `ordenar = senhaHash` | 400 |
