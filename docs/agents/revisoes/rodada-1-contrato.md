# Revisão independente DOC-03 — contrato (rodada 1)

**Data:** 2026-11-09. **Escopo:** somente leitura e probes em cópias temporárias; nenhum arquivo do repositório foi alterado além deste relatório.

## 1. Modelo, fontes e verificações

**Modelo:** o host informa, no prompt de sistema desta sessão, "Sonnet 5.5, ID `claude-sonnet-5-5`". É a única atestação disponível; não há outra chamada do host que confirme o modelo.

**Fontes lidas:** `AGENTS.md`, `docs/agents/DOC-03-PLANEJAMENTO.md`, `docs/agents/revisoes/brief-contrato.md`, `docs/contratos/README.md`, `openapi.json` (lido por script: 30 operações, 67 schemas, 198 exemplos nomeados), `exemplos/cenarios.json` (inteiro), `validar.py` (inteiro), `docs/backend/{API,DTOS,REGRAS-DE-NEGOCIO,MODELO-DE-DADOS,SEED,CENARIOS-DE-TESTE}.md`, D29–D33 em `ESCOPO.md`, `db.json` (estrutura e limites de tamanho), `docs/research/lanternas/grupo-*.md` (campos de texto), e `grep` em `INTEGRACAO.md`, planos, `ARQUITETURA.md` e na skill `backend-api` atrás de rotas inventadas, `busca` e bcrypt. **Não li** `docs/agents/README.md`, a pesquisa `2026-11-09-…`, o texto integral da skill `backend-api` nem os planos de FE/BE. Eles são do outro revisor ou só foram consultados por busca.

**Comandos, da raiz:**

| Comando | Exit | Resultado |
|---|---|---|
| `py -3 docs/contratos/validar.py` | **0** | `OK documental: 30 operações…` |
| `node docs/agents/validar-documentacao.mjs` | **0** | 43 documentos, 402 links locais, 15 pastas, 0 falhas |
| `python3 docs/contratos/validar.py` | não executa | `python3` é alias da Microsoft Store neste host; o README só cita `python` |

Os dois validadores passam. Os achados abaixo vêm do cruzamento de fontes e dos probes, não de falha dos scripts.

**Probes do validador** (cópias em diretório temporário, `--spec`/`--fixtures`): 23 mutações. Rejeitadas, como declarado (8): campo extra, campo obrigatório ausente, valor fora do enum, 204 com corpo, versão divergente, timestamp sem fuso, 400 sem `detalhes`, código de autorização não declarado. **Aceitas com exit 0 (15),** detalhadas em C-09.

**Verificação positiva:** os 142 pares operação×código de erro do OpenAPI têm exemplo em `components.examples`, com `caminho` compatível com a rota. As rotas de `API.md` e as do OpenAPI coincidem, e os status HTTP por operação coincidem entre `API.md` e o OpenAPI. Não encontrei endpoint inventado nos documentos pesquisados. Nenhuma fixture usa dado demonstrativo OANET: e-mails `*.invalid`, JWT `<JWT_FICTICIO_NAO_UTILIZAVEL>`. O README afirma que o transporte é só pelo servidor Next, e não encontrei texto que o contradiga.

## 2. Veredito

**Não apto para liberação a dois devs independentes sem correção de C-01 e C-02** (P1). Nenhum P0. O formato OpenAPI está coerente e utilizável. O que falta é determinismo em um ponto de máquina de estados (C-01) e um conjunto de cenários que sirva de oráculo comum (C-02, C-03). Os P2 podem ser corrigidos na mesma rodada, sem mudar a estrutura do pacote.

## 3. Achados

### C-01 — P1 — Liberar Responsável de Ocorrência `em_andamento` não tem resultado definido
- **Onde:** `API.md` § Ocorrências (`PATCH …/responsavel`: "`null` para liberar"); `REGRAS-DE-NEGOCIO.md` RN-12, RN-15, RN-20; OpenAPI `atribuirResponsavel` ("null libera") e schema `Evento_status_alterado`.
- **Evidência:** RN-12 exige Responsável para `em_andamento`. A rota aceita `responsavelId: null` em qualquer Ocorrência não resolvida, e a única fixture (`atribuirResponsavel`) usa O1 `aberta`. Nada diz o que acontece com uma Ocorrência `em_andamento`: o status permanece (e viola RN-12), volta a `aberta`, ou a liberação é recusada. O OpenAPI não prevê Evento `em_andamento→aberta`, já que `Evento_status_alterado` tem `de: const aberta`, `para: const em_andamento`. Também não há código de erro que sirva para recusar.
- **Impacto:** BE e FE escolhem comportamentos diferentes. Isso afeta Minha fila, `cargaAtual`, RN-20 e o tipo de Evento gravado. Os testes de provedor não conseguem arbitrar.
- **Correção / critério:** decidir (D-nova) entre (a) liberar uma `em_andamento` volta a `aberta` com Evento definido, (b) 422 com código novo, ou (c) permitido sem Responsável, revogando RN-12 como invariante. Acrescentar a decisão a RN-12/RN-15, ao OpenAPI e a `API.md`, mais um cenário em `cenarios.json`. Critério: dado O `em_andamento` com Responsável, `PATCH responsavel null` tem status, estado final e Evento únicos.

### C-02 — P1 — `cenarios.json` não traz pré-condições por cenário nem requisições inválidas para os erros
- **Onde:** `exemplos/cenarios.json`, chaves `usuarios`, `setores`, `ocorrencias`, `operacoes`, `erros`; `README.md` § Exemplos e pré-condições.
- **Evidência:**
  - O estado prévio global só define 4 usuários, 2 Setores e 2 Ocorrências. Faltam as Fichas `hal-jordan`, `kilowog` e `lanterna-sem-setor`, que aparecem apenas dentro das respostas, e o Comentário `…0007` e os Eventos de O1, que só existem no corpo da resposta. Cada item de `operacoes` tem só `operationId`, `ator`, `request`, `response`, e apenas 1 entrada de `autorizacao` tem `estadoAnterior`.
  - `erros` tem 26 corpos sem `operationId`, sem `request` e sem estado. Eles não permitem a um provedor produzir o erro nem a um consumidor saber qual chamada o gera. Em `README.md`: "erros inclui todos os códigos dos status…".
  - Não há requisição inválida em nenhum lugar: nenhum corpo com campo extra, query fora do enum (`ordenar=senhaHash`), `limite=51`, UUID/slug malformado, resolução curta (RN-13) etc. Os 142 pares operação×código só existem como corpos de resposta.
- **Impacto:** cada dev monta o próprio estado para reproduzir um cenário. As duas implementações podem ser consideradas conformes e divergir. O pedido era "requests válidos e inválidos, cobertura real de sucesso/erro por operação".
- **Correção / critério:** acrescentar a cada cenário `estadoInicial` (referenciando entidades de um bloco `lanternas`/`comentarios`/`eventos`) e `request` + `esperado`. Criar cenários de erro por operação×código (`operationId`, `ator`, `estadoInicial`, `request`, `status`, `codigo`) e fazer o validador exigir cobertura dos pares de `x-codigos`. Se isso ficar para a fase de testes, dizê-lo no README e remover a frase que sugere cobertura.

### C-03 — P2 — As fixtures se contradizem entre si
Provas que passam no validador:
- **Evento `criada` de O1 versus a Ocorrência:** `listarEventos` traz autor `…0001` (Guardião), mas `ocorrencias[0].criadaPorId` é `…0002` (L2814).
- **Linha do tempo versus estado de O1:** os Eventos terminam em `reaberta` com `responsavelId: null`, às 16:00 de 11-07. O1, em `ocorrencias`, está `aberta` com `responsavelId: hal-jordan`. O caso `resolvida` põe `resolvidaEm = 11-09T12:00`, depois da reabertura que o Evento `reabertura-libera-afastado` marca em 11-07T16:00. O Evento fala em Hal "afastado", mas a Ficha de Hal está `em_missao`.
- **`criarOcorrencia`:** a resposta usa o UUID `…0005`, o mesmo de O1, com `criadaEm = 2026-11-09T12:00:00Z` (O1 é de 11-07). O mesmo id representa dois registros.
- **`listarUsuarios`** (`busca: teste`, `limite 1`, `ordenar nome asc`): `meta.total = 4`. Só 3 contas têm "teste" no nome ou e-mail. O item devolvido é "Lanterna 2814…", mas ordenado por nome o primeiro seria "Conta sem vínculo" (ou "Guardião de teste", se filtrado).
- **`erros[]`:** `caminho` de `EMAIL_JA_CADASTRADO`, `MENTOR_INVALIDO`, `MUITAS_TENTATIVAS` e outros é `/ocorrencias/…0005`, a rota errada. Só `LANTERNA_EM_USO` usa `/lanternas/hal-jordan`.
- **Impacto:** quem usar as fixtures como "mundo" único recebe asserções que falham ou, pior, aprende regras erradas (ordenação, filtro). O README promete "UUIDs/slug/números consistentes".
- **Correção / critério:** ajustar os valores acima, ou declarar explicitamente que os blocos são independentes e não podem ser compostos. Acrescentar ao validador as checagens possíveis (C-09). Critério: nenhuma contradição entre `autorId` do Evento `criada` e `criadaPorId`, `meta.total` coerente com a ordem pedida, `caminho` da rota correta.

### C-04 — P2 — `busca` não tem semântica em nenhuma fonte
- **Onde:** `API.md` (3 listas), `DTOS.md` § Query e path, OpenAPI (`busca: string maxLength 100`).
- **Evidência:** `grep busca` encontra o parâmetro, mas nada define campos pesquisados (nome? e-mail? título? codinome?), comparação (substring, prefixo, caixa, acento) ou tratamento de `%`/`_`. A fixture `listarUsuarios` já a usa de forma incoerente (C-03).
- **Impacto:** FE implementa busca esperando um comportamento; BE entrega outro. Não há como testar.
- **Correção / critério:** definir por lista: campos, substring sem distinção de caixa/acento, escape de curingas, `busca` vazia (ignorada ou 400). Acrescentar exemplos que provem o comportamento (um positivo, um negativo, um com acento).

### C-05 — P2 — Limite de senha: contrato em caracteres, bcrypt em bytes, sem código para o excedente
- **Onde:** OpenAPI `CadastroEntrada.senha` (`minLength 8, maxLength 72`) e `LoginEntrada.senha` (`maxLength 72`); `DTOS.md` § Esteira; `backend/PLANO-IMPLEMENTACAO.md`: "bcrypt com limite em bytes acordado nos DTOs"; skill `backend-api`: "bcrypt só usa 72 bytes".
- **Evidência:** o DTOS remete a "verificação dos bytes UTF-8 no provedor", mas não define o limite em bytes, o código/status ao exceder (400 `DADOS_INVALIDOS`? com qual `detalhes`?) nem o efeito no login. O plano diz que o limite em bytes está "acordado nos DTOs", e não está. Probe: uma senha de 72×`ç` (144 bytes) é aceita no validador.
- **Impacto:** o formulário do FE aceita 72 caracteres multibyte e o BE trunca em silêncio (duas senhas diferentes passam a coincidir) ou rejeita sem contrato.
- **Correção / critério:** declarar `x-max-bytes: 72` no schema (e no validador) ou usar limite de caracteres menor, mais 400 `DADOS_INVALIDOS` com `campo: senha`. Incluir um cenário de senha multibyte >72 bytes.

### C-06 — P2 — O seed documentado viola o schema de resposta da Ficha
- **Onde:** `SEED.md` § Lanternas (`primeiraAparicao`: "como na ficha, com ressalva"); OpenAPI `LanternaFicha.primeiraAparicao` (`maxLength 120`); `docs/research/lanternas/`.
- **Evidência:** pelo `grep` das linhas `primeiraAparicao`, três valores da pesquisa excedem 120 caracteres: Katma Tui 138, Sinestro 133, Boodikka 131. A regra de conversão do seed copia o texto com a ressalva. Outros campos (`identidadeCivil`, `especie`) também excedem em células de pesquisa, mas misturam nota e valor; não afirmo violação ali, só que nenhuma verificação confere seed contra schema.
- **Impacto:** o front valida a resposta pelo tipo exato do contrato (frontend-web/API-04). A Ficha de 3 Lanternas falharia na validação de saída contra a API real. O BE que inserir pelo domínio sem DTO não perceberia.
- **Correção / critério:** subir `maxLength` (ex.: 300) ou condensar o texto no seed, e registrar um teste de seed que valide as 25 Fichas contra `LanternaFicha`.

### C-07 — P2 — Vínculo de Ficha tem casos sem resultado
- **Onde:** `API.md` § Usuários; RN-07; DTOS "Vincular Lanterna".
- **Evidência:** RN-07 trata "uma conta de Lanterna". Não dizem o resultado de: (a) vincular Ficha a conta **Guardião** (que pode ter `setorId` nulo); (b) Ficha com `setorId` nulo (12 das 25 do seed, "não tem conta", D25) a uma conta Lanterna; (c) conta sem `setorId`. O único erro previsto é `SETOR_DIFERENTE` para "mesmo Setor".
- **Impacto:** dois devs respondem 422, 409 ou 200. Isso se junta ao Guardião com `lanternaId` preservado após promoção (RN-08), que não deve entrar em Minha fila.
- **Correção / critério:** escrever a regra ("Ficha sem Setor não vincula: 422 `SETOR_DIFERENTE`; conta Guardião não vincula: …"), com um cenário por caso.

### C-08 — P2 — `CENARIOS-DE-TESTE.md` não cobre RN-19 e as regras determinísticas de D33
- **Onde:** `CENARIOS-DE-TESTE.md` (abertura: "Um cenário para cada regra… pelo menos um caminho feliz e um de erro").
- **Evidência:** varredura RN×cenário: **RN-19 (Minha fila) não aparece**; só RN-07 cita a rota. Não existe cenário para ordem de Minha fila (prazo, Gravidade, id), exclusão de resolvidas/excluídas, 403 do Guardião, paginação (página além do fim, `meta.paginas`), ordenação com desempate, `limite` máximo nas fixtures (só `limite = 51`), campo extra → 400 (RN-01 cobre só o cadastro), nem série UTC com zeros (só "30 pontos"). O cenário "RN-23" de concorrência ("ambos 409") usa uma Ficha já `afastado`, então não prova a transação.
- **Impacto:** o BE passa na suíte descrita sem cobrir comportamento que D33 declara determinístico.
- **Correção / critério:** adicionar os cenários acima, com RN-19 primeiro. Reescrever RN-23 com duas atribuições a Fichas `ativo` e uma Ocorrência.

### C-09 — P2 — O validador aceita contradições que o README sugere detectar
Probes (exit 0 = aceito):

| Mutação | Resultado |
|---|---|
| ator `L674` em `criarSetor` (`x-acesso: G`); ator `Pub` em `listarUsuarios` | aceito |
| `x-acesso` de `criarSetor` trocado de G para Aut; remover o 403 de `criarSetor` | aceito |
| `x-codigos` de 409 em `criarSetor` trocado para `LANTERNA_EM_USO` (o `allOf` do schema segue `SETOR_JA_CADASTRADO`) | aceito |
| `meta.paginas` errado em `listarUsuarios`; `vencida`/`prazoEm` errados em `ocorrencias[0]`; `responsavelId`/`lanternaId` inexistentes | aceito |
| `id` da resposta ≠ `id` do path; slug `"hal-jordan\n"` (`re.search` com `$` aceita) | aceito |
| `required` de `prazoEm` removido da Ocorrência; senha 72×`ç` | aceito |
| `erros[0].body.caminho` qualquer | aceito |

- **Onde:** `validar.py` `verificar()`; `README.md` § Verificação documental e § Exemplos e pré-condições.
- **Evidência:** `verificar()` só cruza `x-acesso` com `security` (Pub versus bearer), não com a tabela de acesso nem com 401/403; só confere `meta.paginas` em `casosDeBorda`; só relaciona usuário→Setor e Ocorrência→Setor/criador.
- **Impacto:** o README lista os limites de forma geral (ciclos, agregações, integridade de todas as entidades). Faltam as lacunas acima, que são checáveis em poucas linhas. A frase de aceite "UUIDs/slug/números consistentes" não é garantida por nenhum script.
- **Correção / critério:** (1) checar `x-acesso` contra a tabela de `API.md` e exigir 401 em rotas protegidas e 403 nas de papel; (2) comparar `x-codigos` com o enum do `allOf`; (3) conferir `meta` e `prazoEm`/`vencida` (gravidade+relógio) em todas as fixtures, ator×acesso e `id` do path×resposta; (4) existência de `responsavelId`/`lanternaId`; (5) trocar `$` por `\Z`/`fullmatch`; (6) atualizar o README com os limites que restarem. Cada mutação acima vira teste negativo.

### C-10 — P3 — Precedência de erros e ambiguidades menores
- `PATCH /ocorrencias/:id` em Ocorrência `resolvida` por Lanterna não criador: 403 ou 409? A descrição do OpenAPI dá "outro autor 403; Resolvida 409" sem ordem.
- `PATCH …/status` por L com `status: aberta` em Ocorrência não resolvida: 403 (reabrir) ou 422 `TRANSICAO_INVALIDA`?
- `POST /ocorrencias`: o status de L enviando `setorId`, ou de G omitindo, só aparece em `CENARIOS-DE-TESTE` (400); `API.md` e o OpenAPI só têm "proíbe/exige".
- `DELETE /comentarios/:id` de comentário em Ocorrência já excluída; `PATCH /lanternas/:id/status` com `ativo` em Ficha `em_missao`.
- Rota ou método inexistente (RN-33 "404", RN-40 "404/405") não tem envelope definido; `NAO_ENCONTRADO` só vale para operações do OpenAPI.
- `MODELO-DE-DADOS` grafa `não verificado`; o enum é `nao_verificado`.
- `SEED.md` manda marcar dado de demonstração em `fontes`, mas `FonteCampo.estado` só tem `verificado|nao_verificado`.
- **Correção:** uma linha de precedência por caso (autenticação → papel → existência/escopo → formato → regra) e um cenário para cada.

## 4. Sugestões (não bloqueiam)
1. `PATCH /lanternas/:id` com `fontes`: dizer se substitui o objeto ou faz merge por campo; permitir `url` com `estado: nao_verificado`?
2. `tempoMedioResolucaoHoras`: fixar arredondamento (casas decimais), já que dois provedores calculam `number` diferente.
3. RN-34 + RN-15 tornam a troca de Setor da Ficha impossível depois da primeira Ocorrência (a conta ou o histórico sempre ficam incompatíveis). Registrar isso no `ESCOPO`, para não parecer defeito.
4. `ordenar=setor` em Lanternas: onde ficam as Fichas com `setorId` nulo (nulls first/last)?
5. `PATCH /usuarios/:id/papel` com `papel: lanterna` em conta que já é Lanterna funciona como transferência de Setor. Dizer se é intencional.
6. Documentar `python3` ao lado de `py -3`; o alias da Microsoft Store também afeta `python3`.

## 5. Limites desta revisão
- Nada foi executado contra API real, fake HTTP ou integração: não existem. A revisão é documental.
- Não conferi o texto dos planos FE/BE nem `docs/agents/README.md`; o outro revisor examina os planos. Os `grep` por rotas inventadas cobrem `INTEGRACAO.md`, `docs/frontend`, `PLANO-IMPLEMENTACAO` do BE, `ARQUITETURA` e `PLANO.md`.
- A validação do seed contra o schema foi feita por varredura das linhas de tabela da pesquisa, não por um seed executável; só `primeiraAparicao` é confirmado como violação.
- Os probes mudaram só cópias em diretório temporário da sessão.
