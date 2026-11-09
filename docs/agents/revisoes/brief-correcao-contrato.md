# DOC-03 — correção do contrato após revisão Sonnet 5.5

Agente Claude Code, modelo solicitado `claude-sonnet-5-5`. Tarefa somente documental/contratual: não implementar API, fake HTTP, telas ou migrations; não instalar pacotes, não commit/push, não reset/stash/clean e não escrever no db.json. Checkout compartilhada contém alterações de outras tarefas; preserve-as.

## Propriedade exclusiva

- `docs/contratos/**` (OpenAPI, exemplos, README, validador e testes documentais sem dependências novas).
- `docs/backend/API.md`, `DTOS.md`, `ESCOPO.md`, `REGRAS-DE-NEGOCIO.md`, `MODELO-DE-DADOS.md`, `SEED.md`, `CENARIOS-DE-TESTE.md`.
- Relatório novo `docs/agents/revisoes/rodada-2-correcao-contrato.md`.

Não edite planos de implementação, INTEGRACAO, arquiteturas, índices, AGENTS/DESIGN, pesquisa, relatórios da rodada 1, DOC-03, validador de links ou README das revisões. Outro agente já corrige planos/índices e possui esses arquivos. Envie impactos para coordenação em vez de editar fora da propriedade.

## Entrada obrigatória

Leia AGENTS, guia dos agentes, registro DOC-03 e skill backend-api canônica. Leia integralmente `docs/agents/revisoes/rodada-1-contrato.md`, fontes do seu escopo e a pesquisa `docs/research/2026-11-09-documentacao-para-agentes.md`. Confira o estado antes de editar. O contrato é rascunho 1.0.0 ainda não liberado; não há consumidor/provedor real desta versão. Fechar a rodada produz hash final novo; a coordenação registrará G-1 após validação e sem P0/P1 pendentes.

## Decisões da coordenação

Registre estas definições técnicas em ESCOPO (novos números após D33, agrupados por assunto) e alinhe RN/API/DTO/schema/exemplos/cenários. Elas fecham ambiguidades para independência dos devs; não apresentam aprovação individual prévia do usuário nem implementação existente.

### C-01 aceito — liberação em andamento

`responsavelId:null` numa Ocorrência `em_andamento` é **422 SEM_RESPONSAVEL**, sem mudança de status, vínculo, carga ou Eventos. Não voltar automaticamente a aberta e não criar transição nova. Reatribuir diretamente para outro responsável válido continua permitido; aberta pode liberar; resolvida segue409 OCORRENCIA_RESOLVIDA. Adicionar SEM_RESPONSAVEL aos códigos da operação e aos testes, com único resultado/estado final. Uma tentativa rejeitada não gera Evento; uma atribuição/reatribuição/liberação efetiva gera `atribuida` com de/para coerentes.

### C-02 e C-03 aceitos — cenários reproduzíveis

Transformar `cenarios.json` em oráculo comum de formato **e pré-condições**, ainda documental. Cada cenário precisa de ID, operationId, ator, estado inicial explícito (pode referenciar mundos/entidades reutilizáveis com overrides bem definidos), request e resposta/efeitos esperados. Incluir Lanternas, vínculos, Comentários e Eventos referenciados; criação usa ID novo, e snapshots históricos de cenários diferentes não se misturam.

Cobrir todos os pares operação×código declarados em x-codigos com cenário identificável e estado que permite a falha. Para400, incluir pedidos realmente inválidos (campo extra, query/UUID/slug malformados, limite51, senha etc.); o validador deve distinguir pedido inválido esperado de fixture positiva inválida. Para401/403/404/409/422/429/500, declarar a pré-condição necessária, inclusive falha controlada e throttle quando não forem meros dados. Nenhum token utilizável. Documentar como cada frente materializará o cenário em teste, sem simular prova do provedor agora.

Corrigir timeline/autor/criador/estado final de O1, datas de resolução/reabertura, afastado/em_missao, busca+ordem+total de usuários, caminhos de erro, IDs novos e relações. Preferir referências reutilizáveis a centenas de cópias independentes divergentes; manter OpenAPI fonte dos formatos. Nenhum gerador temporário fica no pacote final como fonte concorrente.

### C-04 aceito — busca determinística

Campos: Usuários por nome OU email; Lanternas por codinome; Ocorrências por título. Substring literal, trim da busca; busca vazia é ignorada. Comparação sem distinção de caixa e acento pela mesma normalização Unicode NFD → remover marcas combinantes → minúsculas, tanto texto armazenado quanto termo. `%`, `_` e `\\` são caracteres literais, não curingas controlados pelo cliente. Queries continuam parametrizadas e filtradas no banco. Registrar no modelo campos auxiliares de busca normalizada/atualização transacional, sem expô-los no HTTP; informar a coordenação para alinhar plano BE. Incluir casos com acento, caixa, vazio, sem resultado e curingas literais.

### C-05 aceito — senha em bytes

Senha preserva conteúdo, sem trim. Cadastro mínimo8 caracteres Unicode, login mínimo1; ambos máximo72 bytes UTF-8, sem truncamento silencioso. Manter limite de caracteres existente compatível e acrescentar `x-max-bytes:72` + verificação documental. Excesso é400 DADOS_INVALIDOS com detalhe campo senha, inclusive no login, antes da comparação bcrypt. Incluir negativos multibyte e caso limítrofe válido; tratar erro de encoding como inválido, sem crash do validador.

### C-06 aceito — pesquisa/seed

Ampliar `primeiraAparicao` para300 caracteres em entrada e saída; preservar texto aceito em D18 sem truncamento silencioso. Registrar requisito de o futuro teste de seed validar as25 Fichas contra o schema, incluindo demais limites dos campos. O seed não existe ainda: conferir documentalmente as células relevantes e separar valor/notas/fontes ao converter, sem reescrever pesquisa aceita. Relatar qualquer campo ainda incompatível em vez de esconder o problema.

### C-07 aceito — vínculo de Ficha

Ao definir vínculo não nulo: alvo deve ser conta Lanterna com Setor próprio e Ficha com Setor não nulo igual. Alvo Guardião recebe422 VINCULO_NAO_PERMITIDO, inclusive se possui Setor preservado; ficha sem Setor recebe422 SETOR_DIFERENTE. Ausência de referência segue404. Conta Lanterna sem Setor não é estado persistido válido; se necessário tratar dado inconsistente, descrever limite em vez de criar caso normal impossível.

Promoção pode preservar vínculo existente (D30); `lanternaId:null` permite desvincular inclusive Guardião promovido, mas nunca habilita Minha fila para G. Declare precedência dos casos e inclua cenários para Guardião com/sem Setor, sem Setor na Ficha, desvínculo e vínculo duplicado. Adicionar código novo aos lugares pertinentes.

### C-08 aceito com correção da recomendação de concorrência

Cobrir RN-19 (ordem prazo, gravidade, id; só pendentes/não excluídas; vínculo;403G; paginação), D33 e demais casos apontados. **Não assumir que duas atribuições válidas são proibidas**: carga múltipla é permitida. Para RN-23 usar corrida atribuir versus afastar uma Ficha inicialmente ativa: linearizações válidas são atribuição vence/afastamento409 LANTERNA_EM_MISSAO, OU afastamento vence/atribuição409 LANTERNA_AFASTADO. Nunca responsável afastado ou histórico parcial. Duas atribuições ao mesmo recurso só precisam preservar estado/eventos serializáveis, sem inventar limite de uma tarefa por Lanterna.

### C-09 aceito dentro do escopo declarado

Fortalecer o validador para operações/acesso da API, status401/403 esperados, enum de códigos versus x-codigos, ator em cenários positivos/negativos, cobertura de cenário por operação×código, metadata de páginas, relações/IDs, path versus resposta/caminho de erro, prazo/vencida pelo relógio do cenário, correspondência autor/criador e campos críticos obrigatórios. Slug usa fullmatch/âncora absoluta, sem aceitar newline final. Cada correção tem teste negativo stdlib permanente (arquivo no seu escopo), além do positivo.

Não construir um segundo backend completo dentro do validador. Propriedades que dependem de execução ficam no teste futuro do provedor, explicitadas no README. Mudança arbitrária no schema aprovado também exige controle de versão/hash: não alegar que um script consegue inferir intenção de toda mudança. Se não validar alguma propriedade citada pelo revisor, registrar com precisão o limite e como o gate impedirá falso aceite. API real, bcrypt, concorrência e integração continuam sem prova de execução nesta tarefa.

### C-10 aceito — precedência e casos menores

Ordem da esteira: autenticação → papel da rota → validação de formato (DTO/params/query) → existência/escopo do recurso → autoria/permissão da ação → regras de estado. Não prometer consultar recurso antes de converter UUID inválido. Logo editar resolvida por L não criador do mesmo Setor é403; por ator autorizado é409. Outro Setor é404 antes da autoria. L pede status aberta: se estado atual resolvida é tentativa de reabertura403; se não é resolvida, transição inválida422. Criação com setor proibido/ausente por papel é400 com detalhe setorId.

Comentário cuja Ocorrência foi excluída não fica acessível pelo DELETE:404. `PATCH /lanternas/:id/status` com ativo em Ficha em_missao retorna409 LANTERNA_EM_MISSAO; não permite apagar estado calculado. Rota/método desconhecido usa404 NAO_ENCONTRADO com envelope global seguro; não prometer405 sem implementação correspondente. Dado demonstrativo nas fontes usa estado nao_verificado, sem inventar terceiro enum; padronizar grafia no modelo.

Sugestões pertinentes: PATCH fontes substitui o objeto inteiro quando enviado, omitido preserva; URL com nao_verificado é permitida como referência não atestada. Média de resolução arredondada a2 casas decimais, metade para cima (valores não negativos). Nulos de ordenar=setor/anoIngresso ficam no fim, em ambas direções. Definir explicitamente que /papel com destino lanterna em conta já Lanterna pode alterar Setor sob as mesmas restrições de vínculo (sem nova rota; só G opera). Registrar limitação de RN-34: após histórico responsável incompatível, não há fluxo de remanejamento entre Setores neste escopo.

## Entrega

Execute `py -3 docs/contratos/validar.py`, testes negativos permanentes criados, `node docs/agents/validar-documentacao.mjs`, `git diff --check`. Modelo/parser de formatos continuam parciais; nenhum teste de API real é executado. Não editar planos em paralelo: envie lista curta das novas decisões/códigos, campos internos, limites e cenários que o agente dos planos precisa incorporar.

Relatório `rodada-2-correcao-contrato.md`: para C-01…C-10 e sugestões tratadas, decisão, fontes corrigidas, provas positivas/negativas, limites honestos. Congele o pacote ao terminar e retorne pelo mecanismo Orca. A coordenação fará leitura cruzada e hash final, sem commit/publicação.
