# Desenvolvimento com agentes

Este guia organiza tarefas neste projeto (front-end Next.js e, em construção, back-end NestJS). `AGENTS.md` é a entrada compartilhada;
`CLAUDE.md` aponta para ela. Os papéis abaixo distribuem trabalho entre pessoas
ou agentes; os arquivos de documentação não iniciam processos nem agentes.

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
4. Registre objetivo, arquivos, responsável, contratos e aceite usando
   [TAREFA.md](TAREFA.md), no registro de tarefa que o grupo estiver usando.
   Entregue a outro agente apenas o contexto e os arquivos necessários.
5. Divida o trabalho somente quando as dependências e os arquivos permitirem.
   Encerre a preparação quando cada tarefa tiver um responsável, limites
   explícitos e critérios de aceite verificáveis.

## Divisão para três frentes

Esta é uma distribuição inicial. Para cada tarefa, atribua arquivos concretos;
o papel não concede posse permanente sobre uma pasta inteira.

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

`package.json`, `package-lock.json`, configurações, `app/globals.css`, `db.json`
(até ser removido) e o contrato da API ([API.md](../backend/API.md)) afetam várias
frentes. A tarefa deve indicar quem os edita e quais consumidores serão conferidos.
Reutilize as decisões STACK/DEC da skill de front-end e as D1 a D18 de
[ESCOPO.md](../backend/ESCOPO.md); uma proposta desta documentação não cria uma
decisão do grupo. O contrato da API é o ponto de acordo entre back-end e front-end:
mudar uma rota, um código de erro ou um formato de resposta exige atualizar
`API.md` na mesma tarefa.

Se houver trabalho paralelo de implementação, prefira branch e worktree próprios
por tarefa. Uma pasta compartilhada exige arquivos sem sobreposição e execução
coordenada dos comandos que escrevem artefatos. Cada worktree precisa das suas
dependências e configuração local. Use os recursos nativos do ambiente quando
ele já administrar worktrees.

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

Enquanto a migração ([frontend/MIGRACAO.md](../frontend/MIGRACAO.md)) não termina,
`db.json` é persistência do json-server e fixture importada por testes. POST/PATCH
de uma demonstração altera esse arquivo. Antes de testar escrita, use uma cópia
dos dados na pasta isolada da tarefa e uma API que aponte para ela. Depois da
migração, o banco SQLite da API assume esse papel e o teste de escrita usa um
arquivo de banco próprio da tarefa (`DATABASE_PATH`).
Atribua portas diferentes quando houver várias aplicações/APIs simultâneas e
ajuste `API_URL` só no ambiente local da tarefa. `scripts/iniciar.sh` usa as portas
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
`package.json` de `backend/` (testes unitários, e2e e build), quando existir.
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
