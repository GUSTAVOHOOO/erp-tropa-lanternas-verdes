<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Padrões acadêmicos do projeto

Ao escrever, revisar ou explicar código do front deste projeto, leia
[frontend-web](.claude/skills/frontend-web/SKILL.md) e consulte as referências
pertinentes ao pedido; para o back-end, leia
[backend-api](.claude/skills/backend-api/SKILL.md). Os arquivos nesses caminhos
são as fontes canônicas.

## UI oficial

Ao criar ou migrar uma tela, siga [docs/UI.md](docs/UI.md): o laboratório OANET
é a referência visual oficial (decisão D28). Use seus componentes, vetores,
tokens e animações. O front antigo serve para recuperar fluxos e regras,
não como modelo de design. A implementação da UI oficial está concluída:
siga o [plano FE](docs/frontend/PLANO-IMPLEMENTACAO.md), com a UI-01 e toda a suíte UI-02 (UI-02.00 a UI-02.12) integradas à `main` (PRs #1, #2, #3, #6, #7, #8), assim como a integração contra a API NestJS real (FE-00 a FE-10 no Corte 1 e aditivos, PRs #11 a #19, e ajustes nos PRs #20 e #22). O [handoff UI-02](docs/agents/HANDOFF-UI-02.md) traz o encerramento da UI-02; o [handoff do front](docs/agents/HANDOFF-FRONT.md) traz o histórico da UI-02.00; o [handoff de preparação FE](docs/agents/HANDOFF-FE-PREPARACAO.md) registra a preparação e o [handoff OANET](docs/agents/HANDOFF-OANET.md) é o histórico da transferência da UI-01.

## Trabalho com agentes

- Ao iniciar uma tarefa, leia [docs/agents/README.md](docs/agents/README.md)
  para definir escopo, responsáveis, dependências e verificações.
- Para localizar uma funcionalidade ou alterar contratos entre camadas, consulte
  [docs/agents/MAPA.md](docs/agents/MAPA.md). Confira os arquivos atuais antes de editar.
- Para implementar front/back em paralelo ou integrar HTTP, use o [plano da frente](docs/PLANO.md), o [pacote de contrato](docs/contratos/README.md) e os [gates de integração](docs/INTEGRACAO.md). Registre a revisão do contrato usada (G-1: versão e SHA-256); simulação não comprova integração real, e a ativação real é um corte único descrito em INTEGRACAO.
- Ao dividir trabalho ou passar uma tarefa para outro agente, use
  [docs/agents/TAREFA.md](docs/agents/TAREFA.md). Cada arquivo tem um responsável
  por tarefa; testes acompanham o código do respectivo responsável.
- Preserve alterações locais de outras tarefas. Confira `git status --short`
  antes de editar. A persistência é o SQLite da API (`backend/`); testes de
  escrita usam banco próprio (`DATABASE_PATH` isolado) e a fixture de integração.
- Mudanças em dependências, configuração, dados compartilhados e decisões do
  projeto (`docs/backend/ESCOPO.md`) precisam constar explicitamente no escopo
  da tarefa. O contrato da API (`docs/backend/API.md`) muda junto com o código.
- Registre os comandos executados e seus resultados. Falha presente antes da sua
  mudança deve ser reproduzida antes de ser atribuída ao trabalho atual.
- O índice de toda a documentação está em [docs/README.md](docs/README.md).
