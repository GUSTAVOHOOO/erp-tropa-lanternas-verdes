# DOC-03: correção do contrato após a revisão (rodada 2)

**Data:** 2026-11-09. **Tarefa:** `task_a3c631090190`, despachada pelo coordenador Orca. **Natureza:** somente documental e contratual. Não houve API, fake HTTP, tela, migration, dependência nova, commit, push, reset, stash, clean nem escrita em `db.json`.

**Modelo.** O host informa, no prompt de sistema desta sessão, "Sonnet 5.5, ID `claude-sonnet-5-5`". É a única atestação disponível; não há chamada do host que a confirme.

**Fontes lidas.** `AGENTS.md` (e as mudanças que outra tarefa fez nele durante a sessão, que não são minhas), `docs/agents/README.md`, `docs/agents/DOC-03-PLANEJAMENTO.md`, `brief-correcao-contrato.md`, `.claude/skills/backend-api/SKILL.md`, [a revisão da rodada 1](rodada-1-contrato.md) inteira, a [pesquisa](../../research/2026-11-09-documentacao-para-agentes.md), `API.md`, `DTOS.md`, `ESCOPO.md`, `REGRAS-DE-NEGOCIO.md`, `MODELO-DE-DADOS.md`, `SEED.md`, `CENARIOS-DE-TESTE.md`, `contratos/README.md`, `validar.py`, o `openapi.json` e o `cenarios.json` originais (por script) e as tabelas de `docs/research/lanternas/grupo-*.md` (por script, só leitura). Não li as referências da skill `backend-api` (`references/`), que a tarefa não exige para estas correções.

## 1. Estado de entrada e de saída

| Comando (raiz do repositório) | Antes (baseline) | Depois |
|---|---|---|
| `py -3 docs/contratos/validar.py` | exit 0, 30 operações | exit 0, 30 operações, 310 cenários |
| `py -3 -m unittest discover -s docs/contratos -p "test_*.py"` | não existia | exit 0, 120 testes |
| `node docs/agents/validar-documentacao.mjs` | exit 0, 47 documentos, 442 links, 15 pastas | exit 0 (ver §8) |
| `git -c core.safecrlf=false diff --check` | exit 0 | exit 0 (ver §8) |

Nenhum teste de API real, bcrypt, concorrência ou integração foi executado, porque nada disso existe ainda.

**Pacote após a rodada:** 30 operações; 144 pares operação×código (142 anteriores, mais `atribuirResponsavel 422 SEM_RESPONSAVEL` e `vincularLanterna 422 VINCULO_NAO_PERMITIDO`), todos com cenário; 310 cenários (92 sucesso, 61 pedido inválido, 155 rejeição, 2 rota desconhecida); 171 exemplos no OpenAPI, todos reconstruídos a partir dos cenários para existir um único "mundo". Nenhum gerador ficou no repositório: os arquivos de dados foram produzidos por scripts descartáveis do scratchpad da sessão, e o `openapi.json` e o `cenarios.json` entregues são estáticos e editáveis à mão. O OpenAPI continua a fonte dos formatos; a versão continua `1.0.0`.

## 2. Resultado por achado

### C-01: liberar Responsável de Ocorrência em andamento (P1, resolvido)

- **Decisão:** D34. `responsavelId: null` em `em_andamento` é 422 `SEM_RESPONSAVEL`, sem mudar status, vínculo, carga nem Eventos; não volta a `aberta`; reatribuir direto continua permitido; liberar `aberta` é permitido; `resolvida` é 409. Rejeição não gera Evento; só atribuição, reatribuição ou liberação efetivas geram `atribuida`; sem mudança é 200 sem Evento.
- **Fontes corrigidas:** ESCOPO (D34), RN-12, RN-15, API.md (nota de `…/responsavel` e tabela), DTOS, OpenAPI (`atribuirResponsavel`: 422 `SEM_RESPONSAVEL` em `x-codigos`, enum, exemplo; `ResponsavelEntrada` e `Evento` descritos), CENARIOS-DE-TESTE.
- **Prova positiva:** `atribuirResponsavel.200.libera-aberta`, `.reatribui-em-andamento`, `.mesmo-responsavel` (sem Evento), `.carga-multipla`.
- **Prova negativa:** `atribuirResponsavel.422.SEM_RESPONSAVEL.liberar-em-andamento` (o validador exige Ocorrência `em_andamento` + `null`; o teste `test_liberar_em_andamento_exige_ocorrencia_em_andamento` troca por uma `aberta` e é recusado) e cobertura do par (`test_cobertura_de_par_operacao_codigo`).
- **Limite:** que "sem mudança de status, carga e Eventos" realmente ocorra só o provedor mostra; o cenário documenta e o validador garante `semMudanca`/ausência de efeitos.

### C-02 e C-03: cenários reproduzíveis e fixtures coerentes (P1/P2, resolvidos)

- **Decisão:** D42. `cenarios.json` virou oráculo de formato **e de pré-condições**: `mundos.base` reutilizável + `ajustes` bem definidos (`mesclar`, `adicionar`, `remover`) + `request` + `esperado` + `efeitos` (mesma gramática). `precondicao` para o que não é dado: `token_*`, `throttle`, `falha_controlada`. `invalidoPor` e `precedencia` marcam os casos em que o pedido é inválido por papel ou de propósito. Criação usa ID novo (faixa 9xx).
- **Correções de C-03 (todas verificadas pelo validador):** Evento `criada` de O1 agora tem autor = criador; linha do tempo de cada Ocorrência termina no estado dela; datas de resolução e reabertura coerentes; afastado/`em_missao` conforme RN-20; busca + ordem + total de Usuários (`listarUsuarios.200.busca-teste-pagina-2`: 5 contas casam "teste", página 2 de limite 2 traz a 3ª e a 4ª pelo nome normalizado, `total 5`, `paginas 3`); `caminho` de cada erro igual ao da rota; IDs novos nas criações; relações (Setor, criador, Responsável, vínculo) e Comentário apagado com Evento correspondente.
- **Cobertura:** os 144 pares têm cenário identificável com estado que permite a falha (49 regras de estado por operação×código no validador, mais 9 cenários "as duas condições verdadeiras" para as precedências). Para 400 há pedidos realmente inválidos (campo extra, UUID e slug malformados, slug com `\n`, `limite=51`, `ordenar=senhaHash`, `busca` de 101 caracteres, senhas) e três modos de invalidez que o schema não decide (`invalidoPor`). Para 401/429/500 a `precondicao` é obrigatória. Nenhum token utilizável.
- **Materialização por frente:** tabela no [README do pacote](../../contratos/README.md); nada implementado.
- **Provas negativas permanentes:** 120 testes. Entre eles: ator sem papel, ator público em rota protegida, 403 com ator errado, 400 com ator sem papel, pedido "inválido" que valida, fixture positiva inválida, 404 com UUID malformado, autor do Evento `criada` ≠ criador, linha do tempo que não chega ao estado, `resolvidaEm` divergente, prazo e `vencida` errados (inclusive pelo relógio do cenário), Responsável e Ficha inexistentes, vínculo com Setor diferente, Ficha em duas contas, status calculado da Ficha, efeito que gera mundo inválido, `caminho` do erro, cobertura de par.
- **Limite:** os `efeitos` são escritos à mão; o validador garante que o estado final é um mundo válido, não que seja o único efeito correto.

### C-04: busca determinística (P2, resolvido)

- **Decisão:** D35/RN-60. Usuários por nome OU e-mail; Lanternas por codinome; Ocorrências por título (nunca descrição). Substring literal do termo aparado; vazio ignorado; mesma normalização (NFD, remover marcas combinantes, minúsculas) no termo e no armazenado; `%`, `_` e `\` literais; consulta parametrizada no banco. Ordenação textual pelo campo normalizado. **Campos internos** no modelo (não expostos no HTTP): `nomeBusca`, `emailBusca` (Usuario), `codinomeBusca` (Lanterna), `tituloBusca` (Ocorrencia), atualizados na mesma transação do campo de origem; nomes são sugestão.
- **Fontes corrigidas:** ESCOPO, RN-60, API.md (seção "Busca"), DTOS, MODELO-DE-DADOS, OpenAPI (descrição dos parâmetros `busca` e das operações), CENARIOS-DE-TESTE.
- **Prova positiva:** `listarUsuarios.200.busca-sem-acento`, `.busca-maiuscula-com-acento`, `.busca-email-com-espacos`, `.busca-vazia-ignorada`, `.busca-sem-resultado`, `.curinga-percentual`, `.curinga-sublinhado`, `.curinga-barra-invertida`; `listarLanternas.200.busca-*` (acento, vazia, sem resultado, curinga); `listarOcorrencias.200.busca-titulo-acento` ("O1" casa "O10") e `.busca-descricao-nao-casa`.
- **Prova negativa:** a função `casa_busca`/`normalizar_busca` do validador tem testes próprios (acento, caixa, Unicode composto e decomposto, trim, vazio, curingas literais, substring ≠ regex); `test_item_que_nao_casa_a_busca`, `test_total_de_usuarios_nao_bate_com_a_busca`, `test_pagina_de_usuarios_fora_da_ordem`.
- **Limite:** o validador confere pertinência à busca nas três listas, e total e ordem só para Usuários; filtros combinados e totais de Lanternas e Ocorrências ficam para o provedor.

### C-05: senha em bytes (P2, resolvido)

- **Decisão:** D36/RN-61. Sem trim (carve-out explícito em API.md e DTOS, que antes diziam "texto é aparado"). Cadastro 8 caracteres a 72 bytes; login 1 a 72 bytes; sem truncamento; excesso é 400 `DADOS_INVALIDOS` com detalhe `senha`, também no login, antes do bcrypt. `x-max-bytes: 72` nos dois schemas, mantendo o limite de caracteres.
- **Prova positiva:** `cadastrarUsuario.201.senha-72-bytes` (36 × `ç`), `.senha-com-espacos`, `entrar.200.senha-72-bytes`.
- **Prova negativa:** `cadastrarUsuario.400…senha-multibyte-74-bytes` e `entrar.400…senha-multibyte-74-bytes` (37 × `ç`: dentro do limite de caracteres, 74 bytes), `senha-73-bytes`, `senha-emoji-76-bytes`, `entrar…senha-vazia`; testes `test_bytes_utf8_do_limite`, `test_erro_de_encoding_vira_invalido_sem_quebrar` (substituto isolado vira `Invalido`), `test_senha_multibyte_acima_do_limite_nao_pode_ser_fixture_positiva`, `test_limite_de_bytes_removido_do_schema_de_senha`.
- **Limite:** o bcrypt e a recusa real antes dele não foram exercitados.

### C-06: pesquisa e seed (P2, resolvido no documento, seed não existe)

- **Decisão:** D37. `primeiraAparicao` sobe para 300 em `LanternaFicha`, `LanternaCriacao` e `LanternaEdicao`; texto aceito em D18 não é truncado; teste de seed validando as 25 Fichas contra o schema é requisito registrado em SEED e ESCOPO.
- **Conferência documental (varredura por script das tabelas de `grupo-a…d`, 25 fichas):** as 17 células preenchidas de `primeiraAparicao` cabem (máximo 138; antes, 3 passavam de 120: Katma Tui 138, Sinestro 133, Boodikka 131). Células que **não podem ser copiadas literalmente** e exigem extração explícita no seed (tabela em [SEED](../../backend/SEED.md)): `identidadeCivil` de Kilowog (89), Sinestro (153) e Boodikka (83), com nota junto do valor; `especie` de Tomar-Re (61), Katma Tui (78) e Soranik Natu (87), `null.` + nota; `habilidades` de Kilowog, Arisia Rrab, Tomar-Re, Katma Tui e Soranik Natu, listas numeradas com `<br>` e nota (item único de 105 a 171 caracteres, limite 60); `codinome` de Laira (frase de 79 caracteres); `anoIngresso` de Kyle Rayner e Salaak sem ano explícito (SEED já manda `null`). Nenhuma célula foi reescrita; a "extração esperada" de cada uma é proposta para o autor do seed conferir contra a pesquisa aceita.
- **Prova:** `criarLanterna.400…primeira-aparicao-301` e `editarLanterna.400…primeira-aparicao-301` (301 caracteres são recusados); o limite de 300 vive só no OpenAPI.
- **Limite:** o seed não existe e o teste de seed não foi escrito nem executado. `biografia`, `citacao` e `habilidades` (itens regulares) foram checados só por script de varredura, com os limites do schema.

### C-07: vínculo de Ficha (P2, resolvido)

- **Decisão:** D38/RN-07/RN-08. Ordem: conta da rota (404) → `null` desvincula → Ficha (404) → alvo Guardião (**422 `VINCULO_NAO_PERMITIDO`**, também com Setor preservado) → Setor da conta e da Ficha não nulos e iguais (422 `SETOR_DIFERENTE`, Ficha sem Setor também) → Ficha de outra conta (409 `LANTERNA_JA_VINCULADA`). Desvincular vale para Guardião promovido e não habilita Minha fila (403). Conta Lanterna sem Setor não é estado válido (o validador recusa esse mundo; não há caso normal impossível). `/papel` com destino `lanterna` em conta já Lanterna troca o Setor sob as mesmas restrições.
- **Código novo** em: `Erro422` (enum), `vincularLanterna` 422 (`x-codigos`, enum, exemplo), tabela de códigos de API.md, ESCOPO, RN, DTOS, README e cenários.
- **Prova positiva:** `vincularLanterna.200`, `.200.desvincular`, `.200.desvincular-guardiao-promovido`, `.200.idempotente`; `alterarPapel.200.rebaixamento-preserva-setor`, `.rebaixamento-com-setor`, `.lanterna-troca-setor`.
- **Prova negativa:** `vincularLanterna.422.VINCULO_NAO_PERMITIDO.guardiao-sem-setor` e `.guardiao-com-setor`, `.422.SETOR_DIFERENTE.setor-distinto` e `.ficha-sem-setor`, `.409.LANTERNA_JA_VINCULADA`, `listarMinhaFila.403…guardiao-promovido-com-vinculo`. **Precedências com as duas condições verdadeiras** (o validador exige): `.422.VINCULO_NAO_PERMITIDO.precede-setor` (Guardião + Ficha sem Setor), `.422.SETOR_DIFERENTE.precede-ja-vinculada`, `.404…ficha-inexistente-precede-guardiao`; `alterarPapel.409.ULTIMO_GUARDIAO.precede-setor`. Testes que quebram cada uma.

### C-08: cobertura de RN-19, D33 e concorrência (P2, resolvido no documento)

- **Decisão:** D39 (com a correção do coordenador): carga múltipla é permitida; RN-23 reescrito como corrida **atribuir × afastar** uma Ficha inicialmente `ativo` (atribuição vence → afastamento 409 `LANTERNA_EM_MISSAO`; afastamento vence → atribuição 409 `LANTERNA_AFASTADO`; nunca Responsável afastado nem histórico parcial); duas atribuições ao mesmo recurso só preservam estado e Eventos serializáveis. A linha antiga ("ambos 409" sobre uma Ficha já `afastado`) saiu.
- **Fontes corrigidas:** RN-19, RN-23, CENARIOS-DE-TESTE (novas seções "Minha fila (RN-19)", "Busca e paginação", "Precedência", linhas de dashboard e de RN-23).
- **Prova:** `listarMinhaFila.200` (empate de prazo por Gravidade e por `id`, resolvida e excluída fora), `.200.paginacao`, `.200.pagina-alem-do-fim`, `.200.vazia`, `.200.fila-vazia-sem-pendentes`, `.403` (inclusive Guardião promovido), `.409.CONTA_SEM_LANTERNA`, `.400…query-desconhecida`; dashboard com série UTC de 7 dias com zeros (`consultarDashboard.200`, `.guardiao-todos`, `.guardiao-setor`, `.sem-resolvidas`); `atribuirResponsavel.200.carga-multipla`; testes `test_minha_fila_fora_da_ordem` e `test_minha_fila_so_pendentes_e_nao_excluidas`.
- **Limite honesto:** a corrida de RN-23 e o rollback de "falha ao gravar o Evento" são linhas de CENARIOS-DE-TESTE para o teste do provedor; não há cenário em `cenarios.json` para elas (dependem de execução concorrente e de injeção no meio da transação). Os números do dashboard foram calculados fora do pacote e conferidos à mão (por exemplo, G com `dias=7`: 5/2/2 por status, 2/2/3/2 por Gravidade, 1 vencida, média 36.0, série 11-03…11-09 com 11-04 resolvidas 1 e 11-05…11-08 abertas 2/2/1/2); o validador não recalcula agregações.

### C-09: validador (P2, resolvido dentro do escopo declarado)

Cada item tem teste negativo permanente em `docs/contratos/test_validar.py`, que muta uma cópia e exige a mensagem do controle correto.

| Item pedido | Controle | Teste negativo |
|---|---|---|
| operações e acesso da API | `x-acesso` × tabela de `API.md`; rotas lidas só das linhas de tabela; status de sucesso e de erro por rota; códigos citados | `test_acesso_do_openapi_diverge_da_tabela`, `…_da_api_md_diverge_do_openapi`, `test_rota_removida_da_api_md`, `test_status_de_sucesso_diverge` |
| 401/403 esperados | 401 em rota protegida; 403 `SEM_PERMISSAO` em rota de papel; rota pública sem `NAO_AUTENTICADO` | `test_rota_protegida_sem_401`, `test_rota_de_papel_sem_403`, `test_rota_publica_nao_declara_nao_autenticado` |
| enum × `x-codigos` | enum do `allOf` == `x-codigos` == exemplos; `ErroNNN` sem órfãos nem faltas; tabela de códigos de API.md == uso | `test_enum_de_codigo_diverge_de_x_codigos`, `test_codigo_novo_precisa_estar_no_erro_422`, `test_tabela_de_codigos_da_api_md_precisa_do_codigo_novo` |
| ator em cenários | ator × acesso × status | `test_ator_sem_papel_da_rota`, `…_publico_em_rota_protegida`, `test_403_exige_ator_sem_o_papel`, `test_400_exige_ator_que_passa_a_esteira` |
| cobertura operação×código | todo par e toda operação com cenário; rota desconhecida | `test_cobertura_de_par_operacao_codigo`, `…_do_codigo_novo_de_vinculo`, `…_de_sucesso_e_de_rota_desconhecida` |
| metadata de páginas | `paginas`, `pagina`, `limite`, tamanho da página, página além do fim | `test_meta_de_paginas_errada`, `test_meta_de_pagina_diverge_do_pedido`, `test_pagina_alem_do_fim_nao_pode_ter_itens` |
| relações e IDs | Setor, criador, Responsável, vínculo, Ficha, e-mail, mentoria, status calculado | série `MundoERelacoes` (22 testes) |
| path × resposta | id da resposta == id do path; resposta == entidade do mundo final | `test_id_da_resposta_diverge_do_path`, `…_do_setor_…`, `test_resposta_diverge_da_entidade_do_mundo` |
| caminho do erro | cenário e exemplos do OpenAPI | `test_caminho_do_erro_diverge_da_rota`, `test_caminho_do_exemplo_do_openapi_fora_da_rota` |
| prazo e vencida pelo relógio | `prazoEm` = `criadaEm` + janela; `vencida` pelo relógio do cenário | `test_prazo_errado`, `test_vencida_incoerente_com_o_relogio`, `test_vencida_segue_o_relogio_do_cenario` |
| autor × criador | Evento `criada` | `test_autor_do_evento_criada_diverge_do_criador` |
| campos críticos | `required` de 9 schemas; `x-max-bytes` | `test_campo_critico_fora_de_required`, `test_limite_de_bytes_removido_do_schema_de_senha` |
| slug absoluto | `re.fullmatch` | `test_slug_com_quebra_de_linha_final_e_recusado` |

**O que o validador não prova** (README, seção "O que o validador NÃO prova"): execução de API, bcrypt, concorrência e rollback; agregações (estatísticas da Ficha, dashboard, médias); ordem e filtros de Ocorrências e Lanternas; que o `efeito` escrito seja o único correto; que um provedor responda como o cenário; o teste de seed; OpenAPI 3.1 integral. **Como o gate impede falso aceite:** `validar.py --hash` imprime o SHA-256 de cada fonte (doze arquivos: as nove fontes mais `validar.py`, `test_validar.py` e o README do pacote, com fim de linha normalizado para LF) e do conjunto; `--conferir-hash` falha com exit 1 se qualquer fonte mudou depois do aceite (`test_conferir_hash_errado_falha_com_codigo_1`). O script não tenta inferir a intenção de uma mudança de schema: o hash a torna visível e obriga nova revisão.

### C-10: precedência e casos menores (P3, resolvido)

- **Decisão:** D40 e D41. Esteira: autenticação → papel da rota → formato → existência e escopo do recurso da rota → autoria → estado/domínio. "Existência" é a do `:id` da rota; referências do corpo entram nas regras de domínio (assim D30/RN-08, em que o último Guardião precede o 404 de Setor do corpo, continuam coerentes). Casos: editar resolvida por L não criador é 403, por autorizado é 409, outro Setor é 404 antes da autoria; L pede `aberta`: resolvida → 403, senão 422; `setorId` proibido ou ausente por papel é 400 com detalhe `setorId`; Comentário de Ocorrência excluída → 404; `ativo` sobre `em_missao` → 409 `LANTERNA_EM_MISSAO`; rota e método desconhecidos → 404 `NAO_ENCONTRADO` com envelope padrão, sem 405; `nao_verificado` como único estado de dado demonstrativo e grafia padronizada no modelo (inclusive `fontes.setorId` no lugar de `fontes.setor` no SEED).
- **Prova:** `editarOcorrencia.403…resolvida-precede-409`, `.404…outro-setor-antes-da-autoria`, `.409.OCORRENCIA_RESOLVIDA.criador` e `.guardiao`; `alterarStatusOcorrencia.403…reabrir-por-lanterna` e `.422.TRANSICAO_INVALIDA.lanterna-pede-aberta`; `criarOcorrencia.400…lanterna-com-setorId` e `…guardiao-sem-setorId`; `excluirComentario.404…ocorrencia-excluida`; `alterarStatusLanterna.409…ativo-sobre-calculado`; `global.404…rota-desconhecida` e `…metodo-desconhecido`; `criarSetor.401…precede-formato` e `.403…precede-formato`; `consultarOcorrencia.400…uuid-malformado` (L674: formato antes da consulta). Testes de quebra: `test_precedencia_de_autoria_antes_do_estado`, `test_esteira_ordem_autenticacao_e_papel_antes_do_formato`, `test_rota_desconhecida_que_existe`.

### Sugestões tratadas

| # | Tratamento |
|---|---|
| 1 `fontes` no PATCH | Substitui o objeto inteiro; omitido preserva; URL com `nao_verificado` é aceita como referência não atestada (D41; `editarLanterna.200.fontes-substitui` e `.fontes-omitido-preserva`). |
| 2 Arredondamento | 2 casas decimais, metade para cima, valores não negativos (D41; OpenAPI `EstatisticasLanterna` e `Dashboard`). |
| 3 RN-34 sem remanejamento | Registrado como limitação deliberada em RN-34, API.md e D41. |
| 4 Nulos em `ordenar` | No fim em asc e desc (`listarLanternas.200.ordenar-setor-asc|desc`, `.ordenar-ano-desc`). |
| 5 `/papel` lanterna→lanterna | Troca de Setor sob as mesmas restrições de vínculo, sem rota nova, só G (D38; `alterarPapel.200.lanterna-troca-setor`, `.422.SETOR_DIFERENTE.troca-setor-lanterna`). |
| 6 `python3` | Documentado no README: neste host `python`/`python3` apontam para a Microsoft Store; o comando é `py -3`. |

## 3. Definições adicionais que eu fechei para tornar o oráculo determinístico

Não estavam no brief. **A coordenação deve confirmar ou reverter**, porque saíram do raciocínio de consistência, não de decisão do usuário:

1. `autor` de Evento e Comentário é o resumo da conta **atual** (papel incluído), derivado, não gravado (API.md; por isso o mundo não guarda `autor`).
2. Atribuir com Ficha inexistente é 404, depois de `resolvida` e `SEM_RESPONSAVEL` e antes de Setor e afastado (RN-15).
3. Revincular a mesma Ficha à mesma conta é 200 sem mudança; vincular outra substitui; `null` numa conta já desvinculada é 200.
4. Atribuir quem já é Responsável, ou liberar `aberta` sem Responsável, é 200 sem mudança e sem Evento.
5. `caminho` do erro é o *pathname* sem query; rota desconhecida responde 404 mesmo sem token (o guard não executa).
6. Ordenação textual (`nome`, `codinome`) usa a forma normalizada de busca; desempate por `id`.
7. Precedência de vínculo: `VINCULO_NAO_PERMITIDO` > `SETOR_DIFERENTE` > `LANTERNA_JA_VINCULADA`, e 404 de Ficha antes de todas.
8. `PATCH …/papel`: 404 da conta, depois último Guardião (409), depois Setor efetivo (404/422), depois `SETOR_DIFERENTE`.
9. A invariante "autor Lanterna do mesmo Setor" não é validada, porque histórico de autoria sobrevive à mudança de papel (descoberto quando um cenário de rebaixamento a violou).

## 4. Impactos para o agente dos planos (lista curta)

- **Decisões e códigos novos:** D34–D42 em ESCOPO; RN-60 e RN-61; códigos `VINCULO_NAO_PERMITIDO` (422, `vincularLanterna`) e `SEM_RESPONSAVEL` também em `PATCH …/responsavel`; rota desconhecida: 404 `NAO_ENCONTRADO`, sem 405.
- **BE (modelo, migrations, seed):** campos internos de busca `nomeBusca`, `emailBusca`, `codinomeBusca`, `tituloBusca` (gravados na mesma transação; preenchidos em migration e seed; nunca expostos); busca por substring literal parametrizada com `%`, `_` e `\` literais; ordenação textual pelo campo normalizado; nulos no fim em `setor`/`anoIngresso`; verificação de **72 bytes UTF-8** da senha no DTO de cadastro e de login, antes do bcrypt, sem trim; `primeiraAparicao` com 300; ordem da esteira (D40) e ordem interna de `/papel`, `/lanterna` e `/responsavel`; Evento `atribuida` só em mudança efetiva; `autor` derivado da conta atual; `caminho` sem query; média com 2 casas (metade para cima).
- **BE (testes):** o teste de seed contra o schema das 25 Fichas (D37, tabela de extração no SEED) é requisito novo; RN-23 vira "atribuir × afastar" (a linha antiga "ambos 409" sai); incluir os cenários de RN-19, precedência, busca, senha e rota desconhecida de CENARIOS-DE-TESTE; materialização do mundo, `ajustes`, `precondicao` (throttle, falha injetada) e `efeitos` conforme o README do pacote.
- **FE:** formulários medem a senha em **bytes** além de caracteres e não aparam; mapear `VINCULO_NAO_PERMITIDO` e `SEM_RESPONSAVEL` (inclusive ao liberar em andamento, que não é mais "voltar a aberta"); tratar 404 de rota desconhecida com o envelope padrão; enviar `busca` crua (o servidor normaliza); `fontes` no PATCH substitui o objeto; consumir cenários por `mundo`+`ajustes`+`request`+`esperado`, no processo Node servidor/teste.
- **Integração e G-1:** o gate usa a versão e o SHA-256 do conjunto de `py -3 docs/contratos/validar.py --hash`; `--conferir-hash` detecta mudança pós-aceite. Os comandos de verificação do pacote são `py -3 docs/contratos/validar.py` e `py -3 -m unittest discover -s docs/contratos -p "test_*.py"`.
- **Índices:** o `README` do pacote e este relatório precisam constar nos índices que o outro agente mantém; `docs/contratos/` já está descrito no índice, e o novo `test_validar.py` não cria pasta nova.

## 5. Limites e riscos honestos

- Nada foi executado contra API real, fake HTTP, banco ou front. O pacote prova coerência documental no subconjunto declarado.
- Os 120 testes provam que o validador recusa as mutações listadas, não que não existam outras contradições que ele aceite. Foram acrescentados controles positivos (o pacote aprovado passa) e mensagens específicas para um teste não passar por causa de outro erro.
- O pacote ficou maior (cenarios.json 328 KB, validar.py 69 KB): é o preço do oráculo com pré-condições. Mantê-lo editável à mão exige disciplina; qualquer mudança de mundo reabre a cobertura.
- `docs/agents/revisoes/README.md`, índices, planos e `INTEGRACAO.md` não foram editados (outra tarefa os possui). Este relatório ainda não consta no `README` das revisões; o verificador de links só exige que os links existentes resolvam.
- `AGENTS.md` e `DESIGN.md` aparecem modificados no `git status` por outra tarefa; não os toquei.

## 6. Arquivos alterados

`docs/contratos/openapi.json`, `docs/contratos/exemplos/cenarios.json`, `docs/contratos/README.md`, `docs/contratos/validar.py`, `docs/contratos/test_validar.py` (novo); `docs/backend/API.md`, `DTOS.md`, `ESCOPO.md`, `REGRAS-DE-NEGOCIO.md`, `MODELO-DE-DADOS.md`, `SEED.md`, `CENARIOS-DE-TESTE.md`; este relatório (novo).

## 7. Hash do pacote congelado

Calculado ao encerrar, por `py -3 docs/contratos/validar.py --hash` (SHA-256, fim de linha normalizado para LF; o conjunto cobre os doze arquivos abaixo, e este relatório não entra no hash). Depois deste ponto nenhum deles foi tocado. **Conjunto: `f31aa1eb270d2712171e8379a3f58c4cd5aa425ffeaccfb38089ef7403a02d64`.**

```text
1836fa15115a7819a603431288921b3cbddb47d6032327adf5d7a35411cd7166  docs/contratos/openapi.json
6e19e93b2597d8f894ddd3442f6be849455177dcf80842dab1bc62260c0f0402  docs/contratos/exemplos/cenarios.json
5ef2ab758238640f5fbad55b47a444257c31ad5880e905275dd24799432133b0  docs/contratos/validar.py
4e5257d3721b0d137135dc62671b731f983a95ed5b7ee0086add3cf8a8d197d1  docs/contratos/test_validar.py
886258196bdce6a4188b5d1d65b1d493ac1d03e824098ec29a12407adf242e5d  docs/contratos/README.md
e360f9fe5e0a70d077dcee32fcbd70ec95da9187d878c082f9bff5cfc9768a98  docs/backend/API.md
9aa6dea5db5c8e39ae8aab2dee2ac276c0bb2bf81018cc93462288b2251aa0ca  docs/backend/DTOS.md
4ea569c2b5dcac23e66b6d278773cd543b9a19b152d6ab4d63c6f68dda0ddd01  docs/backend/REGRAS-DE-NEGOCIO.md
dffb919dc27d04d004f0934f8844199b5f3afb593d49dc2649f792abff3d5ef9  docs/backend/ESCOPO.md
75c496247c0eebaf9ce16a1d893b7e37199d7b019aa133aeb00d7090ceef2ce2  docs/backend/MODELO-DE-DADOS.md
5fc68e25de95f83e6d0771bf1725940f32d3466a15733ed779a1b2c349cf1120  docs/backend/SEED.md
bc0f0bb218e64e97d0a9302bcc3f27b001e2070aa1b2d988d8a104cda1aa58c6  docs/backend/CENARIOS-DE-TESTE.md
```

Isto é um hash de **rascunho validado**, não o registro G-1: a coordenação faz a leitura cruzada, confirma ou reverte as definições da §3 e só então registra versão e hash.

## 8. Execução final

Da raiz do repositório, depois de congelar o pacote:

| Comando | Exit | Resultado |
|---|---|---|
| `py -3 docs/contratos/validar.py --hash` | 0 | `OK documental: 30 operações; 310 cenários …` e os hashes da §7 |
| `py -3 -m unittest discover -s docs/contratos -p "test_*.py"` | 0 | `Ran 120 tests … OK` (~31 s) |
| `node docs/agents/validar-documentacao.mjs` | 0 | 49 documentos, 459 links locais, 15 pastas, 0 falhas |
| `git -c core.safecrlf=false diff --check` | 0 | sem saída |

Observações: o `node` falhou uma vez no meio da tarefa (`ESCOPO.md` linkava este relatório antes de ele existir) e passou depois de o escrever. Os arquivos de documentação do repositório estão em LF na checkout; o git avisa que converterá para CRLF no próximo toque (`core.autocrlf=true`), o que não afeta o hash. Nenhuma execução de API, banco, front, bcrypt ou concorrência ocorreu.
