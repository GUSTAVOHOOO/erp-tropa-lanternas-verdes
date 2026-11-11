# Handoff — front depois da UI-02.00

**Data:** 2026-11-10. **Preparado por:** dev front, com Claude Code como coordenador
dos agentes no Orca. **Para:** quem continuar o front (pessoa ou agente) a partir da
UI-02.01 e da FE-01.

> Retrato datado. Antes de agir, confira `git status --short`, `git log` e o estado
> das PRs no GitHub: o que está abaixo vale para 2026-11-10 e envelhece a cada merge.
> A sequência de trabalho continua no [plano FE](../frontend/PLANO-IMPLEMENTACAO.md);
> este arquivo não a substitui.

## O que está entregue e onde

| Entrega | Branch | PR | Estado |
|---|---|---|---|
| UI-01, casca OANET | `front/ui-01-casca` (removida) | #1 | Integrada à `main` |
| Cidade de Oa redesenhada (`CidadeOa`) | `front/oa-planeta-cidade` (removida) | #2 | Integrada à `main` |
| UI-02.00, componentes compartilhados na OANET | `front/ui-02-00-componentes` (removida) | #3 | Integrada à `main` (`241d837`) |
| Patch do Next 16.4.0 → 16.4.6 | `front/next-16-4-6` | #4 | Em revisão |
| Este handoff e as linhas de estado dos documentos | `front/handoff-front` | #5 | Em revisão |
| FE-00, infraestrutura e servidor falso de contrato | `front/fe-00-infra` (`179c8a9`) | sem PR | Enviada ao GitHub; fica separada da `main` até o Corte 1 ([INTEGRACAO §6](../INTEGRACAO.md)) |

O relato completo de cada entrega (arquivos, comandos com exit, checagens no navegador
e limites) está no corpo da PR correspondente e, para a FE-00, na mensagem do commit.

## O que falta integrar

1. **#4 (patch do Next):** corrige o `SecurityFatalError` que derruba a 1ª execução de
   `npm run build` na `main`. Só muda `package.json` e `package-lock.json`. Verificado
   sobre `241d837`: 174/174 testes, lint, tipos e build de primeira.
2. **FE-00,** quando a coordenação decidir. A branch saiu de `f0cb363`, antes das PRs
   #2 e #3: atualize-a com a `main` (`git merge origin/main` ou rebase) e rode de novo a
   verificação dela. Depois que a #4 entrar, as linhas do Next ficam idênticas dos dois
   lados; se o `package-lock.json` conflitar, aceite o da `main` e rode `npm install`
   para reaplicar `@playwright/test`, `ajv` e `ajv-formats`.

## Atenção antes de rodar

- **Node 26.** O projeto exige Node >= 26; use npm 11 (`npm ci` não altera o lock).
- **`.env.local`.** Copie de `.env.example`. Hoje são `API_URL` e `SESSION_SECRET`. Com a
  FE-00, `SITE_URL=http://localhost:3000` passa a ser obrigatória: sem ela `dev` e
  `build` param com "Configuração de ambiente inválida". Os dois devs precisam
  acrescentar essa linha quando a FE-00 entrar.
- **Build na `main` antes da #4.** A 1ª execução para no `SecurityFatalError` do Next
  16.4.0; a 2ª passa. É falha de baseline, não da tarefa em curso.
- **Depois de atualizar a `main`.** Rode `npm ci`: a #4 muda a versão do Next instalada.
- **Teste manual de escrita.** Use uma cópia isolada do `db.json` e portas próprias
  (por exemplo json-server em 3101 e `next start` em 3102), com `API_URL` e
  `SESSION_SECRET` no ambiente do processo. Nunca escreva no `db.json` do repositório.
- **Contrato G-1.** Versão `1.0.0`, conjunto
  `cd91fef5a43bb239a67be5bbc1a942caedda7129bb268da7dbfdd0632b9a4730`. Confira com
  `python docs/contratos/validar.py --conferir-hash <hash>`; hash diferente = parar.

## Próximas tarefas

Pela ordem do [plano FE](../frontend/PLANO-IMPLEMENTACAO.md):

1. **UI-02.01 (Portal)**, depois UI-02.02 a UI-02.12, uma linha por PR, em
   `front/<id>` a partir da `main`. Cada linha é dona da sua
   página e do seu formulário; os componentes compartilhados já estão na OANET.
2. **FE-01 (cliente HTTP)** depois da FE-00, na trilha de preparação.

Pontos que as próximas linhas herdam da UI-02.00:

- Botões das páginas (`Registrar ocorrência`, filtros do catálogo) ainda usam a
  primitiva antiga; trocam para `BotaoOa` na linha de cada rota.
- O 404 global recebeu só o escopo de cores OANET. O acabamento é da UI-02.11.
- A página de registro ficou centralizada com 672 px a pedido do dev front; a de
  atribuição continua com `max-w-xl` à esquerda (UI-02.10 decide).
- `BarraStatus` (UI-02.06), `ui/badge` e `ui/card` (UI-02.04), `Emblema` e `ui/alert`
  (UI-02.12) ainda não foram tocados, como o plano manda.

## Achados em aberto

- O foco de teclado de `oa-button--linha` mostra só os cantos do contorno. É o
  comportamento do laboratório; falta decidir se muda.
- Tablet e aba oculta não foram inspecionados no navegador na UI-02.00.
- `npm ci` acusa vulnerabilidades em dependências que já existiam; ninguém tratou.
- Documentos da coordenação com menções desatualizadas ao estado do front:
  `docs/PLANO.md`, `docs/UI.md`, `docs/README.md`, partes de `docs/frontend/` e
  `docs/design/oanet/movimento-cinematografico.md` (cita `TorreOa`, que saiu no
  redesenho da cidade).
- Na FE-00: a CSP é estática e só em modo relatório (sem nonce, porque `proxy.ts` não
  era da tarefa); o servidor falso prova só o consumidor ("preparado contra contrato").

## Como o trabalho foi conduzido

- Coordenação por `orca orchestration`, com arquivos disjuntos por agente: Gemini Argon
  para o que é visual, Gemini Flash para código mecânico, Claude Haiku para documentos
  e Codex para código difícil e revisão.
- O coordenador escreve os testes antes, revisa cada diff contra "mesmas props" e é o
  único que roda a suíte completa, o build e o navegador. A máquina do dev front tem
  pouca memória livre: um build por vez, e agentes não sobem servidor.
- Commit, push e PR só depois da aprovação visual do dev front.

## Estado local na máquina do dev front

Não está no GitHub e pode ser descartado sem perda para o projeto:

- Worktree `oa-planeta-livre` (branch `front/oa-planeta-livre`): proposta alternativa
  da cidade de Oa, não escolhida, sem commit.
- Worktree `oa-planeta-cidade`: cópia de trabalho de uma branch já integrada.
- Worktrees `fe-00-infra` e `next-16-4-6`: cópias de trabalho das branches que ainda
  estão no GitHub.
