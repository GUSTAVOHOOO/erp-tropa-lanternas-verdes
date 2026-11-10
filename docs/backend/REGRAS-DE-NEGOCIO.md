# Regras de negócio

Versão de 2026-11-06, com esclarecimentos contratuais em 2026-11-09 (D29–D42). Cada regra vive no **service**; o controller só traduz HTTP e o repository só guarda. A coluna "Origem" aponta para a decisão em [ESCOPO.md](ESCOPO.md).

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
| RN-08 | Promoção preserva Setor/vínculo, ignorados como restrição de escopo para Guardião. Destino Lanterna exige Setor próprio: corpo pode informá-lo, ou preserva o anterior. Ordem: último Guardião (409, RN-04) → Setor informado inexistente (404) → sem Setor próprio nem informado (422 `SETOR_OBRIGATORIO`) → incompatível com a Ficha vinculada (422 `SETOR_DIFERENTE`). Destino `lanterna` numa conta que já é Lanterna, com `setorId`, troca o Setor sob as mesmas restrições (Ficha vinculada só aceita o próprio Setor; desvincule antes). | D30, D38 |
| RN-05 | O Lanterna só vê e opera Ocorrências do próprio Setor. Fora dele, a resposta é 404. | backend-api |
| RN-06 | O papel e o Setor usados nas decisões vêm do banco a cada requisição, não só do token, para uma promoção valer sem novo login. | D21 |
| RN-07 | O Guardião vincula uma conta de Lanterna a uma Ficha (`PATCH /usuarios/:id/lanterna`). Valor não nulo, nesta ordem: a Ficha deve existir (404); o alvo deve ser conta **Lanterna** (Guardião: 422 `VINCULO_NAO_PERMITIDO`, inclusive com Setor preservado); conta e Ficha devem ter Setor e ser o mesmo (422 `SETOR_DIFERENTE`; Ficha sem Setor também); a Ficha não pode estar vinculada a outra conta (409 `LANTERNA_JA_VINCULADA`). `null` desvincula, inclusive Guardião promovido; revincular a mesma Ficha à mesma conta é 200 sem mudança, e outra Ficha substitui o vínculo. Sem vínculo, a conta registra e comenta, mas não tem Minha fila; vínculo preservado por Guardião nunca a habilita. Conta Lanterna sem Setor não é estado persistido válido. | D27, D38 |

## Ocorrência

| ID | Regra | Origem |
|---|---|---|
| RN-10 | Ao registrar: `status = aberta`, sem Responsável nem resolução; criador vem do token; o Lanterna não escolhe o Setor, o servidor usa o dele. O Guardião escolhe um Setor existente. | D3, regras atuais |
| RN-11 | Transições permitidas: `aberta → em_andamento → resolvida`. Qualquer outra é 422 `TRANSICAO_INVALIDA`. | D7 |
| RN-12 | Passar para `em_andamento` exige Responsável (422 `SEM_RESPONSAVEL`). A recíproca vale: liberar (`responsavelId: null`) uma Ocorrência `em_andamento` também é 422 `SEM_RESPONSAVEL`, sem mudar status, vínculo, carga nem Eventos; ela não volta a `aberta`. Reatribuir direto a outro Responsável válido é permitido. | D7, D34 |
| RN-13 | Resolver exige `resolucao` com no mínimo 10 caracteres (422 `RESOLUCAO_OBRIGATORIA`) e grava `resolvidaEm`. | D7 |
| RN-14 | Reabrir (`resolvida → aberta`) é só do Guardião e exige `motivo` (422 `MOTIVO_OBRIGATORIO`). Limpa `resolucao` e `resolvidaEm`; mantém o Responsável, exceto se ele estiver `afastado`: então é liberado (`null`). Lanterna que pede `aberta`: se a Ocorrência está `resolvida` é tentativa de reabertura (403); se não está, é transição inválida (422 `TRANSICAO_INVALIDA`). | D7, D19, D40 |
| RN-15 | Atribuir é só do Guardião. Ordem: Ocorrência `resolvida` (409, RN-16) → `null` sobre `em_andamento` (422 `SEM_RESPONSAVEL`, RN-12; `null` sobre `aberta` libera) → Ficha inexistente (404) → o Responsável deve ser do mesmo Setor da Ocorrência (422 `RESPONSAVEL_DE_OUTRO_SETOR`; Lanterna sem Setor recebe o mesmo erro) → não estar `afastado` (409 `LANTERNA_AFASTADO`). Atribuir quem já é Responsável, ou liberar uma `aberta` sem Responsável, é 200 sem mudança e sem Evento; só mudança efetiva gera o Evento `atribuida`. Não há limite de uma Ocorrência por Lanterna (RN-20). | D8, D34, D39, regras atuais |
| RN-16 | Ocorrência `resolvida` não aceita nova Atribuição nem edição (409 `OCORRENCIA_RESOLVIDA`); é preciso reabrir antes. | D19 |
| RN-17 | Editar título, descrição, planeta, envolvidos e Gravidade: o Guardião, ou o Lanterna criador do mesmo Setor, enquanto não estiver resolvida. Mudar a Gravidade recalcula o Prazo. Ordem: outro Setor ou excluída (404) → Lanterna não criador (403, mesmo se resolvida) → resolvida (409 `OCORRENCIA_RESOLVIDA`, para quem é autorizado). | D19, D40 |
| RN-18 | Excluir é só do Guardião e é soft delete. Some das listas, mas Eventos e Comentários permanecem. | D4, D10 |
| RN-19 | Minha fila usa o vínculo atual do Usuário e contém apenas suas Ocorrências atribuídas não resolvidas e não excluídas, no próprio Setor. Ordem: `prazoEm` asc, Gravidade crítica→baixa, `id` asc; paginação padrão (página além do fim devolve `itens: []`, preservando `total`). Guardião recebe 403, também quando preservou `lanternaId` ao ser promovido; conta Lanterna sem vínculo recebe 409 `CONTA_SEM_LANTERNA`; vinculada sem pendências recebe lista vazia (200). | D27, D33, D38 |

## Lanterna e Ocorrência (transação única)

| ID | Regra | Origem |
|---|---|---|
| RN-20 | O Lanterna está `em_missao` enquanto for Responsável de ao menos uma Ocorrência **não resolvida e não excluída** (`aberta` ou `em_andamento`); senão está `ativo` (ou `afastado`, que o Guardião define). O status é recalculado, na mesma transação, a cada atribuição, liberação, resolução, reabertura e exclusão. | D8, D26 |
| RN-21 | Reatribuir libera o Lanterna anterior pela mesma regra RN-20. | D8 |
| RN-22 | Afastar um Lanterna `em_missao` (com Ocorrência não resolvida sob sua responsabilidade) é recusado (409 `LANTERNA_EM_MISSAO`); o Guardião reatribui antes. Enviar `ativo` para uma Ficha `em_missao` também é 409 `LANTERNA_EM_MISSAO`: o estado calculado não é apagado. `em_missao` não é aceito no corpo. | D20, D41 |
| RN-23 | A checagem de afastado e a troca de status acontecem na mesma transação, de modo que **atribuir e afastar** uma Ficha inicialmente `ativo`, simultaneamente, tenham só duas saídas válidas: a atribuição vence e o afastamento é 409 `LANTERNA_EM_MISSAO`, ou o afastamento vence e a atribuição é 409 `LANTERNA_AFASTADO`. Nunca resulta Responsável afastado nem histórico parcial (Ocorrência, status da Ficha e Eventos ficam consistentes). Duas atribuições válidas ao mesmo recurso só precisam deixar estado e Eventos serializáveis; carga múltipla é permitida. | backend-api, D39 |

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
| RN-31 | Remover Setor com Lanternas, Ocorrências ou Usuários ligados é 409 `SETOR_EM_USO`. | D10, D31 |
| RN-32 | O mentor de um Lanterna é outro Lanterna existente, e nunca ele mesmo. Não pode formar ciclo (A mentor de B e B mentor de A). | D13, D20 |
| RN-33 | Lanterna não é removido; afasta-se. Não existe `DELETE /lanternas/:id`: a chamada responde 404 `NAO_ENCONTRADO` (rota desconhecida), não 405. | D10, D41 |
| RN-34 | Alterar/anular Setor da Ficha não pode tornar incompatível conta vinculada nem Ocorrência sob responsabilidade da Ficha, inclusive histórica/excluída; responde 409 `LANTERNA_EM_USO`. PATCH sem mudança de Setor não é bloqueado por essa regra. **Limitação deliberada:** com histórico de responsável incompatível, não há fluxo de remanejamento entre Setores neste escopo. | D32, D41 |

## Evento e Comentário

| ID | Regra | Origem |
|---|---|---|
| RN-40 | O Evento é gravado na mesma transação da mudança nestes casos: criação, atribuição, início (`status_alterado`), reabertura, resolução e comentário apagado. Cada ação gera um Evento, sem duplicar `status_alterado` ao resolver/reabrir. Nunca é editado ou apagado. | D16, D33 |
| RN-41 | Comentar é permitido ao Guardião e aos Lanternas do Setor da Ocorrência. Comentário não é editado. | D16 |
| RN-42 | O autor, ou qualquer Guardião, apaga o Comentário (soft delete); isso gera Evento `comentario_apagado`. Comentário já excluído, inexistente, de Ocorrência excluída ou de outro Setor (para o Lanterna) é 404. | D16, D41 |
| RN-43 | Comentar em Ocorrência `resolvida` é permitido. | D19 |

## Dashboard

| ID | Regra | Origem |
|---|---|---|
| RN-50 | O Guardião vê todos os Setores, com filtro opcional; o Lanterna vê só o próprio Setor e o filtro é ignorado. | D17 |
| RN-51 | Métricas agregadas no banco: contagem por Status e por Gravidade, vencidas, tempo médio de resolução (`resolvidaEm − criadaEm`, null sem amostra), série diária UTC de `dias` (padrão 30, incluindo hoje) e ranking por resolvidas. `dias` afeta só a série; demais métricas usam histórico no escopo. | D17, D33 |
| RN-52 | Ocorrência excluída não entra em nenhuma métrica. | D4 |

## Busca e credenciais

| ID | Regra | Origem |
|---|---|---|
| RN-60 | `busca` é substring literal e determinística: Usuários por nome OU e-mail, Lanternas por codinome, Ocorrências por título. Termo aparado; vazio é ignorado; comparação sem caixa e sem acento (NFD, remover marcas combinantes, minúsculas) no termo e no texto armazenado; `%`, `_` e `\` são literais. Filtra no banco, com consulta parametrizada, sobre campos auxiliares internos mantidos na mesma transação do campo de origem. | D35 |
| RN-61 | A senha não sofre trim. Cadastro: 8 caracteres Unicode a 72 bytes UTF-8; login: 1 caractere a 72 bytes. Excesso é 400 `DADOS_INVALIDOS` (campo `senha`) antes do bcrypt; nada é truncado. | D36 |
