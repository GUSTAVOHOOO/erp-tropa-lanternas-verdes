# Telas do front-end

De 2026-11-06 (atualizado em 2026-11-11 após conclusão da UI-02). A coluna **Estado** diz se a tela existe hoje ou é planejada. As rotas planejadas foram aceitas em D23. Regras de acesso em [backend/API.md](../backend/API.md#matriz-de-permissões); regras de negócio em [REGRAS-DE-NEGOCIO.md](../backend/REGRAS-DE-NEGOCIO.md). A **forma visual** de cada tela é do redesign OANET ([UI.md](../UI.md)); aqui só a função.

Toda tela com dados tem os quatro estados: carregando, erro, vazio e com dados.

**Situação visual em 2026-11-11:** laboratório OANET aprovado; casca UI-01 concluída e integrada à `main` (PR #1); componentes compartilhados da UI-02.00 integrados à `main` (PR #3); cidade de Oa (`CidadeOa`) redesenhada (PR #2). Toda a suíte UI-02 (UI-02.01 a UI-02.12) foi concluída e integrada à `main` (PRs #6, #7 e #8), migrando todas as 12 rotas existentes para a identidade visual OANET. O handoff de entrega e o backlog de refinamentos visuais estão documentados em [docs/agents/HANDOFF-UI-02.md](../agents/HANDOFF-UI-02.md). Integração de dados segue [INTEGRACAO.md](../INTEGRACAO.md).

## Públicas

| Tela | Rota | Estado | Função e mudanças |
|---|---|---|---|
| Início | `/` | Atual (UI-01, UI-02.01) | Apresentação da Central de Oa e acesso ao login |
| Sobre | `/sobre` | Atual (UI-01, UI-02.02) | Oa, a Tropa e o juramento |
| Lanternas | `/lanternas` | Preparado contra contrato (FE-03, P) | Lista com filtro por Setor. **Muda:** busca, filtro de status e paginação, vindos da API |
| Ficha do Lanterna | `/lanternas/[id]` | Preparado contra contrato (FE-03, P) | Ficha pública com identidade, espécie, planeta, Setor navegável, status operacional com SeloOa, construto vetorial OANET e link de retorno |
| Login | `/login` | Preparado contra contrato (FE-02, P) | **Muda:** chama a API; link para o cadastro; aviso de 429 |
| Cadastro | `/cadastro` | Preparado contra contrato (FE-02, P) | Nome, e-mail, senha e Setor. Sempre cria um Lanterna; depois leva ao login |
| Acesso negado | `/acesso-negado` | Atual (UI-01, UI-02.11) | Página de aviso 403 com PaginaAviso, EmblemaOa e botão de retorno ao painel |
| Design system | `/design-system` | Atual (UI-01, UI-02.12) | Redirecionamento permanente para a vitrine oficial do laboratório OANET (/laboratorio, decisão D28) |
| Laboratório | `/laboratorio` | Existe, UI oficial D28 | Referência de design, assets e movimento; dados ilustrativos, sem API |

## Painel (autenticado)

| Tela | Rota | Quem | Estado | Função e mudanças |
|---|---|---|---|---|
| Dashboard (substitui o Resumo) | `/painel` | Guardião, Lanterna | Preparado contra contrato (FE-07a, P) | Painel operacional com `GET /dashboard`: contagens por status e gravidade, vencidas, tempo médio (nulo como "Sem resoluções ainda"), série dos últimos dias em SVG com tabela equivalente, ranking com links para a Ficha e as ocorrências mais recentes, em MolduraOa; filtro de setor só para o Guardião |
| Minha fila | `/painel/minha-fila` | Lanterna | **Nova** | Ocorrências atribuídas ao usuário, por Prazo e Gravidade, com destaque às vencidas. O Guardião não a acessa |
| Ocorrências | `/painel/ocorrencias` | Guardião, Lanterna | Preparado contra contrato (FE-04/05, P) | Lista operacional com filtros de status, gravidade e setor dentro de MolduraOa, tabela OANET, estado vazio com ação de limpar e botão de novo registro |
| Nova ocorrência | `/painel/ocorrencias/nova` | Guardião, Lanterna | Preparado contra contrato (FE-04/05, P) | Formulário de registro em MolduraOa com BotaoOa, CampoTexto, CampoSelect e validação zóide cliente/servidor |
| Detalhe | `/painel/ocorrencias/[id]` | Guardião, Lanterna | Preparado contra contrato (FE-04/05/06, P) | Detalhe operacional em MolduraOa com badges de gravidade/status, dados formatados, formulário FormStatus com BotaoOa, ação de atribuição, linha do tempo e comentários |
| Atribuir | `/painel/ocorrencias/[id]/atribuir` | Guardião | Preparado contra contrato (FE-04/05, P) | Atribuição de responsável em MolduraOa com BotaoOa, CampoSelect e validação de permissão exclusiva para Guardião |
| Lanternas (gestão) | `/painel/lanternas` | Guardião | **Nova** | Lista, criar, editar, afastar e reativar. Mostra a carga de cada um |
| Setores (gestão) | `/painel/setores` | Guardião | **Nova** | Criar, editar e remover; remoção bloqueada se o Setor estiver em uso |
| Usuários | `/painel/usuarios` | Guardião | **Nova** | Lista, promoção de papel e vínculo da conta a uma Ficha de Lanterna; impede rebaixar o último Guardião |

## Ações por Status e papel (tela de Detalhe)

| Status | Lanterna do Setor | Guardião |
|---|---|---|
| `aberta` | Iniciar (só com Responsável), comentar | Atribuir, iniciar, editar, comentar, excluir |
| `em_andamento` | Resolver (com explicação), comentar | Reatribuir, resolver, editar, comentar, excluir |
| `resolvida` | Comentar | Reabrir (com motivo), comentar, excluir |

## Navegação

- **Visitante:** Início, Lanternas, Sobre, Entrar, Cadastrar.
- **Lanterna:** Resumo, Minha fila, Ocorrências, Nova ocorrência, Lanternas, Sair.
- **Guardião:** Resumo, Ocorrências, Nova ocorrência, Lanternas (gestão), Setores, Usuários, Sair.

O link ativo usa `usePathname` com `aria-current` (ROTA-17).

Os links por papel moram em `app/(site)/layout.tsx` e `app/(painel)/layout.tsx` (hoje com itens fixos para os dois papéis), testados em `__tests__/components/casca-oanet.test.tsx`. O dev front os edita em sequência, sem edição concorrente: FE-02 (visitante: Cadastrar), FE-07b (Lanterna: Minha fila) e FE-08 (Guardião: gestão), cada um com o teste “links por papel”. Detalhe no [plano FE](PLANO-IMPLEMENTACAO.md).

## Estados vazios e mensagens a definir

Cada lista tem uma frase própria para o vazio, em vez de uma genérica: "Nenhuma ocorrência neste filtro", "Você não tem ocorrências na fila", "Nenhum comentário ainda". A redação final é do redesign.
