# DTOs e validações

Versão de 2026-11-06. Campo a campo, o que cada rota de [API.md](API.md) aceita. Aplica-se `ValidationPipe` global com `whitelist`, `forbidNonWhitelisted` e `transform`: campo desconhecido é 400 `DADOS_INVALIDOS`, e query e route param chegam como texto e são convertidos antes de validar. Texto é aparado (`trim`) antes de medir. Os limites seguem os schemas Zod que o front já usa, para o mesmo erro aparecer nos dois lados.

Legenda: **obr** obrigatório · **opt** opcional · **nulo** aceita `null`.

## Corpo

### `POST /auth/cadastro`

| Campo | Tipo | Regra |
|---|---|---|
| `nome` | texto, obr | 2 a 100 |
| `email` | texto, obr | e-mail válido, até 254, convertido para minúsculas |
| `senha` | texto, obr | 8 a 72 (limite do bcrypt) |
| `setorId` | inteiro, obr | Setor existente (404 se não existir) |

Sem `papel`: enviar o campo é 400 (RN-01).

### `POST /auth/login`

| Campo | Tipo | Regra |
|---|---|---|
| `email` | texto, obr | e-mail válido |
| `senha` | texto, obr | 1 a 72 |

### `PATCH /usuarios/:id/papel`

| Campo | Tipo | Regra |
|---|---|---|
| `papel` | `guardiao` \| `lanterna`, obr | |

### `PATCH /usuarios/:id/lanterna`

| Campo | Tipo | Regra |
|---|---|---|
| `lanternaId` | slug | `null`, obr | Ficha existente do mesmo Setor da conta; `null` desvincula (RN-07) |

### Setor: `POST /setores`, `PATCH /setores/:id`

| Campo | Tipo | Regra |
|---|---|---|
| `id` | inteiro, obr no POST; proibido no PATCH | 0 a 9999; único |
| `nome` | texto, obr no POST | 2 a 60 |
| `descricao` | texto, obr no POST | 10 a 300 |

No `PATCH` todos os campos são opcionais e ao menos um é exigido.

### Lanterna: `POST /lanternas`, `PATCH /lanternas/:id`

| Campo | Tipo | Regra |
|---|---|---|
| `id` | slug, obr no POST; proibido no PATCH | `^[a-z0-9]+(-[a-z0-9]+)*$`, 2 a 40; único |
| `codinome` | texto, obr no POST | 2 a 60 |
| `identidadeCivil` | texto, opt, nulo | 2 a 80 |
| `especie` | texto, obr no POST | 2 a 50 |
| `planetaNatal` | texto, obr no POST | 2 a 60 |
| `setorId` | inteiro, opt, nulo | Setor existente (D25) |
| `anoIngresso` | inteiro, opt, nulo | 1900 a 2100 |
| `primeiraAparicao` | texto, opt, nulo | até 120 |
| `habilidades` | lista de textos, opt | até 10 itens de 2 a 60 |
| `mentorId` | slug, opt, nulo | Lanterna existente, não ele mesmo, sem ciclo (422 `MENTOR_INVALIDO`) |
| `citacao` | texto, opt, nulo | até 15 palavras |
| `biografia` | texto, opt, nulo | até 1200 |
| `fontes` | objeto, opt | por campo: `{ estado: "verificado" \| "nao_verificado", url?: texto }` |

O `status` não vai aqui: `em_missao` é do sistema (RN-20), e afastar ou reativar tem rota própria.

### `PATCH /lanternas/:id/status`

| Campo | Tipo | Regra |
|---|---|---|
| `status` | `ativo` \| `afastado`, obr | `em_missao` nunca é aceito |

### Ocorrência: `POST /ocorrencias`

| Campo | Tipo | Regra |
|---|---|---|
| `titulo` | texto, obr | 5 a 100 |
| `descricao` | texto, obr | 10 a 2000 |
| `planeta` | texto, obr | 2 a 100 |
| `gravidade` | `baixa` \| `media` \| `alta` \| `critica`, obr | |
| `envolvidos` | inteiro, obr | 1 a 1.000.000 |
| `setorId` | inteiro | Obrigatório para o Guardião; **proibido** para o Lanterna (o servidor usa o dele; enviar é 400) |

### `PATCH /ocorrencias/:id`

Os mesmos campos de `titulo` a `envolvidos`, todos opcionais, ao menos um exigido. `setorId` e `status` não entram.

### `PATCH /ocorrencias/:id/status`

| Campo | Tipo | Regra |
|---|---|---|
| `status` | `aberta` \| `em_andamento` \| `resolvida`, obr | A transição é validada no service |
| `resolucao` | texto | Exigida e 10 a 2000 quando `status = resolvida`; ignorada nos demais |
| `motivo` | texto | Exigido e 10 a 500 quando é uma reabertura; ignorado nos demais |

### `PATCH /ocorrencias/:id/responsavel`

| Campo | Tipo | Regra |
|---|---|---|
| `responsavelId` | slug \| `null`, obr | `null` libera o Responsável |

### `POST /ocorrencias/:id/comentarios`

| Campo | Tipo | Regra |
|---|---|---|
| `texto` | texto, obr | 1 a 1000 |

## Query

Comuns às listas: `pagina` inteiro ≥ 1 (padrão 1) e `limite` inteiro de 1 a 50 (padrão 20).

| Rota | Parâmetros |
|---|---|
| `GET /usuarios` | `busca` (até 100, nome ou e-mail), `ordenar` = `nome` \| `criadoEm`, `ordem` |
| `GET /lanternas` | `setor` inteiro, `status` enum, `busca` (até 100, codinome), `ordenar` = `codinome` \| `setor` \| `anoIngresso`, `ordem` |
| `GET /ocorrencias` | `status`, `gravidade`, `setor` (ignorado para o Lanterna), `responsavel` slug, `vencida` = `true` \| `false`, `busca` (até 100, título), `ordenar` = `prazo` \| `criadaEm` \| `gravidade`, `ordem` |
| `GET /ocorrencias/minha-fila` | só paginação; a ordem é fixa (Prazo, depois Gravidade) |
| `GET /ocorrencias/:id/eventos`, `…/comentarios` | só paginação |
| `GET /dashboard` | `setor` inteiro (só Guardião), `dias` inteiro de 7 a 90 (padrão 30) |

Padrões: `ordem` é `asc` ou `desc`. Quando `ordenar` é omitido, usa-se `codinome` asc em Lanternas, `nome` asc em Usuários e `criadaEm` desc em Ocorrências. O desempate é sempre pelo `id`. Um valor fora da lista permitida é 400, nunca vira SQL.

## Parâmetros de rota

`:id` de Ocorrência, Comentário, Evento e Usuário é UUID (400 se malformado). `:id` de Lanterna é slug e o de Setor é inteiro (400 se malformado, 404 se não existir).

## Respostas

Nunca saem: `senhaHash`, `excluidaEm` de registro excluído (o registro some das listas), nem o `fontes` quando a rota é de lista (só na Ficha). `usuario` devolve `id`, `nome`, `email`, `papel`, `lanternaId`, `setorId`.
