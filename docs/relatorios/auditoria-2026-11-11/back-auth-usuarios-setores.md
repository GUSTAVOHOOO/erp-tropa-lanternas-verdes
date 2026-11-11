# Auditoria fatia 1: saude, auth, usuarios, setores

Data: 2026-11-11. Auditor: agente somente leitura (nenhum arquivo do repositorio foi editado).
Contrato: docs/contratos/openapi.json (30 operacoes; 12 no escopo) e docs/contratos/exemplos/cenarios.json (119 cenarios no escopo, incluindo 2 globais).
Ambiente de teste: API NestJS isolada em porta 3061, banco SQLite em scratchpad, variaveis de ambiente do processo (sem criar backend/.env). Todos os processos iniciados foram encerrados pelo PID gravado por mim; o banco de teste foi apagado ao final.

## 1. Operacoes do escopo

| # | Metodo e rota | Papel | Respostas documentadas (openapi) | Obtido (teste manual + runner) | Veredito |
|---|---|---|---|---|---|
| 1 | GET /saude | Pub | 200, 400, 500 | 200 em todos os testes; `?x=1` -> 200 (esperado 400) | DIVERGENTE (query desconhecida) |
| 2 | POST /auth/cadastro | Pub | 201, 400, 404, 409, 500 | 201, 400 (senha, campo extra, email), 404 (setor), 409 (email com caixa/espaco). `setorId` como string "2814" -> 201; "1e3", " 2814 " e true tambem aceitos por coercao | DIVERGENTE (tipo do corpo) |
| 3 | POST /auth/login | Pub | 200, 400, 401, 429, 500 | 200, 401 (mesma resposta para conta inexistente e senha errada), 429 apos LOGIN_LIMITE. Corpo invalido consome a cota (ver B-06). 500 via falha induzida: OK | OK (com ressalva B-06) |
| 4 | GET /auth/me | Aut | 200, 400, 401, 500 | 200 com token valido; 401 para sem token, lixo, expirado, assinatura errada, alg none, sub inexistente, papel invalido. `?x=1` -> 200 (esperado 400) | DIVERGENTE (query desconhecida) |
| 5 | GET /usuarios | G | 200, 400, 401, 403, 500 | 200, 401, 403, 400 (limite 51, ordenar, ordem, pagina 0/abc/1e1/0x1, busca 101, x=1). `pagina=99999999999999999999` -> 500 | DIVERGENTE (500 em entrada de cliente) |
| 6 | PATCH /usuarios/:id/papel | G | 200, 400, 401, 403, 404, 409, 422, 500 | 200 (promocao, rebaixamento preservando setor), 401, 403, 404, 409 ULTIMO_GUARDIAO com precedencia correta, 422 SETOR_OBRIGATORIO e SETOR_DIFERENTE (cenarios). Detalhe 400 de "guardiao + setorId" sai com campo `geral` e mensagem vazia. `setorId` string aceito | DIVERGENTE |
| 7 | PATCH /usuarios/:id/lanterna | G | 200, 400, 401, 403, 404, 409, 422, 500 | 200 (desvincular, revincular, idempotente), 401, 403, 404 ficha e conta, 409 LANTERNA_JA_VINCULADA, 422 VINCULO_NAO_PERMITIDO (alvo Guardiao), 422 SETOR_DIFERENTE (precede 409). Todos os 400 de formato OK | OK (ver divergencia D-01 na secao 4) |
| 8 | GET /setores | Pub | 200, 400, 500 | 200; `?x=1` -> 200 (esperado 400) | DIVERGENTE (query desconhecida) |
| 9 | POST /setores | G | 201, 400, 401, 403, 409, 500 | 201, 400 (tamanhos, extra, trim, id fora de 0-9999), 401, 403 (precede 400), 409 SETOR_JA_CADASTRADO. `id` string "4101" -> 201; "1e3" -> 201 com id 1000 | DIVERGENTE (tipo do corpo) |
| 10 | GET /setores/{id} | Pub | 200, 400, 404, 500 | 200, 404, 400 (10000, -1, abc, 2814.5). `?x=1` -> 200 (esperado 400). `/setores/00002814` -> 200 (doc nao proibe; ver P3-06) | DIVERGENTE (query desconhecida) |
| 11 | PATCH /setores/{id} | G | 200, 400, 401, 403, 404, 500 | 200 (edicao parcial), 400, 401, 403, 404. Corpo vazio -> 400 com campo `body` (cenario espera `corpo`) | DIVERGENTE (nome do campo de detalhe) |
| 12 | DELETE /setores/{id} | G | 204, 400, 401, 403, 404, 409, 500 | 204 (setor sem referencias), 409 SETOR_EM_USO (setor com usuario e setor 2814), 404, 400, 401, 403. Caminho de FK do SQLite (setores.service.ts:50-54) nao foi exercitado: a checagem previa de referencias responde antes | OK |

Erros 500 (todas as operacoes): o contrato exige mensagem generica sem detalhe. Verificado nos cenarios induzindo falha real (tabela `usuario` ou `setor` renomeada no banco de teste): envelope `ERRO_INTERNO` correto em 11 de 11 operacoes. `GET /saude` nao tem como produzir 500 pelo repositorio (ver D-02).

Cenarios (runner, 119 no escopo): 110 OK, 8 FALHA, 1 NAO VERIFICADO.
- 3 FALHA sao artefato do oraculo: `criadoEm` dos cadastros esperado em 2026-11-09T12:00:00Z (relogio fixo do contrato); status e corpo corretos.
- 5 FALHA reais: GET /auth/me?x=1, GET /setores?x=1, GET /saude?x=1 (query desconhecida aceita), PATCH /usuarios/:id/papel com destino guardiao e setorId (detalhe `geral` em vez de `setorId`) e PATCH /setores/:id com corpo vazio (campo `body` em vez de `corpo`).
- 1 NAO VERIFICADO: consultarSaude.500 (ver D-02).

## 2. Bugs

Severidade: P0 bloqueia, P1 grave, P2 contrato violado ou comportamento errado visivel, P3 menor.

### P2-01 Query desconhecida aceita em rotas sem DTO de query
- Arquivos: backend/src/saude/saude.controller.ts:7-9; backend/src/auth/auth.controller.ts:28-31; backend/src/setores/setores.controller.ts:14-24.
- Contrato: API.md linha 55 e DTOS.md linha 7: campo desconhecido na query e 400 DADOS_INVALIDOS; cenarios consultarSaude.400, consultarUsuarioAtual.400, listarSetores.400 (query-desconhecida).
- Repro: `curl "http://localhost:3061/saude?x=1"` -> 200 (esperado 400). Igual em `/auth/me?x=1` (com token), `/setores?x=1` e `/setores/2814?x=1`.
- Causa: ValidationPipe global so valida @Query quando ha DTO de query; estes handlers nao tem DTO.

### P2-02 Coercao de tipo no corpo aceita strings numericas e booleanos
- Arquivos: backend/src/auth/dto/cadastro.dto.ts:21-25 (`@Type(() => Number)` em setorId); backend/src/setores/dto/criar-setor.dto.ts:5-9 (id); backend/src/usuarios/dto/papel-usuario.dto.ts:23-27 e 35 (inteiroOpcional aceita string).
- Contrato: openapi CadastroEntrada.setorId, SetorCriacao.id, PapelEntrada.setorId com type integer; DTOS.md linha 7 limita a conversao a query e path ("Converter query/path antes de validar"). Corpo com tipo errado deve ser 400.
- Repro (com token G em $TG):
  - `curl -X POST localhost:3061/auth/cadastro -H 'content-type: application/json' -d '{"nome":"X Y","email":"a@b.invalid","senha":"SenhaSegura123","setorId":"2814"}'` -> 201 (esperado 400).
  - `curl -X POST localhost:3061/setores -H "authorization: Bearer $TG" -H 'content-type: application/json' -d '{"id":"1e3","nome":"Setor X","descricao":"Descricao de teste"}'` -> 201 com id 1000 (esperado 400).
  - `curl -X PATCH localhost:3061/usuarios/<id-hal>/papel -H "authorization: Bearer $TG" -H 'content-type: application/json' -d '{"papel":"lanterna","setorId":"2814"}'` -> 200 (esperado 400).
  - `setorId: true` no cadastro -> 404 (Number(true)=1), resposta enganosa; esperado 400.

### P2-03 HTTP 500 para pagina muito grande
- Arquivos: backend/src/usuarios/dto/filtro-usuarios.dto.ts:19-22 (pagina sem teto superior; inteiroQuery aceita qualquer inteiro seguro); backend/src/usuarios/usuarios.repository.ts:65 (`skip((pagina-1)*limite)`).
- Repro: `curl -H "authorization: Bearer $TG" "localhost:3061/usuarios?pagina=99999999999999999999"` -> 500 ERRO_INTERNO. Log: `SqliteError: datatype mismatch` (api-run.err.log).
- Esperado: 200 com itens vazios (contrato: pagina alem do fim devolve itens []) ou 400.
- Observacao: o mesmo padrao de paginacao sem teto aparece em FiltroPaginacaoDto (backend/src/comum/filtro-paginacao.dto.ts:8-9) usado por outros modulos; fora do escopo, mas vale corrigir junto.

### P2-04 Erro 4xx sem mapeamento vira ERRO_INTERNO
- Arquivo: backend/src/comum/filtro-excecoes.ts:27-28 (codigo padrao ERRO_INTERNO) e 73-75 (ramo `else` so ajusta mensagem; o codigo continua ERRO_INTERNO).
- Repro: corpo de 200 KB -> `curl -X POST localhost:3061/auth/cadastro -H 'content-type: application/json' --data-binary @grande.json` -> 413 com `erro.codigo = "ERRO_INTERNO"` e mensagem "Requisicao nao aceita". Esperado: 4xx com codigo estavel (o contrato nao lista 413, mas ERRO_INTERNO para erro do cliente contradiz o envelope).

### P2-05 Detalhe 400 vazio e campo `geral` em regra de papel/destino
- Arquivo: backend/src/usuarios/dto/papel-usuario.dto.ts:16-21 (SetorSomenteParaLanterna sem `defaultMessage`; a mensagem sai vazia) e 36.
- Contrato: openapi Erro400.detalhes.mensagens tem items com minLength 1; DTOS.md linha 47 e cenario alterarPapel.400.setor-com-destino-guardiao exigem detalhe `campo: setorId`.
- Repro: `curl -X PATCH localhost:3061/usuarios/<id>/papel -H "authorization: Bearer $TG" -H 'content-type: application/json' -d '{"papel":"guardiao","setorId":2814}'` -> 400 com `detalhes: [{"campo":"geral","mensagens":[""]}]`.

### P2-06 Vazamento de JWT sem limite de validade
- Arquivo: backend/src/auth/jwt.guard.ts:37-39 (verifyAsync sem exigir `exp` e sem maxAge).
- Contrato: API.md linha 8 (JWT expira em 8 h).
- Repro: token assinado com o segredo, sem `exp` ou com `exp` = agora+9h: `GET /auth/me` -> 200 (esperado 401). Exige o segredo para forjar; o risco e de defesa em profundidade (qualquer token emitido fora do login continua valido).

### P3-01 Mojibake em mensagens de erro visiveis ao cliente
- backend/src/usuarios/usuarios.service.ts:51, 55, 74, 104, 109, 125 (ex.: "Setor nÃ£o encontrado", "NÃ£o Ã© possÃ­vel rebaixar o Ãºltimo GuardiÃ£o", "Ficha jÃ¡ vinculada a outra conta").
- backend/src/usuarios/dto/id-usuario.pipe.ts:7 ("id deve ser um UUID vÃ¡lido").
- Repro: `curl -H "authorization: Bearer $TG" -X PATCH localhost:3061/usuarios/xx/papel` (ou 409 ULTIMO_GUARDIAO) -> mensagem com bytes corrompidos. backend/src/setores/setores.service.ts esta correto ("Setor nao encontrado"), o que mostra que o problema e localizado nos arquivos de usuarios. O contrato trata erro pelo codigo, mas a mensagem aparece para o usuario.

### P3-02 Requisicoes com corpo invalido consomem a cota de login
- Arquivo: backend/src/auth/auth.controller.ts:20-22 (`@UseGuards(ThrottlerGuard)`) roda antes do ValidationPipe global (configurar-http.ts:13-20).
- Teste: 5 corpos `{}` seguidos de login valido -> 5x 400 e depois 429 (Caso A). Caso C: 3x corpo invalido + 2x senha errada -> a 6a tentativa e 429.
- Contrato: openapi /auth/login 429 "apos LOGIN_LIMITE tentativas na janela"; a doc nao diz se tentativas com formato invalido contam. Registrar como decisao a confirmar.
- Controle: 5 senhas erradas + senha certa -> 6a = 429 MUITAS_TENTATIVAS (Caso B) — conforme o contrato.

### P3-03 Datas com precisao de segundos (pista confirmada) e fonte inconsistente
- Arquivos: backend/src/usuarios/usuario.entity.ts:57-58 (`@CreateDateColumn({type:'datetime'})`) e backend/src/database/migrations/Inicial.ts:48 (`DEFAULT strftime('%Y-%m-%d %H:%M:%f','now')`, com milissegundos).
- Observado: `SELECT criadoEm FROM usuario` -> "2026-11-11 17:25:50" (sem milissegundos). A API devolve "2026-11-11T17:25:50.000Z".
- Fuso: NAO confirmado como problema. O valor gravado e UTC e corresponde ao relogio UTC (14:25 local = 17:25Z). Hipotese de deslocamento por fuso refutada neste ambiente (America/Sao_Paulo).
- Efeito: ordenacao por criadoEm empata dentro do mesmo segundo (desempate por id, dentro da regra). A divergencia entre o DEFAULT da migracao (ms) e a escrita do entity (s) e interna.

### P3-04 Campo de detalhe `body` em vez de `corpo` (PATCH /setores/:id)
- Arquivo: backend/src/setores/dto/editar-setor.pipe.ts:8.
- Cenario editarSetor.400.corpo-vazio espera `detalhes: [{campo: "corpo"}]`. O codigo devolve `body`.
- Repro: `curl -X PATCH localhost:3061/setores/2814 -H "authorization: Bearer $TG" -H 'content-type: application/json' -d '{}'`.

### P3-05 Ruido em detalhes de validacao
- Campo ausente gera tres mensagens conflitantes para o mesmo campo: `POST /auth/cadastro` sem setorId -> detalhes: "must not be greater than 9999", "must not be less than 0", "must be an integer number" (causado por `@Type(() => Number)` convertendo undefined em NaN). Mesmo efeito em `POST /setores` sem descricao.
- Corpo JSON com array -> dezenas de mensagens.

### P3-06 Aceitacao de formas nao canonicas de inteiro no path
- Arquivo: backend/src/setores/dto/id-setor.pipe.ts:6 (regex /^\d+$/ aceita zeros a esquerda).
- `GET /setores/00002814` -> 200. A doc (openapi: integer 0-9999) nao proibe; registrar apenas como nota.

### P3-07 JWT sem limite de validade em tokens emitidos fora do login
- Ver P2-06 (mesmo ponto, severidade reduzida se o segredo estiver protegido).

## 3. Verificacoes que passaram

- Ordem da esteira: 401 antes de 400 (corpo invalido sem token), 403 antes de 400 (Lanterna com corpo invalido), 400 antes de 404 (PATCH setor com corpo vazio em id inexistente), 409 ULTIMO_GUARDIAO antes de 422 SETOR_OBRIGATORIO, 422 SETOR_DIFERENTE antes de 409 LANTERNA_JA_VINCULADA, 422 VINCULO_NAO_PERMITIDO antes de SETOR_DIFERENTE.
- RN-06: papel lido do banco a cada requisicao. Token de Lanterna passa a acessar /usuarios apos promocao, e token de Guardiao recebe 403 apos rebaixamento, sem novo login.
- RN-04: ultimo Guardiao nao rebaixa (409); com dois Guardioes, rebaixar a si mesmo e permitido.
- Senha: cadastro aceita 72 bytes multibyte, recusa 73 bytes ASCII e 74/76 bytes multibyte; login recusa excesso antes do bcrypt; 401 identico para conta inexistente e senha errada (mesmo codigo e mensagem); senha sem trim.
- Email normalizado (espaco e caixa): duplicado detectado como 409.
- Token: sem header, lixo, expirado, assinatura de outro segredo, alg none, sub inexistente, papel invalido -> 401 NAO_AUTENTICADO. Esquema "bearer" minusculo aceito.
- Setores: exclusao com usuario vinculado -> 409 SETOR_EM_USO; setor sem referencias -> 204 sem corpo; criacao e edicao com trim; id repetido -> 409 SETOR_JA_CADASTRADO.
- Envelope de erro: {sucesso:false, erro:{status,mensagem,codigo[,detalhes]}, caminho, timestamp}; detalhes so em 400; caminho sem query string; 404 para rota desconhecida e metodo nao previsto (sem 405).
- CORS: preflight de origem permitida -> 204 com Access-Control-Allow-Origin; origem nao permitida nao e refletida (cabecalho fixo com a origem configurada).
- Helmet: X-Powered-By ausente; X-Content-Type-Options nosniff; Content-Security-Policy, HSTS e X-Frame-Options presentes.
- Logs: nenhuma senha, token ou Authorization encontrado nos logs da API (busca por senhas usadas e por "Bearer"/"eyJ").
- Rate limit: 429 MUITAS_TENTATIVAS na 6a tentativa de login (Caso B).

## 4. Divergencias entre documentos (registradas, sem escolher lado)

- D-01 (openapi.json, componente VinculoEntrada.description; ESCOPO.md D38 linha 87): dizem "Ficha livre ou ja da propria conta (409 LANTERNA_JA_VINCULADA)" e "Ficha livre (409)". Isso contradiz RN-07 (REGRAS-DE-NEGOCIO.md linha 22: 409 so se a Ficha estiver vinculada a outra conta) e API.md linha 96 (revincular a mesma Ficha e 200). O codigo segue RN-07/API.md (verificado: conta nova -> hal-jordan = 409; revincular propria = 200). Acao: corrigir o texto do openapi e de D38.
- D-02 (cenarios.json, consultarSaude.500.ERRO_INTERNO): exige falha injetada no "repositorio" para GET /saude, mas API.md linha 174 e openapi (descricao de /saude) dizem que a rota nao acessa dados. O cenario nao pode ocorrer no codigo atual. Nao verificado.
- D-03 (cenarios.json, editarSetor.400.corpo-vazio): campo `corpo`; codigo emite `body` (ver P3-04). Escolher um nome e alinhar.
- D-04 (cenarios.json, alterarPapel.400.setor-com-destino-guardiao): exige detalhe `setorId` (DTOS.md linha 47); codigo emite `geral` com mensagem vazia (P2-05).
- D-05 (DTOS.md linha 7 vs openapi): DTOS restringe conversao a query e path; openapi declara integer no corpo. O codigo converte tambem o corpo. Doc consistente com openapi; codigo diverge (P2-02).
- D-06 (cenarios.json, relogio e ids): os cenarios fixam relogio 2026-11-09T12:00:00Z e ids da faixa 9xx gerados pelo servidor. Como oraculo de formato, nao de valor, isso gera 3 FALHA artificiais (criadoEm) e ids que o servidor nunca reproduz. Registrar que a comparacao de ids e de formato.
- D-07 (openapi GET /auth/me e API.md linha 80): ambos documentam 400 para o endpoint sem parametros; o cenario tambem. Consistente entre si; codigo diverge (P2-01).
- D-08 (cenarios.json, POST /auth/login 429 vs doc): contrato nao diz se tentativas de formato invalido contam para LOGIN_LIMITE (ver P3-02). Ambiguidade.
- D-09 (openapi, PATCH /usuarios/:id/papel descricao): ordem "formato (setorId com destino guardiao: 400) -> conta da rota (404) -> ..." e consistente com API.md linha 94, RN-08 e DTOS.md linha 47. Sem divergencia.

## 5. Riscos nao verificados

- Rate limit por IP (ThrottlerGuard usa IP por padrao): se o front Next chamar a API a partir de um unico servidor, todas as contas compartilham uma cota de login. Topologia de producao nao foi verificada; so o comportamento local foi testado.
- Caminho de excecao de FK em DELETE /setores (setores.service.ts:50-54): nao exercitado; a checagem previa de referencias sempre responde antes.
- Concorrencia de atribuicoes e promocoes: nao testada.
- Falhas 500 foram induzidas renomeando tabelas no banco de teste, nao por injecao de falha no codigo. O mapeamento para ERRO_INTERNO e o mesmo, mas o caminho real nao foi exercitado.

## 6. Comandos e resultados

- Leitura: openapi.json (30 operacoes), cenarios.json (310 cenarios; 119 no escopo), API.md, DTOS.md, REGRAS-DE-NEGOCIO.md, ESCOPO.md, ARQUITETURA.md, codigo de saude/auth/usuarios/setores/comum/config.
- `npm run migration:run` e `npm run seed -- --etapa completa` com variaveis de ambiente do processo: OK.
- API iniciada com `node dist/src/main.js`, PID registrado, saude 200. Encerrada por PID em cada etapa (3 vezes).
- Bateria manual: 168 linhas (scratchpad/resultados-manual.txt).
- Runner de cenarios: 119 no escopo; 110 OK, 8 FALHA, 1 NAO VERIFICADO (scratchpad/resultados-cenarios.txt e .json). Cada cenario com API nova e banco pristino.
- Rate limit: Casos A, B, C (scripts throttle.mjs e throttle2.mjs; ver secao 2, P3-02).
- Limpeza: bancos de teste (fatia1.sqlite, fatia1-cenarios.sqlite, cenarios-pristino.sqlite) apagados ao final. Porta 3061 livre. Nenhum arquivo do repositorio alterado.

## 7. Pistas da auditoria anterior

- `GET /setores?x=1` retornou 200: CONFIRMADO (P2-01).
- Datas com `.000Z` / perda de precisao: CONFIRMADO no banco (segundos); fuso NAO confirmado como problema (P3-03).
