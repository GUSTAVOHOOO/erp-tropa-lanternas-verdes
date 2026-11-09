# DOC-03 — planos independentes e contrato de integração

**Estado:** concluída (entrega documental). **Data:** 2026-11-09. Implementação permanece suspensa; nenhuma retomada automática.
**Responsável e integração:** Codex nesta sessão; pesquisa e revisão delegadas com propriedade delimitada.
**Base:** checkout compartilhada `docs/migracao-back-end`, HEAD `148aa4f`; pacote OANET e casca UI-01 locais preservados. Nenhuma implementação funcional está autorizada por esta tarefa documental.
**Base observada posteriormente:** HEAD `949b1e8`, com `5377e39` (pacote/casca OANET) e `949b1e8` (D28 e documentos anteriores) surgidos externamente durante a sessão. Este coordenador não executou commits; o parcial continua presente e seu commit não comprova aceite. O diff documental desta tarefa continua local.
**Dependências:** decisões D1–D28, documentação atual, pesquisa primária sobre documentação para agentes.

## Objetivo e limites

Entregar instruções utilizáveis por dois desenvolvedores trabalhando separadamente: front com respostas contratuais simuladas em ambiente de desenvolvimento/teste; back com clientes de teste. A integração real é um marco separado, com provas de compatibilidade e persistência. Simulações não entram como dados reais do produto.

**Propriedade:** coordenador edita `AGENTS.md`, `README.md`, `docs/README.md`, `docs/PLANO.md`, `docs/CONTRIBUINDO.md`, `docs/UI.md`, `docs/agents/`, fontes de decisão/modelo/RN/seed/cenários/arquitetura e ponteiros em `docs/frontend/ARQUITETURA.md`, `MIGRACAO.md` e `TELAS.md`. Agente de pesquisa edita somente `docs/research/2026-11-09-documentacao-para-agentes.md`. Autor de planos possui `docs/frontend/PLANO-IMPLEMENTACAO.md`, `docs/backend/PLANO-IMPLEMENTACAO.md`, `docs/INTEGRACAO.md`. Autor de contrato possui `docs/contratos/**`, `docs/backend/API.md` e `DTOS.md`. Revisores recebem relatórios exclusivos em `docs/agents/revisoes/`.

**Mudanças compartilhadas incluídas:** documentação dos contratos em `docs/backend/API.md` e `DTOS.md`; pacote novo `docs/contratos/` com especificação, exemplos e validação documental; planos separados de front/back e integração. Esclarecimentos que afetem decisões entram em `docs/backend/ESCOPO.md`, modelo, regras RN, cenários e arquitetura, com impacto descrito. Dependências instaladas, configuração da aplicação, dados compartilhados, código funcional, commit e publicação ficam fora do escopo.

## Contexto e aceite

- Fontes canônicas: `API.md`/`DTOS.md` para semântica HTTP, regras RN para domínio, `UI.md` para visual. O pacote legível por máquina deve corresponder a essas fontes, com precedência e procedimento de mudança explícitos.
- O estado atual continua sendo Next + json-server; NestJS, JWT e novas features são destino. UI-01 está parcial, sem aceite confirmado.
- Front e back recebem tarefas com arquivos, dependências, critérios de sucesso/erro, verificações e ponto de integração.
- Todas as rotas contratuais têm entrada, saída, códigos, autenticação, nulabilidade e exemplos definidos.
- README descreve todas as pastas de documentação, finalidade, autoridade e sequência de leitura por papel.
- Pesquisa cita fontes primárias; recomendações aplicadas ficam rastreáveis.
- Revisores Claude Code/Sonnet 5.5 solicitados pelo usuário procuram falhas; disponibilidade e execução efetivas serão registradas sem substituição silenciosa. Correções delegadas recebem arquivos sem sobreposição.
- Verificação final: referências locais, consistência de contratos/exemplos/cobertura, `git diff --check`; sem declarar execução de testes de uma aplicação ainda inexistente.

## Registro de execução

- Leitura integral do handoff, instruções AGENTS e documentação de entrada; `git status --short` conferido antes de editar. Nenhuma alteração funcional realizada pelo receptor.
- Pesquisa primária delegada em background; resultado e aplicação aguardados.
- Comandos de descoberta: `rg --files docs`, leitura de API/DTO/modelo/regras/arquitetura e guias Orca, todos com exit 0.
- Claude Code instalado: `claude --version`, exit 0, `2.1.319`. Pesquisa primária identificou `claude-sonnet-5-5`; disponibilidade da conta será observada no lançamento, sem fallback silencioso.
- `python docs/agents/validar_documentacao.py` falhou (exit 1) porque `python` é alias da Microsoft Store. O arquivo provisório foi substituído por `node docs/agents/validar-documentacao.mjs`; `py -3 --version` confirmou Python 3.14.3 para o validador de contrato. Sem instalação/configuração do ambiente.
- Primeira execução do verificador de links detectou pacote contratual ainda em criação e pastas sem descrição; as descrições foram acrescentadas. A execução final será registrada após consolidação.
- Snapshot anterior à revisão externa: `py -3 docs/contratos/validar.py` aprovou 30 operações; `node docs/agents/validar-documentacao.mjs` aprovou 43 documentos, 400 links locais e 15 pastas; `git -c core.safecrlf=false diff --check` não encontrou falhas. Esses resultados não demonstram API/fake em execução.
- Pesquisa entregue, planos FE/UI/BE e integração escritos, pacote contratual disponível. Os briefs exclusivos da revisão são `revisoes/brief-contrato.md` e `revisoes/brief-planos.md`. Implementação funcional permanece suspensa.
- Revisores iniciados via Orca com recibos `state: ready`, agente `claude`, modelo `claude-sonnet-5-5`, run `run_506dd4bd209f`: contrato `ctx_e43a01822930`; planos `ctx_13ec7949d7cd`.
- Revisão dos planos recebida com sucesso: [relatório](revisoes/rodada-1-planos.md), 12 achados (3 P1, 6 P2, 3 P3). Decisões e propriedade da correção estão no [brief de correção](revisoes/brief-correcao-planos.md); a coordenação aceitou os problemas de ativação/dependências e tratou a documentação local como pré-condição de distribuição, preservando a proibição de commit desta sessão.
- Na rodada de correção de planos, o agente possui os arquivos enumerados no brief (incluindo DESIGN e planos/índices); coordenador reserva este registro, índice das revisões e o validador de links. Pacote contratual/fontes canônicas ficam fora dessa propriedade e aguardam relatório próprio.
- Revisão do contrato recebida: [relatório](revisoes/rodada-1-contrato.md), 10 achados (2 P1, 7 P2, 1 P3), sem P0. Validadores passavam, mas probes encontraram contradições não detectadas; não foi concedido aceite de contrato.
- Decisões de correção e propriedade estão no [brief de contrato](revisoes/brief-correcao-contrato.md). Liberação de responsável em andamento será422 SEM_RESPONSAVEL sem mutação; cenários terão pré-condições/requests de erro e checagens negativas permanentes. A recomendação de proibir duas atribuições válidas não foi adotada: RN-20 permite carga múltipla; corrida atribuir/afastar deve demonstrar linearizações e integridade.
- Correção dos planos foi iniciada em `ctx_3c064fe36115`, com recibo ready/claude-sonnet-5-5. Os impactos da revisão HTTP foram enviados ao mesmo agente por mailbox, preservando propriedade separada.
- Correção dos planos entregue: [rodada 2](revisoes/rodada-2-correcao-planos.md), cobrindo P-01 a P-12 e S-01 a S-06. Coordenação conferiu Corte 1/G7a-G7b, BE-FX, propriedade e registro G-1. Ajustes finais eliminaram a frase que proibia dois pedidos simultâneos válidos e esclareceram que G6 amplia detalhe existente. Fontes HTTP ainda estavam em correção; esses impactos não receberam aceite final prematuro.
- Verificador de links ampliado pela coordenação com `--ancoras`: 48 documentos,445 links locais,15 pastas,22 âncoras,0 falhas. Prova negativa temporária com âncora inexistente retornou1, e após removê-la retornou0. Cobre títulos `#` e IDs HTML locais; não é renderizador Markdown completo.
- Correção contratual foi iniciada em `ctx_aabbff7a4b71`, recibo ready/claude-sonnet-5-5; seu pacote permanece reservado até a entrega. Lacunas HTTP mencionadas no relatório dos planos são o snapshot anterior à conclusão dessa correção, não novos achados ignorados.
- Leitura cruzada dos planos pela coordenação: alinhada fixture com segundo Guardião sem Setor; seed deve validar respostas das25 Fichas contra schema de saída (preservando nulls aceitos da pesquisa); relógio injetado somente no processo de fixture monta histórico, sem parâmetro de tempo no bootstrap normal da API.
- S-03 conferido na documentação Next instalada, `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`, seção Environment Variable Load Order: `process.env` é consultado antes de `.env.*`. Não houve execução de servidor ou alteração de `.env.local` nesta tarefa.

## Pesquisa aplicada

| Recomendação da pesquisa | Aplicação concreta |
|---|---|
| Entrada curta e leitura por tarefa | AGENTS continua roteador; `docs/agents/README.md` e índices indicam gatilhos e fontes por papel |
| Uma fonte por assunto | OpenAPI para formatos; API/DTO/RN para comportamento/validação/domínio; conflito impede liberar a operação |
| Tarefa retomável e propriedade | `TAREFA.md` recebe revisão/hash e modo P/A; planos incluem arquivos, dependências e evidências futuras |
| Mock não prova integração | `INTEGRACAO.md` distingue consumidor preparado, provedor aceito e ativação real; fake só servidor/teste/desenvolvimento |
| Verificações observáveis e drift | Pacote de contrato tem exemplos/validação documental; índice tem verificador de links/pastas; testes de consumidor/provedor e E2E são tarefas futuras explícitas |

Fonte: [relatório com fontes primárias](../research/2026-11-09-documentacao-para-agentes.md). Não foi adotada dependência MSW/Pact nem um segundo formato de plano por causa da pesquisa. A entrega documental não retoma implementação automaticamente.

## Leitura cruzada e decisões finais

Correção contratual entregue e congelada em [rodada 2](revisoes/rodada-2-correcao-contrato.md): C-01 a C-10 tratados, incluindo 144 pares operação×código e 310 cenários com mundo/ajustes/request/esperado/efeitos. Planos foram alinhados ao pacote final e ao hash do conjunto, que cobre fontes narrativas e validadores além do OpenAPI.

As nove definições adicionais propostas pelo corretor na seção 3 do relatório foram **confirmadas pela coordenação** dentro do escopo de fechar contratos:

| Item | Confirmação e motivo |
|---|---|
| 1 — autor de Evento/Comentário | Resumo derivado da conta atual; o Evento mantém autorId/dados históricos imutáveis, sem prometer snapshot do nome/papel |
| 2 — Responsável inexistente | 404 na ordem específica de RN-15, depois de recusar resolvida/liberação em andamento; retorno determinístico |
| 3 — vínculo repetido/troca | Mesma Ficha ou null já aplicado é 200 sem mudança; outra Ficha substitui sob RN-07; não cria rota nova |
| 4 — atribuição sem mudança | 200 sem Evento; evita inventar mudança histórica ao repetir o mesmo valor |
| 5 — caminho/rota desconhecida | Erro usa pathname sem query; rota/método desconhecido 404 seguro, inclusive sem token, pois não há rota cujo guard executar |
| 6 — ordem textual | Usa normalização da busca e desempate por id, para consumidor e provedor terem o mesmo resultado |
| 7 — precedência do vínculo | Ficha inexistente 404 antes de papel do alvo 422, Setor 422 e exclusividade 409; a permissão do ator continua na esteira geral |
| 8 — precedência de papel | Conta 404, último Guardião 409, Setor efetivo 404/422 e incompatibilidade 422; preserva a invariante do último Guardião |
| 9 — autoria histórica | Não exigir que autor histórico ainda seja Lanterna do mesmo Setor; papel/Setor podem mudar. Autorização é exigida no momento da nova operação |

Os efeitos e precedências continuam sujeitos ao teste futuro do provedor; confirmar a definição documental não significa executar a regra. O hash histórico `f31aa1eb…2d64` do relatório da correção foi substituído no G-1 porque a coordenação atualizou o cabeçalho do README do pacote para apontar ao aceite consolidado. Os demais 11 arquivos do pacote mantiveram os hashes entregues pelo corretor.

## Entrega e verificações finais

**Resultado:** planos FE/UI e BE separados, contrato completo de destino, exemplos e cenários reproduzíveis, integração por Corte 1/aditivos e READMEs com todas as 15 pastas. Pesquisa primária aplicada. Duas revisões e duas correções Claude Code/Sonnet 5.5 concluídas; P-01…P-12 e C-01…C-10 tratados. Nenhum P0/P1 identificado permanece aberto; G-1 registra o aceite técnico documental e a revisão a consumir.

| Verificação executada pela coordenação, na raiz | Resultado e alcance |
|---|---|
| `py -3 -B docs/contratos/validar.py --hash` | exit 0; 30 operações, 310 cenários; hash do conjunto e OpenAPI registrados em [G-1](../INTEGRACAO.md#g-1--aceite-do-contrato) |
| `py -3 -B -m unittest discover -s docs/contratos -p "test_*.py"` | exit 0; 120 testes em 29,278s; prova das validações e mutações documentais cobertas |
| `node docs/agents/validar-documentacao.mjs --ancoras` | exit 0; 49 documentos, 469 links locais, 15 pastas, 29 âncoras; prova negativa de âncora inválida também executada |
| `py -3 -B docs/contratos/validar.py --conferir-hash cd91fef5a43bb239a67be5bbc1a942caedda7129bb268da7dbfdd0632b9a4730` | exit 0 após registrar o G-1 e alinhar os planos; conjunto congelado corresponde ao aceite |
| `git -c core.safecrlf=false diff --check` | exit 0; sem erro de whitespace |
| `git diff --name-only -- app components lib __tests__ db.json package.json package-lock.json next.config.ts` | saída vazia sobre HEAD 949b1e8; aplicação, dados e dependências preservados nesta DOC-03 |

**Limites/pendências de execução:** NestJS, fake HTTP, fixture BE-FX e novos scripts de aplicação ainda são planejados. Não foram executados API, bcrypt, banco, concorrência, agregações, integração real, build/lint/testes da aplicação nem aceite visual UI-01 nesta tarefa documental. Validador não é implementação integral OpenAPI/JSON Schema. Resultados de mocks/provedor/integração serão provas separadas na implementação.

**Integração/distribuição na conclusão documental:** alterações ainda eram locais, inclusive novos documentos. HEAD 949b1e8 foi observado após commits externos anteriores; até esse momento, este coordenador e os agentes da DOC-03 não tinham feito commit/push. A etapa de publicação posterior está registrada abaixo. Próximo passo da implementação exige atribuição explícita de tarefa; não reabrir a UI automaticamente.

## Publicação autorizada depois do aceite

O usuário solicitou explicitamente subir todo o trabalho para o Git para entregar aos devs. Essa instrução inclui commit e push dos arquivos novos e modificados da DOC-03, ampliando o escopo inicial de entrega local. Destino: `origin`, repositório `GUSTAVOHOOO/erp-tropa-lanternas-verdes`, branch `docs/migracao-back-end`. A autorização não inclui merge em outra branch nem retomada da implementação.

Antes da publicação: `git fetch origin` exit 0, branch local/remota sem divergência (0/0); hash G-1 confirmado; verificação de links/pastas/âncoras exit 0; testes documentais repetidos com exit 0 (120 testes em 29,405s). Os arquivos preparados são conferidos no índice antes do commit. O commit da entrega e seu resultado de push são verificáveis no histórico dessa branch; a mensagem final informa o identificador observado.
