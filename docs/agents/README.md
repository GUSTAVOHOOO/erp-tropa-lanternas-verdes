# Desenvolvimento com agentes

Este guia organiza tarefas neste projeto (front-end Next.js e back-end NestJS integrados). `AGENTS.md` é a entrada compartilhada;
`CLAUDE.md` aponta para ela. Os papéis abaixo distribuem trabalho entre pessoas
ou agentes; os arquivos de documentação não iniciam processos nem agentes.

## Leitura por tarefa

Use [docs/README.md](../README.md) como índice, carregando as referências quando o assunto exigir. A pesquisa que orientou esta organização está em [documentação para agentes](../research/2026-11-09-documentacao-para-agentes.md).

| Sua tarefa | Contexto a carregar | Saída verificável |
|---|---|---|
| Planejar ou distribuir trabalho | [PLANO](../PLANO.md), plano da frente e [TAREFA](TAREFA.md) | Responsável, arquivos, dependências e aceite definidos |
| Implementar UI existente | [UI](../UI.md), item do [plano FE](../frontend/PLANO-IMPLEMENTACAO.md), arquivos atuais e skill front | Tela e estados com fluxo preservado; evidência visual e funcional |
| Implementar cliente/API/mock ou mudar HTTP | [contratos](../contratos/README.md), operação OpenAPI, API/DTO/RN pertinentes | Exemplos compatíveis e testes de consumidor/provedor |
| Implementar domínio/banco | Item do [plano BE](../backend/PLANO-IMPLEMENTACAO.md), modelo/RN/cenários pertinentes e skill back | Regra, migration e testes, incluindo integridade |
| Juntar as frentes | [INTEGRACAO](../INTEGRACAO.md) e evidências das duas tarefas | Corte 1 (ativação única) e depois cada gate aditivo aprovados contra API real |
| Revisar planos ou receber achados | [revisões](revisoes/README.md) e escopo da tarefa | Achados localizáveis, decisão e prova de correção |

**Prioridade:** instruções explícitas da tarefa; decisões vigentes em ESCOPO; regras RN e contrato sincronizado; planos; evidências/histórico. Se duas fontes canônicas divergirem, registre o conflito e alinhe-as antes de implementar a parte afetada. Uma captura antiga ou um mock não altera regra de domínio.

## Começar uma tarefa

1. Leia o pedido e execute `git status --short`. Identifique alterações existentes
   e preserve o trabalho de outros responsáveis.
2. Consulte o [mapa](MAPA.md) para localizar o fluxo afetado. Leia o código atual,
   seus testes e as instruções locais aplicáveis.
3. Para escrever, revisar ou explicar código, leia a skill do lado afetado:
   [front-end](../../.claude/skills/frontend-web/SKILL.md) ou
   [back-end](../../.claude/skills/backend-api/SKILL.md). Elas indicam as
   referências por assunto. Para código Next.js, leia também o guia pertinente
   em `node_modules/next/dist/docs/` da instalação usada. As decisões do projeto
   estão em [backend/ESCOPO.md](../backend/ESCOPO.md) e o índice de toda a
   documentação em [docs/README.md](../README.md).
   Para interface, leia também [UI.md](../UI.md): o laboratório OANET é a
   referência oficial D28. A UI-01 e toda a suíte UI-02 (UI-02.00 a UI-02.12) estão 100% integradas à `main` (PRs #1, #2, #3, #6, #7 e #8). O [HANDOFF-UI-02.md](HANDOFF-UI-02.md) traz a entrega e os refinamentos visuais; a sequência ativa de funcionalidades segue no [PLANO](../PLANO.md) e no [plano FE](../frontend/PLANO-IMPLEMENTACAO.md).
4. Registre objetivo, arquivos, responsável, contratos e aceite usando
   [TAREFA.md](TAREFA.md), no registro de tarefa que o grupo estiver usando.
   Anote a versão e o SHA-256 do contrato (G-1, [INTEGRACAO §2](../INTEGRACAO.md#g-1--aceite-do-contrato)) que você leu antes de abrir a tarefa.
   Entregue a outro agente apenas o contexto e os arquivos necessários.
5. Divida o trabalho somente quando as dependências e os arquivos permitirem.
   Encerre a preparação quando cada tarefa tiver um responsável, limites
   explícitos e critérios de aceite verificáveis.

## Responsabilidades dos dois desenvolvedores

O dev FE reúne domínio/dados do Next e interface; o dev BE reúne API e banco. A coordenação documental e a revisão são responsabilidades transversais, não exigem um terceiro desenvolvedor. Para cada tarefa, atribua arquivos concretos; o papel não concede posse permanente sobre uma pasta inteira.

| Frente | Responsabilidade | Área usual e seus testes |
|---|---|---|
| Coordenação e integração | Define aceite, contratos, ordem e responsáveis; revisa a integração e registra a entrega | Documentação e configuração compartilhada; validação final |
| Back-end | Implementa a API NestJS: módulos, regras de negócio, migrations, seed e testes e2e | `backend/` |
| Domínio, dados e segurança (front) | Implementa serviços, schemas, sessão, autorização e Server Actions | `lib/`, `proxy.ts`, `app/**/actions.ts`, `__tests__/lib/`, `__tests__/acoes/`, `__tests__/proxy.test.ts` |
| Interface | Implementa páginas, formulários, navegação, componentes e estados de tela | `app/**/page.tsx`, layouts, boundaries, `_components/`, `components/`, CSS e testes correspondentes |

Um agente pode exercer mais de um papel em tarefas pequenas. Revisão precisa
examinar o diff e as evidências, mesmo quando houver só uma pessoa disponível.
Para equipes maiores, divida por funcionalidades com arquivos independentes,
mantendo um responsável pela integração.

## Contratos e edição simultânea

Antes de domínio e interface trabalharem em paralelo, combine as assinaturas
das actions, os schemas, o retorno `ResultadoAcao` e as props afetadas.
Registre o que permanece compatível e quais consumidores precisarão mudar.
O [mapa](MAPA.md) aponta os contratos atuais; o código é a fonte da assinatura.

Cada arquivo tem um responsável por tarefa. Se dois agentes precisarem editar
`app/(painel)/painel/ocorrencias/actions.ts`, execute essas partes em sequência
ou atribua o arquivo completo a um deles. Quem encontrar uma dependência fora
do escopo registra o motivo e combina a mudança com o responsável.

`package.json`, `package-lock.json`, configurações, `app/globals.css` e o contrato da API ([API.md](../backend/API.md)) afetam várias
frentes. A tarefa deve indicar quem os edita e quais consumidores serão conferidos.
Reutilize as decisões STACK/DEC da skill de front-end e as decisões vigentes de
[ESCOPO.md](../backend/ESCOPO.md); uma proposta desta documentação não cria uma
decisão do grupo. O contrato da API é o ponto de acordo entre back-end e front-end:
mudar uma rota, um código de erro ou um formato de resposta exige atualizar
`API.md`, `DTOS.md`, OpenAPI e exemplos na mesma tarefa, conforme o [procedimento de contrato](../contratos/README.md).

O trabalho independente usa a mesma revisão do contrato. Front comprova seu consumidor com fixtures contratuais e HTTP simulado no servidor/teste; back comprova o provedor sem precisar do front. A [integração](../INTEGRACAO.md) exige depois ambas as provas e o fluxo real. O mock não pode virar fallback silencioso da aplicação.

Se houver trabalho paralelo de implementação, prefira branch e worktree próprios
por tarefa. Uma pasta compartilhada exige arquivos sem sobreposição e execução
coordenada dos comandos que escrevem artefatos. Cada worktree precisa das suas
dependências e configuração local. Use os recursos nativos do ambiente quando
ele já administrar worktrees.

Os assets OANET e os entregáveis da DOC-03 (contrato, planos, INTEGRACAO, validador, revisões, pesquisa e edições de índices) estão todos consolidados na branch `main`. Para novas tarefas, use sempre a `main` atualizada como base comum. Preserve qualquer trabalho local restante.

O responsável pela integração incorpora primeiro os contratos dos quais outras
tarefas dependem, depois seus consumidores. Depois de resolver conflitos,
execute as verificações sobre o estado integrado: testes em branches separadas
não demonstram que a combinação funciona.

## Estado local, servidores e dados

Siga o [README do projeto](../../README.md) para instalar e executar a aplicação;
os scripts efetivos estão em `package.json`. No PowerShell, o caminho de uma rota
com parênteses ou colchetes deve ser passado como literal, por exemplo:

```powershell
Get-Content -LiteralPath 'app/(painel)/painel/ocorrencias/[id]/page.tsx'
```

A persistência é o SQLite da API NestJS (`backend/`), configurado por `DATABASE_PATH`.
O json-server e o `db.json` foram removidos na FE-09. Testes de escrita usam um
arquivo de banco próprio da tarefa (`DATABASE_PATH` isolado) e a fixture de
integração (`npm run fixture:integracao`, somente de teste), nunca o banco de
demonstração.
Atribua portas diferentes quando houver várias aplicações/APIs simultâneas e
defina `API_URL`, `DATABASE_PATH` e portas **no ambiente do processo** que a tarefa inicia, sem editar `.env.local` (arquivo único da checkout). `scripts/iniciar.sh` usa as portas
fixas 3000/3001; instâncias paralelas precisam de inicialização própria.

Em uma pasta compartilhada, execute `next dev` e `next build` de forma coordenada,
pois ambos usam `.next`. Preserve os processos de outras tarefas e encerre
apenas os servidores iniciados para a sua atividade. Mantenha segredos em
variáveis locais; os nomes necessários estão em `.env.example`.

## Verificar e entregar

Escolha verificações pelo impacto:

| Alteração | Evidência esperada |
|---|---|
| Serviços, schemas e regras | Casos de sucesso e erro relevantes nos testes de domínio/actions |
| Sessão ou autorização | Sem sessão, papel incorreto e setor alheio, além do caso permitido |
| Formulário ou componente interativo | Validação, erros retornados, envio e acessibilidade do fluxo afetado |
| Página assíncrona ou integração de escrita | Build e fluxo real com API; conferir persistência, navegação e atualização dos dados |
| Estilo | Inspeção em celular e desktop; teclado e foco quando houver controles |
| Documentação | Links e caminhos existentes, instruções coerentes e diff revisado |

Os comandos gerais de validação do front são os do `package.json`:
`npm run test:run`, `npm run lint` e `npm run build`. No back-end, os do
`package.json` de `backend/` (`npm test`, `npm run test:e2e` e `npm run build`).
Falha já presente antes da sua mudança deve ser reproduzida antes de atribuí-la
ao trabalho atual.

O guia local Next `01-app/02-guides/testing/vitest.md` informa o limite de suporte
a Server Components assíncronos; um teste com serviços simulados não prova o
fluxo completo com a API real.

Antes da entrega, revise `git diff` e `git status --short`. Relate resultado,
arquivos alterados, comandos e códigos de saída, além do que ficou sem verificar.
Marque uma tarefa como concluída quando o aceite e as verificações aplicáveis
estiverem atendidos. Falha de baseline pode ser registrada separadamente, mas
precisa continuar visível na entrega e não autoriza declarar o projeto aprovado.

Se a alteração modificar uma fronteira ou um procedimento descrito aqui,
atualize a seção correspondente junto com o código. Resultados datados de uma
verificação ficam no relato da tarefa; instruções duradouras ficam neste guia,
nas skills e em `docs/`.
