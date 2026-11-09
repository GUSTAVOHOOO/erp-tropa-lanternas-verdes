# Escopo e decisões do back-end

Registro de 2026-11-06. Reúne o enunciado do professor e as decisões acordadas com o usuário. Termos do domínio estão em [GLOSSARY.md](../../GLOSSARY.md); a escolha do token está em [ADR 0001](../adr/0001-token-jwt-fica-no-servidor-do-next.md).

## Enunciado (requisitos mínimos)

Back-end da aplicação do trabalho anterior, atendendo a todas as funcionalidades do front-end, com **NestJS + TypeORM + SQLite**.

| Tema | Obrigatório |
|---|---|
| API REST | Rotas que atendam ao front, com métodos HTTP, parâmetros, query params e status codes adequados |
| Validação e erros | DTOs com class-validator, middleware de log, respostas padronizadas de sucesso e erro (interceptor e filtro global) |
| Arquitetura | Controller, service e repository; regras de negócio no service |
| Banco | SQLite com TypeORM, entidades com relacionamentos, seed com dados de exemplo |
| CRUD | Create, Read, Update e Delete para as principais entidades |
| Autenticação | Cadastro e login com senha em hash (bcrypt); token JWT; rotas privadas protegidas por Guard (401); pelo menos uma rota restrita por papel (403) |
| Integração | O front consome a API no lugar de dados fixos |

## Mudanças em relação à spec original

- **Cadastro de usuários**, antes fora do escopo, passa a ser requisito.
- **json-server e `db.json` saem** quando a migração terminar. Nada fica mockado.
- A skill `padroes-wellington` vira a skill de front-end de produção `frontend-web`; a skill `backend-api` cobre o back-end.

## Decisões acordadas

| # | Decisão |
|---|---|
| D1 | O back-end fica em `backend/`, neste repositório, com `package.json` próprio. Sobe na porta 3001 e o `API_URL` do front não muda. |
| D2 | O JWT fica num cookie `httpOnly` lido só pelo servidor do Next (ADR 0001). O cookie HMAC do front é aposentado. |
| D3 | O cadastro é público e sempre cria um Lanterna, que escolhe o Setor. O Papel nunca vem do corpo da requisição. O Guardião nasce pelo seed ou por promoção feita por outro Guardião em `PATCH /usuarios/:id/papel` (a rota restrita por papel, que responde 403). |
| D4 | Entidades: Setor, Lanterna, Usuário, Ocorrência. Setor 1—N Lanterna; Setor 1—N Ocorrência; Lanterna 1—N Ocorrência (Responsável); Usuário 1—N Ocorrência (criador); Usuário 1—1 Lanterna (opcional). Ocorrência é excluída por soft delete. O seed reaproveita os dados atuais do `db.json`. |
| D5 | Features extras: **(a)** linha do tempo com Eventos automáticos, **(b)** Comentários, **(c)** dashboard com agregações feitas no banco, **(d)** busca, filtros e paginação. Bônus se sobrar tempo: anéis de poder e prazo/prioridade. |
| D6 | Ordem: 1) back-end com contrato e testes; 2) migração do front (`lib/*`, Actions, `dal.ts`, `proxy.ts`, remover `db.json`); 3) skill de front-end com o contrato real em mãos; 4) features nas telas. O agente de UI segue no visual em paralelo. |
| D7 | Ciclo de vida da Ocorrência: `aberta → em_andamento → resolvida`, sem pular etapas. Só entra em andamento com Responsável. Resolver exige explicação (mín. 10 caracteres). Reabrir (`resolvida → aberta`) é só do Guardião e exige motivo. Transição inválida responde 422. |
| D8 | Lanterna e Ocorrência se influenciam: Lanterna `afastado` não recebe Atribuição (409). Atribuir passa o Lanterna a `em_missao`; sem nenhuma Ocorrência em andamento ele volta a `ativo`. Tudo na mesma transação. |
| D9 | Prazo por Gravidade: crítica 24 h, alta 3 dias, média 7 dias, baixa 14 dias, contados de `criadaEm`. "Vencida" é derivada e devolvida pela API, sem tarefa agendada. O painel destaca e ordena por prazo. |
| D10 | Gestão restrita ao Guardião: criar, editar e remover Setor; criar e editar Lanterna; afastar e reativar. Setor ou Lanterna com Ocorrências não é removido (409). |
| D11 | Telas novas: Ficha completa do Lanterna (`/lanternas/[id]`) e Minha fila (ocorrências atribuídas ao Lanterna logado, ordenadas por prazo e Gravidade). Sem notificações, porque não há tempo real. |
| D12 | Elenco de cerca de 25 Lanternas conhecidos (os 6 do seed mais 19 marcantes), cada um no Setor canônico. O seed passa a ter pelo menos 8 Setores. |
| D13 | Campos da Ficha: codinome, identidade civil, espécie, planeta natal, Setor, ano de ingresso, primeira aparição, habilidades, mentor (auto-relacionamento Lanterna—Lanterna), citação, biografia curta. Calculados na hora: resolvidas, em andamento, tempo médio e carga atual. Sem foto; o visual é gerado em código. O Status continua sendo estado do sistema (D8), não dado de pesquisa. |
| D14 | Fontes: páginas oficiais da DC e referências bibliográficas de quadrinhos. Wikis de fãs só para localizar o que verificar. Campo sem fonte fica nulo e marcado "não verificado"; nada é inventado. A pesquisa vai para `docs/research/lanternas/` antes de virar seed. |
| D15 | Pesquisa por 4 agentes Haiku em paralelo, ~6 Lanternas cada, cada um com seu arquivo. O resultado é auditado e unido antes de virar seed. |
| D16 | Evento é gerado na criação, atribuição, mudança de Status, reabertura, resolução e comentário apagado; é imutável. Comenta o Guardião e o Lanterna do mesmo Setor. Comentário não se edita; o autor ou um Guardião o apaga (soft delete). |
| D17 | Dashboard: o Guardião vê tudo, com filtro por Setor; o Lanterna vê só o próprio Setor. Métricas agregadas no banco: Status, Gravidade, vencidas, tempo médio de resolução, série de 30 dias e ranking de Lanternas por resolvidas. |
| D18 | Pesquisa dos Lanternas encerrada em 2026-11-06: os 4 arquivos de `docs/research/lanternas/` foram conferidos pelo usuário nas fontes e aceitos como estão, sem nova auditoria. Entram no seed na conversão. |
| D19 | Ciclo de vida, regras extras: reabrir limpa a resolução e mantém o Responsável; Ocorrência resolvida não é editada nem reatribuída; editar vale para o Guardião ou o Lanterna criador, enquanto não estiver resolvida; comentar em resolvida é permitido; o Prazo não reinicia ao reabrir. |
| D20 | Integridade: não rebaixar o último Guardião (409); não afastar Lanterna com Ocorrência em andamento (409); o mentor não pode ser o próprio Lanterna nem formar ciclo. |
| D21 | Sessão e contrato: o papel é lido do banco a cada requisição; Ocorrência de outro Setor responde 404; o cadastro não devolve token; o usuário atual é `GET /auth/me`; o login devolve `expiresIn`; ordenação por `?ordenar=` e `?ordem=asc\|desc`. |
| D22 | IDs e limites: Setor usa o número como id, Lanterna usa o slug, o resto usa UUID; Comentário de 1 a 1000 caracteres; migrations versionadas, sem sincronização automática do esquema. |
| D23 | Campo nulo na Ficha aparece com o selo "não verificado". Rotas novas do front: `/cadastro`, `/painel/minha-fila`, `/painel/lanternas`, `/painel/setores`, `/painel/usuarios`. |
| D24 | Equipe: dois desenvolvedores. O usuário também cuida da documentação. O backlog divide o trabalho por frente (BE, FE) e por tarefa, com responsável a atribuir. |
| D26 | Esclarece D8 e D20: o Lanterna está `em_missao` enquanto for Responsável de ao menos uma Ocorrência **não resolvida** (`aberta` ou `em_andamento`), e só então não pode ser afastado. Reabrir uma Ocorrência cujo Responsável está afastado o libera. Corrige uma ambiguidade da redação original ("em andamento"). |
| D25 | `Lanterna.setorId` é opcional. Os 4 Lanternas originais sem Setor verificado (John Stewart, Guy Gardner, Salaak, Arisia Rrab) mantêm o do `db.json` como dado de demonstração; os outros 12 ficam sem Setor, aparecem com "Setor não verificado", não recebem Atribuição e não têm conta. O seed tem 7 Setores, não os 8 de D12, porque um oitavo só existiria por invenção. |
| D27 | O Usuário tem `setorId` próprio (escopo, RN-05). O cadastro cria a conta sem Ficha; o Guardião vincula conta e Ficha em `PATCH /usuarios/:id/lanterna` (RN-07). Sem vínculo, a conta registra e comenta, mas não tem Minha fila. |

## Decisão de interface — 2026-11-09

| # | Decisão |
|---|---|
| D28 | O laboratório OANET (`/laboratorio`, `components/oanet/`, tokens e estilos OANET) é a base visual oficial de todo o sistema. Novas telas e migrações usam os assets e o movimento gerados em código. O front anterior deixa de orientar o design; seus fluxos, contratos e permissões continuam sendo preservados até a substituição funcional. Pranchas raster e o design system antigo são históricos. A migração visual pode começar sem a API nova; a integração de dados continua dependente do back-end e dos testes correspondentes. Fonte visual canônica: `docs/UI.md`. |

## Contrato e trabalho independente — 2026-11-09

O usuário solicitou planos separados e contratos completos antes de retomar a implementação. As definições técnicas abaixo fecham lacunas documentais nesta tarefa; não afirmam que a API já existe.

| # | Definição e impacto |
|---|---|
| D29 | Front e back podem preparar suas implementações independentemente, usando a mesma revisão do pacote `docs/contratos/`. O front usa simulações de HTTP restritas ao servidor/ambiente de teste e desenvolvimento; o back usa clientes e testes próprios. A ativação nas rotas reais e a retirada do json-server continuam condicionadas aos gates de integração. Isso esclarece a preparação em D6/D28; mocks não atendem ao aceite final. |
| D30 | Na mudança de papel, promoção preserva Setor e vínculo à Ficha, mas o Guardião não tem restrição de escopo. Para rebaixar uma conta sem Setor, `PATCH /usuarios/:id/papel` também aceita `setorId` quando o destino é `lanterna`; ausência sem Setor anterior é 422 `SETOR_OBRIGATORIO`. Se já houver Setor, omitido o preserva. Setor inexistente é 404; incompatível com Ficha vinculada é 422 `SETOR_DIFERENTE`. Setor enviado com destino `guardiao` é 400. A proteção do último Guardião permanece. Impacto: DTO e formulário de gestão precisam incluir essa condição; não há endpoint novo. |
| D31 | A exclusão de Setor ligado a qualquer Usuário também é 409 `SETOR_EM_USO`, preservando a FK. Duplicidade de id usa `SETOR_JA_CADASTRADO` ou `LANTERNA_JA_CADASTRADA`; Minha fila sem vínculo usa `CONTA_SEM_LANTERNA`. São códigos estáveis do contrato v1, para o front não depender do texto de erro. |
| D32 | Alterar ou anular o Setor de uma Ficha é 409 `LANTERNA_EM_USO` se isso deixar uma conta vinculada ou Ocorrência sob sua responsabilidade em Setor incompatível, inclusive registros históricos/excluídos. O PATCH dos demais campos continua disponível. Fecha uma lacuna de integridade; não cria fluxo de remanejamento. |
| D33 | Determinismo do contrato v1: Minha fila contém somente atribuídas ao vínculo atual, não resolvidas e não excluídas. No dashboard, `dias` delimita somente a série diária UTC (inclui hoje); contagens/média/ranking consideram todo o histórico não excluído no escopo. Média sem amostra é `null`. Cada ação gera um Evento: `status_alterado` ao iniciar, `resolvida` ao resolver, `reaberta` ao reabrir; não se duplica um `status_alterado` nessas duas últimas ações. As formas completas e desempates estão no contrato estruturado. |

Os schemas completos e exemplos estão no [pacote de contrato](../contratos/README.md). Formas de resposta, padrões de ordenação e casos limite são definições contratuais; novas regras de produto continuam exigindo registro aqui e ajuste sincronizado de consumidores e provedor.

## Correção do contrato (rodada 2) — 2026-11-09

Definições técnicas da coordenação que fecham ambiguidades achadas na revisão independente do rascunho 1.0.0 ([relatório](../agents/revisoes/rodada-1-contrato.md); [correção](../agents/revisoes/rodada-2-correcao-contrato.md)). Elas existem para os dois desenvolvedores trabalharem sem perguntar um ao outro; **não representam aprovação individual prévia do usuário** nem implementação existente. Cada linha cita o achado de origem.

| # | Assunto | Definição e impacto |
|---|---|---|
| D34 | Liberar Responsável em andamento (C-01) | `PATCH /ocorrencias/:id/responsavel` com `responsavelId: null` numa Ocorrência `em_andamento` é **422 `SEM_RESPONSAVEL`**, sem mudar status, vínculo, carga nem Eventos. Não volta automaticamente a `aberta` e não há transição nova. Reatribuir direto a outro Responsável válido continua permitido; liberar uma `aberta` é permitido; `resolvida` segue 409 `OCORRENCIA_RESOLVIDA`. Tentativa rejeitada não gera Evento; atribuição, reatribuição ou liberação **efetivas** geram `atribuida` com `de`/`para` coerentes; sem mudança é 200 sem Evento. Impacto: RN-12/15, API, OpenAPI (`SEM_RESPONSAVEL` na operação), cenários. |
| D35 | Busca determinística (C-04) | Campos: Usuários por nome OU e-mail; Lanternas por codinome; Ocorrências por título. Substring literal do termo aparado; busca vazia é ignorada. Comparação sem caixa e sem acento pela mesma normalização (Unicode NFD, remover marcas combinantes, minúsculas) aplicada ao termo e ao texto armazenado. `%`, `_` e `\` são literais. Consulta parametrizada, filtrada no banco, sobre **campos auxiliares internos** de busca normalizada (ver modelo), atualizados na mesma transação do campo de origem e nunca expostos no HTTP; a ordenação textual (`nome`, `codinome`) usa o mesmo campo. Impacto: modelo, migration, repository e plano BE; o front só envia o termo cru. |
| D36 | Senha em bytes (C-05) | A senha preserva o conteúdo (sem trim). Cadastro: mínimo 8 caracteres Unicode; login: mínimo 1; ambos: máximo 72 caracteres e 72 bytes UTF-8 (`x-max-bytes: 72` no OpenAPI), sem truncamento silencioso. Excesso é 400 `DADOS_INVALIDOS` com detalhe no campo `senha`, também no login, antes da comparação bcrypt. Impacto: schema do formulário do front mede bytes também; teste do provedor cobre multibyte. |
| D37 | `primeiraAparicao` e seed (C-06) | O limite de `primeiraAparicao` sobe para 300 caracteres na entrada e na saída; o texto aceito em D18 não é truncado. O futuro teste de seed valida as 25 Fichas contra o schema da Ficha, com todos os limites. O seed separa valor, nota e fonte ao converter, sem reescrever a pesquisa (ver [SEED](SEED.md) para as células que não cabem literais). |
| D38 | Vínculo conta–Ficha e troca de Setor (C-07) | Vínculo não nulo exige: Ficha existente (404), alvo de papel Lanterna (Guardião: **422 `VINCULO_NAO_PERMITIDO`**, mesmo com Setor preservado), conta e Ficha com Setor não nulo e igual (422 `SETOR_DIFERENTE`; Ficha sem Setor também), Ficha livre (409 `LANTERNA_JA_VINCULADA`), nessa ordem. `lanternaId: null` desvincula, inclusive Guardião promovido, e nunca habilita Minha fila para Guardião. Revincular a mesma Ficha à mesma conta é 200 sem mudança; outra Ficha substitui. Conta Lanterna sem Setor não é estado persistido válido. `PATCH /usuarios/:id/papel` com destino `lanterna` em conta que já é Lanterna pode trocar o Setor sob as mesmas restrições de vínculo (sem rota nova; só G opera). |
| D39 | Concorrência e carga (C-08) | Carga múltipla é permitida (RN-20): duas atribuições válidas à mesma Ficha não são proibidas. Para RN-23 a corrida relevante é **atribuir × afastar** uma Ficha inicialmente `ativo`: as únicas linearizações válidas são "atribuição vence, afastamento 409 `LANTERNA_EM_MISSAO`" ou "afastamento vence, atribuição 409 `LANTERNA_AFASTADO`"; nunca Responsável afastado nem histórico parcial. Duas atribuições ao mesmo recurso só precisam deixar estado e Eventos serializáveis. |
| D40 | Esteira de avaliação (C-10) | Autenticação → papel da rota → formato (DTO/params/query) → existência e escopo do recurso da rota → autoria/permissão da ação → regras de estado e de domínio. "Existência" é a do recurso `:id`; referências do corpo (Setor, Ficha, Responsável, mentor) entram nas regras de domínio, na ordem de cada operação. Exemplos: editar resolvida por Lanterna não criador do Setor é 403, por ator autorizado é 409; outro Setor é 404 antes da autoria; Lanterna pede `aberta`: resolvida → 403, caso contrário 422 `TRANSICAO_INVALIDA`; criação com `setorId` proibido ou ausente por papel é 400 com detalhe `setorId`. Não se consulta recurso antes de converter UUID inválido. |
| D41 | Casos menores (C-10 e sugestões) | Comentário de Ocorrência excluída não é alcançável pelo `DELETE` (404). `PATCH /lanternas/:id/status` com `ativo` em Ficha `em_missao` é 409 `LANTERNA_EM_MISSAO`. Rota ou método sem correspondência: 404 `NAO_ENCONTRADO` com o envelope padrão (sem 405 prometido). Dado demonstrativo nas fontes usa o estado `nao_verificado`; não existe terceiro estado. `PATCH` de `fontes` substitui o objeto inteiro quando enviado e preserva quando omitido; URL com `nao_verificado` é referência não atestada. Média de resolução com 2 casas decimais, metade para cima. Nulos de `ordenar=setor`/`anoIngresso` ficam no fim em `asc` e `desc`. Limitação de RN-34: com histórico de responsável incompatível, este escopo não tem fluxo de remanejamento entre Setores. |
| D42 | Cenários e gate do contrato (C-02, C-03, C-09) | `exemplos/cenarios.json` é o oráculo documental comum de formato **e de pré-condições**: mundos reutilizáveis, ajustes, request, resposta esperada e efeitos, com cobertura de todos os pares operação×código. O validador (`validar.py` + `test_validar.py`) confere o que é documental; propriedades que dependem de execução (API real, bcrypt, concorrência, agregações, integração) ficam para os testes de provedor. O aceite do contrato (G-1) registra versão e SHA-256 do pacote; mudança arbitrária de schema só é detectada por esse hash, não por inferência do script. |


## Em aberto

- Papel de Supervisor de setor (descartado do escopo; só volta por nova decisão).
- Anéis de poder e Prazo configurável (bônus de D5, só se sobrar tempo).
- Hospedagem em produção (decide HSTS e a escolha de deploy; ver PROD-02 da skill `frontend-web`).
