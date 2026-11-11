# Auditoria fatia 3: ocorrências, eventos e comentários

Data: 2026-11-11. Repositório: `C:\Users\Windows 11\Documents\Desenvolvimento web\TrabalhoWeb` (branch `integracao/back-front`). Escopo: 12 operações do openapi (ocorrências, eventos, comentários), ciclo de vida, permissões por papel e Setor, transações e eventos.

Nenhum arquivo do repositório foi editado. `git status` continua mostrando só as duas modificações que já existiam (`eslint.config.mjs`, `vitest.config.mts`). O `backend/.env` já existia antes da auditoria e não foi alterado; a instância usou as variáveis de ambiente do processo. `backend/data/dev.sqlite` não foi tocado.

## 1. Resumo

- **Oráculo (`cenarios.json`), 128 cenários das minhas operações:** 126 OK, 2 divergências (BUG-1 e BUG-4).
- **Sondas direcionadas, 36 casos:** 15 OK, 18 divergências reais, 1 nota (F1). Duas linhas ficaram fora da contagem: D8 (erro de expectativa minha) e E1 (artefato do relógio congelado). Detalhes na seção 5.
- **Atomicidade (falha injetada ao gravar o Evento, 6 casos):** 6 OK. Resposta 500 e banco idêntico ao anterior em todos.
- **Pista da auditoria anterior (título só de espaços retorna 201):** CONFIRMADA. Ver BUG-3.
- **Ordem dos Eventos em `criadoEm` iguais:** o contrato pede `criadoEm asc, id asc`, e o código cumpre isso. Em empate, a ordem vira o UUID aleatório, não a ordem de gravação. Não reproduzi o empate via HTTP com relógio real (0 em 40 requisições concorrentes). Ver BUG-6.
- **Hipótese de fuso (America/Sao_Paulo) afetando `criadaEm`, `prazoEm`, `vencida` e ordem dos Eventos:** REFUTADA. Ver seção 5.
- **Achados mais graves:** (1) ordenação por Gravidade invertida nas duas direções; (2) trim não aplicado antes de medir, o que permite título, descrição, planeta e comentário só de espaços; (3) coerção de tipos no corpo (`titulo: 12345678` vira `"12345678"`, `envolvidos: true` vira `1`, `setorId: "2814"` é aceito).
- **Regras de estado, permissões, 404 por Setor, soft delete, Evento por ação e no-op de rejeições:** conforme o contrato nas verificações feitas.

## 2. Método e ambiente

- **Banco isolado:** `scratchpad\fatia3.sqlite`, migrado com `npm run migration:run`. Porta 3063. `JWT_SECRET` aleatório. As variáveis foram passadas ao processo (`DATABASE_PATH`, `PORT`, etc.). Porta 3001 e `dev.sqlite` não foram usadas.
- **Por que não usei a fixture `e`:** o oráculo define IDs e datas fixos (`mundos.base`, relógio de referência 2026-11-09T12:00Z), e a fixture não bate com eles. Materializei o `mundos.base` com as colunas e os valores da migration (senha fictícia `SomenteTeste123!`, hash bcrypt), aplicando os `ajustes` de cada cenário. A violação de FK do mundo foi 0 em todos os cenários.
- **Relógio:** o processo roda com um preload (`f3-clock.mjs`) que congela o `Date` no instante do cenário (campo `relogio` quando existe, senão 2026-11-09T12:00Z). Os cenários rodaram com `TZ=UTC`. As sondas de fuso rodaram com o fuso padrão da máquina, sem preload.
- **Comparação (`f3-cenarios.mjs`):** para cada cenário, compara status, `codigo`, `caminho`, `detalhes[].campo`, corpo (datas ISO normalizadas; ids e timestamps de criação ignorados, com checagem de `prazoEm = criadaEm + janela`) e efeitos. Os efeitos são conferidos por diff do banco inteiro antes e depois: linhas novas, alteradas ou removidas que não estejam documentadas falham. Rejeições têm que deixar o banco idêntico. Cenários 500 são simulados renomeando a tabela principal da operação (`ALTER TABLE ... RENAME`), não por falha injetada no repositório.
- **Controle negativo:** duas expectativas falsas num oráculo copiado foram detectadas (status errado e efeito inexistente). O runner não está cego.
- **Limitações:** rodei 128 dos 310 cenários (só os das minhas operações). A concorrência cobriu atribuir×atribuir e resolver×atribuir. Não exercitei excluir×atribuir nem editar×resolver.

## 3. Operações

| # | Método e rota | Acesso | Documentado (sucesso / erros) | Obtido | Veredito |
|---|---|---|---|---|---|
| 1 | `GET /ocorrencias` | Aut (G vê tudo; L só o próprio Setor; `setor` ignorado para L) | 200 `OcorrenciasPagina`; 400, 401, 500 | Oráculo 13/14. Falha: `ordenar=gravidade&ordem=asc` (BUG-1). Filtros, busca, paginação, `vencida` e ordenação por prazo/criadaEm OK. | DIVERGENTE (BUG-1) |
| 2 | `GET /ocorrencias/minha-fila` | L (G: 403; conta sem Ficha: 409) | 200; 400, 401, 403, 409 `CONTA_SEM_LANTERNA`, 500 | 11/11 OK. Ordem prazo asc, gravidade crítica→baixa e id asc (D9). Query extra: 400 (D10). | OK |
| 3 | `GET /ocorrencias/:id` | Aut (outro Setor e excluída: 404) | 200; 400, 401, 404, 500 | 9/9 OK. UUID em maiúsculas de registro existente: 404 (BUG-5). | OK com ressalva P3 |
| 4 | `POST /ocorrencias` | Aut (G: `setorId` obrigatório; L: proibido, 400 com detalhe `setorId`) | 201; 400, 401, 404 (Setor), 500 | 9/9 OK (inclui 400 por papel e 404 de Setor). Título, descrição e planeta só de espaços: 201 (BUG-3). Tipos errados aceitos (BUG-2). | DIVERGENTE (BUG-2, BUG-3) |
| 5 | `PATCH /ocorrencias/:id` | Aut (G, ou L criador no próprio Setor; L não criador: 403 mesmo se resolvida) | 200; 400, 401, 403, 404, 409 `OCORRENCIA_RESOLVIDA`, 500 | Oráculo 9/10: a falha é o corpo vazio com campo `body` em vez de `corpo` (BUG-4). Ordem (404→403→409) e recálculo de prazo por gravidade OK. Título só de espaços aceito (BUG-3); `envolvidos: "5"` aceito (BUG-2). | DIVERGENTE (BUG-2, BUG-3, BUG-4) |
| 6 | `PATCH /ocorrencias/:id/status` | Aut (L: sem reabrir) | 200; 400, 401, 403, 404, 422 `TRANSICAO_INVALIDA` / `SEM_RESPONSAVEL` / `RESOLUCAO_OBRIGATORIA` / `MOTIVO_OBRIGATORIO`, 500 | 19/19 OK: transições, pulo de etapa, mesmo status, reabrir por L (403), reabrir liberando afastado, resolução e motivo curtos ou ausentes. Resolução/motivo só de espaços: 422 OK (A7, A9). Resolução armazenada sem trim (BUG-3b). `resolucao` numérica aceita (BUG-2). | DIVERGENTE (BUG-2, BUG-3b) |
| 7 | `PATCH /ocorrencias/:id/responsavel` | G | 200; 400, 401, 403, 404, 409 `LANTERNA_AFASTADO` / `OCORRENCIA_RESOLVIDA`, 422 `SEM_RESPONSAVEL` / `RESPONSAVEL_DE_OUTRO_SETOR`, 500 | 20/20 OK. Idempotência sem Evento extra (D4). Liberar em andamento: 422 sem mudança (D3). Concorrência atribuir×atribuir e resolver×atribuir com estado consistente (E2 e T4, ver seção 5). Código 422 `TRANSICAO_INVALIDA` inalcançável (BUG-7). | OK com ressalva P3 |
| 8 | `DELETE /ocorrencias/:id` | G | 204; 400, 401, 403, 404, 500 | 7/7 OK. Excluir duas vezes: 204 e depois 404 (D1). Papel antes de existência: Lanterna recebe 403 (D2). Recálculo do Responsável OK. | OK |
| 9 | `GET /ocorrencias/:id/eventos` | Aut (mesmo escopo; outro Setor: 404) | 200 (criadoEm asc, id asc); 400, 401, 404, 500 | 6/6 OK. Eventos gerados batem com as ações (sem Evento extra). Desempate em `criadoEm` igual: ver BUG-6. | OK com NOTA (BUG-6) |
| 10 | `GET /ocorrencias/:id/comentarios` | Aut | 200; 400, 401, 404, 500 | 5/5 OK. Limite 51 → 400 (D12). | OK |
| 11 | `POST /ocorrencias/:id/comentarios` | G ou L do Setor (sem Ficha também; em resolvida também) | 201; 400, 401, 404, 500 | 8/8 OK nos cenários do oráculo. Texto só de espaços: 201 (BUG-3). Texto numérico: 201 (BUG-2). Texto de 1000 chars + 2 espaços: 400 (BUG-3b). | DIVERGENTE (BUG-2, BUG-3, BUG-3b) |
| 12 | `DELETE /comentarios/:id` | Aut (autor ou G) | 204 (com Evento `comentario_apagado`); 400, 401, 403, 404, 500 | 10/10 OK. Excluído, inexistente, de Ocorrência excluída e de outro Setor: 404. Comentário alheio (mesmo Setor): 403. Evento gerado com o id correto. | OK |

Atomicidade (RN-40 / RN-23), sabotando a tabela `evento`: criar Ocorrência, atribuir, resolver, iniciar, reabrir, excluir comentário. Todas respondem 500 `ERRO_INTERNO` e o banco fica idêntico ao anterior. Veredito: OK.

## 4. Bugs e divergências

Severidades: P0 bloqueia; P1 dano sério sem contorno; P2 contrato violado com efeito real; P3 menor, inconsistência ou risco.

### BUG-1 (P2): ordenação por Gravidade invertida nas duas direções

- **Local:** `backend/src/ocorrencias/prazo.ts:18-19` (`ordenarGravidadeSql` atribui critica=0, baixa=3) usado em `backend/src/ocorrencias/ocorrencias.repository.ts:60` (`ordenar=gravidade`).
- **Contrato:** `docs/backend/DTOS.md:63` ("Gravidade usa ordem de domínio baixa→critica em asc, inversa em desc") e `docs/contratos/exemplos/cenarios.json` cenário `listarOcorrencias.200.ordenar-gravidade-asc` (primeiro item com `gravidade: "baixa"`).
- **Observado:** asc entrega critica primeiro; desc entrega baixa primeiro. A mesma função é usada na Minha fila em `ocorrencias.repository.ts:76` com ASC, e ali o resultado critica→baixa está correto. Por isso a correção precisa ser parametrizada por operação, não só inverter a função.
- **Reprodução** (token de Guardião; mundo materializado):
  ```
  curl -s "http://localhost:3063/ocorrencias?ordenar=gravidade&ordem=asc" -H "authorization: Bearer $TOKEN"
  ```
  Esperado: primeiro item `"gravidade":"baixa"`. Obtido: `"critica"`, sequência `critica,critica,alta,alta,alta,media,media,baixa,baixa`.

### BUG-2 (P2): coerção de tipos no corpo aceita valores fora do schema

- **Local:** `backend/src/comum/configurar-http.ts:18` (`transformOptions: { enableImplicitConversion: true }`), combinado com `@Type(() => Number)` em `backend/src/ocorrencias/dto/criar-ocorrencia.dto.ts:24` e `:31`. Efeito em todos os campos `string` e `number` dos DTOs de ocorrências e comentários.
- **Contrato:** `docs/contratos/openapi.json` (`OcorrenciaCriacao`, `OcorrenciaEdicao`, `OcorrenciaStatusEntrada`, `ComentarioEntrada`: tipos `string` e `integer`) e `docs/backend/DTOS.md:7` (conversão de tipo só para query/path) e `DTOS.md:13` (formato/tipo inválido é 400).
- **Observado** (todos com 201 ou 200, valores gravados):
  - `titulo: 12345678` → armazenado `"12345678"` (B1).
  - `envolvidos: "3"` → `3` (B2). `envolvidos: true` → `1` (B3). `PATCH envolvidos: "5"` → `5` (B5).
  - `setorId: "2814"` como Guardião → `2814` (B4).
  - `resolucao: 1234567890` ao resolver → `"1234567890"` (B6).
  - `texto: 12345` em comentário → `"12345"` (B8).
  - Controle: `responsavelId: 123` → 400 (B7 OK), porque o tipo união não sofre coerção.
- **Reprodução:**
  ```
  curl -s -X POST http://localhost:3063/ocorrencias -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
    -d '{"titulo":12345678,"descricao":"Descrição fictícia com extensão válida.","planeta":"Terra","gravidade":"media","envolvidos":true,"setorId":"2814"}'
  ```
  Esperado: 400 `DADOS_INVALIDOS` com `detalhes` nos campos `titulo`, `envolvidos` e `setorId`. Obtido: 201 com `titulo:"12345678"`, `envolvidos:1`, `setorId:2814`.

### BUG-3 (P2): trim não aplicado antes de medir (pista da auditoria anterior CONFIRMADA)

- **Local:** `backend/src/ocorrencias/dto/criar-ocorrencia.dto.ts:7,12,17` (`titulo`, `descricao`, `planeta` só com `@MinLength`/`@MaxLength`, sem transform de trim); `backend/src/ocorrencias/dto/editar-ocorrencia.dto.ts:8,14,20`; `backend/src/comentarios/dto/criar-comentario.dto.ts:5` (`@MinLength(1)` aceita `"   "`).
- **Contrato:** `docs/backend/API.md:10` ("Texto é aparado antes de medir"), `docs/backend/DTOS.md:9`, e `docs/backend/MODELO-DE-DADOS.md` (titulo 5 a 100, descricao mín. 10, planeta mín. 2).
- **Observado:** título de 5 espaços, descrição de 10 espaços, planeta `" T "` (1 caractere após trim) e comentário de 3 espaços são aceitos (201, ou 200 no PATCH). A auditoria anterior estava certa.
- **Reprodução** (token de Lanterna do Setor 2814, `TOKL`):
  ```
  curl -s -X POST http://localhost:3063/ocorrencias -H "authorization: Bearer $TOKL" -H 'content-type: application/json' \
    -d '{"titulo":"     ","descricao":"Descrição fictícia com extensão válida.","planeta":"Terra","gravidade":"media","envolvidos":1}'
  curl -s -X POST http://localhost:3063/ocorrencias/00000000-0000-4000-8000-000000000201/comentarios -H "authorization: Bearer $TOKL" -H 'content-type: application/json' -d '{"texto":"   "}'
  ```
  Esperado: 400 `DADOS_INVALIDOS` (campo `titulo`; campo `texto`). Obtido: 201 com `titulo:"     "`; 201 com `texto:"   "`.

### BUG-3b (P3): valores persistidos sem trim e medição crua de busca e texto

- **Local:** `backend/src/ocorrencias/ciclo-vida.service.ts:96-98` (resolução: mede com trim, grava `dados.resolucao` cru); `:112,125` (motivo: mede com trim, grava cru no Evento); `backend/src/ocorrencias/dto/filtro-ocorrencias.dto.ts:33-35` (`@MaxLength(100)` sobre a busca crua); `backend/src/comentarios/dto/criar-comentario.dto.ts:6` (`@MaxLength(1000)` sobre o texto cru).
- **Contrato:** `API.md:10` e `DTOS.md:9` (aparar antes de medir); `openapi.json` `busca` ("trim") e o limite de 100 caracteres do termo aparado.
- **Observado:** resolução `"  Resolvido com ação completa  "` é gravada com espaços (A8). Busca de 101 caracteres com 6 espaços finais (95 após trim) → 400 (A10). Texto de 1000 caracteres + 2 espaços → 400 (A11).
- **Reprodução:** `curl -s -X PATCH http://localhost:3063/ocorrencias/00000000-0000-4000-8000-000000000201/status -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"status":"resolvida","resolucao":"  Resolvido com ação completa  "}'` → esperado `resolucao` aparada; obtido com espaços.

### BUG-4 (P3): nome do campo de erro para corpo vazio diverge do oráculo

- **Local:** `backend/src/ocorrencias/editar-ocorrencia.pipe.ts:8` (`'body informe ao menos um campo para atualizar'`; o filtro de exceções em `backend/src/comum/filtro-excecoes.ts:53-54` extrai o campo `body`).
- **Oráculo:** `cenarios.json` `editarOcorrencia.400.DADOS_INVALIDOS.corpo-vazio` espera `detalhes[].campo = "corpo"`. `API.md` e `DTOS.md` não definem esse nome.
- **Reprodução:** `curl -s -X PATCH http://localhost:3063/ocorrencias/00000000-0000-4000-8000-000000000201 -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{}'` → 400, `detalhes:[{"campo":"body",...}]`.

### BUG-5 (P3): UUID em maiúsculas não encontra registro existente

- **Local:** `backend/src/ocorrencias/dto/id-ocorrencia.pipe.ts:6` (regex com `/i`, aceita maiúsculas) e a busca por igualdade exata em `ocorrencias.repository.ts:34`. Não verifiquei os pipes de outros módulos.
- **Esperado:** UUID é case-insensitive (RFC 4122); o registro deveria ser encontrado, ou o formato deveria ser normalizado para minúsculas.
- **Observado:** `POST` cria `e3c0b419-a166-467c-afbe-d9bf28f9c3ce`; `GET .../E3C0B419-A166-467C-AFBE-D9BF28F9C3CE` → 404 `NAO_ENCONTRADO`; a forma minúscula → 200. O mesmo vale para `/eventos`.

### BUG-6 (P3, risco; não reproduzido via HTTP): desempate de Eventos por UUID

- **Local:** `backend/src/eventos/eventos.repository.ts:18` e `:30-31` (`criadoEm ASC, id ASC`, `id` é UUID aleatório). O `agora` é um default de parâmetro calculado na chamada, antes do bloqueio da transação: `ciclo-vida.service.ts:32` e `:50`. Duas ações que entram no mesmo milissegundo recebem o mesmo `criadoEm` e a ordem vira aleatória.
- **Contrato:** `API.md:158` pede `criadoEm asc` e `id asc`. O código cumpre o contrato ao pé da letra, mas o contrato permite ordem não cronológica em empate.
- **Confirmado:** `f3-sondas.mjs` F1 inseriu dois Eventos com o mesmo `criadoEm` (primeiro `status_alterado` com id alto, depois `comentario_apagado` com id baixo). A API devolveu `comentario_apagado > status_alterado`, ou seja, a ordem de gravação não é preservada. Em E1, com relógio congelado, a cadeia de/para saiu invertida em 9 de 25 execuções.
- **Não reproduzido com relógio real:** 40 pares de atribuições concorrentes (`f3-tz.mjs` T4) não tiveram `criadoEm` igual e nenhuma cadeia invertida.
- **Sugestão:** coluna de sequência monotônica (ou `rowid`) como desempate, no lugar do UUID.

### BUG-7 (P3): código 422 `TRANSICAO_INVALIDA` fora do documentado, inalcançável

- **Local:** `backend/src/ocorrencias/ciclo-vida.service.ts:77` (`if (resultado.affected !== 1) throw this.transicaoInvalida()` em `alterarResponsavel`).
- **Contrato:** `openapi.json` `PATCH /ocorrencias/{id}/responsavel` não lista 422 `TRANSICAO_INVALIDA` (lista `SEM_RESPONSAVEL` e `RESPONSAVEL_DE_OUTRO_SETOR`).
- **Avaliação:** com o `UPDATE` de bloqueio na primeira instrução da transação (`ciclo-vida.service.ts:53`), a condição não ocorre. Se ocorrer, responde um código não documentado para essa operação.

### BUG-8 (P3): código 422 `SETOR_OBRIGATORIO` não documentado em `POST /ocorrencias`, inalcançável

- **Local:** `backend/src/ocorrencias/ocorrencias.service.ts:68`.
- **Contrato:** `POST /ocorrencias` lista só 400, 401, 404, 500 em `openapi.json`. Uma Lanterna sem Setor não é estado persistido válido (`RN-08`, `D38`), então o caminho não é alcançável pela API.

### Divergências entre documentos

- **D-1:** nome do campo de detalhe para corpo vazio. O oráculo usa `corpo`; `API.md` e `DTOS.md` não definem. O documento é omisso, e o código usa `body` (BUG-4).
- **D-2:** códigos de erro usados no código e ausentes da linha da operação. `SETOR_OBRIGATORIO` (POST) e `TRANSICAO_INVALIDA` (PATCH responsável) não aparecem na tabela por operação de `API.md` nem no `openapi.json`. Aparecem só na lista genérica de códigos de `API.md`.
- **D-3:** Eventos e comentários de Ocorrência excluída. `API.md` e `openapi.json` dizem "mesmo escopo da Ocorrência" e não tratam o caso excluída. O código responde 404 (consistente com "futuras consultas 404" do DELETE, mas não está escrito para GET de eventos e comentários). Nenhum cenário do oráculo cobre.
- **D-4:** persistência do texto aparado. `API.md` diz "texto é aparado antes de medir", mas não diz se o valor gravado também é aparado. O código grava cru (BUG-3b).
- **Sem divergência encontrada entre os documentos para:** ordenação por gravidade (`DTOS.md:63` e `cenarios.json` concordam; só o código diverge), Minha fila (`API.md:145`, `DTOS.md:64`, `REGRAS RN-19`, `CENARIOS-DE-TESTE.md:174` concordam), prazo e vencida (`REGRAS` e `MODELO` concordam), limites de título, descrição, planeta e comentário (`openapi` e `MODELO` concordam), e a regra de Evento por ação (`RN-40`, `ESCOPO D33`, `openapi` `Evento`).

## 5. Hipóteses verificadas e descartadas

- **Fuso de São Paulo (REFUTADA):** com relógio real e fuso padrão da máquina (`f3-tz.mjs`):
  - T1: `criadaEm` da API bate com o relógio real (desvio 0,00 h); `prazoEm = criadaEm + 24 h`.
  - T2: os Eventos `criada`, `atribuida` e `status_alterado` saem em ordem cronológica, com `criadoEm` consistente.
  - T3: linha gravada em UTC (como o `DEFAULT` do banco) é lida corretamente; `?vencida=true` e o campo `vencida` concordam.
  - Conclusão: o TypeORM grava e lê `datetime` do SQLite em UTC, então o `DEFAULT` do banco não causa deslocamento.
- **E1 (artefato, descartado como bug):** rodou com relógio congelado, então os `criadoEm` iguais são do harness. O resultado real está em T4.
- **D8 (erro de expectativa minha, descartado):** a busca `ocorrência de contrato o1` casa com "O1" e "O10" porque é substring. Total 2 é o correto.
- **Guardião com `setorId` omitido, Lanterna com `setorId`, Guardião com Setor inexistente:** OK no oráculo e nas sondas.
- **Papel antes de existência (D2):** OK. Lanterna excluindo id inexistente recebe 403, não 404.
- **Concorrência atribuir×atribuir (E1 com relógio real, T4):** 40 de 40 com `200` nas duas, sem cadeia invertida e sem empate de `criadoEm`. Estado final consistente.
- **Concorrência resolver×atribuir (E2, relógio congelado):** 15 de 15 com estado final consistente (`resolvida`, e o Responsável da atribuição só quando ela venceu a resolução). Resolver deu 200 nas 15. Na amostra da primeira iteração, a atribuição deu 409 `OCORRENCIA_RESOLVIDA`. Não registrei a distribuição completa das 15 atribuições.

## 6. Não verificado

- 182 cenários do oráculo de outras operações (fora do escopo) não foram executados.
- `falha_controlada` no repositório (ponto injetado) não foi simulado no código; usei renomeação de tabela.
- Concorrência de excluir×atribuir, editar×resolver e comentar×excluir não foi exercitada. Por leitura de código: toda transação de escrita começa com `UPDATE ... SET id = id` (bloqueio), então as escritas são serializadas. Não há prova empírica.
- `docs/contratos/validar.py` não foi executado (não estava no escopo).
- Não testei as regras de Setor e Lanterna que dependem de outras fatias (remanejamento, afastamento, RN-23 em profundidade).

## 7. Comandos executados e resultados

1. Leitura de `API.md`, `REGRAS-DE-NEGOCIO.md`, `DTOS.md`, `ESCOPO.md`, `MODELO-DE-DADOS.md`, `openapi.json` (extração por Node, `f3`-prefixo fora do repo) e `cenarios.json` (estrutura e 128 cenários do escopo).
2. Leitura do código do escopo (ocorrências, eventos, comentários, comum, auth/guards, database).
3. `npm run migration:run` (banco `fatia3.sqlite`): OK, `Inicial1794268800000` executada.
4. API da porta 3063 em UTC com preload de relógio (`TZ=UTC node --import f3-clock.mjs dist/src/main.js`): `/saude` OK.
5. `f3-cenarios.mjs` (128 cenários) → `cenarios: 128 | ok: 126 | falhas: 2 | violacoes FK do mundo: 0`. Falhas: BUG-1 e BUG-4.
6. Controle negativo (`F3_ORACULO` com 2 expectativas falsas) → 2 de 2 falhas detectadas.
7. `f3-sondas.mjs` (UTC, relógio congelado) → 36 linhas: 15 OK, 20 DIVERGENTE (inclui D8 e E1, artefatos), 1 NOTA. Registro em `f3-sondas-utc.log`.
8. API encerrada (PID registrado). API com relógio real e fuso padrão (sem preload) → `f3-tz.mjs` → T1 a T4 (`f3-tz.txt`).
9. `f3-atomicidade.mjs` (sabota `evento`) → 6 de 6 com 500 `ERRO_INTERNO` e banco idêntico ao anterior. Resultado em `f3-atomicidade.json`. Na primeira execução, X4 usou a O2 (sem Responsável) e deu 422 `SEM_RESPONSAVEL`, o que é o correto; troquei o caso para a O9 e repeti.
10. Verificação de UUID em maiúsculas com ID gerado pela API: 404 para a forma maiúscula, 200 para a minúscula.
11. `git status --short` após tudo: somente as duas modificações pré-existentes.

## 8. Arquivos (scratchpad)

- Relatório: `C:\Users\WINDOW~1\AppData\Local\Temp\claude\8cd59eac40c4f8a6\3a6388e6-5415-483b-898d-e774f1df4cc1\scratchpad\relatorio-fatia3-ocorrencias-comentarios.md`
- Runner do oráculo: `...\scratchpad\f3-cenarios.mjs`; relógio: `...\scratchpad\f3-clock.mjs`; sondas: `...\scratchpad\f3-sondas.mjs`; fuso: `...\scratchpad\f3-tz.mjs`; atomicidade: `...\scratchpad\f3-atomicidade.mjs`.
- Resultados: `...\scratchpad\f3-run-final.log`, `f3-resultados.json`, `f3-sondas-utc.log`, `f3-sondas.json`, `f3-tz.txt`, `f3-atomicidade.json`.
- Limpeza ao fim: banco `fatia3.sqlite` e arquivo de ambiente com o segredo (`env-fatia3.sh`) removidos. Os scripts precisam de `JWT_SECRET` para rodar de novo.
