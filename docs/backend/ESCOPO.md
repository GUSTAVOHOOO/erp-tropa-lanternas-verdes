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

## Em aberto

- Papel de Supervisor de setor (descartado do escopo; só volta por nova decisão).
- Anéis de poder e Prazo configurável (bônus de D5, só se sobrar tempo).
- Hospedagem em produção (decide HSTS e a escolha de deploy; ver PROD-02 da skill `frontend-web`).
