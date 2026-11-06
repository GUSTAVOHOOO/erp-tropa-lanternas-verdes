---
name: padroes-wellington
description: Use ao escrever, revisar, refatorar ou explicar código do ERP da Tropa dos Lanternas Verdes (React/Next.js, disciplina do Prof. Wellington), ou justificar seus padrões e bibliotecas. Não aplique as decisões deste grupo a outros projetos nem a tarefas sem relação com esse código.
---

# Padrões Wellington

Aplique as regras deste ERP com a menor alteração que atende ao pedido.
Preserve os helpers, contratos e IDs existentes. Estilo isolado pede regras de
estilo; dados e autenticação entram quando o comportamento afetado exigir.

## Consultar somente as regras necessárias

As referências são a fonte canônica. Comece pelas **seções aplicáveis**, usando
[scripts/consultar.mjs](scripts/consultar.mjs): ele retorna o texto integral de
cada regra, com fonte, exemplos, nota de versão e localização, sem copiar o resto
do arquivo. Requer apenas o Node já usado no projeto; não instala dependências.

Na raiz do projeto:

```powershell
node .claude/skills/padroes-wellington/scripts/consultar.mjs FORM-17 FORM-18 AUTH-05 API-14 ROTA-20
node .claude/skills/padroes-wellington/scripts/consultar.mjs --listar CSS
```

Em cópia isolada, use o caminho do script **nessa cópia**, relativo a este SKILL.md.
Se já souber os IDs, consulte-os em lote, uma vez. Para descobrir outros, use
`--listar PREFIXO` (só títulos); selecione pelo pedido antes de extrair o texto.
Reaproveite regras já lidas no contexto. Se uma saída truncar, extraia só as
seções que faltaram. Leia o arquivo inteiro apenas para uma análise abrangente
ou se a seção não esclarecer o contexto; o resumo inicial está antes da primeira
regra. Sem o leitor, localize o título `### ID:` e leia até a regra seguinte.

| Assunto | Índice/fonte e ponto de partida quando pertinente |
|---|---|
| Componentes, props, estado, JSX | COMP — [componentes-props-state.md](references/componentes-props-state.md) |
| Rotas, layouts, navegação | ROTA — [rotas-layouts.md](references/rotas-layouts.md); params ROTA-10/ROTA-11, redirect ROTA-20 |
| Login, sessão, papéis, setor | AUTH — [autenticacao.md](references/autenticacao.md); página AUTH-04, action AUTH-05, setor AUTH-07, cookie assinado AUTH-03 |
| Formulário e validação | FORM — [formularios-rhf-zod.md](references/formularios-rhf-zod.md); action com dados FORM-17/FORM-18 |
| Serviços, fetch, cache, erros | API — [consumo-apis.md](references/consumo-apis.md); camada API-01, quatro estados API-09, erro/retry API-11/API-12, escrita API-14 |
| Tailwind, tema, semântica | CSS — [estilo-tailwind.md](references/estilo-tailwind.md); responsividade CSS-03 |
| JavaScript de base | JS — [javascript-base.md](references/javascript-base.md) |
| Bibliotecas, pastas, decisões | STACK/DEC — [stack-e-decisoes.md](references/stack-e-decisoes.md); dependências STACK-06, fetch DEC-01, cache cliente DEC-02 |

Consulte os assuntos que se cruzam: uma página com dados privados envolve
sessão, filtro, serviço e estados; uma action envolve validação, autorização e,
quando houver, gravação/navegação. Os IDs da tabela são pontos de partida,
não uma lista completa a carregar em toda tarefa. Consulte STACK/DEC antes de
mudar estrutura ou dependências. Código e `node_modules/` são relativos à raiz
do projeto; antes de código Next.js, leia o guia pertinente em
`node_modules/next/dist/docs/`, conforme `AGENTS.md`, e confira a versão instalada.
Se a doc local faltar, consulte a oficial da versão e informe a limitação.

## Aplicar e conferir

Em **Server Action com dados**, confira no código final: `dados: unknown` e uso
de `parsed.data` (FORM-17); `z.flattenError(parsed.error).fieldErrors` e import de
`z` (FORM-18); sessão/papel antes de validar no painel (AUTH-05; login tem exceção
em AUTH-08); gravação, revalidação e `redirect` fora do `try` quando usados
(API-14, ROTA-20). Os exemplos não substituem as assinaturas reais dos helpers.

A correção explicada precisa aparecer no código, inclusive imports de blocos
completos. Use o **Como verificar** das regras aplicáveis no trecho alterado;
busca é triagem, confirme cada ocorrência. No ripgrep, `--files-without-match`
lista arquivos sem correspondência; `-L` segue links. Execute testes/lint/build
conforme o impacto; estilo isolado pede inspeção em celular e desktop. Informe
apenas verificações executadas e seus resultados; proposta não é execução.

Marque a linha da escolha relevante com `// [FORM-17]` ou `{/* [CSS-03] */}`,
por aplicação, inclusive em arquivos distintos; dispense marcações do óbvio.
Use IDs existentes. Uma lacuna pede explicação/proposta; uma nova decisão do
grupo precisa ser explicitamente acordada, não inventada para legitimar código.

## Explicar e entregar

`[SLIDE]` é material do professor; `[DOCS]`, documentação; `[DECISÃO]`, escolha do
grupo. Confira a **Fonte** da seção e cite ID e origem com precisão: fontes mistas
não tornam uma escolha local exigência docente. Antes de alegar ausência de regra,
consulte o índice do assunto. Sem acesso ao PDF, diga “a referência da skill
registra…”, sem afirmar ter conferido o slide. Diferença de API pede nota de versão.

Para PDFs e manutenção do catálogo, consulte
[fontes-e-manutencao.md](references/fontes-e-manutencao.md) somente quando necessário.
Entregue a alteração/achados e a verificação com suas limitações. Cite as regras
que sustentam a escolha, sem repetir o catálogo nem reproduzir regras inteiras
na resposta quando um ID e sua fonte bastarem.
