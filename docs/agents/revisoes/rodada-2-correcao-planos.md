# Rodada 2 — correção dos planos (DOC-03)

**Data:** 2026-11-09. **Escopo:** correção dos achados P-01 a P-12 e das sugestões S-01 a S-06 de [rodada-1-planos.md](rodada-1-planos.md), mais os impactos da revisão do contrato comunicados pela coordenação. **Modelo:** o ambiente declara Claude Sonnet 5.5 (`claude-sonnet-5-5`); é declaração do ambiente, sem recibo independente. **Nada foi implementado:** só documentação; sem commit, push, instalação, build ou teste de aplicação. O relatório da rodada 1 não foi editado.

## Verificações executadas (raiz da checkout, depois de todas as edições)

| Comando | Resultado | Limite |
|---|---|---|
| `node docs/agents/validar-documentacao.mjs` | exit 0: 47 documentos, 444 links locais, 15 pastas, 0 falhas | Confere destinos de arquivo e pastas. **Não confere âncoras** (`#...`) nem caminhos entre crases. |
| `py -3 docs/contratos/validar.py` | exit 0: 30 operações, referências internas, exemplos e fixtures | Validador documental; mede coerência do pacote como está, não a adoção das decisões da rodada 2 do contrato (ver “Lacunas nas fontes”). |
| `git -c core.safecrlf=false diff --check` | exit 0 | Só whitespace. |
| `grep -rnE "começar agora\|imediatamente\|comece pelo\|pode começar agora" AGENTS.md DESIGN.md docs/agents/*.md docs/frontend` | sem resultado | Teste de aceite de P-03. |

Âncoras que escrevi e conferi só por regra de slug, sem ferramenta: `INTEGRACAO.md#g-1--aceite-do-contrato`, `#2-preparar-sem-esperar-o-outro-dev`, `#3-matriz-de-recursos-e-gates`, `#4-fixtures-identidade-e-testes-de-escrita`, `#1-fontes-e-papéis`; `PLANO-IMPLEMENTACAO.md` do front `#ui-0200--componentes-compartilhados-antes-de-qualquer-rota` e `#procedimento-canônico-de-remoção`; do back `#be-fx--fixture-de-integração-somente-de-teste`. Nenhuma ferramenta as validou.

## Achados

| ID | Decisão | Onde foi corrigido | Evidência | Limite ou pendência |
|---|---|---|---|---|
| **P-01** | Corte 1 único, sem adaptador legado nem publicação intermediária. G1–G5 e G7a são provas P/B; A é registrado uma vez, para o conjunto. G6, G7b (fila) e G8 são aditivos. | `INTEGRACAO.md` §3 (subseção “Corte 1”, tabela com coluna “Ativa junto com”, tabela rota→operação→gate); `PLANO.md` (grafo, texto do grafo, divisão, FE-01/02, marcos M1–M4); `frontend/PLANO-IMPLEMENTACAO.md` (“Primeiro corte integrado e aditivos”); `backend/PLANO-IMPLEMENTACAO.md` (“Entrega ao Corte 1”). FE-07 virou FE-07a e FE-07b; G7 virou G7a e G7b. | Toda rota existente com dados aparece na tabela de §3 com operação real. O dashboard não calcula a partir da lista paginada (FE-07a). | Nome do gate, IDs `FE-07a/b`, `G7a/b`, `BE-FX` são novos e sincronizados em PLANO, INTEGRACAO, FE e BE; nada executado. |
| **P-02** | G2/FE-02 exigem BE-05 (leitura pública de Setores); o cadastro carrega `GET /setores` no servidor e testa erro e vazio. O back testa o cadastro por persistência. | `INTEGRACAO.md` §3 (G2), `frontend/PLANO-IMPLEMENTACAO.md` FE-02, `backend/PLANO-IMPLEMENTACAO.md` BE-05/BE-07a/BE-03, `PLANO.md` BE-05 e FE-02. | G2 lista BE-05; FE-02 tem os dois testes de origem. | — |
| **P-03** | Instruções operacionais de começar já viraram histórico atribuído no tempo, com remissão ao plano e dependência da autorização do usuário. | `AGENTS.md` (UI oficial), `DESIGN.md` (nota inicial), `frontend/MIGRACAO.md` (cabeçalho e “Ordem sugerida”), `agents/HANDOFF-OANET.md` (aviso de histórico, receptor, “Primeiro incremento”, fecho), `docs/README.md` (linha da tabela), `agents/README.md`, `agents/MAPA.md`, `PLANO.md`. | grep de aceite sem resultado. D28 permanece válido e não é pedido de novo (dito no handoff e nos planos). | A ordem de leitura do handoff continua oferecendo contexto histórico, agora marcado como tal. |
| **P-04** | Um dev front, posse por arquivo em sequência: UI-01 → UI-02.00 → linha UI → tarefa FE. Preparação sem UI (FE-00/01, `lib/`, fake) pode avançar antes; páginas entram na branch de preparação por rebase explícito. | `frontend/PLANO-IMPLEMENTACAO.md` (“Sequência de posse por arquivo”, com tabela; “Depende” de FE-02 a FE-08); `INTEGRACAO.md` §6; `PLANO.md`. A frase de G0 que contradizia FE-03 foi reescrita (UI-02 não bloqueia a preparação de HTTP, mas FE assume arquivo só depois da UI). | Cada FE que toca página/formulário cita a linha UI-02.xx. | Regra de processo; não há ferramenta que a imponha. |
| **P-05** | UI-02.00 com inventário completo (sem curinga), destino e dono. | `frontend/PLANO-IMPLEMENTACAO.md` (“UI-02.00”), `PLANO.md`, `agents/MAPA.md`. Linhas UI-02.11/12 ajustadas (componentes de estado passam a UI-02.00; `alert`, `Emblema` removidos em UI-02.12). | Inventário de 2026-11-09 feito por `import` em `app/` e `components/` e por testes em `__tests__/`: 18 componentes de `components/` e 10 de `components/ui/`. | `Marca.tsx` e `MenuNavegacao.tsx` não têm importador em `app/` ou `components/` (só testes); a remoção como superados pela casca é decisão minha, a confirmar na execução com o grep já descrito. `CampoSelect` e `EsqueletoLista` não têm teste direto; o plano manda criá-los. |
| **P-06** | G-1 “aceite do contrato”: coordenador/integrador preenche versão, SHA-256 e evidências; sem P0/P1; validadores com exit 0. A dupla registra ciência. | `INTEGRACAO.md` §2 (G-1, tabela de registro); `TAREFA.md` (campo de ciência); FE-00, BE-01, FE e BE “Entrada”; `PLANO.md`; `agents/README.md`. | Registro com campos `pendente`. | **O hash não foi preenchido e não deve ser nesta rodada:** o contrato ainda está em correção por outro agente. Nenhuma assinatura foi escrita por terceiros. |
| **P-07** | BE-FX: fixture somente de teste, comando `npm run fixture:integracao`, arquivos próprios, ids e manifesto, entregue em etapas a–e junto de BE-07a, 07b, 08, 09 e 10; sem endpoint de bootstrap. Relógio exato no teste do provedor; E2E com margem de pelo menos 1 hora. | `INTEGRACAO.md` §4 e §7; `backend/PLANO-IMPLEMENTACAO.md` (seção BE-FX e linhas em cada BE); `PLANO.md`; FE-10; `TAREFA.md`. | Tabela de etapas por gate; manifesto sem senha nem token. | Comando e arquivos são planejados; nada existe. A margem de 1 hora é minha escolha de projeto (qualquer margem segura serve). |
| **P-08** | Um procedimento canônico em FE-09, referenciado de PLANO e INTEGRACAO. | `frontend/PLANO-IMPLEMENTACAO.md` (“Procedimento canônico de remoção”: escopo, PowerShell, ripgrep opcional, `npm ls json-server --all`, menções permitidas); `PLANO.md` FE-09; `INTEGRACAO.md` §7. | Os outros dois documentos só apontam; a regex antiga não aparece mais. | Os comandos PowerShell não foram executados aqui (não há remoção a verificar). `npm ls` pode sair com exit 1 quando o pacote está ausente, e isso é sucesso. |
| **P-09** | Pré-condição para distribuir trabalho: base comum com todos os entregáveis da DOC-03, por commit autorizado ou pacote com não rastreados, verificado no destino. Assets OANET já estão no HEAD. | `INTEGRACAO.md` §2; `agents/README.md` (parágrafo de worktrees); `frontend/PLANO-IMPLEMENTACAO.md` UI-01. | Lista de caminhos locais e verificações (validadores com exit 0, SHA-256 igual ao G-1). | **Os entregáveis seguem locais e sem commit** (`git status` acima); isso não é falha desta entrega, mas bloqueia a distribuição até a base ser montada. |
| **P-10** | Evento `atribuida` explícito em atribuir, reatribuir e liberar, com teste de rollback. | `backend/PLANO-IMPLEMENTACAO.md` BE-09 (bullet e aceite); `PLANO.md` BE-09; `INTEGRACAO.md` G5; FE-05 e FE-06. | O aceite agora cobre falha injetada no Evento de atribuição. | Os casos correspondentes **não existem** em `CENARIOS-DE-TESTE.md` (ver abaixo). |
| **P-11** | Layouts reais e teste da casca nomeados, edição sequencial pelo dev front. | `frontend/PLANO-IMPLEMENTACAO.md` (tabela de posse, FE-02, FE-07b, FE-08); `frontend/TELAS.md` (Navegação). | `app/(site)/layout.tsx`, `app/(painel)/layout.tsx` e `__tests__/components/casca-oanet.test.tsx` aparecem nas três tarefas com o teste “links por papel”. | — |
| **P-12** | Depois do Corte 1, G8 já tem Ocorrências; os dois casos históricos entram na fixture. Prova antecipada só B. | `INTEGRACAO.md` §3 (G8) e §4 (linha “Histórico para gestão”); FE-08; BE-FX etapa d. | A fixture inclui Ocorrência resolvida e excluída ligadas a Setor e Lanterna. | — |
| **S-01** | Roteiro visual em todo gate A. | `INTEGRACAO.md` §3 (parágrafo inicial) e §6; FE-10. | — | — |
| **S-02** | Rollback proporcional à demonstração integrada; sem produção inventada. | `INTEGRACAO.md` §8 (cópia do arquivo SQLite, voltar à combinação anterior). | — | Procedimento planejado, não ensaiado. |
| **S-03** | Variáveis no ambiente do processo, sem editar `.env.local`. | `INTEGRACAO.md` §1 e §4 (exemplo PowerShell); `agents/README.md`; plano FE. | — | Afirmação de que o ambiente do processo prevalece sobre `.env*` é comportamento conhecido do Next, mas **não foi verificado nos guias locais** desta instalação. Conferir na execução. |
| **S-04** | Dono único de `package.json`/lock/config/db: dev front em FE-00 e FE-09. `.env.example`, `AGENTS.md`, README e mapa: integrador (§1), com lista de mudanças entregue pelo dev front. | `INTEGRACAO.md` §1; `frontend/PLANO-IMPLEMENTACAO.md` (Propriedade e FE-09). | Os dois documentos agora dizem o mesmo. | — |
| **S-05** | `npx playwright install chromium` planejado em FE-00, com autorização registrada. | `frontend/PLANO-IMPLEMENTACAO.md` FE-00; `INTEGRACAO.md` §7; `PLANO.md` FE-00. | — | Passo planejado. |
| **S-06** | `__tests__/lib/sessao.test.ts` entra nos arquivos de FE-02; `podeAcessarSetor` e `setorParaFiltro` migram para `lib/escopo.ts` (novo) com `__tests__/lib/escopo.test.ts`. `MIGRACAO.md` alinhado. | `frontend/PLANO-IMPLEMENTACAO.md` FE-02; `frontend/MIGRACAO.md`. | O código atual usa os dois helpers em `actions.ts` e em três páginas. | O nome `lib/escopo.ts` é proposta minha; a tarefa pode escolher outro, desde que registre. |

## Impactos da revisão do contrato (mensagem da coordenação)

| Impacto | Linha dos planos que o absorve |
|---|---|
| Liberar responsável de Ocorrência em andamento = 422 `SEM_RESPONSAVEL`, sem mutação | `backend/PLANO-IMPLEMENTACAO.md` BE-09 (regra e aceite); `PLANO.md` BE-09; FE-05 (tela mostra o motivo) |
| Busca literal sem caixa nem acento (usuários nome/e-mail, lanternas codinome, ocorrências título), colunas internas normalizadas | BE-02 (colunas e manutenção nas escritas), BE-04, BE-06, BE-08; FE-03/FE-04/FE-08 (texto enviado como digitado) |
| Senha: máximo em bytes, erro 400 no campo `senha`, também no login | BE-03; FE-02 (schemas de cadastro e login) |
| `primeiraAparicao` com limite ampliado | BE-07b (validação das 25 Fichas no teste do seed); FE-03 |
| Novo 422 `VINCULO_NAO_PERMITIDO`; `null` desvincula | BE-04 (regra e aceite); FE-08 |
| Média em horas arredondada; nulos de ordenação ao fim | BE-11; BE-06; FE-07a; FE-03 |
| Corrida atribuir versus afastar: duas linearizações válidas, sem limite de uma atribuição por Lanterna | BE-09 (aceite) |

Os planos não copiam valores nem schemas: apontam para o OpenAPI e para as fontes, e mandam a operação aguardar a fonte se ela ainda não os trouxer.

## Lacunas nas fontes canônicas (fora da minha propriedade; para o coordenador)

Conferido por busca de texto em 2026-11-09:

- **`VINCULO_NAO_PERMITIDO`** não aparece em `openapi.json`, `API.md`, `DTOS.md`, `REGRAS-DE-NEGOCIO.md`, `CENARIOS-DE-TESTE.md`, `MODELO-DE-DADOS.md` nem `ESCOPO.md`.
- **`x-max-bytes`** não aparece em nenhum deles; o limite de senha em bytes ainda não está no contrato.
- **`primeiraAparicao`** continua com `maxLength` 120 no OpenAPI (`LanternaFicha`, `LanternaCriacao`, `LanternaEdicao`); a ampliação ainda não foi aplicada.
- **Evento `atribuida`** existe em `openapi.json`, `API.md` e `MODELO-DE-DADOS.md`, mas **não** em `REGRAS-DE-NEGOCIO.md` (RN-40 só cita “atribuição”) nem em `CENARIOS-DE-TESTE.md`. Falta, para o aceite de BE-09 ser verificável: cenários de atribuir, reatribuir, liberar aberta (com `de`/`para` e `null`), liberar em andamento (422 `SEM_RESPONSAVEL` sem Evento) e rollback com falha injetada no Evento de atribuição.
- `SEM_RESPONSAVEL` aparece em API, RN, cenários e OpenAPI, mas não confirmei que a regra “liberar em andamento” esteja escrita.

Enquanto essas fontes não mudarem, os planos referenciam decisões que o contrato ainda não registra. O aceite G-1 deve ser dado só depois delas.

## Pendências reais

- **Hash G-1 vazio por desenho.** O coordenador o preenche quando o contrato estiver congelado.
- **Lacunas nas fontes acima.**
- **Âncoras não validadas** por ferramenta (o validador só confere arquivos).
- **Entregáveis da DOC-03 locais**, sem commit; a base comum precisa ser montada antes de distribuir tarefas.
- **Nada foi implementado ou executado** além dos validadores documentais. Os comandos novos (`fixture:integracao`, `test:e2e`, `npx playwright install chromium`, o procedimento de remoção) são planejados.
- **Marcas de decisão minhas**, a revisar: destino de `Marca.tsx` e `MenuNavegacao.tsx` (remoção), nome `lib/escopo.ts`, margem de 1 hora na fixture, FE-07a/FE-07b e G7a/G7b como novos IDs.

## Arquivos editados nesta rodada

`AGENTS.md`, `DESIGN.md`, `README.md`, `docs/README.md`, `docs/PLANO.md`, `docs/CONTRIBUINDO.md`, `docs/INTEGRACAO.md`, `docs/agents/{README,MAPA,TAREFA,HANDOFF-OANET}.md`, `docs/frontend/{PLANO-IMPLEMENTACAO,ARQUITETURA,MIGRACAO,TELAS}.md`, `docs/backend/{PLANO-IMPLEMENTACAO,ARQUITETURA}.md`, e este relatório. `docs/UI.md` estava na lista de propriedade e não precisou de mudança.
