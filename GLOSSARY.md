# Tropa dos Lanternas Verdes

Sistema em que a Tropa registra, acompanha e atribui ocorrências intergalácticas. Visitantes conhecem a Tropa; membros autenticados operam as ocorrências.

## Language

**Tropa**:
A organização dos Lanternas Verdes, sediada em Oa.
_Avoid_: Corpo, empresa

**Oa**:
O planeta-sede da Tropa, no Setor 0.
_Avoid_: Central, matriz

**Setor**:
Região do universo sob a responsabilidade de um ou mais Lanternas. Todo Setor tem um número; o Setor 0 é o de Oa.
_Avoid_: Região, zona, setor espacial

**Lanterna**:
Membro da Tropa que atua em um Setor. É quem pode ser responsável por uma Ocorrência.
_Avoid_: Agente, soldado, usuário

**Guardião**:
Membro da cúpula da Tropa, com visão de todos os Setores.
_Avoid_: Administrador, admin, gestor

**Papel**:
A função de uma pessoa no sistema, que define o que ela pode fazer: Guardião ou Lanterna. Nunca é informado pela própria pessoa ao se cadastrar.
_Avoid_: Perfil, role, nível

**Ocorrência**:
Incidente registrado em um Setor que a Tropa precisa acompanhar até a resolução.
_Avoid_: Chamado, ticket, missão, incidente

**Gravidade**:
O quão grave é uma Ocorrência: baixa, média, alta ou crítica.
_Avoid_: Prioridade, urgência

**Status**:
A fase da Ocorrência: aberta, em andamento ou resolvida. Resolver exige explicar a resolução.
_Avoid_: Estado, situação

**Responsável**:
O Lanterna do mesmo Setor encarregado de uma Ocorrência.
_Avoid_: Atribuído, dono

**Atribuição**:
O ato de designar o Responsável de uma Ocorrência.
_Avoid_: Delegação, alocação

**Prazo**:
O limite para resolver uma Ocorrência, definido pela Gravidade e contado da criação.
_Avoid_: SLA, deadline

**Vencida**:
Ocorrência não resolvida cujo Prazo já passou.
_Avoid_: Atrasada, expirada

**Ficha**:
A página completa de um Lanterna, com sua identidade, origem, trajetória e ocorrências.
_Avoid_: Perfil, cadastro

**Minha fila**:
As Ocorrências atribuídas ao Lanterna logado, ordenadas por Prazo e Gravidade.
_Avoid_: Caixa de entrada, inbox

## Linha do tempo

**Evento**:
Registro automático de algo que mudou numa Ocorrência (criação, mudança de Status, Atribuição), com autor e momento. Não é editado depois.
_Avoid_: Log, histórico, auditoria

**Comentário**:
Mensagem escrita por um membro da Tropa em uma Ocorrência.
_Avoid_: Nota, observação, mensagem
