# Auditoria: fatia 2 do back-end (Lanternas e Dashboard)

Repositório: `C:\Users\Windows 11\Documents\Desenvolvimento web\TrabalhoWeb` (branch `integracao/back-front`). Nenhum arquivo do repositório foi editado. Sem commit.

## 1. Escopo e fontes

Seis operações do `docs/contratos/openapi.json` (de 30):

| Operação | Acesso (`x-acesso`) |
|---|---|
| `GET /lanternas` | Pública |
| `GET /lanternas/{id}` | Pública |
| `POST /lanternas` | Guardião |
| `PATCH /lanternas/{id}` | Guardião |
| `PATCH /lanternas/{id}/status` | Guardião |
| `GET /dashboard` | Autenticado (Guardião vê tudo com `setor` opcional; Lanterna vê só o próprio Setor) |

Respostas documentadas por operação (openapi.json):

- `GET /lanternas`: 200 `LanternasPagina` (`itens` + `meta{total,pagina,limite,paginas}`); 400 `DADOS_INVALIDOS`; 500. Query: `setor` (0–9999), `status` (`ativo|em_missao|afastado`), `busca` (≤100), `pagina` (≥1, padrão 1), `limite` (1–50, padrão 20), `ordenar` (`codinome|setor|anoIngresso`, padrão `codinome`), `ordem` (`asc|desc`, padrão `asc`).
- `GET /lanternas/{id}`: 200 `LanternaFicha` (17 campos); 400; 404 `NAO_ENCONTRADO`; 500.
- `POST /lanternas`: 201 Ficha; 400; 401; 403 `SEM_PERMISSAO`; 404; 409 `LANTERNA_JA_CADASTRADA`; 422 `MENTOR_INVALIDO`; 500.
- `PATCH /lanternas/{id}`: 200 Ficha; 400; 401; 403; 404; 409 `LANTERNA_EM_USO`; 422 `MENTOR_INVALIDO`; 500.
- `PATCH /lanternas/{id}/status`: 200 Ficha; 400; 401; 403; 404; 409 `LANTERNA_EM_MISSAO`; 500.
- `GET /dashboard`: 200 `Dashboard`; 400; 401; 500. Query: `setor` (0–9999; ignorado para Lanterna), `dias` (7–90, padrão 30).

Fontes consultadas: `openapi.json`, `exemplos/cenarios.json`, `docs/backend/API.md`, `DTOS.md`, `REGRAS-DE-NEGOCIO.md`, `ESCOPO.md`, e o código em `backend/src/lanternas`, `backend/src/dashboard`, `backend/src/comum`, `backend/src/auth` (guards), mais os pontos de Ocorrência de que o status calculado depende (`ocorrencias.repository.ts`, `usuarios.repository.ts`).

## 2. Ambiente e método

- Instância isolada: `DATABASE_PATH` = `...\scratchpad\fatia2.sqlite` (removido ao final), `PORT=3062`, demais variáveis do enunciado. Nada em `backend/data/dev.sqlite`, na porta 3001 ou em `backend/.env`.
- Verificado que `process.loadEnvFile` não sobrescreve variáveis já definidas (o `backend/.env` existente tem as mesmas chaves; a configuração de teste prevaleceu).
- `npm run migration:run` e `npm run seed -- --etapa completa` executados sem erro. Depois o seed foi refeito com `--limpar` e `SEED_INSTANTE=2026-11-09T12:00:00Z`.
- `dist/` usado sem rebuild. Verificado por mtime que nenhum `.ts` de `src` é mais novo que `dist/src/main.js`; a correspondência compilado × fonte não foi comprovada por diff de build.
- Relógio: a API foi iniciada com um preload de teste (no scratchpad, `fatia2-relogio.mjs`) que desloca `Date` para `relogioReferencia` = 2026-11-09T12:00Z. Necessário para comparar `dashboard`/`serie` com os cenários. Não altera o repositório.
- Mundo base: o runner materializou `mundos.base` + `ajustes` de cada cenário diretamente no SQLite (colunas conforme `migrations/Inicial.ts`), com senha bcrypt do contrato. Tokens gerados com o `JWT_SECRET` de teste (não via login, por causa de `LOGIN_LIMITE=5/60s`).
- Processos iniciados por mim: três `node` escutando na 3062 (PIDs 1500, 33544, 33980), todos encerrados por PID após conferência com `netstat`. Nenhum outro processo foi tocado (há `api-manual.pid` de outra tarefa no scratchpad, intocado).

Scripts e saídas (no scratchpad): `fatia2-cenarios.mjs` → `fatia2-resultados.json`; `fatia2-manuais.mjs` → `fatia2-manuais-resultados.json`; `fatia2-extra.mjs` → `fatia2-extra-corrida.json`, `fatia2-extra-dashboard.json`; `fatia2-falha500.mjs`; `fatia2-seed.mjs` → `fatia2-seed-consistencia.json`; `fatia2-transform.mjs`.

Resultados gerais:

- Cenários de `cenarios.json` das 6 operações: 63. OK 53; DIVERGENTE 4; 500 (6) sem ponto de injeção de falha no código, verificados por simulação (seção 5).
- Bateria manual (além dos cenários): 122 checagens. OK 111; DIVERGENTE 11.
- Corrida RN-23 (atribuir × afastar): 68 rodadas no total (8 na bateria, 30 com atraso só no afastar, 30 com atraso aleatório nos dois lados). Ordens observadas: 60 com atribuição primeiro e 8 com afastamento primeiro. Nenhum estado inválido.
- Dashboard recomputado do banco e comparado à API: 5 casos × 2 bases (mundo com as mutações da bateria; seed). Iguais em todos os campos.
- Consistência do status calculado: 25 Lanternas do seed, 0 divergências entre Ficha, lista, resumo do mentor e valor armazenado; `estatisticas` recomputadas, 0 divergências.

## 3. Tabela de operações

Veredito: OK / DIVERGENTE / AUSENTE / NÃO VERIFICADO. Códigos de bug (B-xx) na seção 4.

| Método + rota | Documentado | Obtido | Veredito |
|---|---|---|---|
| `GET /lanternas` | Pub; 200 lista paginada; 400; 500. Filtros e ordenação como em 1. | 200 para `busca` (acento, `%`, `_`, `\`, só espaços), `status` (calculado), `ordenar` (nulos no fim em asc/desc), `pagina`/`limite`, página além do fim, `ordem=desc`. **400 para qualquer `setor`**, inclusive válido (B-01). **500 com `pagina` ≥ 1e21** (B-03). 400 para `ordem=ASC` e `busca` >100. Lanterna recebe a mesma lista que anônimo. | DIVERGENTE (B-01 P1, B-03 P2) |
| `GET /lanternas/{id}` | Pub; 200 Ficha (17 chaves, sem vazamento); 400; 404; 500. | 200 e 404 corretos; 400 para id de 1 caractere, maiúsculo, 41 caracteres e `%2F`. Ficha com exatamente as 17 chaves e as 4 de `estatisticas`. Query desconhecida (`?x=1`) aceita (B-04). Bearer inválido em rota pública: 200 (contrato silente, DV-10). | DIVERGENTE (B-04 P3) |
| `POST /lanternas` | Guardião; 201 Ficha; 400; 401; 403; 404 (Setor); 409; 422 (mentor); 500. | 401/403 corretos (inclusive Lanterna de outro Setor e claim forjado ignorado); 201, 404, 409, 422 corretos; 400 para `especie:null`, `id` curto, `codinome` só espaços, citação de 16 palavras, 11 habilidades, `fontes` com campo extra, URL `ftp:`/`javascript:`, `criadoEm` extra, JSON malformado. **201 para tipos errados** (`codinome` numérico/booleano/objeto gravado como texto, `setorId` e `anoIngresso` como string numérica) (B-02). Query desconhecida aceita (B-04). | DIVERGENTE (B-02 P2, B-04 P3) |
| `PATCH /lanternas/{id}` | Guardião; 200 Ficha; 400; 401; 403; 404; 409 `LANTERNA_EM_USO`; 422 `MENTOR_INVALIDO`; 500. | 409 para troca/anulação de Setor com conta vinculada ou Ocorrência histórica/excluída (inclusive com `setorId` string "674", coerção B-02). Mesmo Setor (RN-34): 200. Ciclo direto e indireto e mentor inexistente: 422. `fontes {}` limpa; `fontes:null`, `especie:null`, corpo vazio: 400. Renomear `codinome` atualiza a busca. **Tipos errados aceitos** (`codinome:123`, `anoIngresso:"2001"` → 200) (B-02). Query aceita (B-04). | DIVERGENTE (B-02 P2, B-04 P3) |
| `PATCH /lanternas/{id}/status` | Guardião; 200 Ficha; 400; 401; 403; 404; 409 `LANTERNA_EM_MISSAO`; 500. | Afastar com carga → 409 (`afastado` e `ativo` sobre `em_missao`). Afastar sem carga → 200; reativar 200; idempotente 200. Corpo: `em_missao`, `null`, extra, vazio, maiúsculo → 400. 20 PATCH simultâneos: todos 200, sem 500. Corrida RN-23: sem estado inválido. Query aceita (B-04). | DIVERGENTE (B-04 P3) |
| `GET /dashboard` | Autenticado; 200; 400; 401; 500. `dias` 7–90 (padrão 30); série UTC; média `null` sem amostra; ranking ≤10. | 400 para `dias=7.5`, vazio, `setor=-1`, `setor=2814.5`, `setor=10000`, query desconhecida, `setor=abc` por Lanterna. `dias=7` → série de 7; `dias=90` → 90; padrão → 30. Agregados (porStatus, porGravidade, vencidas, média, série, ranking) iguais à recomputação do banco para G, G com filtro, L (com `setor` ignorado) em 2 bases. Setor inexistente (9999): 200 com zeros (DV-6). Cenários `consultarDashboard.*` todos OK. | OK |

Para os seis: 500 do envelope verificado por simulação (seção 5): OK.

## 4. Bugs

Caminho base de `backend/src`: `C:\Users\Windows 11\Documents\Desenvolvimento web\TrabalhoWeb\backend\src`. Reproduções usam `TOK` = JWT de Guardião assinado com o `JWT_SECRET` de teste e `API=http://localhost:3062`, que é a instância isolada da auditoria (já encerrada; para reproduzir, subir a mesma configuração do seção 2). Não usar a porta 3001 (desenvolvimento).

### B-01 — P1 — Filtro `setor` de `GET /lanternas` sempre responde 400
- Arquivo: `C:\...\backend\src\lanternas\dto\filtro-lanternas.dto.ts:32-35` (`inteiroQuery` aceita só string) e `:37-43` (`setor` com `@Transform(inteiroQuery)` na linha 39).
- Causa: `C:\...\backend\src\comum\configurar-http.ts:18` (`enableImplicitConversion: true`) converte `"2814"` em número antes do `@Transform`; `inteiroQuery(2814)` devolve `NaN` e `setor` vira `null`, falhando `IsInt`/`Min`/`Max`. Em `C:\...\backend\src\dashboard\dto\filtro-dashboard.dto.ts:32-33` a mesma função aceita número, por isso o filtro do dashboard funciona.
- Reprodução: `curl -s "$API/lanternas?setor=2814"`
- Esperado: 200, só Lanternas do Setor 2814 (openapi, `GET /lanternas`, `setor` 0–9999).
- Obtido: 400 `DADOS_INVALIDOS` com `detalhes` `[{campo:"setor"}]` ×3 (`must not be greater than 9999`, `must not be less than 0`, `must be an integer number`). Ocorre também com `setor=0`, `setor=9999` e `setor=abc`.
- Confirmado no cenário `listarLanternas.200`.

### B-02 — P2 — Coerção de tipos no corpo aceita valores de tipo errado e grava lixo
- Causa: `C:\...\backend\src\comum\configurar-http.ts:18`. Campos afetados: `criar-lanterna.dto.ts` linhas 28–32 (`codinome`), 41–45 (`especie`), 47–51 (`planetaNatal`); `criar-lanterna.dto.ts` 54 e 61 (`setorId`/`anoIngresso` aceitam string numérica no `@Transform`); e os equivalentes em `editar-lanterna.dto.ts` 127–131, 141–145, 148–152, 155–159, 162–166.
- Reprodução (cada `id` único):
  - `curl -s -X POST "$API/lanternas" -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" -d '{"id":"x-obj","codinome":{"a":1},"especie":"Esp","planetaNatal":"Pl"}'`
  - `... -d '{"id":"x-num","codinome":12345,"especie":"Esp","planetaNatal":"Pl"}'`
  - `... -d '{"id":"x-set","codinome":"Nm","especie":"Esp","planetaNatal":"Pl","setorId":"674"}'`
  - `curl -s -X PATCH "$API/lanternas/hal-jordan" -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" -d '{"anoIngresso":"2001"}'`
- Esperado: 400 `DADOS_INVALIDOS` (openapi: `codinome` string, `setorId`/`anoIngresso` integer; API.md: "conversão falhou" é 400; DTOS.md limita conversão a query e path).
- Obtido: 201, 201, 201 e 200. O `codinome` gravado é `"[object Object]"`, `"12345"`, e `setorId` `674` (de string). Verificado no banco.
- Sem bypass de autorização; o problema é integridade dos dados da Ficha.

### B-03 — P2 — `GET /lanternas` responde 500 com `pagina` inteiro muito grande
- Arquivos: `C:\...\backend\src\lanternas\dto\filtro-lanternas.dto.ts:55-58` (`pagina` sem máximo; aceita inteiro inseguro); `C:\...\backend\src\lanternas\lanternas.repository.ts:81` (`.skip((pagina - 1) * limite)`). Para valores ≥ 1e21 o JS serializa em notação exponencial e o SQLite falha com `datatype mismatch` (visto no log de erro).
- Reprodução: `curl -s "$API/lanternas?pagina=1000000000000000000000"`
- Esperado: 200 com `itens: []` (página além do fim, openapi/API.md) ou 400. Contrato não define máximo para `pagina`.
- Obtido: 500 `ERRO_INTERNO`. Valores até 9007199254740992 respondem 200.

### B-04 — P3 — Query desconhecida é aceita em rotas sem DTO de query
- Arquivos: `C:\...\backend\src\lanternas\lanternas.controller.ts:22-26` (`GET :id`), `:28-32` (`POST`), `:34-38` (`PATCH :id/status`), `:40-44` (`PATCH :id`). `GET /lanternas` e `GET /dashboard` já rejeitam (DTOs com whitelist).
- Reprodução: `curl -s "$API/lanternas/hal-jordan?x=1"` (e o mesmo com `POST`, `PATCH` e `PATCH …/status`, com `?x=1`).
- Esperado: 400 `DADOS_INVALIDOS` (openapi, `x-query-desconhecida` em todas as operações; API.md: "campo desconhecido é 400").
- Obtido: 200 (ou 201 no POST, 200 no PATCH).

### B-05 — P3 — `detalhes` repete o campo, uma entrada por restrição
- Arquivo: `C:\...\backend\src\comum\filtro-excecoes.ts:42-57` (cada mensagem vira um objeto).
- Reprodução: `curl -s "$API/lanternas?setor=abc"`
- Esperado: um objeto por campo com `mensagens` (Erro400 e API.md: `detalhes` é lista de `{campo, mensagens[]}`).
- Obtido: três objetos `{campo:"setor"}`. O cenário `listarLanternas.400.DADOS_INVALIDOS.setor-nao-numerico` espera uma entrada.

### B-06 — P3 — Nome do campo para corpo vazio: `body` (código) × `corpo` (cenário)
- Arquivo: `C:\...\backend\src\lanternas\dto\editar-lanterna.pipe.ts:7-9` (mensagem `body informe ao menos…`, que vira `campo: "body"`).
- Reprodução: `curl -s -X PATCH "$API/lanternas/hal-jordan" -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" -d '{}'`
- Esperado (cenário `editarLanterna.400.DADOS_INVALIDOS.corpo-vazio`): `detalhes[0].campo = "corpo"`. Nenhum documento define o nome.
- Obtido: `"body"`. Status 400 e código corretos.

### B-07 — P3 — Latente: precedência afastado × em_missao difere entre listagem e Ficha (não reproduzido via API)
- Listagem e filtro: `C:\...\backend\src\lanternas\lanternas.repository.ts:66` (`afastado` vence). Ficha: `C:\...\backend\src\lanternas\ficha-resposta.dto.ts:37-39` (`cargaAtual > 0` vence, `em_missao`).
- Só aparece com `afastado` e carga > 0 armazenados. Pela API isso é inalcançável: afastar exige carga 0 (`lanternas.service.ts:107-108`) e atribuir a `afastado` é recusado. Nas 68 rodadas RN-23 não apareceu. RN-20 não define a precedência (ver DV-7).

### B-08 — P3 — Latente: resumo de mentor/aprendiz usa o status armazenado
- `C:\...\backend\src\lanternas\lanterna-resumo.dto.ts:98` (`resposta.status = lanterna.status`, valor persistido). Ficha e lista usam a contagem viva (`ficha-resposta.dto.ts:37`, `lanternas.repository.ts:66`).
- Hoje consistente: `recalcularStatus` persiste em cada mutação. Testado em atribuir, `em_andamento`, resolver, excluir Ocorrência e afastar: as quatro visões (Ficha, lista, resumo do mentor, armazenado) bateram. Um caminho que altere a carga sem recalcular deixaria o resumo defasado.

## 5. Verificações sem divergência (resumo)

- Envelope: sucesso `{sucesso,dados}`; erro com `erro{status,mensagem,codigo[,detalhes]}`, `caminho` (pathname) e `timestamp` ISO. `detalhes` só em 400.
- Esteira: 401 antes de 403, 403 antes de 400/404 (ex.: `POST` inválido de Lanterna → 403; `PATCH` sem token em id inexistente → 401; `PATCH` com corpo inválido em id inexistente → 400).
- Autenticação: sem token, assinatura de outro segredo, expirado, `sub` inexistente, esquema `Basic` → 401. Claim `papel` forjado é ignorado (papel vem do banco, RN-06).
- 500 (seção de simulação): ao renomear `lanterna` temporariamente no banco isolado, as seis rotas responderam 500 com `{codigo:"ERRO_INTERNO", mensagem:"Erro interno", status:500}`, sem `detalhes` e sem campos extras; `caminho` correto. Schema restaurado; `foreign_key_check` vazio; `GET /lanternas/hal-jordan` voltou a 200. (O campo `vazaSql` do script era falso positivo: o caminho `/lanternas` contém "lanterna".)
- Ficha: 17 chaves exatas; `estatisticas` com 4 chaves; `fontes` sempre presente; lista com 8 chaves (sem `fontes`/biografia/estatísticas).
- Validação de corpo confirmada como correta: `especie`/`planetaNatal` null no POST e PATCH, `id` malformado, `codinome` só espaços, trim, citação 15 vs 16 palavras, 10 vs 11 habilidades, `primeiraAparicao` 300 (aceito) vs 301 (400), URL HTTP(S), whitelist aninhada de `fontes`, `minProperties` do PATCH, `status` no corpo do POST/PATCH.
- Mentor: próprio id, ciclo direto e indireto, inexistente → 422; sem ciclo → 200; mentor lista o aprendiz.
- Setor da Ficha (RN-34/D32): troca com conta vinculada → 409 `LANTERNA_EM_USO`; anulação com histórico → 409; mesmo Setor → 200.
- Busca (D35): acento e caixa neutros; `%`, `_` e `\` literais; espaços ignorados; 101 caracteres → 400.
- Ordenação: `setor` e `anoIngresso` com nulos no fim em asc e desc; `codinome` pela forma normalizada.
- Paginação: `meta` (total, pagina, limite, paginas); página além do fim → `itens: []` com meta preservada; `limite=0` → 400.
- Status calculado: 4 visões iguais após atribuir, `em_andamento`, resolver, excluir e afastar. Seed: 25 Lanternas, 0 divergências.
- RN-23: 68 rodadas atribuir × afastar, 0 estados inválidos; ambas as linearizações ocorreram. Cadastro com mesmo `id` ×10 simultâneos → 1×201, 9×409. Setor × atribuição simultâneos → sem responsável de outro Setor.
- Dashboard: validação de `dias`, `setor` e query; série 7/30/90; agregados recomputados iguais (ver seção 2).
- Rota inexistente: `DELETE /lanternas/{id}` → 404 `NAO_ENCONTRADO` (RN-33); `PUT` → 404 (sem 405).
- Log: `LogMiddleware` grava método, caminho, status e duração; no log da API não há `Bearer`, `eyJ`, senha ou hash.

## 6. Divergências entre documentos (sem escolher lado)

- **DV-1** — `openapi.json` `x-query-desconhecida` (repetido nas 30 operações): "setor conhecido é aceito e ignorado para L nas rotas documentadas". Aplicado a `GET /lanternas` (Pública; a matriz de API.md diz que Lanterna vê Lanternas) e às rotas só de Guardião. Não está claro se Lanterna deve ter `setor` ignorado em `GET /lanternas`.
- **DV-2** — `cenarios.json` `consultarFichaLanterna.400.DADOS_INVALIDOS.slug-malformado` espera `caminho` = `/lanternas/Hal Jordan` (decodificado). API.md define `caminho` como "pathname da requisição". Um pathname de URL é codificado (`/lanternas/Hal%20Jordan`), e a API devolve assim. Status e código batem; só o `caminho` diverge.
- **DV-3** — Nome do campo em `detalhes` para corpo vazio: cenário `corpo`, código `body` (B-06). Nenhum documento define.
- **DV-4** — API.md ("campo desconhecido e query malformada são 400, em todas as operações") × rotas sem DTO de query (B-04). Divergência código × documento.
- **DV-5** — API.md lista para `POST /lanternas` "404 (Setor), 409 LANTERNA_JA_CADASTRADA, 422" sem definir a ordem entre 404 e 409. Código: 409 (id duplicado) antes de 404 (Setor inexistente). Observado: `id` existente + `setorId: 9999` → 409.
- **DV-6** — Dashboard com `setor` inexistente (9999 para Guardião): openapi e API.md não documentam 404 nem o resultado vazio. Código: 200 com zeros.
- **DV-7** — Precedência de status quando `afastado` tem carga (RN-20, D8, D26): não definida. Código diverge entre listagem e Ficha (B-07).
- **DV-8** — Formato de `detalhes`: o schema Erro400 permite repetir `campo`, mas a descrição ("campo e mensagens") sugere uma entrada por campo (B-05).
- **DV-9** — Token inválido em rota pública (`GET /lanternas`, `GET /lanternas/{id}`): contrato silente. Código ignora o token e responde 200.
- Sem divergência encontrada entre `openapi.json`, `API.md`, `DTOS.md`, `REGRAS-DE-NEGOCIO.md` e `ESCOPO.md` para as seis operações, além das listadas acima. A lista de códigos 409 da operação `PATCH …/status` (`LANTERNA_EM_MISSAO`) e a de `PATCH /lanternas/{id}` (`LANTERNA_EM_USO`) batem entre openapi e API.md.

## 7. Não verificado e limites

- **500 dos cenários**: não há ponto de injeção no código. Simulado por renomear a tabela `lanterna` no banco isolado (e restaurar). Prova o envelope; não prova que uma falha real do repositório produz o mesmo.
- **Lanterna sem Setor no dashboard**: inalcançável; o banco impede (`CK_usuario_lanterna_setor`). Não testado.
- **Corrida setor × atribuição**: uma rodada apenas. Não foi feita bateria de corrida para `PATCH /lanternas/{id}` com `setorId`.
- **Precedência afastado × em_missao** (B-07): não reproduzido pela API.
- **Cenários materializados por mim**: o mundo base foi montado pelo runner a partir de `cenarios.json`, com o mapeamento de colunas do `migrations/Inicial.ts`. Erros no materializador afetariam a comparação; os cenários de dashboard e de Ficha que batem indicam que o mapeamento está correto.
- **Relógio de teste** (ver seção 2).
- **Desempenho**: não medido.
- **`backend/.env`**: existe e não foi alterado nem criado por mim (mtime 14:04). Não li os valores; só as chaves.

## 8. Limpeza

- API de teste encerrada (PID 33980, único processo ativo; PIDs 1500 e 33544 já encerrados por mim). Confirmado por `netstat` na porta 3062.
- `fatia2.sqlite` removido. `fatia2-env.sh` (com o segredo de teste) removido.
- `git status --short` após a auditoria: apenas `M eslint.config.mjs` e `M vitest.config.mts`, que já estavam modificados antes. `backend/data/dev.sqlite` (14:05) não tocado.
- Scripts e JSONs de resultado mantidos no scratchpad para reprodução.
