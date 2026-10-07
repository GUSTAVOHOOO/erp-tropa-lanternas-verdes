---
name: auditoria-apresentacao
description: Audita o projeto "ERP da Tropa dos Lanternas Verdes" (Next.js, disciplina do Prof. Wellington) contra os requisitos do enunciado e as regras da skill padroes-wellington, e gera docs/AUDITORIA.md (matriz requisito → arquivo:linha → regra → slide/página, violações, regras não aplicadas) e docs/ROTEIRO.md (explicação de cada feature com perguntas prováveis da banca). Use quando o usuário pedir para auditar, revisar o projeto inteiro, conferir requisitos, ver "o que falta", checar se está de acordo com o professor, preparar ou ensaiar a apresentação, ou gerar explicação/roteiro de uma feature, mesmo que não use a palavra "auditoria".
---

# Auditoria e roteiro de apresentação

Objetivo: o grupo precisa explicar cada linha na apresentação e justificar com o que o professor
ensinou. Esta skill prova (com arquivo e linha) que cada requisito foi atendido, mostra o que
quebra as regras e prepara o roteiro de fala.

Esta skill NÃO repete regras. Toda regra citada é da skill `padroes-wellington`
(`.claude/skills/padroes-wellington/`), pelo ID. Para saber o texto e a fonte de uma regra:
`rg -n -A1 "^### FORM-17:" .claude/skills/padroes-wellington/references`.

## Princípios

- **Nunca invente fonte.** A fonte de cada regra é copiada da linha `**Fonte:**` dela. Só diga
  "o professor ensinou" quando a etiqueta for `[SLIDE]`. `[DOCS]` e `[DECISÃO]` são ditos como tal.
  Se a regra tiver "p. ?", mantenha "p. ?".
- **Arquivo:linha real.** Toda evidência é conferida com `rg -n` ou abrindo o arquivo. Não escreva
  número de linha de memória.
- **Auditar não é corrigir.** Liste as violações com a correção sugerida; só altere código se o
  usuário pedir.
- **Heurística não é veredito.** Resultado `REVISAR` do script só vira violação depois de você ler o trecho.

## Processo

### 0. Preparar
1. Ache a raiz do projeto Next (pasta com `package.json` que tem `next`). Se não houver projeto,
   diga isso e pare.
2. Confirme que `.claude/skills/padroes-wellington/references/` existe (a auditoria depende dela).
3. Leia `references/requisitos-enunciado.md` (requisitos literais + onde procurar cada um).

### 1. Varrer os marcadores [ID]
1. Liste os marcadores: `rg -n -o "\[[A-Z]{2,5}-[0-9]{2}\]" app components lib proxy.ts`.
2. O script do passo 2 já acusa ID inexistente (C-39).
3. Faça a checagem M-10 de `references/checks.md`: abra a regra e confirme que a linha marcada
   aplica mesmo a regra. Marcador na linha errada também é violação.

### 2. Rodar as verificações automáticas
1. `bash .claude/skills/auditoria-apresentacao/scripts/verificar.sh <raiz-do-projeto>`
2. Para cada `VIOLACAO`, abra o trecho e confirme. Para cada `REVISAR`, decida e anote o motivo.
   O significado de cada `C-xx` está em `references/checks.md`.
3. Faça as verificações manuais `M-01` a `M-11` de `references/checks.md`. As que dependem de
   rodar o app (M-05 a M-09): se você não puder rodar, deixe o passo a passo como pendência para o
   grupo, marcado "não executado".

### 3. Conferir os requisitos
Para cada REQ de `references/requisitos-enunciado.md`: ache os arquivos, colete a evidência com
`arquivo:linha`, liste as regras aplicadas e copie a fonte de cada uma. Status ✅, ⚠️ (com
ressalva escrita) ou ❌. REQ-05 vira três linhas (a, b, c) e REQ-06 vira seis (a a f).

### 4. Regras de slide não aplicadas
1. Liste as regras de slide: `rg -n "^\*\*Fonte:\*\* \[SLIDE\]" -B1 .claude/skills/padroes-wellington/references`
   (o título com o ID está na linha anterior).
2. Para cada uma sem marcador e sem evidência no código, classifique: "falta implementar",
   "feature ainda não existe" ou "não se aplica" (com motivo). Ex.: ROTA-15 não se aplica se
   ninguém usa `useSearchParams`.

### 5. Gerar docs/AUDITORIA.md
Copie `assets/AUDITORIA.template.md` para `<raiz>/docs/AUDITORIA.md` e preencha tudo. Remova as
linhas de exemplo `{{...}}`. Na seção 6, copie as "Notas de versão" das regras usadas.

### 6. Gerar docs/ROTEIRO.md
Copie `assets/ROTEIRO.template.md` para `<raiz>/docs/ROTEIRO.md`. Uma seção "Feature" para cada:
homepage e navegação; páginas públicas; login; controle de acesso (proxy + DAL); papéis e 403;
lista de ocorrências com filtros; nova ocorrência; detalhe e mudança de status; atribuir
responsável; estados de tela; camada de serviço e reuso no back-end; estilo e componentes. Pule
feature que não existe no código (e registre na auditoria). Para "Pergunta provável", use
`references/perguntas-provaveis.md` e adapte ao código real.

Na fala, troque a sigla pelo nome do deck: ROTAS → "slide de Rotas", FORMS → "slide de
Formulários", APIS → "slide de Consumo de APIs", PROPS → "slide de Props e Estado", JSX → "slide de
Introdução ao React", CSS → "slide de CSS e Tailwind", JS → "slide de JavaScript".

### 7. Responder ao usuário
Resumo curto: requisitos atendidos (x de 6), violações confirmadas (as três mais graves primeiro:
segurança e requisitos antes de estilo), pendências manuais, e o caminho dos dois arquivos.

## Pedidos parciais

- "Explica a feature X" / "monta o roteiro do login": faça só o passo 6 para essa feature (com os
  passos 1 e 2 restritos aos arquivos dela) e responda no chat; gere arquivo só se pedirem.
- "Confere só os requisitos": passos 0, 3 e um resumo.
- "Roda os checks": passo 2 e lista de violações confirmadas.

## Arquivos desta skill

- `references/requisitos-enunciado.md`: texto literal dos requisitos e onde procurar cada um.
- `references/checks.md`: o que cada verificação automática (C-xx) e manual (M-xx) faz.
- `references/perguntas-provaveis.md`: banco de perguntas da banca com as regras de resposta.
- `scripts/verificar.sh`: roda as verificações automáticas (bash; usa grep, awk e node).
- `assets/AUDITORIA.template.md` e `assets/ROTEIRO.template.md`: modelos dos documentos.
