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

## Trabalho com agentes

- Ao iniciar uma tarefa, leia [docs/agents/README.md](docs/agents/README.md)
  para definir escopo, responsáveis, dependências e verificações.
- Para localizar uma funcionalidade ou alterar contratos entre camadas, consulte
  [docs/agents/MAPA.md](docs/agents/MAPA.md). Confira os arquivos atuais antes de editar.
- Ao dividir trabalho ou passar uma tarefa para outro agente, use
  [docs/agents/TAREFA.md](docs/agents/TAREFA.md). Cada arquivo tem um responsável
  por tarefa; testes acompanham o código do respectivo responsável.
- Preserve alterações locais de outras tarefas. Confira `git status --short`
  antes de editar. Até a migração para a API real, `db.json` é persistência da
  demonstração e fixture de testes; testes manuais de escrita precisam de dados
  isolados.
- Mudanças em dependências, configuração, dados compartilhados e decisões do
  projeto (`docs/backend/ESCOPO.md`) precisam constar explicitamente no escopo
  da tarefa. O contrato da API (`docs/backend/API.md`) muda junto com o código.
- Registre os comandos executados e seus resultados. Falha presente antes da sua
  mudança deve ser reproduzida antes de ser atribuída ao trabalho atual.
- O índice de toda a documentação está em [docs/README.md](docs/README.md).
