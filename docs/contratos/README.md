# Contrato de integração OANET

**Contrato alvo 1.0.0, consolidado em 2026-11-09.** Permite desenvolver front e back separadamente e comparar as entregas no marco de integração. O aceite técnico documental e a revisão consumível são os registrados em [G-1](../INTEGRACAO.md#g-1--aceite-do-contrato), com versão e SHA-256 do pacote após revisão, correções e leitura cruzada. Não representa API NestJS, consumidor ou provedor real implementados; a implementação continua dependente de tarefa própria.

| Fonte | Autoridade |
|---|---|
| [ESCOPO](../backend/ESCOPO.md), ADRs e [regras RN](../backend/REGRAS-DE-NEGOCIO.md) | Decisões e regras de domínio; mudanças precisam de decisão identificada. |
| [openapi.json](openapi.json) | Fonte normativa dos formatos: operações, parâmetros, DTOs, respostas completas, nulabilidade, limites e códigos permitidos por operação. |
| [API.md](../backend/API.md) | Semântica HTTP, autenticação, acesso, ordem de avaliação, erros e efeitos das operações. |
| [DTOS.md](../backend/DTOS.md) | Aplicação da validação e condições que dependem de papel/estado; não mantém outro schema. |
| [exemplos/cenarios.json](exemplos/cenarios.json) | Oráculo documental comum de **formato e de pré-condições**: estado inicial, request, resposta esperada e efeitos. Não decide regras; deriva do contrato. |
| [validar.py](validar.py) e [test_validar.py](test_validar.py) | Verificação documental e seus testes negativos permanentes. Não são prova de provedor. |

Direção de manutenção: **contrato primeiro**. Consumidores e provedor devem aderir ao formato do OpenAPI e à semântica API/D/RN. Divergência entre essas fontes bloqueia a tarefa até correção conjunta; não escolher silenciosamente a fonte mais conveniente. Quando existir Swagger gerado pelo Nest, compará-lo ao acordo. O gerado não substitui o contrato por conta própria. A pesquisa que fundamentou essa direção está [aqui](../research/2026-11-09-documentacao-para-agentes.md).

## Usar em cada frente

O [plano do front](../frontend/PLANO-IMPLEMENTACAO.md) deve validar o cliente HTTP e os schemas de resposta contra estes exemplos, com simulação no processo **Node servidor/teste**. Chamadas de Server Components e Actions saem do servidor Next: interceptação só no navegador não cobre essa fronteira. O navegador recebe props e resultado de action; token fica no servidor, em cookie httpOnly conforme ADR0001. Este pacote não instala servidor de simulação nem biblioteca de mock.

O [plano do back](../backend/PLANO-IMPLEMENTACAO.md) usa as mesmas operações e cenários com clientes HTTP de teste e banco isolado. Verificar também regras RN, transações, autorização, concorrência e persistência: isso não cabe somente nos schemas. O seed de pesquisa é outro artefato e continua sujeito a D14/D18/D25/D37; as frases e identidades fictícias deste pacote não são dados editoriais aprovados.

Na [integração](../INTEGRACAO.md), executar front e API reais, comparar chamadas/respostas com o contrato e conferir sessão, permissões e persistência dos cenários escolhidos. Resultado de fixture, mock, provedor e integração deve ser relatado separadamente. Nunca copiar estas fixtures para dados-demo do OANET, db.json, banco compartilhado ou respostas reais do produto.

## O que o contrato fecha

As 30 operações de API.md possuem entrada (quando aplicável), query/path, saída completa e erros. Objetos de saída têm todos os campos declarados, inclusive null; 204 não tem corpo. Há schemas distintos para lista de Lanterna, resumo de relações e Ficha; Ocorrência usa forma completa também na lista. Autor de Evento/Comentário é resumo sem e-mail e é sempre derivado da conta atual. Eventos usam payload discriminado por tipo. Defaults e enumerações vivem no OpenAPI, não em schemas paralelos neste README.

Códigos acrescentados ao fechar lacunas, todos estáveis (o front trata código, não mensagem): `SETOR_JA_CADASTRADO`, `LANTERNA_JA_CADASTRADA`, `CONTA_SEM_LANTERNA`, `SETOR_OBRIGATORIO`, `LANTERNA_EM_USO` e, na rodada 2, **`VINCULO_NAO_PERMITIDO`**. `SEM_RESPONSAVEL` passou a valer também em `PATCH …/responsavel`. O conjunto de decisões D29–D42 está em [ESCOPO](../backend/ESCOPO.md): determinismo de Minha fila e dashboard, liberação de Responsável em andamento, busca, senha em bytes, vínculo conta–Ficha, concorrência, ordem de avaliação e casos menores. Os 144 pares operação×código declarados estão cobertos por cenário identificável.

## Cenários: oráculo de formato e de pré-condições

`exemplos/cenarios.json` tem três blocos além do cabeçalho (`versaoContrato`, `relogioReferencia` 2026-11-09T12:00:00Z, `convencoes`):

- **`mundos.base`**: estado inicial fictício e reutilizável, com Setores, contas (Guardião, Lanternas, conta sem vínculo, Guardião promovido com vínculo preservado), Fichas (ativa, `em_missao`, `afastado`, sem Setor, mentor e aprendiz), Ocorrências (aberta, em andamento, resolvida, vencida, excluída), Eventos coerentes com cada Ocorrência e Comentários (inclusive um apagado). As entidades usam a forma da API, mais os campos internos `excluidaEm` (Ocorrência) e `excluidoEm` (Comentário); `autor` não é guardado, é derivado da conta.
- **`cenarios[]`**: cada item é independente e tem `id`, `operationId`, `ator` (`Pub` ou chave de conta; o teste gera o token, que nunca é fixture), `mundo`, `ajustes` opcionais (mudanças bem definidas sobre o mundo: `mesclar`, `adicionar`, `remover`), `request`, `esperado` e, nas escritas, `efeitos` (a mesma gramática, descrevendo o estado final). Tipos: `sucesso`, `pedido_invalido` (400), `rejeicao` (401/403/404/409/422/429/500) e `global` (rota sem operação). Entidade criada usa ID novo; snapshots de cenários diferentes não se misturam e nenhum cenário depende da ordem de execução.
- **`precondicao`**, quando o estado não é só dado: `token_ausente|token_adulterado|token_expirado` (401), `throttle` (429, tentativas anteriores esgotando o limite), `falha_controlada` (500, falha injetada no ponto indicado). Pedido inválido que o schema aceita (Lanterna enviando `setorId`, `setorId` com destino `guardiao`) é marcado `invalidoPor: papel|destino`; cenário que prova a esteira com pedido inválido de propósito usa `precedencia`.

Como cada frente materializa um cenário (o provedor BE já carrega os 310 cenários em `backend/test/contrato.e2e-spec.ts`, mas a auditoria de 2026-11-11 mostrou que ele não cobre todos os casos: ver [relatórios](../relatorios/README.md); o consumidor do front ainda não existe):

| Frente | Materialização |
|---|---|
| Provedor (BE) | Monta o banco isolado do teste a partir do `mundo` + `ajustes` (migrations reais, sem tocar o seed), gera o token do `ator` com a chave de teste, aplica a `precondicao` (sem Authorization, token adulterado ou vencido, repetição de logins até o limite, falha injetada no repository), envia o `request` e compara status, `codigo`, `caminho`, `detalhes[].campo` e o corpo; depois confere o banco contra `efeitos` (e que rejeições não mudaram nada nem geraram Evento). |
| Consumidor (FE) | Registra o `esperado` como resposta do HTTP simulado **no processo Node servidor/teste**, para o `request` correspondente, e valida o tratamento no cliente (envelope, código, `detalhes`). Mundos e efeitos servem de dados dos testes de tela; nunca viram dado do produto nem fallback silencioso. |

Senhas dos mundos: todas as contas usam a senha fictícia `SomenteTeste123!`; nenhum hash e nenhum token utilizável aparecem no pacote. O login devolve só o marcador `<JWT_FICTICIO_NAO_UTILIZAVEL>`.

## Verificação documental

Na raiz do repositório, com Python 3.10+ e apenas biblioteca padrão:

```powershell
py -3 docs/contratos/validar.py
py -3 -m unittest discover -s docs/contratos -p "test_*.py"
py -3 docs/contratos/validar.py --hash
```

Neste Windows `py -3` existe; os aliases `python` e `python3` apontam para a Microsoft Store e não executam. Em ambientes onde `python3` funciona, use-o no lugar de `py -3`. O validador resolve seus caminhos e aceita `--spec`, `--fixtures` e `--api` para avaliar cópias isoladas; sai com 0 se passar e com 1 e `FALHA documental` se rejeitar, sem levantar exceção para entrada malformada.

**O que o validador confere** (cada item tem teste negativo permanente em `test_validar.py`, inclusive os controles que já existiam antes da rodada 2):

- JSON legível, referências internas, `operationId` único, segurança declarada, parâmetros de path e keywords de schema (desconhecida é recusada).
- OpenAPI × `API.md`: rotas (lidas só das linhas de tabela), acesso (`x-acesso` contra a tabela), status de sucesso, status de erro por rota, códigos citados, tabela de códigos de erro; 401 em toda rota protegida, 403 `SEM_PERMISSAO` nas rotas de papel, nenhum `NAO_AUTENTICADO` em rota pública; enum de código do schema == `x-codigos` == chaves de exemplos, e cada `ErroNNN` admite exatamente os códigos usados; `caminho` dos exemplos de erro corresponde à rota; campos críticos continuam em `required`; limite de bytes de senha continua no schema.
- Subconjunto de JSON Schema: tipos, required, enum/const, null, `additionalProperties:false`, comprimentos, `pattern` com `fullmatch` (sem aceitar `\n` final), mínimo/máximo, arrays, `minProperties`, `anyOf/oneOf/allOf`, `x-max-palavras` e `x-max-bytes` (UTF-8; erro de encoding vira rejeição, não falha do script). Formatos uuid, date, date-time com fuso, e-mail simplificado e URL HTTP(S) absoluta, só no subconjunto documentado.
- **Mundos e estados finais** (inicial, após `ajustes` e após `efeitos`): formato das entidades; relações e IDs (Setor, criador, Responsável do mesmo Setor, vínculo conta–Ficha com o mesmo Setor, mentoria sem ciclo, e-mail único); `prazoEm` e `vencida` pelo relógio do cenário; status calculado da Ficha (RN-20); resolução e datas; **linha do tempo reproduzida** (primeiro Evento `criada` com autor igual ao criador, `de`/`para` encadeados e estado final igual ao da Ocorrência) e Comentário apagado com Evento correspondente.
- **Cada cenário**: ator × acesso × status (a esteira exige ator que passe autenticação e papel para qualquer 4xx/5xx que não seja 401/403); pedido realmente inválido (viola o schema) distinto de fixture positiva (deve validar); `caminho` do erro igual ao da rota pedida; `detalhes[].campo` presente nos 400; precondição obrigatória nos 401/429/500; **o estado inicial e o request permitem a falha declarada** (regra por operação×código, incluindo os cenários "as duas condições verdadeiras" que provam a precedência); sucesso de escrita com `efeitos`, rejeição sem; id da resposta igual ao do path; resposta igual à entidade do mundo final; `meta` das páginas (`paginas`, `pagina`, `limite`, tamanho da página, página além do fim), busca (cada item casa, total de Usuários), ordem de Usuários e de Minha fila.
- **Cobertura**: cada par operação×código declarado em `x-codigos` e cada operação tem cenário identificável; há cenário de rota desconhecida.
- `--hash` imprime o SHA-256 de cada arquivo do pacote (fim de linha normalizado para LF) e do conjunto; `--conferir-hash HEX` falha se o contrato mudou depois do aceite.

**O que o validador NÃO prova** (fica para os testes futuros do provedor e para a integração, e deve ser relatado separadamente):

- Execução de qualquer API, fake HTTP ou tela; hash e comparação bcrypt; transações, concorrência (RN-23) e rollback; guards reais.
- Agregações: `estatisticas` da Ficha, dashboard (contagens, série UTC, média, ranking), `tempoMedioResolucaoHoras` e arredondamento. Os números publicados nos cenários foram calculados fora do pacote e conferidos à mão uma vez; o validador só confere o formato.
- Listas além do declarado: ordem e filtros de Ocorrências e Lanternas (só pertinência à busca e meta), filtros combinados, total das listas de Lanternas e Ocorrências.
- Que o `efeito` escrito seja o **único** correto: o validador exige apenas que o estado final seja um mundo válido e coerente com a linha do tempo.
- Que o provedor realmente responda como o cenário: a cobertura prova um cenário identificável com estado compatível, não a resposta de uma implementação.
- Seed: o teste de seed contra o schema (D37) cobre só as Fichas públicas (`backend/test/seed-dominio.e2e-spec.ts`); os demais recursos do seed não são validados contra o schema.
- Validação integral de OpenAPI 3.1/JSON Schema 2020-12, formatos RFC completos e referências externas; DNS, URLs e existência de contas fora dos mundos.
- Intenção de uma mudança arbitrária no schema: o script não infere o que um autor quis. O gate é o hash (abaixo).

## Mudança, versão e hash

Manter `info.version` no OpenAPI e `versaoContrato` nas fixtures iguais. Na mesma tarefa, revisar API/DTO, mundos e cenários, validador e seus testes, consumidores, provedor e testes afetados, com proprietário explícito por arquivo. Mudança incompatível de entrada/saída, nulabilidade, obrigatoriedade, enum/código, permissão ou semântica exige nova versão major e atualização coordenada dos consumidores; novo campo ou rota compatível, minor; correção editorial sem mudar comportamento, patch. Como respostas usam `additionalProperties:false`, acrescentar campo de saída exige revisar consumidores e não é presumido compatível.

**Gate de aceite (G-1).** O aceite registra a versão e o SHA-256 do conjunto impresso por `--hash` (OpenAPI, cenários, o próprio `validar.py`, `test_validar.py` e este README, e as fontes de API, DTO, RN, ESCOPO, modelo, seed e cenários de teste), porque apagar um controle do validador também tem que mudar o hash. O validador não decide se uma mudança de schema é compatível: qualquer alteração depois do aceite muda o hash e falha `--conferir-hash`, o que obriga nova revisão e novo registro em vez de um falso "continua aprovado". Registrar comandos, saídas e limites no registro da tarefa, não neste guia. Dependência nova, gerador ou fonte concorrente do OpenAPI não fazem parte desta entrega.
