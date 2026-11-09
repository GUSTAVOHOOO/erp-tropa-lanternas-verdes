# Especificação do seed

Versão de 2026-11-06. Diz o que o `npm run seed` do `backend/` grava e de onde cada dado vem. Entidades em [MODELO-DE-DADOS.md](MODELO-DE-DADOS.md), pesquisa em `docs/research/lanternas/` (aceita em D18).

> Decisões que moldam este seed: D25 (Setor opcional), D26 (status do Lanterna) e D27 (vínculo conta e Ficha), todas aceitas em [ESCOPO.md](ESCOPO.md).

## Princípios

1. **Idempotente.** Reexecutar não duplica: o seed faz `upsert` pela chave natural (Setor `id`, Lanterna `id`, Usuário `email`) e usa **UUIDs fixos** nas Ocorrências, Eventos e Comentários, definidos como constantes no código do seed.
2. **Nada inventado.** Dado sem fonte fica `null`, com `fontes.<campo> = { estado: "nao_verificado" }` (D14). Dado de demonstração herdado do `db.json` usa o mesmo estado `nao_verificado`; não existe terceiro estado nem grafia com espaço.
3. **Estado coerente.** Status de Lanterna, Eventos e datas obedecem às regras de [REGRAS-DE-NEGOCIO.md](REGRAS-DE-NEGOCIO.md); o seed passa pelas mesmas funções de domínio, não grava estado impossível.
4. **Datas relativas.** As datas das Ocorrências são calculadas a partir do momento da execução (tabela abaixo), para a demonstração sempre mostrar um mix de vencidas e dentro do prazo.

## Setores

| `id` | Origem | Observação |
|---|---|---|
| 0 | `db.json` | Oa, sede da Tropa e lar dos Guardiões |
| 674 | `db.json` | Inclui Bolovax Vik, planeta natal de Kilowog |
| 1417 | `db.json` | Inclui Graxos IV, planeta natal de Arisia |
| 2814 | `db.json` | Inclui a Terra; um dos mais movimentados |
| 3601 | `db.json` | Sem Lanterna designado |
| 2813 | pesquisa (Tomar-Re) | Setor vizinho ao da Terra |
| 2 | pesquisa (Hannu) | Setor de Hannu |

São **7 Setores** (a D12 previa pelo menos 8; um oitavo só existiria por invenção). Os textos dos Setores novos usam apenas o que a pesquisa verificou.

## Lanternas

25 registros: os 6 do `db.json` mais 19 da pesquisa. Regras de conversão de cada ficha de `docs/research/lanternas/grupo-*.md`:

| Campo | Regra |
|---|---|
| `id` | Slug em minúsculas, sem acento e sem apóstrofo (`ch-p`, `ke-haan`, `tomar-re`). Os 6 originais mantêm o id do `db.json` (`hal-jordan`, `guy-gardner`, `kilowog`, `salaak`...) |
| `codinome` | O nome que aparece entre parênteses em "Green Lantern (Hal Jordan)"; sem parênteses, o texto inteiro. Grafia de Salaak: `Salaak` |
| `identidadeCivil`, `especie`, `planetaNatal` | Valor verificado; senão `null`. Para os 6 originais, `especie` e `planetaNatal` vêm do `db.json` e recebem `fontes.<campo> = { estado: "nao_verificado" }` (dado de demonstração). Limites: 80, 50 e 60 caracteres. A célula pode trazer nota junto do valor (ver "Conversão da pesquisa") |
| `setorId` | Setor verificado. Os 4 originais sem Setor verificado (John Stewart, Guy Gardner, Salaak, Arisia Rrab) mantêm o do `db.json`, com `fontes.setorId = { estado: "nao_verificado" }` (dado de demonstração). Os outros 12 ficam sem Setor |
| `anoIngresso` | Só recebe valor se o **ano** estiver explícito e verificado; "Green Lantern #50, ano não verificado" vira `null`, e o texto vai para `primeiraAparicao` |
| `primeiraAparicao` | Título, número e mês/ano como na ficha, com ressalva quando a fonte diz "não confirmado". Até **300 caracteres** (D37); o texto aceito em D18 entra inteiro, sem truncamento silencioso (o maior hoje tem 138) |
| `habilidades` | Lista verificada, no máximo 10 itens de 2 a 60 caracteres; senão `[]` |
| `mentorId` | Só se o mentor verificado **também está no elenco**; senão `null`. Inserir primeiro sem mentor e atualizar depois (a FK é para a própria tabela) |
| `citacao` | Só fala real, até 15 palavras e verificada; senão `null` |
| `biografia` | O texto da ficha (já está em palavras próprias) |
| `fontes` | Por campo: `{ estado, url }` copiado da coluna Estado e Fonte da ficha |
| `status` | `ativo`, exceto o que o `db.json` já tinha (John Stewart `em_missao`, Arisia `afastado`). Depois de inserir as Ocorrências, o status é **recalculado** pela RN-20, que prevalece |

Lanterna sem Setor aparece na lista e na Ficha com "Setor não verificado"; não recebe Atribuição e não tem conta (D25).

Verificação: depois do seed, a contagem esperada é 25 Lanternas, 9 com Setor da pesquisa, 4 com Setor de demonstração e 12 sem Setor.

### Conversão da pesquisa (D37)

O seed ainda não existe. Conferência documental feita em 2026-11-09 sobre as tabelas de `docs/research/lanternas/grupo-*.md` (25 fichas), contra os limites do schema `LanternaFicha`: com `primeiraAparicao` em 300 caracteres, as 17 células preenchidas cabem. Nenhuma célula da pesquisa foi reescrita. Ao converter, o seed separa **valor**, **nota** e **fonte**: só o valor vai para a coluna, a fonte vira `fontes.<campo>.url` quando for URL HTTP(S), e a nota livre permanece na pesquisa. Células que **não podem ser copiadas literalmente** (excedem o limite ou misturam nota ao valor) e exigem extração explícita, a ser conferida pelo autor do seed contra a pesquisa aceita:

| Ficha | Campo | Célula | Extração esperada |
|---|---|---|---|
| Kilowog | `identidadeCivil` | 89 caracteres, "Não tem nome civil no excerto. Profissão anterior: …" | `null`; a profissão não é identidade civil |
| Sinestro | `identidadeCivil` | 153 caracteres, "Thaal Sinestro (nome real). A profissão não consta …" | `Thaal Sinestro` |
| Boodikka | `identidadeCivil` | 83 caracteres, "Nome real: Boodikka. Ocupação segundo a ficha …" | `Boodikka` |
| Tomar-Re, Katma Tui, Soranik Natu | `especie` | `null.` seguido de nota de 61 a 87 caracteres | `null` |
| Kilowog, Arisia Rrab, Tomar-Re, Katma Tui, Soranik Natu | `habilidades` | lista numerada com `<br>` e nota final, item único de 105 a 171 caracteres | um item por linha numerada, sem a numeração e sem a nota |
| Laira | `codinome` | frase de 79 caracteres sobre a consulta | `Laira` |
| Kyle Rayner, Salaak | `anoIngresso` | sem ano de 4 dígitos explícito | `null`; o texto vai para `primeiraAparicao` (regra da tabela acima) |

Fichas com `primeiraAparicao` que carregam ressalva na própria célula (Hal Jordan, Kyle Rayner, Jessica Cruz, Simon Baz, Katma Tui, Sinestro e outras) mantêm a ressalva dentro desse campo, porque o texto foi aceito assim em D18 e cabe nos 300 caracteres.

**Requisito do teste de seed:** depois do `npm run seed`, um teste lê as 25 Fichas, monta a forma de `LanternaFicha` (campos base e `fontes`; os derivados são calculados) e a valida contra o schema do OpenAPI, incluindo todos os limites: `codinome` ≤ 60, `identidadeCivil` ≤ 80, `especie` ≤ 50, `planetaNatal` ≤ 60, `anoIngresso` 1900–2100 ou `null`, `primeiraAparicao` ≤ 300, `habilidades` ≤ 10 itens de 2 a 60, `citacao` ≤ 15 palavras, `biografia` ≤ 1200 e `fontes` só com `estado` válido. Esse teste não existe ainda e não foi executado.

## Usuários

| E-mail | Papel | Lanterna | Senha de demonstração |
|---|---|---|---|
| `ganthet@oa.tropa` | `guardiao` | — | `guardiao123` |
| `hal@oa.tropa` | `lanterna` | `hal-jordan` | `lanterna123` |
| `kilowog@oa.tropa` | `lanterna` | `kilowog` | `lanterna123` |

Senhas gravadas com bcrypt. A tabela de contas vai no `README.md`, nunca em texto no banco. Os ids dos usuários são UUIDs fixos.

## Ocorrências

As 9 do `db.json`, com o mesmo conteúdo (título, descrição, planeta, Setor, Gravidade, envolvidos, Responsável) e as datas abaixo, contadas para trás a partir da execução. O Prazo vem da Gravidade (D9).

| Antes | Status | Gravidade | Criada há | Resolvida há | Prazo |
|---|---|---|---|---|---|
| `o1` | em andamento | crítica | 20 h | — | dentro (24 h) |
| `o2` | aberta | alta | 4 dias | — | **vencida** (3 d) |
| `o3` | resolvida | média | 10 dias | 8 dias | — |
| `o4` | aberta | baixa | 2 dias | — | dentro (14 d) |
| `o5` | em andamento | média | 8 dias | — | **vencida** (7 d) |
| `o6` | resolvida | alta | 6 dias | 5 dias | — |
| `o7` | resolvida | crítica | 3 dias | 2,5 dias | — |
| `o8` | aberta | alta | 1 dia | — | dentro (3 d) |
| `o9` | aberta | média | 6 dias | — | dentro (7 d) |

Resultado: 2 vencidas, 4 abertas ou em andamento no prazo e 3 resolvidas. Ocorrências antigas do `db.json` com Responsável e `aberta` (como a de `salaak`) mantêm o Responsável.

## Eventos e Comentários

- Cada Ocorrência recebe os Eventos que o seu estado implica: `criada` sempre; `atribuida` se tem Responsável; `status_alterado` ao entrar em andamento; `resolvida` ao resolver. Resolver não duplica `status_alterado` (D33). `autorId` é o criador ou um Guardião, e `criadoEm` respeita a ordem cronológica.
- 6 Comentários de exemplo espalhados em 3 Ocorrências, de autores do Setor correspondente, incluindo um apagado (com seu Evento `comentario_apagado`).

## Comando e verificação

- `npm run seed` no `backend/`, depois das migrations. `npm run seed -- --limpar` recria o banco de desenvolvimento (recusa rodar com `NODE_ENV=production`).
- Aceite: executar duas vezes seguidas dá a mesma contagem em todas as tabelas; `GET /lanternas` devolve 25; `GET /setores` devolve 7; `GET /dashboard` do Guardião mostra 2 vencidas.
