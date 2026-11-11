# Documentação do projeto

Atualizada em 2026-11-09. **Atual:** Next + json-server e laboratório OANET aprovado. **Parcial:** casca UI-01 herdada, sem aceite final. **Destino:** NestJS, JWT, novas funcionalidades e migração completa. A [DOC-03](agents/DOC-03-PLANEJAMENTO.md) está concluída com planos e contrato revisados; [G-1](INTEGRACAO.md#g-1--aceite-do-contrato) identifica a revisão consumível. Implementação permanece suspensa até tarefa explícita.

## Comece pelo seu trabalho

| Papel ou objetivo | Ordem de leitura | Resultado esperado |
|---|---|---|
| Conhecer o produto | [PRODUCT](../PRODUCT.md) → [GLOSSARY](../GLOSSARY.md) → [PLANO](PLANO.md) | Entender domínio, estado atual e marcos |
| Dev de front | [Guia dos agentes](agents/README.md) → [plano FE/UI](frontend/PLANO-IMPLEMENTACAO.md) → [UI](UI.md) → [contrato](contratos/README.md) | Escolher incremento e carregar somente referências/arquivos necessários |
| Dev de back | [Guia dos agentes](agents/README.md) → [plano BE](backend/PLANO-IMPLEMENTACAO.md) → [contrato](contratos/README.md) → RN/modelo da tarefa | Implementar e testar o recurso sem esperar a UI |
| Integrar as duas frentes | [INTEGRACAO](INTEGRACAO.md) → revisão contratual usada por ambos → evidências das tarefas | Aprovar o gate contra API real com dados isolados |
| Agente novo | [AGENTS](../AGENTS.md) → [guia](agents/README.md) → [MAPA](agents/MAPA.md) → tarefa atribuída | Conhecer propriedade, restrições e primeiro passo executável |
| Entender a UI-01 parcial | [Plano FE](frontend/PLANO-IMPLEMENTACAO.md) (UI-01, UI-02.00) → [Handoff](agents/HANDOFF-OANET.md) como histórico | Preservar o parcial; a implementação só recomeça quando o usuário autorizar |
| Revisar contratos ou planos | [DOC-03](agents/DOC-03-PLANEJAMENTO.md) → [revisões](agents/revisoes/README.md) | Localizar achados, decisões e evidências de correção |

As skills canônicas de [front](../.claude/skills/frontend-web/SKILL.md) e [back](../.claude/skills/backend-api/SKILL.md) são lidas ao escrever/revisar/explicar o respectivo código. Next exige o guia pertinente instalado em `node_modules/next/dist/docs/` antes de escrever código.

## Mapa de todas as pastas

| Pasta | Conteúdo e finalidade | Autoridade/estado |
|---|---|---|
| `docs/` | Este índice, [PLANO](PLANO.md), [CONTRIBUINDO](CONTRIBUINDO.md), [INTEGRACAO](INTEGRACAO.md) e [UI](UI.md) | Entradas de execução e contrato visual |
| `docs/agents/` | [Fluxo](agents/README.md), [mapa](agents/MAPA.md), [modelo de tarefa](agents/TAREFA.md), [handoff da UI-01](agents/HANDOFF-OANET.md), [handoff do front](agents/HANDOFF-FRONT.md), [registro DOC-03](agents/DOC-03-PLANEJAMENTO.md) | Operação e estado datado; não redefine produto |
| `docs/agents/revisoes/` | [Índice](agents/revisoes/README.md), relatórios e correções por rodada | Evidência, não fonte de contrato |
| `docs/contratos/` | [Entrada](contratos/README.md), OpenAPI JSON, exemplos e validador documental | Formato HTTP acordado de destino; não API implementada |
| `docs/contratos/exemplos/` | Requisições/respostas e cenários identificados por operação | Fixtures sintéticas de contrato; não dados do produto |
| `docs/backend/` | Decisões, dados, regras, API, DTOs, arquitetura, seed, cenários e plano BE | Destino, com decisões vigentes explícitas |
| `docs/frontend/` | Arquitetura, telas, migração e plano FE/UI | Atual/destino distinguidos em cada documento |
| `docs/adr/` | Decisões arquiteturais com consequências e alternativas | Permanente; [ADR 0001](adr/0001-token-jwt-fica-no-servidor-do-next.md) mantém JWT no Next |
| `docs/research/` | Pesquisa primária datada e recomendações | Insumo; [pesquisa para agentes](research/2026-11-09-documentacao-para-agentes.md) orienta esta organização |
| `docs/research/lanternas/` | Pesquisa aceita em D18 para os 25 membros | Insumo canônico do [seed](backend/SEED.md), não vem das ilustrações |
| `docs/design/` | Agrupa estudos e evidências de design | Consulta por direção; OANET é a oficial |
| `docs/design/oanet/` | [Índice OANET](design/oanet/README.md), histórico visual e evidências de implementação | Referência; regras atuais em [UI](UI.md) |
| `docs/design/oanet/verificacao/` | PNGs e JSONs de inspeções datadas | Evidências; assets executáveis ficam em `components/oanet/` |
| `docs/superpowers/` | Agrupa specs e planos das etapas anteriores | Arquivo histórico, sem plano concorrente ativo |
| `docs/superpowers/specs/` | Spec antiga do design system | Histórico superado visualmente por D28 |
| `docs/superpowers/plans/` | Planos históricos de incrementos | Consulta histórica; plano ativo é [PLANO](PLANO.md) |

Novas subpastas de exemplos/artefatos devem ser descritas no README da pasta responsável e referenciadas aqui. Diretórios de código e arquivos de saída temporários não são documentação de produto.

## Fontes canônicas

| Pergunta | Fonte responsável |
|---|---|
| O que foi decidido? | [ESCOPO](backend/ESCOPO.md) e [ADRs](adr/) |
| Qual regra vale e por quê? | [REGRAS-DE-NEGOCIO](backend/REGRAS-DE-NEGOCIO.md), com origem D identificada |
| Qual formato HTTP implementar? | [Contrato estruturado e procedimento de mudança](contratos/README.md); OpenAPI governa formatos, [API](backend/API.md) governa comportamento/acesso e [DTOs](backend/DTOS.md) explica validações |
| Como persistir? | [MODELO-DE-DADOS](backend/MODELO-DE-DADOS.md), [SEED](backend/SEED.md) |
| Como organizar o back e testar regras? | [ARQUITETURA BE](backend/ARQUITETURA.md), [CENARIOS-DE-TESTE](backend/CENARIOS-DE-TESTE.md), [plano BE](backend/PLANO-IMPLEMENTACAO.md) |
| Como organizar e migrar o front? | [ARQUITETURA FE](frontend/ARQUITETURA.md), [TELAS](frontend/TELAS.md), [MIGRACAO](frontend/MIGRACAO.md), [plano FE](frontend/PLANO-IMPLEMENTACAO.md) |
| Como a interface deve parecer e se mover? | [UI](UI.md), D28 e fontes SVG/CSS/Canvas OANET |
| Onde editar e quem possui o arquivo? | [MAPA](agents/MAPA.md) + registro da tarefa; confirme assinaturas no código atual |
| O que já foi verificado? | Registro datado da tarefa e evidências; plano não é resultado de teste |

Divergência entre fontes canônicas bloqueia somente a parte afetada até uma correção sincronizada. Um exemplo, mock ou Swagger gerado não muda o acordo silenciosamente. A revisão contratual usada precisa constar na entrega das duas frentes.

## Manutenção e verificações

1. Mantenha uma fonte por assunto; índices apontam para ela, sem copiar tabelas inteiras de campos/regras.
2. Mudança de contrato inclui API/DTO, OpenAPI, exemplos e impactos no consumidor/provedor na mesma tarefa. Siga o [acordo de integração](INTEGRACAO.md).
3. Atualize “Atual”, “Parcial” ou “Destino” apenas com evidência. Pesquisa e captura histórica não demonstram aceite de uma tela real.
4. Mudança de domínio entra em ESCOPO/RN/modelo conforme o impacto; termo novo entra em [GLOSSARY](../GLOSSARY.md).
5. Registre comandos, diretório, resultado e limites no [modelo de tarefa](agents/TAREFA.md). Validação documental não substitui teste de consumidor, provedor ou integração.
6. Ao criar/remover uma pasta de documentação, atualize este mapa e o [README raiz](../README.md#pastas-da-documentação).

Verificação disponível da raiz: `node docs/agents/validar-documentacao.mjs --ancoras`. Confere destinos dos links locais, presença das pastas neste índice e âncoras de títulos Markdown/IDs HTML. Omita `--ancoras` para conferir somente arquivos/pastas. A checagem de títulos cobre o padrão usado neste repositório (cabeçalhos `#` e IDs explícitos); não é renderizador completo de Markdown e não acessa URLs externas nem verifica significado dos contratos. O validador do contrato tem escopo separado, descrito no [pacote](contratos/README.md).
