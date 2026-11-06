# Regras de negócio

Versão de 2026-11-06, decisões fechadas (D1 a D27). Cada regra vive no **service**; o controller só traduz HTTP e o repository só guarda. A coluna "Origem" aponta para a decisão em [ESCOPO.md](ESCOPO.md). Todas as regras têm origem numa decisão D1 a D27.

## Critério de status HTTP

- **422:** a regra de domínio rejeita o dado ou a ação (transição inválida, campo exigido pela regra).
- **409:** conflito com o estado de outro registro (duplicado, em uso, Lanterna afastado).
- **404:** o recurso não existe **ou** é de outro Setor e o Lanterna não pode saber dele.

## Acesso e papéis

| ID | Regra | Origem |
|---|---|---|
| RN-01 | O cadastro é público e sempre cria um Lanterna. O corpo não aceita `papel`; campo extra é recusado. | D3 |
| RN-02 | O cadastro exige um Setor existente e e-mail único (409 se repetido). | D3 |
| RN-03 | O Guardião nasce no seed ou por promoção feita por outro Guardião. | D3 |
| RN-04 | Não é possível rebaixar o último Guardião (409). | D20 |
| RN-05 | O Lanterna só vê e opera Ocorrências do próprio Setor. Fora dele, a resposta é 404. | backend-api |
| RN-06 | O papel e o Setor usados nas decisões vêm do banco a cada requisição, não só do token, para uma promoção valer sem novo login. | D21 |
| RN-07 | O Guardião vincula uma conta de Lanterna a uma Ficha (`PATCH /usuarios/:id/lanterna`). A Ficha deve existir (404), ter o mesmo Setor da conta (422 `SETOR_DIFERENTE`) e não estar vinculada a outra conta (409 `LANTERNA_JA_VINCULADA`). `null` desvincula. Sem vínculo, a conta registra e comenta, mas não tem Minha fila. | D27 |

## Ocorrência

| ID | Regra | Origem |
|---|---|---|
| RN-10 | Ao registrar: `status = aberta`, sem Responsável nem resolução; criador vem do token; o Lanterna não escolhe o Setor, o servidor usa o dele. O Guardião escolhe um Setor existente. | D3, regras atuais |
| RN-11 | Transições permitidas: `aberta → em_andamento → resolvida`. Qualquer outra é 422 `TRANSICAO_INVALIDA`. | D7 |
| RN-12 | Passar para `em_andamento` exige Responsável (422 `SEM_RESPONSAVEL`). | D7 |
| RN-13 | Resolver exige `resolucao` com no mínimo 10 caracteres (422 `RESOLUCAO_OBRIGATORIA`) e grava `resolvidaEm`. | D7 |
| RN-14 | Reabrir (`resolvida → aberta`) é só do Guardião e exige `motivo` (422 `MOTIVO_OBRIGATORIO`). Limpa `resolucao` e `resolvidaEm`; mantém o Responsável, exceto se ele estiver `afastado`: então é liberado (`null`). | D7, D19 |
| RN-15 | Atribuir é só do Guardião. O Responsável deve ser do mesmo Setor da Ocorrência (422 `RESPONSAVEL_DE_OUTRO_SETOR`; Lanterna sem Setor recebe o mesmo erro) e não estar `afastado` (409 `LANTERNA_AFASTADO`). | D8, regras atuais |
| RN-16 | Ocorrência `resolvida` não aceita nova Atribuição nem edição (409 `OCORRENCIA_RESOLVIDA`); é preciso reabrir antes. | D19 |
| RN-17 | Editar título, descrição, planeta, envolvidos e Gravidade: o Guardião, ou o Lanterna criador do mesmo Setor, enquanto não estiver resolvida. Mudar a Gravidade recalcula o Prazo. | D19 |
| RN-18 | Excluir é só do Guardião e é soft delete. Some das listas, mas Eventos e Comentários permanecem. | D4, D10 |

## Lanterna e Ocorrência (transação única)

| ID | Regra | Origem |
|---|---|---|
| RN-20 | O Lanterna está `em_missao` enquanto for Responsável de ao menos uma Ocorrência **não resolvida e não excluída** (`aberta` ou `em_andamento`); senão está `ativo` (ou `afastado`, que o Guardião define). O status é recalculado, na mesma transação, a cada atribuição, liberação, resolução, reabertura e exclusão. | D8, D26 |
| RN-21 | Reatribuir libera o Lanterna anterior pela mesma regra RN-20. | D8 |
| RN-22 | Afastar um Lanterna `em_missao` (com Ocorrência não resolvida sob sua responsabilidade) é recusado (409 `LANTERNA_EM_MISSAO`); o Guardião reatribui antes. | D20 |
| RN-23 | A checagem de afastado e a troca de status acontecem na mesma transação, para duas atribuições simultâneas não passarem juntas. | backend-api |

## Prazo

| Gravidade | Janela | Origem |
|---|---|---|
| crítica | 24 horas | D9 |
| alta | 3 dias | D9 |
| média | 7 dias | D9 |
| baixa | 14 dias | D9 |

`prazoEm = criadaEm + janela`; `vencida = status ≠ resolvida e agora > prazoEm`. A reabertura não reinicia o Prazo. (D19)

## Gestão de Setores e Lanternas

| ID | Regra | Origem |
|---|---|---|
| RN-30 | Só o Guardião cria, edita e remove Setor, e cria e edita Lanterna. | D10 |
| RN-31 | Remover Setor com Lanternas ou Ocorrências é 409 `SETOR_EM_USO`. | D10 |
| RN-32 | O mentor de um Lanterna é outro Lanterna existente, e nunca ele mesmo. Não pode formar ciclo (A mentor de B e B mentor de A). | D13, D20 |
| RN-33 | Lanterna não é removido; afasta-se. | D10 |

## Evento e Comentário

| ID | Regra | Origem |
|---|---|---|
| RN-40 | O Evento é gravado na mesma transação da mudança nestes casos: criação, atribuição, mudança de Status, reabertura, resolução e comentário apagado. Nunca é editado ou apagado. | D16 |
| RN-41 | Comentar é permitido ao Guardião e aos Lanternas do Setor da Ocorrência. Comentário não é editado. | D16 |
| RN-42 | O autor, ou qualquer Guardião, apaga o Comentário (soft delete); isso gera Evento `comentario_apagado`. | D16 |
| RN-43 | Comentar em Ocorrência `resolvida` é permitido. | D19 |

## Dashboard

| ID | Regra | Origem |
|---|---|---|
| RN-50 | O Guardião vê todos os Setores, com filtro opcional; o Lanterna vê só o próprio Setor e o filtro é ignorado. | D17 |
| RN-51 | Métricas agregadas no banco: contagem por Status e por Gravidade, vencidas, tempo médio de resolução (`resolvidaEm − criadaEm`), série dos últimos 30 dias (abertas e resolvidas por dia) e ranking de Lanternas por resolvidas. | D17 |
| RN-52 | Ocorrência excluída não entra em nenhuma métrica. | D4 |
