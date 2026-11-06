---
name: padroes-wellington
description: Use ao escrever, revisar, refatorar ou explicar código do ERP da Tropa dos Lanternas Verdes (React/Next.js, disciplina do Prof. Wellington), ou justificar seus padrões e bibliotecas. Não aplique as decisões deste grupo a outros projetos nem a tarefas sem relação com esse código.
---

# Padrões Wellington

Aplique as regras acadêmicas e decisões deste ERP, preservando IDs e fontes.
Faça a menor alteração que atende ao pedido; uma correção de estilo não pede
revisão de login, dados ou arquitetura.

## Consultar antes de alterar

Os caminhos `references/` são relativos à pasta desta skill. Caminhos de código,
`package.json` e `node_modules/` são relativos à raiz do projeto.
Leia o arquivo existente que será alterado e selecione as referências pelo
comportamento afetado. Consulte as combinações abaixo quando houver cruzamento:

| Pedido | Referências a consultar |
|---|---|
| Componente, props, estado ou JSX | [componentes-props-state.md](references/componentes-props-state.md) (COMP) |
| Rotas, layouts, navegação, params, loading/error | [rotas-layouts.md](references/rotas-layouts.md) (ROTA) |
| Login, sessão, papéis, setor ou acesso privado | [autenticacao.md](references/autenticacao.md) (AUTH) |
| Formulário, RHF, Zod ou Server Action com dados | [formularios-rhf-zod.md](references/formularios-rhf-zod.md) (FORM); action privada também AUTH; gravação também API; redirect também ROTA |
| Busca, serviço, cache ou erro de API | [consumo-apis.md](references/consumo-apis.md) (API); página também ROTA; dados privados também AUTH |
| Tailwind, tema, responsividade ou semântica | [estilo-tailwind.md](references/estilo-tailwind.md) (CSS) |
| JavaScript de base | [javascript-base.md](references/javascript-base.md) (JS) |
| Bibliotecas, pastas ou justificativa da stack | [stack-e-decisoes.md](references/stack-e-decisoes.md) (STACK/DEC) |

Uma referência adicional só é necessária se a alteração atingir aquele assunto.
Consulte STACK/DEC antes de criar estrutura ou dependência; preserve os helpers e
componentes já existentes. Os exemplos mostram padrões, não substituem a
conferência das assinaturas reais de funções e tipos.

Antes de escrever código Next.js, leia o guia pertinente em
`node_modules/next/dist/docs/`, conforme `AGENTS.md`. Confira versões instaladas
em `package.json` e no lockfile. Se a documentação local não estiver disponível,
consulte a oficial da versão e informe essa limitação. Uma diferença de API pede
nota de versão na regra existente, sem atribuir a mudança ao professor.

## Aplicar e revisar

Use as regras relevantes e seus blocos **Como verificar** no trecho alterado.
Em revisão, o código recebido pode conter justamente o erro a corrigir:
preserve o requisito do usuário, corrigindo a implementação. Confira se o código
proposto aplica a recomendação explicada; mencionar uma correção no texto não
resolve uma chamada antiga que continua no snippet. Em blocos de código
completos, inclua os imports utilizados no próprio bloco.

Mantenha IDs existentes (`FORM-17`, `AUTH-05` etc.). Marque a linha que materializa
uma escolha relevante: `// [FORM-17]` ou `{/* [CSS-03] */}`. Use uma marcação por
aplicação, inclusive em arquivos distintos; dispense marcações do óbvio. Cite
somente IDs encontrados nas referências. Uma regra ausente é uma lacuna a
informar; alterar o padrão do grupo exige decisão explícita, não uma regra
inventada para legitimar a implementação.

Verificações por busca são triagem: confirme cada resultado no código.
Execute comandos a partir da raiz e use a sintaxe do shell disponível.
No ripgrep, `--files-without-match` lista arquivos sem correspondência;
`-L` segue links simbólicos. Ausência de uma palavra não prova a correção da
função inteira. Use os scripts de teste/lint/build do projeto conforme o impacto;
uma mudança apenas visual pede inspeção em celular e desktop. Relate o que foi
executado e o resultado; se só propôs código, diga que não houve execução.

## Explicar com fontes

`[SLIDE]` = material do professor; `[DOCS]` = documentação oficial;
`[DECISÃO]` = escolha do grupo. Distinga as três ao justificar código. Regra com
fontes mistas não transforma toda escolha local em exigência do professor.
Ao justificar uma decisão, confira a seção da regra, não só o índice. Antes de
afirmar que não há registro, busque o termo na referência pertinente.
Ao citar, mantenha ID, etiqueta e fonte da regra. Se o PDF não estiver acessível,
diga “a referência da skill registra…”; não alegue ter conferido o slide.

Para localizar PDFs, conferir paginação ou manter o catálogo, leia
[fontes-e-manutencao.md](references/fontes-e-manutencao.md).
Na entrega, resuma a alteração ou os achados, os IDs/fontes relevantes e as
verificações realizadas com suas limitações. Evite despejar regras sem relação
com o pedido.
