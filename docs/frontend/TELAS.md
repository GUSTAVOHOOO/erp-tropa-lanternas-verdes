# Telas do front-end

De 2026-11-06. A coluna **Estado** diz se a tela existe hoje ou é planejada. As rotas planejadas foram aceitas em D23. Regras de acesso em [backend/API.md](../backend/API.md#matriz-de-permissões); regras de negócio em [REGRAS-DE-NEGOCIO.md](../backend/REGRAS-DE-NEGOCIO.md). A **forma visual** de cada tela é do redesign OANET ([UI.md](../UI.md)); aqui só a função.

Toda tela com dados tem os quatro estados: carregando, erro, vazio e com dados.

**Situação visual em 2026-11-10:** laboratório OANET aprovado; casca UI-01 concluída e integrada à `main` (PR #1); componentes compartilhados da UI-02.00 adaptados à OANET e integrados à `main` (PR #3: campos, select, tabela, selos, cabeçalho, estados e avisos; verificação em navegador registrada na PR); cidade de Oa (`CidadeOa`) redesenhada (PR #2). A composição de cada página segue a anterior até a sua linha UI-02.01 a UI-02.12; o 404 global fica fora da casca, só com o escopo de cores OANET, até a UI-02.11. “Existe” abaixo descreve o fluxo atual com json-server, não comprova migração visual OANET. A ordem e a propriedade de cada rota/estado estão no [plano FE/UI](PLANO-IMPLEMENTACAO.md); integração de dados segue [INTEGRACAO.md](../INTEGRACAO.md).

## Públicas

| Tela | Rota | Estado | Função e mudanças |
|---|---|---|---|
| Início | `/` | Atual (UI-01, UI-02.01) | Apresentação da Central de Oa e acesso ao login |
| Sobre | `/sobre` | Atual (UI-01, UI-02.02) | Oa, a Tropa e o juramento |
| Lanternas | `/lanternas` | Existe | Lista com filtro por Setor. **Muda:** busca, filtro de status e paginação, vindos da API |
| Ficha do Lanterna | `/lanternas/[id]` | Existe, será ampliada | **Muda:** dados completos (identidade, espécie, planeta, Setor, ingresso, primeira aparição, habilidades, citação, biografia), mentor e aprendizes navegáveis, estatísticas (resolvidas, em andamento, tempo médio, carga atual) e selo "não verificado" nos campos sem fonte |
| Login | `/login` | Existe | **Muda:** chama a API; link para o cadastro; aviso de 429 |
| Cadastro | `/cadastro` | **Nova** | Nome, e-mail, senha e Setor. Sempre cria um Lanterna; depois leva ao login |
| Acesso negado | `/acesso-negado` | Existe | Só para 403 de papel |
| Design system | `/design-system` | Existe, histórico visual | Atualizar ou redirecionar para a referência OANET na adoção |
| Laboratório | `/laboratorio` | Existe, UI oficial D28 | Referência de design, assets e movimento; dados ilustrativos, sem API |

## Painel (autenticado)

| Tela | Rota | Quem | Estado | Função e mudanças |
|---|---|---|---|---|
| Resumo | `/painel` | Guardião, Lanterna | Existe, será ampliada | Vira o **dashboard**: totais por Status e Gravidade, vencidas, tempo médio, série de 30 dias e ranking de Lanternas. O Guardião filtra por Setor; o Lanterna vê o próprio |
| Minha fila | `/painel/minha-fila` | Lanterna | **Nova** | Ocorrências atribuídas ao usuário, por Prazo e Gravidade, com destaque às vencidas. O Guardião não a acessa |
| Ocorrências | `/painel/ocorrencias` | Guardião, Lanterna | Existe, será ampliada | Filtros de Status, Gravidade, Setor, responsável e vencida; busca; ordenação por prazo, criação ou Gravidade; paginação; indicador de Prazo |
| Nova ocorrência | `/painel/ocorrencias/nova` | Guardião, Lanterna | Existe | Registro. O Setor é fixo para o Lanterna |
| Detalhe | `/painel/ocorrencias/[id]` | Guardião, Lanterna | Existe, será ampliada | **Muda:** linha do tempo de Eventos, Comentários (comentar e apagar), Prazo e "vencida", ações conforme o Status e o papel, edição dos dados, exclusão (Guardião) e reabertura com motivo (Guardião) |
| Atribuir | `/painel/ocorrencias/[id]/atribuir` | Guardião | Existe | Escolhe o Responsável do mesmo Setor; mostra por que um Lanterna afastado não pode ser escolhido |
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
