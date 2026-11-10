# Documentação para agentes e desenvolvimento independente de front/back

Pesquisa realizada em **2026-11-09**. Escopo: instruções de repositório, contexto sob demanda, tarefas executáveis, contratos e verificação de integração. Este relatório propõe melhorias; não cria decisões do grupo, instala ferramentas ou altera contratos.

**Recorte temporal:** o levantamento local abaixo antecede as alterações da tarefa DOC-03. Na revisão do relatório, em 2026-11-09, conferi no cabeçalho do [handoff OANET](../agents/HANDOFF-OANET.md) que a implementação está suspensa enquanto planos, contratos e revisão documental da DOC-03 são consolidados. As descrições históricas desse handoff não autorizam retomar sua implementação; conferir o estado vigente antes de executar qualquer tarefa.

## Conclusão para este projeto

**Recomendação inferida:** conservar a entrada compartilhada existente e investir primeiro em contratos verificáveis e tarefas retomáveis. O projeto já separa instruções, mapa, decisões, UI e destino da API. O maior ganho provável não está em produzir mais arquivos: está em permitir que alguém encontre o contrato certo, implemente uma parte sem disputar arquivos e demonstre que o resultado combina com os consumidores reais.

Não há evidência nesta pesquisa para prometer qualidade por quantidade de linhas, número de documentos ou uso de uma ferramenta. Recomendações de fornecedores são orientações operacionais, não uma avaliação experimental deste repositório.

## Base local conferida

Leitura inicial feita em 2026-11-09, antes das alterações DOC-03 e sem edição destes arquivos pelo responsável pela pesquisa:

- [AGENTS.md](../../AGENTS.md) encaminha às skills canônicas, ao fluxo de agentes e à UI OANET. [CLAUDE.md](../../CLAUDE.md) importa `@AGENTS.md`.
- [Guia dos agentes](../agents/README.md), [mapa](../agents/MAPA.md) e [modelo de tarefa](../agents/TAREFA.md) já exigem escopo, propriedade por arquivo, dependências, aceite e evidências. O mapa descreve o atual e avisa sobre a migração.
- [Índice](../README.md) distingue documentos atuais, de destino e históricos. [UI.md](../UI.md) é a fonte visual oficial D28; [handoff OANET](../agents/HANDOFF-OANET.md) explica trabalho parcial e o próximo incremento.
- [package.json](../../package.json) declara Next `16.4.0`, React `19.3.0`, Vitest e json-server. A consulta `Test-Path -LiteralPath 'backend'` retornou `False`: NestJS ainda é destino nesta checkout.
- [API.md](../backend/API.md) e [DTOS.md](../backend/DTOS.md) documentam o destino: envelopes, permissões, códigos, corpos, queries e limites. [MIGRACAO.md](../frontend/MIGRACAO.md) distingue adoção visual de migração de dados/sessão e condiciona esta última à API correspondente verificada.
- As skills [frontend-web](../../.claude/skills/frontend-web/SKILL.md) e [backend-api](../../.claude/skills/backend-api/SKILL.md) são regras locais. A primeira estabelece chamadas à API pelo servidor Next; isso deve orientar onde testar/mocar HTTP.

Essas observações não equivalem a uma auditoria completa de implementação. Não executei build, lint ou testes da aplicação para esta pesquisa documental.

## Achados em fontes primárias

Todas as fontes desta seção foram consultadas em **2026-11-09**. Cada recomendação de aplicação é uma inferência para o repositório, separada do fato externo.

| Tema | O que a fonte estabelece | Aplicação recomendada, inferida |
|---|---|---|
| Entrada para agentes | `AGENTS.md` é Markdown sem campos obrigatórios; o projeto do formato o apresenta como complemento ao README para contexto, comandos e convenções de agentes. [AGENTS.md](https://agents.md/) | Conservar README para apresentação/uso humano e AGENTS como roteador operacional. Evitar duplicar integralmente arquitetura e regras nas duas entradas. |
| Descoberta no Codex | Codex combina orientação global e arquivos da raiz até o diretório de trabalho; há prioridade de `AGENTS.override.md`, limite configurável de bytes e precedência das instruções mais próximas. A documentação sugere verificar o que foi carregado. [OpenAI: AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) | Não presumir que uma instrução aninhada foi carregada só porque o agente edita um arquivo descendente. Informar a leitura necessária na tarefa e validar a descoberta no host utilizado. |
| Claude e compatibilidade | A documentação atual oferece leitura nativa de `AGENTS.md` desde Claude Code `2.1.277`, com condições de seleção quando também existe CLAUDE. A importação `@path` continua suportada. Imports carregam o conteúdo junto ao arquivo importador. [Anthropic: memória](https://code.claude.com/docs/en/memory) | Manter o `@AGENTS.md` existente enquanto houver diferentes versões/hosts; testar o carregamento antes de simplificar. Um link Markdown não deve ser tratado como import automático. |
| Contexto sob demanda | Skills do Codex expõem inicialmente nome e descrição; o conteúdo completo de `SKILL.md` é lido quando a skill é selecionada. [OpenAI: skills](https://learn.chatgpt.com/docs/build-skills) | Continuar com entrada → mapa/skill → referência pertinente. Não importar todos os guias e históricos em CLAUDE: organização em arquivos, sozinha, não significa economia de contexto. |
| Instruções verificáveis | Anthropic recomenda instruções concretas, consistentes e auditadas; trata CLAUDE como contexto, não configuração que impõe comportamento. [Anthropic: memória](https://code.claude.com/docs/en/memory) A página de boas práticas recomenda fornecer uma verificação executável com resultado observável. [Anthropic: boas práticas](https://code.claude.com/docs/en/best-practices) | Escrever “execute comando X e registre resultado” e “fonte Y governa Z”. Deixar lint/contratos/testes verificarem propriedades que podem ser automatizadas. |
| Planos duráveis | O cookbook atual descreve planos como convenção opcional. [OpenAI: workflows](https://developers.openai.com/cookbook/examples/codex/iterating-development-workflows-with-codex#agents-and-plans) A receita de ExecPlans, **marcada como arquivada**, sugere contexto suficiente para retomada, marcos observáveis, decisões e evidências atualizadas. [OpenAI: ExecPlans](https://developers.openai.com/cookbook/articles/codex_exec_plans) | Adaptar essas ideias ao `TAREFA.md` e ao plano existentes. Não introduzir um `PLANS.md` concorrente nem copiar recomendações de modelos/APIs da receita arquivada. |
| Contrato estruturado | OpenAPI descreve interfaces HTTP de forma independente da linguagem; a especificação prevê operações, parâmetros, corpos, respostas e schemas. A publicação apontada como mais recente na consulta é `3.2.1`; `3.1.2` também está publicada. [OAS atual](https://spec.openapis.org/oas/v3.2.1.html), [OAS 3.1.2](https://spec.openapis.org/oas/v3.1.2.html) | Avaliar contrato legível por máquina como evolução de API/DTOs; escolher versão suportada pelas ferramentas reais do projeto, sem adotar automaticamente a versão mais nova. |
| Geração no Nest | `@nestjs/swagger` gera a descrição a partir de decorators; `SwaggerModule.createDocument()` produz um objeto serializável que pode ser salvo como JSON/YAML. [NestJS: OpenAPI](https://docs.nestjs.com/openapi/introduction) | Quando o backend existir, comparar o documento gerado com o contrato acordado. A geração, isoladamente, não demonstra que a implementação atende à intenção acordada. |
| Mocks reutilizáveis | MSW intercepta rede em browser e Node e permite reutilizar handlers. [MSW: introdução](https://mswjs.io/docs/) No Node, `setupServer` atua no processo corrente; o guia cobre início, reset entre testes e encerramento. [MSW: Node](https://mswjs.io/guides/integrations/node) | Se houver adoção explícita, testar o cliente HTTP do servidor Next no processo correto. Um worker no navegador não demonstra a interceptação das chamadas feitas pelo servidor. |
| Drift de mocks | O guia oficial MSW recomenda usar especificação compartilhada e explica que mocks congelados podem ficar obsoletos. [MSW: drift](https://mswjs.io/guides/recipes/preventing-mock-drift) | Validar fixtures/handlers contra contrato versionado e observar mudanças no mesmo trabalho; não atualizar snapshots automaticamente para esconder divergência. |
| Contrato versus integração | Pact distingue descrição estática e exemplos executados. Testes apenas do provedor contra seu schema não verificam como o consumidor o chama. [Pact: introdução](https://docs.pact.io/) No fluxo Pact, o consumidor exercita requisições e a verificação do provedor reproduz interações contra a implementação, com estados prévios controlados. [Pact: funcionamento](https://docs.pact.io/getting_started/how_pact_works) | Começar com poucos exemplos compartilhados e verificação dos dois lados. Avaliar Pact se compatibilidade entre entregas independentes justificar seu custo; não instalá-lo apenas por existir trabalho paralelo. |

## Recomendações concretas para o próximo plano

As propostas abaixo são **inferências**, sujeitas a escopo e decisão do grupo. Não representam funcionalidades já implementadas.

### 1. Definir o que cada fonte governa

Preservar a divisão atual e torná-la explícita no índice, sem repetir os conteúdos:

| Fonte | Autoridade proposta |
|---|---|
| `AGENTS.md` / `CLAUDE.md` | Entrada e encaminhamento; regras transversais indispensáveis. |
| Skills front/back | Procedimentos e padrões técnicos do respectivo lado. |
| `docs/backend/ESCOPO.md` e ADRs | Decisões e razões; alterações exigem decisão identificada. |
| `docs/backend/API.md` | Comportamento HTTP acordado: rota, método, acesso, status, envelope e erros. |
| `docs/backend/DTOS.md` | Formatos e limites de entrada; complementar API, evitando repetir tabelas divergentes. |
| `docs/UI.md` | Direção visual oficial OANET, componentes/assets e critérios visuais. |
| `docs/agents/MAPA.md` e código | Navegação para arquivos; assinatura implementada precisa ser conferida no código. |
| `docs/PLANO.md` e registro de tarefa | Ordem e dependências; tarefa concreta possui arquivos, aceite e evidências. |
| Handoffs e pesquisas datadas | Transferência e evidência histórica; não substituem decisões nem estado atual confirmado. |

Se API e DTOs divergem, registrar a divergência e resolvê-la na tarefa do contrato antes de liberar consumidores. Uma fonte canônica representa acordo; não torna automaticamente correta uma implementação divergente, nem autoriza ignorar o comportamento atual durante a migração.

### 2. Liberar trabalho paralelo por fronteira estável

Usar o modelo de tarefa existente com: base/estado local; arquivos atribuídos; responsável pela integração; contrato necessário; alteração incompatível ou compatível; comandos e observações de aceite. Acrescentar, quando necessário, **próximo passo executável** e **recurso compartilhado reservado** (CSS global, cliente HTTP, configuração, porta ou fixture).

Para front/back independentes, aprovar primeiro uma fatia HTTP pequena. Cada fatia precisa definir request e response completos, erros relevantes, dados prévios e consumidor responsável. A frente de apresentação pode trabalhar sobre props tipadas OANET enquanto domínio/serviços trabalham na fronteira HTTP; uma única tarefa deve possuir o arquivo compartilhado.

A independência não elimina dependências: a integração real da API continua condicionada ao backend verificado, conforme `MIGRACAO.md`. Desenvolvimento contra contrato pode antecipar trabalho e testes, sem mudar esse critério de integração.

### 3. Criar contrato executável de forma incremental

Primeira candidata: login e leitura de usuário (`POST /auth/login`, `GET /auth/me`) ou uma listagem pública, escolhida pelo próximo marco. Registrar exemplos que incluam sucesso, formato inválido e erro de acesso pertinente. Para login, conferir `expiresIn`, papel/setor e o código estável de credenciais inválidas; não fabricar sessão na UI.

Antes de adicionar OpenAPI/geradores, definir uma única direção de manutenção:

- **Contrato primeiro:** arquivo estruturado acordado é a fonte do formato HTTP; implementação e documentação derivada são verificadas contra ele.
- **Código primeiro:** documento gerado é comparado com exemplos/aceite aprovados e publicado como artefato revisado; o gerado não muda silenciosamente o acordo.

Manter texto narrativo para decisões e regras que não cabem no schema. Não manter três definições independentes dos mesmos campos em API, DTOs e YAML. Introdução de dependência, script, artefato gerado ou CI deve entrar explicitamente no escopo, como exige AGENTS.

### 4. Distinguir o que cada verificação prova

| Verificação proposta | Evidência obtida | Limite |
|---|---|---|
| Fixture validada pelo schema do contrato | O exemplo tem o formato acordado. | Não prova resposta da API real. |
| Cliente Next contra mock HTTP | O cliente emite/trata o cenário testado; inclui envelope e códigos. | Não prova backend, cookie, navegação ou persistência reais. |
| API Nest contra contrato/exemplos e banco isolado | O provedor responde ao cenário com estado controlado. | Não prova que o front usa corretamente a API. |
| Front + API reais no estado integrado | Sessão, autorização, leitura/escrita e atualização observadas no fluxo escolhido. | Só cobre os cenários exercitados. |
| Inspeção UI OANET | Estados, teclado/foco, móvel/desktop e movimento no fluxo. | Não prova contrato HTTP. |

O guia Next instalado informa que Vitest não suporta Server Components assíncronos e recomenda E2E para eles; portanto, teste de serviço simulado não deve receber o rótulo de fluxo completo. Fonte local consultada em 2026-11-09: [guia Vitest do Next instalado](../../node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md).

Manter dados demonstrativos OANET separados de fixtures de contrato. Para escrita real, continuar com cópia isolada de `db.json` e, no destino, banco próprio por tarefa. Fixtures devem declarar cenário, pré-condição, origem do contrato e determinismo de IDs/datas quando relevante; sucesso e erros devem usar o mesmo acordo.

### 5. Reduzir drift e tornar o handoff retomável

Para cada mudança de contrato, conferir na mesma tarefa: API/DTOs → exemplos/schemas → serviço consumidor → implementação do provedor → verificações afetadas. No destino, automatizar validação do documento, dos exemplos e das respostas reais. Divergência deve falhar de forma legível; aprovação manual de um snapshot não basta.

Para mudanças em rotas, componentes ou procedimentos, atualizar mapa/guia afetado sem espalhar resultados transitórios neles. Guardar resultado datado no registro de tarefa: comando, diretório, código de saída, resultado e limite. “Build passou” precisa indicar qual estado foi verificado; testes de duas branches separadas não demonstram a combinação.

O handoff deve fechar com: estado observado e data; arquivos locais ainda sem commit; responsáveis; contratos pendentes; processos/portas da tarefa; verificações já feitas e faltantes; primeiro comando/cenário de retomada. O receptor confere a checkout antes de agir. Preservar no handoff OANET a distinção entre laboratório demonstrativo, casca migrada e fluxos reais.

## Limitações e validação desta pesquisa

- Foram usadas páginas oficiais abertas, além de arquivos locais. Guias de produtos mudam: não foi verificada a versão instalada de Claude Code/Codex nem o comportamento de todos os hosts. A compatibilidade deve ser confirmada no ambiente de execução.
- ExecPlans é referência histórica explicitamente arquivada. Não usei sua indicação de modelo nem tratei o formato como requisito do Codex.
- As fontes estabelecem mecanismos e práticas; não medem qual organização documental melhora o desempenho dos agentes deste projeto. Não foi conduzido experimento comparativo.
- Não foi auditada a completude de todos os DTOs de saída, regras ou testes existentes. As fatias sugeridas exigem conferir arquivos atuais e aceite antes da implementação.
- Comandos locais executados: leituras com `Get-Content`; descoberta com `rg --files`; `Test-Path` de `backend` (`False`). Leituras/discovery concluíram com código 0. Na revisão, `Get-Location` confirmou `C:\Users\Windows 11\Documents\Desenvolvimento web\TrabalhoWeb`; `git status --short` nesse diretório mostrou arquivos modificados (incluindo README, guias dos agentes e documentos de domínio) e não rastreados (DOC-03, revisões e este relatório). Não se afirma checkout limpa. Esta entrega modifica somente este relatório; alterações simultâneas de outros responsáveis foram preservadas.
- Algumas URLs exploratórias antigas de skills/setup-server retornaram 404; as conclusões usam as páginas atuais abertas e vinculadas acima. Nenhuma instalação ou teste de compatibilidade das ferramentas propostas foi executado.

## Critério sugerido de aceite da melhoria documental

**Inferência:** pedir a um responsável novo para localizar a fonte de uma regra, encontrar o arquivo atual, montar uma tarefa sem sobreposição, executar uma verificação adequada e retomar um handoff sem depender da conversa anterior. Registrar onde houve ambiguidade e corrigir a fonte responsável. Esse exercício verifica utilidade melhor que uma meta arbitrária de tamanho de arquivo.
