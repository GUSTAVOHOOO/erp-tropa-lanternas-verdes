# Guia do desenvolvedor

Versão de 2026-11-06. Para quem vai codar. A visão do produto está em [PRODUCT.md](../PRODUCT.md), as decisões em [backend/ESCOPO.md](backend/ESCOPO.md) e as tarefas em [PLANO.md](PLANO.md).

## Leia antes de começar (nesta ordem)

1. [GLOSSARY.md](../GLOSSARY.md): use estes termos no código, nos commits e nas telas.
2. [backend/ESCOPO.md](backend/ESCOPO.md): decisões D1 a D27.
3. A tarefa em [PLANO.md](PLANO.md), e só os documentos que ela cita.
4. A skill do lado que você mexe: [`backend-api`](../.claude/skills/backend-api/SKILL.md) ou [`frontend-web`](../.claude/skills/frontend-web/SKILL.md). Elas dizem quais referências abrir; não leia todas.

Para código Next.js, leia também o guia local em `node_modules/next/dist/docs/` antes de afirmar uma API: esta versão tem diferenças em relação ao que se costuma conhecer (veja `AGENTS.md`).

## Ambiente

- Node.js 26 ou mais novo, npm e Git.
- Hoje o repositório tem só o front. Siga o [README](../README.md) para rodar; depois do BE-01, o `backend/` terá o próprio `package.json` e `.env.example`.
- Segredos ficam em `.env` e `.env.local`, fora do Git. Nunca coloque credencial no código nem um valor padrão para `JWT_SECRET`.
- Portas: Next.js em 3000 e API em 3001.

Quando o back-end existir, o fluxo será: `npm install` em cada projeto, copiar os `.env.example`, `npm run migration:run` e `npm run seed` no `backend/`, e subir os dois servidores. As contas de demonstração ficam no `README.md`.

## Fluxo de trabalho

### Desenvolvimento independente por contrato

O [plano FE](frontend/PLANO-IMPLEMENTACAO.md) e o [plano BE](backend/PLANO-IMPLEMENTACAO.md) permitem preparação independente usando o mesmo [contrato v1](contratos/README.md). O fake HTTP do front é tarefa futura FE-00, restrito ao servidor/ambiente de teste e desenvolvimento. O dev BE implementa e testa o provedor sem esperar telas. A ativação real é um primeiro corte integrado único e a retirada do json-server fecha depois dos aditivos ([gates reais](INTEGRACAO.md)), com banco isolado e variáveis da tarefa no ambiente do processo, nunca em `.env.local`. Antes de abrir uma tarefa, leia o registro G-1 do contrato.

Antes de desenvolver, registre versão/hash do contrato e exemplos usados. Depois de uma mudança de contrato, alinhe OpenAPI, API/DTO, exemplos e consumidores na mesma tarefa. Um teste contra mock não encerra integração. Scripts futuros de mock, e2e e banco só podem ser executados depois de criados na tarefa correspondente; consulte `package.json` real.

1. Confira `git status --short` e preserve alterações de outras pessoas. Trabalhe em uma branch por tarefa, a partir da `main`: no front, `front/<id>` (p. ex. `front/ui-02-00-componentes`), entrando por PR para a `main`; no back, siga o nome do plano (p. ex. `be-03-autenticacao`).
2. Registre a tarefa com [agents/TAREFA.md](agents/TAREFA.md) na descrição da PR: objetivo, arquivos, aceite, verificações.
3. Escreva o teste junto com o código. Para regras de negócio, o roteiro é [backend/CENARIOS-DE-TESTE.md](backend/CENARIOS-DE-TESTE.md).
4. Rode as verificações (abaixo) e cole os resultados reais na PR.
5. Um dos dois revisa a PR do outro, olhando o diff contra o aceite, não só o relato.
6. Merge só com as verificações passando no estado integrado.

### Commits

Mensagens curtas, no imperativo, em português, com o tipo e o lado: `feat(be): cadastro com bcrypt`, `fix(fe): erro 409 na atribuição`, `docs: atualiza TELAS`. Um commit por mudança lógica. O autor do commit é a pessoa que o fez.

## Definição de pronto

Uma tarefa só está pronta quando:

- [ ] Cumpre todos os itens de "Aceite" do [PLANO.md](PLANO.md).
- [ ] Tem testes de sucesso **e** de erro, e eles passam.
- [ ] As verificações da tabela abaixo foram executadas e o resultado está na PR.
- [ ] O contrato [backend/API.md](backend/API.md) e a regra de [REGRAS-DE-NEGOCIO.md](backend/REGRAS-DE-NEGOCIO.md) foram atualizados **no mesmo PR** se o comportamento mudou.
- [ ] A documentação afetada foi atualizada (DOC-01 do plano).
- [ ] Nada de segredo, `console.log` de depuração ou código comentado ficou para trás.
- [ ] O que não foi verificado está dito na PR.

## Verificações

| Onde | Comando | Quando |
|---|---|---|
| Front | `npm run test:run`, `npm run lint`, `npm run build` | Sempre antes da PR |
| Back-end | `npm run test`, `npm run test:e2e`, `npm run build` (em `backend/`) | Sempre antes da PR |
| Telas | Abrir no navegador, celular e desktop, com teclado | Tarefa que mexe em interface |
| Integração | Fluxo real contra a API, conferindo persistência e atualização | Tarefa que liga front e API |
| E2E | `npm run test:e2e` | FE-10 e mudanças que quebrem fluxos |

Relate o que **de fato** rodou. Falha que já existia antes da sua mudança deve ser reproduzida antes de ser atribuída a você.

## Onde fica cada coisa

| Quero mudar | Vá a |
|---|---|
| Regra de negócio | `backend/src/<assunto>/*.service.ts` e [REGRAS-DE-NEGOCIO.md](backend/REGRAS-DE-NEGOCIO.md) |
| Rota ou formato de resposta | `*.controller.ts`, DTOs e [API.md](backend/API.md), [DTOS.md](backend/DTOS.md) |
| Esquema do banco | Uma **nova migration** (nunca editar a antiga) e [MODELO-DE-DADOS.md](backend/MODELO-DE-DADOS.md) |
| Dados de exemplo | `backend/src/database/seed/` e [SEED.md](backend/SEED.md) |
| Tela | `app/`, `components/` e [frontend/TELAS.md](frontend/TELAS.md) |
| Chamada à API | `lib/` (cliente único em `lib/api.ts`) |
| Visual | `components/oanet/`, `app/globals.css` e [UI.md](UI.md) |

## Regras que mais quebram

- O **papel** nunca vem do corpo da requisição nem do cliente. O servidor usa o do banco.
- **Recurso de outro Setor responde 404**, não 403.
- O token JWT só existe no servidor do Next. O navegador não chama a API.
- Regra de negócio fica no **service**; o controller só traduz HTTP.
- Mudança de Ocorrência, Lanterna e Evento acontece em **uma transação**.
- Erro esperado leva um `codigo` estável; o front trata pelo código, nunca pelo texto.
- Toda lista é paginada e ordenada por campo da lista permitida.

## Quando algo não está claro

Se a documentação não responde, ou se duas documentações discordam: pare, registre a dúvida na tarefa e resolva com quem documenta antes de decidir sozinho. Uma decisão nova entra em `backend/ESCOPO.md` no mesmo dia (e em ADR, se for difícil de reverter e surpreendente).
