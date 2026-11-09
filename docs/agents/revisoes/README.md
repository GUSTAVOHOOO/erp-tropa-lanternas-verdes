# Revisões documentais

Esta pasta guarda achados e evidências de revisão da [DOC-03](../DOC-03-PLANEJAMENTO.md). Não contém instruções de produto nem substitui [contratos](../../contratos/README.md) ou decisões.

## Rodadas

| Rodada | Escopo | Situação |
|---|---|---|
| 1 — contrato | Operações, schemas, exemplos, permissões e compatibilidade | [Relatório entregue](rodada-1-contrato.md): 10 achados, incluindo 2 P1 |
| 1 — execução | Planos FE/BE, dependências, propriedade, integração e índices | [Relatório entregue](rodada-1-planos.md): 12 achados, incluindo 3 P1 |
| 2 — planos | Correção de ativação, dependências, propriedade, instruções históricas e integração | [Relatório entregue](rodada-2-correcao-planos.md); leitura cruzada final concluída |
| 2 — contrato | Correções dos achados da revisão HTTP e verificações negativas permanentes | [Relatório entregue](rodada-2-correcao-contrato.md); 120 testes documentais passaram |
| Aceite final | Tratamento dos 22 achados e definições adicionais | [DOC-03 concluída](../DOC-03-PLANEJAMENTO.md); revisão/hash consumível em [G-1](../../INTEGRACAO.md#g-1--aceite-do-contrato) |

Cada achado deve indicar severidade, arquivo/seção, contradição observada, impacto em um dos desenvolvedores e correção verificável. O coordenador registra aceito/corrigido/descartado com motivo; um relatório sem achados não comprova execução de endpoints futuros.

O usuário solicitou Claude Code com Sonnet 5.5. O registro da tarefa deve informar modelo solicitado, recibo efetivo de execução e qualquer indisponibilidade. Modelos substitutos precisam de escolha explícita do usuário.
