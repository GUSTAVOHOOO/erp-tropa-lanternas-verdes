# DTOs e validações

Contrato alvo **1.0.0 — 2026-11-09**. A fonte normativa de campos, tipos, obrigatoriedade, nulabilidade, enums, limites e formas de resposta é [openapi.json](../contratos/openapi.json). Este guia explica a aplicação da validação e as condições que dependem de papel/estado; não é um segundo schema. [API.md](API.md) governa semântica HTTP, acesso e códigos; decisões D e regras RN governam domínio. Divergência entre as fontes bloqueia a tarefa até correção conjunta, conforme [o pacote de contratos](../contratos/README.md).

## Esteira de entrada

Aplicar ValidationPipe com whitelist, forbidNonWhitelisted e transform. Campo desconhecido no corpo ou na query é **400 DADOS_INVALIDOS**. Converter query/path antes de validar: inteiros decimais para pagina, limite, dias, Setor; somente true/false para vencida, sem coerção de texto arbitrário para verdadeiro. Nas fixtures os valores já estão convertidos; o HTTP os serializa como texto.

Texto é aparado antes de medir, **exceto `senha`**, que preserva o conteúdo; email é normalizado para minúsculas. Manter o mesmo comportamento no schema de formulário e no DTO da API. A contagem máxima de palavras de citacao está em x-max-palavras no contrato.

Senha (D36): além do limite de caracteres, o schema declara `x-max-bytes: 72` (UTF-8). O DTO mede os bytes e recusa o excesso com 400 `DADOS_INVALIDOS`, detalhe `campo: senha`, no cadastro **e no login**, antes de qualquer comparação com o hash; nunca trunca. Cadastro exige ao menos 8 caracteres Unicode, login ao menos 1. O validador documental confere o limite no schema e nos exemplos; a verificação real com bcrypt é do teste do provedor.

Validação de formato/tipo/campo extra é 400, com detalhes no formato definido pelo schema Erro400: lista de objetos com campo e mensagens (lista de textos). Os demais status não contêm detalhes. Não retornar senhaHash, senha, stack nem mensagens do banco.

Ordem das etapas (D40): autenticação (401) → papel da rota (403) → formato de DTO/params/query (400) → existência e escopo do recurso da rota → autoria/permissão da ação → regras de estado e de domínio. As regras de formato que dependem do papel ou do destino (o JSON Schema não as decide) também são 400 com detalhe do campo: Lanterna que envia `setorId` ou Guardião que o omite em `POST /ocorrencias`; `setorId` com destino `guardiao` em `/papel`. Detalhes completos em [API.md](API.md).

## Schemas de corpo por operação

Os nomes abaixo são chaves de components.schemas em [openapi.json](../contratos/openapi.json); os limites ficam somente lá.

| Operação | Schema de entrada |
|---|---|
| POST /auth/cadastro | CadastroEntrada |
| POST /auth/login | LoginEntrada |
| PATCH /usuarios/:id/papel | PapelEntrada |
| PATCH /usuarios/:id/lanterna | VinculoEntrada |
| POST /setores | SetorCriacao |
| PATCH /setores/:id | SetorEdicao |
| POST /lanternas | LanternaCriacao |
| PATCH /lanternas/:id | LanternaEdicao |
| PATCH /lanternas/:id/status | LanternaStatusEntrada |
| POST /ocorrencias | OcorrenciaCriacaoLanterna ou OcorrenciaCriacaoGuardiao |
| PATCH /ocorrencias/:id | OcorrenciaEdicao |
| PATCH /ocorrencias/:id/status | OcorrenciaStatusEntrada |
| PATCH /ocorrencias/:id/responsavel | ResponsavelEntrada |
| POST /ocorrencias/:id/comentarios | ComentarioEntrada |

Atualizações parciais de Setor, Lanterna e Ocorrência exigem ao menos um campo. O id não é editável. Status de Lanterna é alterado só na rota própria; em_missao é calculado. Na criação de Ficha, status nasce ativo, opcionais escalares ficam null, habilidades fica [] e fontes fica {} se omitidos. especie e planetaNatal são obrigatórios no POST; respostas de registros da pesquisa podem conter null nesses campos (D14/D25). PATCH não aceita null para esses dois campos.

fontes aceita somente os campos documentais enumerados em FontesLanterna. Cada entrada tem estado e URL HTTP(S) opcional; campo ausente em fontes equivale a nao_verificado. Dados não pesquisados não devem ser inventados para preencher a resposta.

## Regras complementares ao schema

| Entrada | Condição que depende do sistema |
|---|---|
| Cadastro | Papel nunca vem do corpo; cria conta lanterna sem vínculo. Setor deve existir (404); email repetido dá409. Sem token, segue para /login (D21/D27). |
| Alterar Papel | setorId só é aceito com destino lanterna; com guardiao é400. Omitido preserva Setor anterior; sem Setor disponível dá422 SETOR_OBRIGATORIO. Setor inexistente404; incompatível com Ficha422 SETOR_DIFERENTE. Promoção preserva Setor/vínculo, mas G ignora escopo. Último G409 após formato válido e conta da rota existente, antes dessas regras (RN-08). Destino lanterna em conta já Lanterna pode trocar o Setor, com as mesmas restrições. |
| Vincular Lanterna | lanternaId presente pode ser null (desvincular, inclusive Guardião promovido). Não nulo, nesta ordem: Ficha existente404; alvo Lanterna (Guardião: 422 VINCULO_NAO_PERMITIDO); conta e Ficha com Setor e iguais (422 SETOR_DIFERENTE; Ficha sem Setor também); vínculo único409 LANTERNA_JA_VINCULADA (RN-07, D38). |
| Editar Setor da Ficha | Setor inexistente404. Troca/null incompatível com conta ou Ocorrência histórica/excluída sob responsabilidade dá409 LANTERNA_EM_USO; outros campos continuam editáveis (RN-34). |
| Mentor | Inexistente, próprio ou ciclo são422 MENTOR_INVALIDO. |
| Criar Ocorrência | G exige setorId; L proíbe esse campo, usa o Setor do Usuário. Uma união JSON Schema não decide o papel: o service valida a variante autorizada e a violação é 400 com detalhe `setorId`. Setor informado por G que não existe: 404. |
| Resolver/Reabrir | Ausência ou menos de10 caracteres em resolucao ao resolver e motivo ao reabrir são422 RESOLUCAO_OBRIGATORIA/MOTIVO_OBRIGATORIO. Se presentes, tipo não textual ou tamanho máximo excedido é400. Nos demais destinos os campos são ignorados. Lanterna pedindo aberta: Ocorrência resolvida é tentativa de reabrir (403), qualquer outro estado é 422 TRANSICAO_INVALIDA. |
| Atribuir | responsavelId é slug da Ficha, ou null para liberar. null em Ocorrência em_andamento é 422 SEM_RESPONSAVEL (sem mudança); em aberta libera; resolvida é 409 em qualquer caso. Ficha inexistente404, Setor/sem Setor422, afastado409 (RN-15, D34). Sem mudança efetiva, 200 e nenhum Evento. |

Assim o campo curto de resolução não é recusado primeiro por MinLength no DTO: o service retorna o código422 exigido por RN-13. As transições e a falta de Responsável seguem RN-11/12.

## Query e path

Cada parâmetro permitido e seu default estão na própria operação em openapi.json. Listas paginadas aceitam pagina (padrão1) e limite (padrão20, máximo50); Setores é lista não paginada. Ordenações aceitam somente as enumerações da operação, com desempate por id. Consulta por valor fora da lista dá400, nunca SQL dinâmico livre.

- Usuários: busca (nome ou e-mail), paginação, ordenar por nome/criadoEm, ordem. Default nome asc; `nome` ordena pela forma normalizada de busca.
- Lanternas: setor, status, busca (codinome), paginação, ordenar por codinome/setor/anoIngresso, ordem. Default codinome asc (forma normalizada); em `setor` e `anoIngresso` os nulos ficam no fim, em asc e desc.
- Ocorrências: status, gravidade, setor, responsavel, vencida, busca (título), paginação, ordenar por prazo/criadaEm/gravidade, ordem. Default criadaEm desc. Gravidade usa ordem de domínio baixa→critica em asc, inversa em desc.
- Minha fila: somente paginação; só pendentes (não resolvidas/não excluídas), prazo asc, Gravidade critica→baixa, id asc.
- Eventos/comentários: somente paginação; criadoEm asc, id asc.
- Dashboard: setor e dias (default30, de7 a90). dias afeta só a série UTC, conforme API.md/D33.

L pode enviar setor nas queries documentadas de Ocorrências/Dashboard; o servidor o ignora e usa setorId do Usuário. Isso não transforma um parâmetro desconhecido em parâmetro permitido.

Path :id de Ocorrência, Comentário e Usuário é UUID; de Lanterna é slug; de Setor é inteiro0–9999. Formato inválido400, sem consultar o recurso; referência inexistente404. Guard de autenticação/papel executa antes da validação: requisição sem sessão pode retornar401, e papel insuficiente403, antes de um400 de formato.

`busca` (D35): substring literal; termo aparado, vazio ignorado; comparação sem caixa e sem acento (NFD, remover marcas combinantes, minúsculas) no termo e no armazenado; `%`, `_` e `\` literais; limite de 100 caracteres. Os campos pesquisados são fixos por lista e não se pesquisa a descrição das Ocorrências.

## Respostas e consumo

Todos os campos declarados nos objetos de resposta estão presentes, mesmo quando null. `tempoMedioResolucaoHoras` usa 2 casas decimais, metade para cima. `fontes` enviado em `PATCH /lanternas/:id` substitui o objeto inteiro. Campo opcional de entrada não implica campo opcional de saída. UUIDs são textos; números de Setor são inteiros. Datas têm fuso, exemplos em UTC. Registro excluído some das consultas: excluidaEm/excluidoEm não são expostos.

| Uso | Schema de dados/resposta |
|---|---|
| Conta, cadastro, /auth/me e mutações de usuário | Usuario, com criadoEm para ordenação, sem credenciais |
| Login | LoginDados: token, expiresIn=28800, usuario |
| Setor | Setor; lista não paginada SetoresResposta |
| Lista de Lanternas | LanternaLista (sem fontes); paginação LanternasPagina |
| Relações de Ficha | LanternaResumo para mentor/aprendizes, sem recursão |
| Detalhe e mutações de Lanterna | LanternaFicha, inclui fontes e estatisticas |
| Lista, detalhe e mutações de Ocorrência | Ocorrencia completa, inclui prazoEm/vencida |
| Evento | Evento, união discriminada por tipo e payload dados específico |
| Comentário | Comentario, inclui autorId e autor resumo |
| Dashboard | Dashboard, contagens com todas as chaves, média null sem amostra |

Cada resposta HTTP usa seu schema de envelope, listado na operação. Listas paginadas usam dados.itens e dados.meta; lista vazia mantém metadados. 204 não tem corpo, nem JSON null. O cliente não deve tentar fazer parse JSON de um204.

O Next valida a resposta com o tipo exato do contrato (frontend-web/API-04). Simulações validam exemplos no processo server/test; não substituem prova da API real nem criam sessão de produto. Execute [validar.py](../contratos/validar.py) e os testes de cada lado antes do marco de [integração](../INTEGRACAO.md).
