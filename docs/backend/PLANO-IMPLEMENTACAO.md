# Plano de implementação do back-end

> DOC-03 foi concluída. BE-01 a BE-12 foram implementados em 2026-11-10. O aceite G-9 permanece pendente de atualização do registro G-1 pela coordenação devido à divergência de hash anotada em BE-12.

**Objetivo:** entregar API NestJS independente do front, compatível com o contrato acordado e provada com clientes HTTP e SQLite isolado.

**Arquitetura:** módulos por assunto; controller traduz HTTP, service decide regra, repository persiste. O guard recarrega o usuário; o service autoriza recurso/setor. Operações dependentes compartilham `EntityManager`, escrita condicional e Evento na mesma transação.

**Stack de destino:** NestJS, TypeORM, SQLite, class-validator/class-transformer, bcrypt, JWT, Helmet, throttler, Jest/supertest. BE-01 registrou versões compatíveis para a base HTTP em `backend/package.json` e `backend/package-lock.json`; as dependências das próximas fatias entram quando forem implementadas. Este documento não aprova atualizar o front.

## Entrada e fronteira

Leia [AGENTS.md](../../AGENTS.md), [guia](../agents/README.md), [mapa](../agents/MAPA.md) e [backend-api](../../.claude/skills/backend-api/SKILL.md). Consulte [arquitetura](ARQUITETURA.md), [modelo](MODELO-DE-DADOS.md), [regras RN](REGRAS-DE-NEGOCIO.md), [cenários](CENARIOS-DE-TESTE.md), [seed](SEED.md), [API](API.md), [DTOs](DTOS.md) e [pacote contratual](../contratos/README.md) antes da fatia correspondente. Decisões vigentes de ESCOPO e ADRs governam política, inclusive D32/RN-34 e D33. Não copiar tipos do front nem depender de Next para testar o provedor.

Os caminhos de BE-01 a BE-12 existem; a entrega técnica do provedor está implementada, e o aceite de integração G-9 aguarda a revisão coordenada do hash G-1. O dev back possui os arquivos do backend; contrato e documentação compartilhada são atribuídos à integração. `.env.example` da raiz pertence ao integrador/front; o back usa `backend/.env.example`. Não tocar `db.json`: leitura de origem histórica é permitida, escrita de teste usa SQLite próprio.

**Pré-condição de toda tarefa:** contrato aceito em G-1 ([INTEGRACAO §2](../INTEGRACAO.md#g-1--aceite-do-contrato)), com a versão e o hash lidos anotados no registro da tarefa. Os fechamentos técnicos da rodada 2 do contrato (busca, senha em bytes, vínculo de Ficha, liberação em andamento, precedência de erros) ficam nas fontes — [ESCOPO](ESCOPO.md), [RN](REGRAS-DE-NEGOCIO.md), [API](API.md), [modelo](MODELO-DE-DADOS.md) e OpenAPI — e este plano só aponta onde cada tarefa os cumpre; se uma fonte ainda não os trouxer, a operação aguarda a fonte.

Em cada tarefa registrar `info.version` e o SHA-256 do conjunto de `py -3 docs/contratos/validar.py --hash` (G-1), cenários de `docs/contratos/exemplos/cenarios.json` consumidos, pré-condições, teste focado, comandos/exit e primeiro passo para retomada. Antes dos testes do provedor, executar da raiz `py -3 docs/contratos/validar.py --conferir-hash HASH_DO_G1` e `py -3 -B -m unittest discover -s docs/contratos -p "test_*.py"` (em ambientes onde `python3` funciona, usar `python3` no lugar de `py -3`; Python>=3.10); esperado exit0. Esses testes cobrem o subconjunto documental declarado no README; não provam OpenAPI integral ou API implementada. Divergência API/DTO/OpenAPI é bloqueio daquela operação até resolução na fonte.

## Ordem sem dependências circulares

`BE-01 → BE-02 → BE-03 → BE-07a → BE-05 → BE-06 → BE-07b → BE-04 → BE-08 → BE-09 → BE-10 → BE-07c → BE-11 → BE-12`.

A fixture de integração (BE-FX, abaixo) entra por etapas nesta mesma ordem: a com BE-07a, b com BE-07b, c com BE-08, d com BE-09, e com BE-10.

**Entrega ao Corte 1** ([INTEGRACAO §3](../INTEGRACAO.md#3-matriz-de-recursos-e-gates)): o front só ativa recursos reais em um primeiro corte integrado. Para ele o back precisa ter BE-01, 02, 03, 05, 06, 07a, 07b, 08, 09 e 11, com BE-FX a–d, todos aceitos como provedor (B). Isso inclui BE-05 (leitura pública de Setores) para o cadastro. BE-04, BE-07c, BE-10 e BE-12 não bloqueiam o corte e entregam os gates aditivos (G8, G6) e o fecho (G9). BE-11 está implementado; BE-10 e BE-07c podiam esperar no primeiro corte (a linha de ordem acima é a ordem completa, não a do corte). O dashboard substitui o Resumo quando o corte integrado o ativar.

BE-04 pode começar logo após BE-06; BE-11 pode avançar após BE-08, usando fixtures próprias. BE-07 é dividido para não depender do ciclo de vida antes do login. BE-03 usa repositórios de Usuário/Setor já criados em BE-02, não os endpoints de BE-05/06. Nenhum seed depende de abrir endpoint temporariamente ou desligar guard global.

BE-06 calcula estatísticas por consultas à entidade Ocorrência, já presente em BE-02, mesmo antes de existir endpoint de ocorrência. Separar leitura de persistência da dependência entre módulos HTTP; não criar import circular com `forwardRef` para esconder a ordem. As consultas de carga são encapsuladas no repository da ocorrência e recebem o mesmo manager quando participam de transação. BE-08 implementa regras/rotas acima dessa infraestrutura.

## Ciclo e comandos de verificação futuros

Para cada incremento:

- [ ] Conferir status/base, registrar propriedade e consultar fonte canônica pertinente.
- [ ] Criar os casos de sucesso e erro abaixo e os cenários RN associados; executar teste focado, registrar a falha que representa a lacuna.
- [ ] Implementar regra mínima, retornar DTO de saída explícito, validar resposta real contra contrato/exemplos. Repetir teste até passar; snapshot aprovado manualmente não substitui compatibilidade.
- [ ] Executar no diretório `backend/` os scripts criados em BE-01: `npm run test -- --runInBand`, `npm run test:e2e -- --runInBand`, `npm run build`; esperado após implementação: exit 0. Registrar os resultados reais, nunca copiar o esperado como executado.
- [ ] Rever diff e matriz RN, atualizar documentação que passou de destino a atual e entregar revisão. Dados de teste descartáveis; sem escrita no banco de outro dev.

BE-01 criou `start:dev`, `test`, `test:e2e` e `build`; BE-02 criou `migration:run`/`migration:revert`; BE-07a acrescentou `seed` e a etapa a de `fixture:integracao` (disponibilidade efetiva em `backend/package.json`). As etapas a–e da fixture estão entregues; BE-07c acrescenta as ocorrências, eventos e comentários históricos ao seed demonstrativo.

SQLite em memória serve aos cenários isolados; concorrência, reinício e persistência devem usar arquivo temporário e conexões independentes, com `DATABASE_PATH` exclusivo. Congelar relógio nos testes de Prazo; seed demonstrativo usa datas relativas, não é fixture determinística da suíte.

## BE-01 — projeto e esteira HTTP

**Dependência:** G-1 (contrato aceito). **Arquivos:** `backend/package.json`, `package-lock.json`, `tsconfig.json`, `nest-cli.json`, `.env.example`, `src/main.ts`, `src/app.module.ts`, `src/config/ambiente.ts`, `src/comum/{configurar-http,filtro-excecoes,interceptor-envelope,log.middleware,erro-dominio}.ts`, `src/saude/saude.controller.ts`, `test/{jest-e2e.json,http.e2e-spec.ts}`.

- [x] Criar projeto em `backend/` com scripts e dependências explicitamente registrados. Extrair a configuração HTTP usada tanto no bootstrap quanto no teste: ValidationPipe com whitelist/forbid/transform, filtro/interceptor, Helmet, CORS restrito e log sem corpo/credenciais.
- [x] Validar `PORT`, `DATABASE_PATH`, `JWT_SECRET`, `JWT_EXPIRES_IN=8h`, `CORS_ORIGIN`, `LOGIN_LIMITE`, `LOGIN_JANELA_SEGUNDOS`; falhar ao iniciar se ausentes/inválidas, sem segredo padrão.
- [x] Implementar `/saude` público com envelope e erro global seguro; manter 204 sem envelope. Testar exceção inesperada sem expor stack, SQL ou segredo.

**Aceite:** iniciar com ambiente válido e `GET /saude`→200 acordado; configuração inválida impede subir; payload inválido→400 com detalhes de campo; exceção inesperada→500 `ERRO_INTERNO`. Captura de logs não contém Authorization, senha ou corpo. A proteção padrão será concluída em BE-03 antes da liberação de rotas de domínio.

**Registro de execução — 2026-11-10:** G-1 `1.0.0`, SHA-256 `cd91fef5a43bb239a67be5bbc1a942caedda7129bb268da7dbfdd0632b9a4730`; hash recalculado com Node e igual ao registro. Implementados projeto e pipeline HTTP; testes unitários e e2e exercitam saúde, validação, erro genérico, configuração e 204. `npm run test -- --runInBand` (exit 0, 5 testes), `npm run test:e2e -- --runInBand` (exit 0, 5 testes), `npm run build` (exit 0), `git diff --check` (exit 0). Os comandos Python do gate documental não puderam ser repetidos porque o Python Launcher não está instalado neste ambiente; G-1 mantém o resultado registrado para a revisão aceita. O `npm install` informou 21 vulnerabilidades no conjunto resolvido; não foi executada correção automática de dependências.

## BE-02 — esquema e persistência comum

**Depende:** BE-01. **Arquivos:** `src/database/{database.module,data-source}.ts`, `src/database/migrations/Inicial.ts`; `src/setores/{setor.entity,setores.repository}.ts`, `src/lanternas/{lanterna.entity,lanternas.repository}.ts`, `src/usuarios/{usuario.entity,usuarios.repository}.ts`, `src/ocorrencias/{ocorrencia.entity,ocorrencias.repository}.ts`, `src/eventos/{evento.entity,eventos.repository}.ts`, `src/comentarios/{comentario.entity,comentarios.repository}.ts`, `test/database.e2e-spec.ts`.

- [x] Mapear as seis entidades, nulabilidade/índices/FKs e CHECKs conforme modelo, sem `synchronize`. Setor inteiro; Lanterna slug; demais UUID. Ativar `PRAGMA foreign_keys=ON` em cada conexão.
- [x] Incluir as colunas internas de **busca normalizada** previstas no modelo (Usuário: nome e e-mail; Lanterna: codinome; Ocorrência: título), nunca expostas em DTO. Elas são preenchidas e mantidas na mesma transação de toda escrita que altera o campo de origem, com a normalização única definida na fonte (decomposição Unicode, remoção de marcas, minúsculas). Teste de repository: acento, caixa e `%`, `_`, `\` literais.
- [x] Criar migration inicial, execução/reversão e teste de banco vazio; conferir unicidade de email e vínculo de ficha, enums, envolvidos e restrições de exclusão. Providers de persistência não dependem dos módulos HTTP.
- [x] Repositories aceitam `EntityManager` opcional/obrigatório nas operações transacionais; uma transação não pode escapar para repository conectado fora dela. Incluir consulta de carga de ocorrência para BE-06/09 e filtros de soft delete.

**Aceite:** migrar→reverter→migrar banco temporário preserva esquema esperado; FK inválida, enum inválido e vínculo duplicado falham no banco. Setor com Lanterna/Usuário/Ocorrência não pode ser apagado fisicamente. Falhas de banco serão traduzidas a códigos do contrato nos services, não expostas como 500 bruto.

**Registro de execução — 2026-11-10:** G-1 `1.0.0`, SHA-256 `cd91fef5a43bb239a67be5bbc1a942caedda7129bb268da7dbfdd0632b9a4730`; conferido com o validador Python 3.13. Implementados as seis entidades, repositories por assunto, migration inicial e módulo TypeORM com `synchronize:false`; pesquisa normalizada usa `instr` parametrizado, sem curingas. `npm run test -- --runInBand` (exit 0, 10 testes), `npm run test:e2e -- --runInBand` (exit 0, 10 testes), `npm run build` (exit 0), migrations `run → revert → run` em SQLite temporário (exit 0), validador/hash do contrato (exit 0), `unittest` documental (120 testes, exit 0), `git diff --check` (exit 0). `node docs/agents/validar-documentacao.mjs --ancoras` (exit 1 por referência preexistente a `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`, ausente neste checkout). Node usado: 22.20.0, compatível com o requisito do TypeORM 1.1; Node 24.9 instalado no PATH não atende ao engine do TypeORM.

## BE-03 — autenticação e autorização padrão

**Depende:** BE-02, não depende de endpoints de Setores/Lanternas. **Arquivos:** `src/auth/{auth.module,auth.controller,auth.service,jwt.guard,papeis.guard}.ts`, `src/auth/dto/{cadastro,login}.dto.ts`, `src/comum/{publica,papeis,usuario-atual}.decorator.ts`, `src/usuarios/usuario-resposta.dto.ts`, `test/auth.e2e-spec.ts`, `src/auth/auth.service.spec.ts`, `src/app.module.ts`.

- [x] Testes criam Setores/Usuários com fixtures de repository no banco isolado. Cadastro verifica Setor por persistência existente; nenhuma chamada HTTP ao próprio `/setores`.
- [x] Implementar cadastro sempre Lanterna sem vínculo, email normalizado/único, bcrypt com os limites de caracteres e de bytes do OpenAPI (cadastro e login), sem truncar nem remover caracteres da senha; excesso é 400 com detalhe no campo `senha`, antes da comparação bcrypt. Testes com senha multibyte no limite e acima dele. Login compara hash real ou isca, retorna token/expiresIn/usuario; cadastro retorna só usuario e não token.
- [x] Guard JWT global, algoritmo/expiração fixos, `@Publica()` explícito para auth pública/saúde e futuras leituras públicas; recarregar usuário do banco a cada pedido (RN-06). Guard de papel antes do service; service protege recurso/setor.
- [x] Aplicar throttle ao login; `/auth/me` devolve DTO seguro atual. JWT contém apenas claims acordadas, sem hash/vínculo como fonte de autorização.

**Aceite RN-01/02/06:** cadastro válido→201 L; `papel` extra→400 e nada criado; Setor ausente→404; email repetido/caixa diferente→409. Login inexistente e senha incorreta têm mesma resposta 401; excesso→429. Sem token/adulterado/expirado→401, rota nova sem decorator nasce privada. Alterar papel no banco muda permissão no mesmo token; hash não aparece em resposta/token/log.

**Registro de execução — 2026-11-10:** implementados cadastro/login, DTO seguro, guards globais JWT e papel, limite de tentativas e `/auth/me`. Os testes de integração usam banco SQLite isolado e executam a API em subprocesso para cobrir o Nest/Throttler sem o problema de carregamento ESM no ambiente Jest; fixture de Setor inserida por `SetoresRepository`. Cobertos os limites de senha UTF-8 em cadastro/login, papel extra, duplicidade, Setor ausente, credenciais uniformes, token inválido/expirado, throttle 429 e papel relido no banco. `npm run build` (exit 0), `npm test -- --runInBand` (exit 0, 20 testes), `npm run test:e2e -- --runInBand` (exit 0, 15 testes). Node usado: 22.20.0.

## BE-07a — seed mínimo para login independente

**Depende:** BE-03. **Arquivos:** `src/database/seed/{seed,ids,setores,usuarios}.ts`, `test/seed-minimo.e2e-spec.ts`, `backend/package.json`, `backend/README.md`.

- [x] Criar comando `seed` com etapas explícitas. Etapa mínima grava Setores verificados necessários e um Guardião com UUID/email fixos e bcrypt; não precisa de Fichas, Ocorrências ou Eventos.
- [x] Reexecutar sem duplicação; recusar `--limpar` em produção e exigir banco local explicitamente configurado. Documentar comando/conta demonstrativa no README do back.

**Fixture FX a (BE-FX):** ver a seção BE-FX; esta tarefa entrega `ids`, `manifesto`, `contas` e o script `fixture:integracao` com Setores, G, L2814, L674, um segundo Guardião sem Setor para ensaiar rebaixamento e conta L com Setor, sem ficha.

**Aceite:** banco novo migrado recebe G capaz de login, `/auth/me` e rota G de teste; reexecução mantém contagens/chaves. Sem front, sem rota de bootstrap pública, sem senha em texto no banco. `fixture:integracao` monta as contas em banco novo e grava o manifesto sem segredo. Com BE-05, disponibiliza o gate de autenticação G2 (o cadastro precisa listar Setores).

**Registro de execução — 2026-11-10:** criado `npm run seed -- --etapa minima`, idempotente, com três Setores e o Guardião de demonstração documentado em `backend/README.md`; `--limpar` exige `NODE_ENV=development` e caminho SQLite absoluto. Entregue também a etapa a de `fixture:integracao`: banco absoluto migrado e vazio, cinco contas estáveis (G, G2, L2814, L674 e L sem Ficha), senha `FIXTURE_SENHA` obrigatória e manifesto sem segredo. Testes conferem hash bcrypt, repetição/refusa banco populado, proteção de produção, logins reais e `/auth/me` para as cinco contas. `npm run build` (exit 0), `npm test -- --runInBand` (exit 0, 23 testes), `npm run test:e2e -- --runInBand` (exit 0, 18 testes). Node usado: 22.20.0. Rotas administrativas reais ainda dependem de BE-05/BE-04; a prova de autorização por papel permanece no teste do guard.

## BE-05 — Setores

**Depende:** BE-03 e persistência BE-02; seed mínimo só para demonstração. **Consumidor imediato:** o cadastro do front (FE-02) e o gate G2 exigem a leitura pública de Setores desta tarefa; ela é pré-condição de G2, não de G3. **Arquivos:** `src/setores/{setores.module,setores.controller,setores.service,setor-resposta.dto}.ts`, `src/setores/dto/{criar-setor,editar-setor}.dto.ts`, `src/setores/setores.service.spec.ts`, `test/setores.e2e-spec.ts`.

- [x] GET público sem paginação e GET por inteiro; escrita G. PATCH exige pelo menos um campo e proíbe alterar id; POST valida 0–9999 e unicidade.
- [x] Excluir consulta usos por Lanternas, Ocorrências e Usuários; executar exclusão segura e traduzir FK concorrente para `SETOR_EM_USO`. Não apagar registros vinculados para facilitar a operação.

**Aceite RN-30/31/D31:** visitante consulta; L escreve→403; G cria/edita/exclui setor livre→201/200/204; id repetido→409 `SETOR_JA_CADASTRADO`; inexistente→404; uso por qualquer uma das três relações→409 `SETOR_EM_USO`, inclusive Usuário sem ficha. 204 sem corpo.

**Registro de execução — 2026-11-10:** implementados módulo, controller, service, DTOs e consultas do repository. Lista pública ordenada por ID; escrita G; exclusão verifica Lanterna, Usuário e Ocorrência (incluindo soft-deleted) dentro da transação e traduz FK concorrente para `SETOR_EM_USO`. Testes cobrem validação, trim, unicidade, PATCH parcial e imutabilidade do ID, ordem 401/403 antes de DTO, referências por cada tipo, 204 vazio e 404. `npm run build` (exit 0), `npm test -- --runInBand` (exit 0, 31 testes), `npm run test:e2e -- --runInBand` (exit 0, 23 testes), `git diff --check` (exit 0). Node usado: 22.20.0.

## BE-06 — Lanternas, mentoria, Ficha e status

**Depende:** BE-05, consultas de carga BE-02. **Arquivos:** `src/lanternas/{lanternas.module,lanternas.controller,lanternas.service,ficha-resposta.dto,lanterna-lista-resposta.dto}.ts`, `src/lanternas/dto/{criar-lanterna,editar-lanterna,status-lanterna,filtro-lanternas}.dto.ts`, `src/lanternas/lanternas.service.spec.ts`, `test/lanternas.e2e-spec.ts`.

- [x] GET lista pública paginada por busca (codinome, pela coluna normalizada de BE-02)/status/setor/ordenação permitidos, desempate id no banco; ordenar por Setor ou ano de ingresso deixa nulos no fim nas duas direções. Ficha pública com campos/estatísticas/mentor/aprendizes/fontes completos, nulos preservados. Lista não expõe `fontes`.
- [x] Escrita só G; slug imutável após POST; Setor opcional/nulo; mentor existente, diferente de si e sem ciclo de qualquer comprimento. Validar mentoria concorrente em transação para duas edições não criarem ciclo.
- [x] Ao mudar/anular Setor da Ficha, verificar conta e ocorrências ligadas, inclusive históricas: incompatibilidade é 409 `LANTERNA_EM_USO` (RN-34). Não mover conta/ocorrência automaticamente; validar e atualizar na transação para vínculo/atribuição concorrente não quebrar o Setor.
- [x] Separar `PATCH /status` (`ativo|afastado`) da edição; `em_missao` é sistema. Verificar carga no banco e afastar/recalcular na mesma transação usada nas futuras atribuições, sem depender do controller de Ocorrências. Não implementar DELETE.

**Aceite RN-22/30/32/33/34:** lista/ficha mesmo sem sessão; ficha incompleta→200 com nulls/fontes; id ausente→404, duplicado→409 `LANTERNA_JA_CADASTRADA`. Mentor próprio/inexistente/ciclo longo→422 `MENTOR_INVALIDO`; campo `status` em PATCH de dados→400; afastar com carga→409 `LANTERNA_EM_MISSAO`. Setor diferente/nulo em Ficha com vínculo incompatível→409 `LANTERNA_EM_USO`, mesmo que a ocorrência já esteja resolvida/excluída; sem vínculos incompatíveis a alteração é permitida. Sem ocorrências, estatísticas zeradas/média nula conforme contrato. Exclusão de Lanterna não existe.

**Registro de execução — 2026-11-10:** implementados listagem e Ficha públicas, DTOs de criação/edição/status, validação de mentoria sem ciclos, compatibilidade de Setor sob transação, estatísticas de Ocorrências e status derivado `em_missao` na lista/Ficha. A consulta de mutação adquire o bloqueio de escrita SQLite antes de validar e alterar, serializando edições concorrentes de mentoria. Não foi criada rota DELETE. `npm run build` (exit 0), `npm test -- --runInBand` (exit 0, 41 testes), `npm run test:e2e -- --runInBand` (exit 0, 30 testes; inclui 7 cenários HTTP do BE-06), `git diff --check` (exit 0). Node usado: 22.20.0.

## BE-07b — seed de domínio e vínculos

**Depende:** BE-06 e BE-07a. **Arquivos:** `src/database/seed/{seed,lanternas,usuarios}.ts`, `test/seed-dominio.e2e-spec.ts`, README back.

- [x] Validar a resposta pública de cada uma das 25 Fichas contra `LanternaFicha` (schema de saída do OpenAPI) no teste do seed, inclusive `primeiraAparicao` (300 caracteres) e os demais limites. O seed preserva nulabilidade aceita da pesquisa; não exigir o DTO do cadastro manual para campos sem fonte. Campo incompatível é relatado, não truncado nem escondido.
- [x] Converter pesquisa aceita em lista tipada com fontes; inserir mentores em segunda passagem validada, preservar ausência de fonte e Setor opcional.
- [x] Completar Setores/25 Fichas/contas demonstrativas, vincular somente ficha e conta do mesmo Setor, sem inventar ficha de quem não tem Setor verificado. Reutilizar validações de domínio e estado inicial coerente.

**Fixture FX b (BE-FX):** `fichas.ts` e vínculos de L2814 e L674 (setores distintos, fichas distintas) mais uma Lanterna sem ficha, reutilizando as validações de domínio.

**Aceite:** 7 Setores conforme SEED/D25 (prevalece sobre contagem histórica 8), 25 Lanternas: 9 com Setor pesquisado, 4 de demonstração e 12 sem Setor. Segundo seed não duplica; fontes são visíveis na Ficha e ausentes da lista. As 25 Fichas passam no schema de saída `LanternaFicha`; não precisam passar pelo DTO de cadastro manual, que exige valores para alguns campos pesquisados como nulos. Estatísticas finais com Ocorrências serão conferidas em BE-07c. `fixture:integracao -- --etapa b` monta fichas e vínculos em banco novo.

**Registro de execução — 2026-11-10:** `npm run seed -- --etapa completa` acrescenta os Setores restantes, as 25 fichas pesquisadas e duas contas vinculadas (Hal/2814 e Kilowog/674), mantendo a etapa mínima e o modo `--limpar`. O catálogo usa fontes por campo, valores nulos sem fonte, mentoria em segunda passagem com validação de referência/ciclo e os 7 Setores definidos em SEED. O teste inicia a API e verifica cada Ficha pública contra `LanternaFicha` do OpenAPI, além de contagens e repetição do seed. A fixture `--etapa b` prepara 3 fichas, dois vínculos compatíveis por Setor e uma ficha sem conta. `npm run build` (exit 0), `npm test -- --runInBand` (exit 0, 43 testes), `npm run test:e2e -- --runInBand` (exit 0, 32 testes), `git diff --check` (exit 0). Node usado: 22.20.0.

## BE-04 — usuários, papel e vínculo

**Depende:** BE-03 e BE-06; seed completo não é pré-condição dos testes. **Arquivos:** `src/usuarios/{usuarios.module,usuarios.controller,usuarios.service}.ts`, `src/usuarios/dto/{filtro-usuarios,papel-usuario,vinculo-lanterna}.dto.ts`, `src/usuarios/usuarios.service.spec.ts`, `test/usuarios.e2e-spec.ts`.

- [x] Listar com busca/ordenação/paginação, saída explícita sem hash. Promoção só G; preservar setor/vínculo mas ignorar escopo como G. Para destino L, aceitar setor informado ou anterior; `setorId` com destino G é 400.
- [x] Rebaixamento verifica ao menos outro G e Setor existente/compatível com ficha, na mesma transação. Proteção do último G deve sobreviver a dois rebaixamentos concorrentes; não apenas contar e salvar separadamente.
- [x] Vínculo slug/null: existência (404), alvo precisa ser conta Lanterna com Setor próprio; alvo Guardião é 422 `VINCULO_NAO_PERMITIDO` mesmo com Setor preservado; Ficha sem Setor ou de outro Setor é 422 `SETOR_DIFERENTE`; exclusividade. `null` desvincula, inclusive Guardião promovido, e nunca habilita Minha fila para G. Traduzir corrida na unicidade em `LANTERNA_JA_VINCULADA`; vínculo e autorização não derivam do token antigo. A busca de usuários usa nome ou e-mail pelas colunas normalizadas de BE-02.

**Aceite RN-03/04/07/08:** L→403; promoção→200 e efeito no mesmo token. Último G→409 `ULTIMO_GUARDIAO`; destino L sem Setor→422 `SETOR_OBRIGATORIO`; referência ausente→404; Setor diferente ou ausente na Ficha→422 `SETOR_DIFERENTE`; vínculo a alvo Guardião→422 `VINCULO_NAO_PERMITIDO`; ficha já usada→409. Duas tentativas de remover os últimos G deixam ao menos um; duas contas competindo pela mesma ficha geram um único vínculo. `null` desvincula sem remover Ficha.

**Registro de execução — 2026-11-10:** implementados `GET /usuarios`, `PATCH /usuarios/:uuid/papel` e `PATCH /usuarios/:uuid/lanterna`, com DTOs validados, busca literal normalizada, paginação/ordenação estável e resposta sem campos internos. Alterações de papel e vínculo são transacionais; bloqueio de escrita SQLite serializa concorrência para último Guardião e exclusividade da Ficha. Promoção preserva setor/vínculo; Guardião não pode adquirir vínculo, mas pode remover vínculo preservado. Testes de unidade (14), E2E (37), `npm run build` e `git diff --check` passaram; os 5 E2E de Usuários cobrem autorização, validações, token atualizado, idempotência e disputas concorrentes. Node usado: 22.20.0.

## BE-08 — Ocorrências, escopo, Prazo e fila

**Depende:** BE-06 e BE-03. **Arquivos:** `src/ocorrencias/{ocorrencias.module,ocorrencias.controller,ocorrencias.service,prazo,ocorrencia-resposta.dto}.ts`, `src/ocorrencias/dto/{criar-ocorrencia,editar-ocorrencia,filtro-ocorrencias}.dto.ts`, `src/eventos/{eventos.module,eventos.service}.ts`, `src/ocorrencias/{ocorrencias.service,prazo}.spec.ts`, `test/ocorrencias.e2e-spec.ts`.

- [x] Criar gravador transacional de Eventos agora: criação já exige Evento `criada` por RN-40. A leitura pública autenticada da timeline fica em BE-10.
- [x] Listar/consultar/criar/editar/excluir e `/minha-fila` antes de `/:id`. Envolver autorização por setor em cada consulta/mutação; listas ignoram setor forjado de L, detalhe alheio→404. Criador vem do usuário recarregado, nunca body.
- [x] DTO dinâmico de criação proíbe `setorId` para L e exige para G. Status/responsável/resolução/datas são servidor; PATCH dados só G ou L criador, não resolvida; alterar gravidade recalcula prazo da criação original.
- [x] Busca por título pela coluna normalizada de BE-02, mantida na criação e na edição do título. Fazer paginação, filtros todos e ordenação no banco, incluindo prazo/vencida; ranking de gravidade explícito, desempate id. Fila filtra ficha vinculada ao usuário, somente não resolvidas/não excluídas e ordem fixa prazo/gravidade; sem vínculo→409 `CONTA_SEM_LANTERNA`. A ativação da tela de fila aguarda BE-09 para provar seus efeitos nas mudanças de status.
- [x] Excluir soft em transação, reavaliando carga RN-20 e mantendo Eventos/Comentários no banco. Implementar essa reavaliação junto ao service de Lanternas antes de liberar DELETE, ainda que BE-09 venha depois.

**Fixture FX c (BE-FX):** `ocorrencias.ts` cria, pelo service e pelos repositories (nunca por endpoint), Ocorrências abertas, uma vencida e uma dentro do prazo (ambas com margem de pelo menos 1 hora do limite), uma excluída e volume maior que o limite padrão de página, com `criadaEm` relativo ao instante de referência da fixture.

**Aceite RN-05/10/16/17/18/D9:** POST L não aceita setor e salva no setor da conta; G escolhe existente; criado + Evento são atômicos. Outro setor não lista/obtém/edita/exclui; L não criador edita→403. Resolvida não edita→409; DELETE G→204, GET subsequente→404 e histórico preservado. Prazos 24 h/3 d/7 d/14 d; igualdade exata ainda não vencida, resolvida nunca vencida. Fila G→403; L sem ficha→409. Ordem/páginas estáveis sob empate e filtros sem SQL livre.

**Registro de execução — 2026-11-10:** G-1 `1.0.0`, SHA-256 `cd91fef5a43bb239a67be5bbc1a942caedda7129bb268da7dbfdd0632b9a4730`; contrato permaneceu inalterado. Implementados os endpoints de leitura, criação, edição, exclusão lógica e Minha fila, com escopo atual por Setor, busca literal normalizada, filtros/paginação/ordenação no banco e prazo derivado da gravidade. `criada` é gravado na mesma transação da criação; a exclusão recalcula `em_missao` pela operação exportada do service de Lanternas e preserva histórico. Fixture etapa c cria 22 ocorrências com datas relativas à referência, 22 Eventos, uma ocorrência excluída e volume visível acima da página padrão. `npm run build` (exit 0), `npm test -- --runInBand --testPathIgnorePatterns=e2e` (exit 0, 19 testes), `npm run test:e2e -- --runInBand` (exit 0, 45 testes), `git diff --check` (exit 0). A validação documental Python e a conferência local de hash não puderam ser executadas: `py -3` não está instalado neste ambiente. Próximo passo: BE-09, transições e atribuição atômicas; timeline fica para BE-10. Node usado: 22.20.0.

## BE-09 — transições e responsabilidade atômicas

**Depende:** BE-08. **Arquivos:** `src/ocorrencias/{ocorrencias.controller,ciclo-vida.service}.ts`, `src/ocorrencias/dto/{status-ocorrencia,responsavel-ocorrencia}.dto.ts`, repositories/services de ocorrência/lanterna/evento já atribuídos ao back; `src/ocorrencias/ciclo-vida.service.spec.ts`, `test/{ciclo-vida,concorrencia}.e2e-spec.ts`.

- [x] Implementar todas as transições RN-11–16: iniciar exige responsável; resolver exige explicação e grava data; só G reabre com motivo, preserva prazo e limpa resolução/data, libera responsável se afastado.
- [x] Atribuição/liberação só G, mesmo Setor (nulo é incompatível), não afastado e não resolvida. Liberar (`responsavelId:null`) uma Ocorrência `em_andamento` é 422 `SEM_RESPONSAVEL`, sem mudar status, vínculo, carga nem Eventos; liberar aberta é permitido, e reatribuir direto a outro responsável válido também. Recalcular anterior e novo por contagem de ocorrências abertas/andamento não excluídas. Não restringir cada Lanterna a uma única ocorrência: RN-20 permite carga múltipla.
- [x] Para cada mutação, abrir transação curta, revalidar estado, atualizar condicionalmente com estado anterior e conferir linhas afetadas, recalcular status e inserir um Evento do tipo da ação conforme contrato: `atribuida` ao atribuir, reatribuir ou liberar (com `de`/`para` coerentes, `null` ao liberar), `status_alterado` ao iniciar, `resolvida` ao resolver e `reaberta` ao reabrir, sem duplicar evento genérico em resolver e reabrir. Tentativa rejeitada (inclusive `SEM_RESPONSAVEL`) não grava Evento. Mesma conexão/manager em todos os passos; sem chamada externa no meio.
- [x] Projetar conflito de versão/estado com códigos já acordados: recarregar estado e devolver a regra violada. Se duas escritas ainda seriam válidas, não inventar 409 por princípio; provar invariantes e histórico coerente.

**Fixture FX d (BE-FX):** `ocorrencias.ts` ganha Ocorrências atribuídas, em andamento, resolvida e histórica (uma delas ligada a Setor e Lanterna para provar `SETOR_EM_USO` e `LANTERNA_EM_USO`), obtidas por transições reais do serviço de ciclo de vida, de modo que Eventos e carga fiquem coerentes.

**Aceite RN-11–23/40:** cada sucesso/erro de `CENARIOS-DE-TESTE.md`, inclusive liberar aberta (`null`) com Evento `atribuida`, liberar em andamento→422 `SEM_RESPONSAVEL` sem mutação, reabertura afastado e carga 2→1→0. Atribuir, reatribuir e liberar gravam Evento `atribuida`; falha injetada na gravação do Evento de atribuição ou de liberação deixa ocorrência/lanternas/eventos iguais ao estado anterior (rollback), como nas demais ações. Requisições simultâneas em conexões reais: afastado nunca recebe atribuição; na corrida atribuir versus afastar uma Ficha ativa há duas linearizações válidas — a atribuição vence e o afastamento é 409 `LANTERNA_EM_MISSAO`, ou o afastamento vence e a atribuição é 409 `LANTERNA_AFASTADO` — e nunca responsável afastado nem histórico parcial; duas transições incompatíveis não aplicam o mesmo estado anterior duas vezes. Nenhum teste presume que duas atribuições válidas ao mesmo Lanterna sejam proibidas.

**Registro de execução — 2026-11-10:** G-1 `1.0.0`, SHA-256 `cd91fef5a43bb239a67be5bbc1a942caedda7129bb268da7dbfdd0632b9a4730`; contrato permaneceu inalterado. Implementados `PATCH /ocorrencias/:id/status` e `PATCH /ocorrencias/:id/responsavel`, validação de transições, idempotência, atribuição/liberação/reabertura e recálculo de carga dentro de transações com atualização condicional e gravação atômica de Eventos. A fixture d executa transições pelo serviço real com IDs e instante fixos; produz 22 Ocorrências e 32 Eventos. `npm run build` e testes unitários (23) passaram; `npm run test:e2e -- --runInBand` passou com 53 testes em 13 suítes após recompilar `better-sqlite3` para o Node ativo (ABI 137; o binário anterior era ABI 127); `git diff --check` passou. Validação documental Python indisponível: `py -3` não está instalado. Próximo passo: BE-10, leitura de Eventos e Comentários.

## BE-10 — consulta de Eventos e Comentários

**Depende:** BE-09; escrita de Evento já existe. **Arquivos:** `src/eventos/{eventos.controller,evento-resposta.dto}.ts`, `src/comentarios/{comentarios.module,comentarios.controller,comentarios.service,comentario-resposta.dto}.ts`, `src/comentarios/dto/criar-comentario.dto.ts`, `test/{eventos,comentarios}.e2e-spec.ts`, `src/comentarios/comentarios.service.spec.ts`.

- [x] GET eventos/comentários valida visibilidade da ocorrência e pagina no banco; eventos mais antigos primeiro, desempate estável. DTO histórico preserva dados de mudança conforme tipo.
- [x] POST comentário por G ou L do Setor, inclusive resolvida; texto validado sem HTML executável no consumidor. Excluir só autor/G, soft delete e Evento `comentario_apagado` na mesma transação. Nenhuma rota de editar comentário ou mudar Evento.

**Fixture FX e (BE-FX):** `eventos-comentarios.ts` acrescenta Comentários de autores distintos, inclusive um apagado com Evento, sobre as Ocorrências de FX d.

**Aceite RN-40–43:** autorizado cria→201, autor/G apaga→204 e Evento, outro autor→403, outro setor→404. Falha no Evento desfaz soft delete; excluídos não aparecem, mas registro permanece no banco. Tentativas de editar/apagar Evento e editar comentário atingem rota inexistente, sem mutação.

**Registro de execução — 2026-11-10:** implementados GET paginados de Eventos e Comentários, POST comentário e DELETE soft de Comentário. Leitura valida a visibilidade pela Ocorrência, ordena por `criadoEm`/`id` no banco e expõe somente `autor: { id, nome, papel }`; `excluidoEm`, email e texto de Comentário apagado não aparecem. Exclusão e Evento `comentario_apagado` usam o mesmo manager transacional; criação não produz Evento e aceita Ocorrência resolvida. Fixture e cria 3 Comentários em estados/autores distintos, um apagado com Evento, com IDs/relógio fixos. Build passou; testes unitários passaram (85 testes/22 suítes); E2E passou (60 testes/14 suítes, incluindo 7 cenários dedicados); validador documental passou (30 operações/310 cenários) e `unittest` passou (120 testes). O hash histórico G-1 `cd91fef5a43bb239a67be5bbc1a942caedda7129bb268da7dbfdd0632b9a4730` não confere com o atual `e133d329380a4ee17436681693b384999f73de6915b170ccdb7d64fcbc5f8681`; o pacote inclui `docs/backend/SEED.md`, que já tinha alterações locais antes do BE-10. BE-10 não alterou contrato/OpenAPI. Próximo passo: BE-12, provedor completo.

## BE-07c — seed final de demonstração

**Depende:** BE-07b, BE-09/10. **Arquivos:** `src/database/seed/{seed,ids,ocorrencias,eventos,comentarios}.ts`, `test/seed-dominio.e2e-spec.ts`, README back.

- [x] Inserir 9 ocorrências históricas com UUIDs fixos e datas relativas de SEED; produzir Eventos coerentes pelo domínio transacional, 6 comentários em 3 ocorrências, incluindo um apagado com Evento.
- [x] Recalcular status de cada Lanterna pela RN-20; segunda execução não duplica eventos nem renova cada data isoladamente deixando histórico incoerente. Executar seed com um único instante de referência por rodada.

**Aceite:** duas rodadas preservam contagens de todas tabelas; 2 vencidas, 4 não resolvidas no prazo, 3 resolvidas. 25 Fichas/7 Setores; senhas só hash; mentoria sem ciclo; carga e estatísticas correspondem às ocorrências. `--limpar` continua recusado em produção. Testes de regra usam fixtures próprias e relógio fixo, não esses números relativos como dependência global.

**Registro de execução — 2026-11-10:** seed completo acrescenta 9 Ocorrências, 24 Eventos e 6 Comentários (um soft-deleted com Evento), usando UUIDs fixos e os serviços transacionais do domínio. O status de todas as 25 Lanternas é recalculado pela RN-20; `SEED_INSTANTE` opcional fixa o relógio da rodada. Teste e2e repetiu o seed com outro instante, comprovou snapshot de datas/histórico estável, conferiu 2 vencidas/4 no prazo/3 resolvidas, hashes bcrypt e status derivados, e validou as fichas públicas contra OpenAPI. `npm run build`, 85 testes unitários/22 suítes, 60 testes e2e/14 suítes e o teste e2e focado passaram.

## BE-11 — Dashboard agregado

**Depende:** BE-08; teste usa fixtures próprias, demonstração completa usa BE-07c. **Arquivos:** `src/dashboard/{dashboard.module,dashboard.controller,dashboard.service,dashboard.repository,dashboard-resposta.dto}.ts`, `src/dashboard/dto/filtro-dashboard.dto.ts`, `test/dashboard.e2e-spec.ts`, `src/dashboard/dashboard.service.spec.ts`.

- [x] Implementar métricas acordadas com GROUP BY/consultas agregadas no banco, sem carregar ocorrências para contar em memória; excluir soft deleted em todas as consultas. `dias` limita somente a série UTC, incluindo hoje; demais agregados usam todo o histórico não excluído.
- [x] Aplicar setor de conta para L ignorando query, filtro opcional para G; período 7–90, padrão30. Completar dias sem movimento com zero a partir das agregações; média nula sem resoluções e, com resoluções, em horas, com o arredondamento do contrato, ranking máximo10 e desempate estável conforme contrato.

**Aceite RN-50–52:** fixture com durações conhecidas produz média exata, série com número correto de dias, zeros e totais; G vê todos/filtro e L só seu setor; excluída não entra em nenhuma métrica. `dias=3|200`→400; consultas agregadas evidenciadas em teste/revisão. Dashboard do seed G tem 2 vencidas.

**Registro de execução — 2026-11-10:** implementados controller, query DTO, service e repository agregador para GET `/dashboard`, sem carregar ocorrências em memória. As consultas SQL aplicam setor, excluem soft-deleted e agrupam por status, gravidade, data e Lanterna; série UTC é preenchida com zeros e média arredondada pelo SQLite a 2 casas. Testes unitários validam escopo derivado da conta e construção dos dias; e2e prova G/L, filtro, setor vazio, 7 pontos UTC, ocorrências fora da janela que continuam nos totais, média 36/1,13, ranking top 10 com desempate, exclusão, autenticação e parâmetros inválidos. E2E do seed confirmou 2 vencidas com referência atual. `npm run build` passou; unitários passaram (90 testes/24 suítes); e2e completo passou (63 testes/15 suítes), incluindo os focados do Dashboard e seed.

## BE-12 — provedor completo e entrega ao integrador

**Depende:** BE-04/07c/10/11. **Arquivos:** `test/contrato.e2e-spec.ts`, demais suítes BE, `backend/README.md`; atualização de API/DTO/exemplos somente via tarefa de contrato atribuída ao integrador.

- [x] Inventariar cada operação de `openapi.json`: método, rota, query/body, autenticação, sucesso, 204, erros relevantes e schema real da resposta; usar clientes HTTP reais e estado de banco conhecido.
- [x] Cruzar cobertura de todas RN, tabela “Prove” da skill, exemplos consumidor/provedor e lista de códigos. Executar matriz sem token, token recusado, papel indevido, outro setor, extra field, inexistente, conflito, 422, 429, rollback e concorrência.
- [x] Provar instalar→migrar→seed→iniciar em ambiente limpo com README; reiniciar e conferir persistência. Expor evidências por recurso ao front. Swagger é opcional; se adotado, contrato gerado é comparado ao acordo, não o substitui automaticamente.

- [x] Rodar `fixture:integracao` completo em banco novo e confirmar que o manifesto cobre os cenários de [INTEGRACAO §4](../INTEGRACAO.md#4-fixtures-identidade-e-testes-de-escrita); entregar ao front o comando, o manifesto e a lista de ids estáveis.

**Registro de execução — 2026-11-10:** criado `test/contrato.e2e-spec.ts`: inventaria 30 operações e 310 cenários, confere os 144 pares de status/código declarados, chama as 30 operações em API real e valida as respostas contra os schemas OpenAPI (inclusive corpo vazio em 204). A matriz executa ainda autenticação ausente em todas as rotas protegidas, token adulterado, papel indevido, escopo de Setor, campo extra, query inválida, ausência, conflito e 422; as suítes E2E existentes cobrem 429, rollback e concorrência (inclusive escrita simultânea em SQLite real). Fixture etapa e em banco novo confere 2 Setores, 5 contas, 3 Fichas, 22 Ocorrências, 33 Eventos e 3 Comentários e não expõe segredo. README agora descreve iniciar a API e enumera IDs estáveis da fixture. A prova limpa executou migration, seed completo, `npm start`, `/saude`, login e reinício com `/auth/me` persistente. `npm run build` (exit 0); `npm test -- --runInBand` (exit 0, 92 testes/25 suítes); `npm run test:e2e -- --runInBand` (exit 0, 65 testes/16 suítes); validador documental (exit 0, 30 operações/310 cenários); `python -B -m unittest discover -s docs/contratos -p test_*.py` (exit 0, 120 testes); `git diff --check` (exit 0). **G-9 ainda requer atualização do registro G-1 pela coordenação:** o hash agregado atual é `f3f70cf426eaf1cba6f50c2ee0a8629af076abd236367404dd8b72bdb2616d3f`, diferente do pacote registrado (`cd91fef5a43bb239a67be5bbc1a942caedda7129bb268da7dbfdd0632b9a4730`); o hash do OpenAPI segue igual (`1836fa15115a7819a603431288921b3cbddb47d6032327adf5d7a35411cd7166`). A conferência pelo hash agregado rejeitou G-1; não houve alteração em OpenAPI nem nos arquivos-fonte do contrato nesta tarefa. Não publicar aceite G-9 sob o hash agregado desatualizado.

**Aceite:** testes unitários/e2e/build com comandos e exit reais; respostas do provedor compatíveis com a revisão/hash acordada. Cliente front não é necessário para demonstrar o provedor. A conclusão BE-12 libera integração G9, mas não prova sozinha fluxo completo, cookie/navegação/RSC ou UI; esses aceites pertencem ao estado integrado.

## BE-FX — fixture de integração (somente de teste)

**Objetivo:** montar, em banco novo, o estado dos cenários de [INTEGRACAO §4](../INTEGRACAO.md#4-fixtures-identidade-e-testes-de-escrita) para o E2E do front e os gates, sem endpoint de bootstrap e sem depender do seed demonstrativo. **Dono:** dev back. **Estado:** etapas a–e entregues com BE-07a/07b/08/09/10.

**Arquivos próprios:** etapas a–e em `backend/src/testing/fixture-integracao/{ids,manifesto,contas,fichas,ocorrencias,ciclo-vida,eventos-comentarios,cli}.ts` e `backend/test/fixture-integracao*.e2e-spec.ts`.

**Comando disponível (etapas a–e):** `npm run fixture:integracao -- --etapa a|b|c|d|e` em `backend/`. Entradas no ambiente: `DATABASE_PATH` absoluto exclusivo e `FIXTURE_SENHA` (sem valor padrão); `FIXTURE_INSTANTE` opcional (ISO) fixa o instante de referência, que por padrão é o da execução. Argumento `--saida <arquivo>` grava o manifesto.

**Regras:** só roda em banco migrado e vazio; recusa `NODE_ENV=production`; etapa a grava por repositories existentes (etapas posteriores usam services e repositories do domínio), sem SQL solto nem rota HTTP; reexecução em banco com dados falha em vez de apagar. Ids estáveis e e-mails fictícios no código; nenhuma senha, hash ou token no manifesto nem nos logs.

**Datas de teste:** a CLI de fixture instancia o relógio injetável usado pelos services apenas nesse processo de teste, permitindo montar o histórico em relação ao instante do manifesto e manter Eventos/transições coerentes. Não acrescenta parâmetro HTTP de data nem variável de relógio no bootstrap normal da API. A API do E2E usa tempo real e os casos ficam afastados do vencimento pela margem abaixo.

**Manifesto de estado (JSON):** `versaoContrato`, instante de referência, contas por papel e caso (id, e-mail), Setores, Fichas e vínculos, Ocorrências por caso (id, status, datas), Eventos e Comentários, e contagens por tabela.

**Entrega incremental (cada etapa antes do gate que a usa):**

| Etapa | Tarefa de entrega | Conteúdo | Aceite |
|---|---|---|---|
| a | BE-07a | Setores, G e segundo Guardião com Setor nulo, L2814, L674 e conta L com Setor, sem ficha | Login real das contas; manifesto sem segredo; recusa produção e banco com dados |
| b | BE-07b | Fichas, vínculos (setores e fichas distintos), Lanterna sem ficha | Escopo L2814 versus L674 reproduzível pelos testes do provedor |
| c | BE-08 | Ocorrências abertas, vencida e dentro do prazo (margem de pelo menos 1 hora), excluída, volume acima do limite de página | `criadaEm` relativo ao instante de referência; Evento `criada` coerente |
| d | BE-09 | Atribuídas, em andamento, resolvida e histórica por transições reais | Eventos `atribuida`, `status_alterado`, `resolvida` coerentes; carga das Lanternas igual à contagem |
| e | BE-10 | Comentários, um apagado com Evento | Comentário apagado oculto na lista e presente no banco |

**Fora do alcance:** relógio configurável em produção (não existe). Os casos exatos de Prazo — limite exato e igualdade ainda não vencida — ficam no teste do provedor com relógio injetável; o E2E usa a margem acima.

**Uso pelo front e pela integração:** FE-10, E2E de cada FE e gates invocam o comando quando a etapa necessária estiver entregue e leem o manifesto; não recriam dados à mão. Todas as etapas a–e já podem ser invocadas.
