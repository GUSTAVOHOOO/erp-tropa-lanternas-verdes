# Escrita e avaliação eficiente de Agent Skills

**Data:** 2026-11-06
**Escopo local:** versão original de `.claude/skills/padroes-wellington/SKILL.md` e `CLAUDE.md`. Não consultei resultados da avaliação nem alterei skill ou código da aplicação.

## Fatos documentados

### Descoberta e contexto

No Codex, a descoberta começa com nome e descrição; o corpo de `SKILL.md` é carregado quando a skill é escolhida, e referências ou scripts são consultados quando necessários. A lista inicial de skills tem orçamento padrão de até 2% da janela de contexto ou 8.000 caracteres se o tamanho for desconhecido; descrições são encurtadas primeiro e, em listas grandes, algumas skills podem ser omitidas. [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills)

A especificação Agent Skills exige `name` e `description`, limita a descrição a 1.024 caracteres e recomenda dizer o que a skill faz, quando deve ser usada e quais termos identificam tarefas relevantes. Ela sugere metadados curtos, corpo principal abaixo de 5.000 tokens e 500 linhas, e mover detalhes para referências carregadas sob demanda. As referências devem ser focadas, usar caminhos relativos e ficar ligadas diretamente ao `SKILL.md`, sem cadeias profundas. [Agent Skills: Specification](https://agentskills.io/specification)

OpenAI recomenda skills focadas, instruções imperativas com entradas e saídas explícitas e descrição concisa, com os principais usos e termos no início. Também recomenda testar prompts para observar acionamento. [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills)

### Avaliação

A documentação Anthropic orienta separar duas medidas: se a skill é invocada nos prompts em que deve ser usada e se a saída atende ao esperado. A comparação sugerida usa tarefas realistas em sessões novas, com a skill ligada e desligada; sessão fresca evita que o contexto da autoria mascare falhas nas instruções. A mesma página descreve avaliação cega A/B de versões e comparação de qualidade, tokens e tempo. [Anthropic: Evaluate and iterate on a skill](https://code.claude.com/docs/en/skills#evaluate-and-iterate-on-a-skill)

O guia Agent Skills recomenda casos com prompt realista, comportamento esperado e arquivos de entrada quando necessários. Sugere começar com 2–3 tarefas de qualidade, variar linguagem e dificuldade e incluir pelo menos um caso de borda. As assertions devem ser observáveis e vir acompanhadas de evidência; critérios subjetivos pedem revisão humana. [Agent Skills: Evaluating skill output quality](https://agentskills.io/skill-creation/evaluating-skills)

Para testar descrição, Agent Skills sugere prompts rotulados como “deve ativar” e “não deve ativar”, incluindo quase acertos que compartilham palavras/tema mas pedem outra coisa. A orientação propõe cerca de 20 consultas (8–10 de cada classe), repetição para observar variabilidade e separação de consultas de treino e validação para reduzir sobreajuste. [Agent Skills: Optimizing skill descriptions](https://agentskills.io/skill-creation/optimizing-descriptions)

**Limites documentados:** testes pequenos são uma triagem inicial, não evidência geral; com 2–3 casos e uma execução, medidas de dispersão não são informativas. Uma skill explicitamente mencionada no prompt testa execução das instruções, mas não testa descoberta automática pela descrição. [Agent Skills: Evaluating skill output quality](https://agentskills.io/skill-creation/evaluating-skills#aggregating-results), [Agent Skills: Optimizing skill descriptions](https://agentskills.io/skill-creation/optimizing-descriptions#testing-whether-a-description-triggers)

## Diagnóstico local — versão original

O `SKILL.md` examinado tem uma descrição extensa e cobertura ampla: código e explicações do ERP, React/Next.js, autenticação, formulários, API, estilos, estrutura e escolha de bibliotecas. A descrição diz para usar a skill sempre em tarefas de código deste projeto. O corpo apresenta um mapa assunto→arquivo de referência, exige conferir “Como verificar”, citar IDs/fontes, distingue `[SLIDE]`, `[DOCS]` e `[DECISÃO]`, e traz convenções para comentários, simplicidade e checklist. `CLAUDE.md` também pede seguir a skill em todo código do ERP.

**Inferência:** amplitude parece intencional, mas pode tornar a descrição menos discriminativa. O objetivo da avaliação deve ser preservar acionamentos legítimos relacionados ao ERP e evitar falsos acionamentos em projetos externos ou pedidos sem relação. O mapa por assunto e as referências existentes já favorecem divulgação progressiva; não há motivo para duplicar referências inteiras no corpo.

Informações adicionais comunicadas pelo coordenador, não verificadas por leitura dos arquivos envolvidos: entrypoint original com aproximadamente 107 linhas; referências já contêm IDs/fontes; existem testes fixos em `docs/research/evals-wellington/{casos,protocolo}`. O coordenador reportou usos de `rg -L` com semântica inadequada (seguir symlinks, não listar arquivos sem correspondência) e `xargs` incompatível com PowerShell em verificações de `autenticacao`, `rotas` e `apis`. Recomenda-se considerar esses comandos como casos de execução: avaliar semântica e shell-alvo, e não classificar uma regra como seguida se o comando não funcionou. Não alterei esses arquivos nem consultei os resultados.

O coordenador também informou que a skill não aparece no catálogo Codex desta sessão. Um apontador curto em `AGENTS.md` ao caminho canônico poderia orientar um agente que leia as instruções do projeto, mas não equivale à skill estar registrada no mecanismo de descoberta do Codex. Logo, esse arranjo não demonstra acionamento automático por descrição. A documentação do Codex separa arquivos de instrução do projeto dos locais de skills reconhecidos, como `.agents/skills`. [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills)

## Recomendações

1. **Manter o escopo local explícito.** Tratar como positivos pedidos de implementação, revisão ou explicação de decisões do ERP, inclusive sem a palavra “padrões”. Usar negativos próximos que mencionem React/Next ou bibliotecas, mas deixem claro que o projeto é externo. Essa fronteira deriva do escopo escrito na descrição original.
2. **Medir discovery sem invocação explícita.** Usar mensagens naturais e observar se o agente consultou o `SKILL.md`; não mencionar `padroes-wellington` nem instruir “use a skill” nesse conjunto. Para medir execução, a invocação explícita pode ser usada em um conjunto separado.
3. **Comparar a versão original e a revisada de modo controlado.** Reutilizar os casos fixos informados pelo coordenador; manter prompt, arquivos, contexto, ferramentas, permissões e configuração iguais. Executar cada condição em agente/sessão fresco e, se possível, repetir. Para a descrição, reservar consultas inéditas como validação.
4. **Definir critérios antes de inspecionar saídas.** Exemplos: referência correta para o tema; regra aplicável verificada; IDs/fontes corretos; nenhuma afirmação de que o professor ensinou algo sem `[SLIDE]`; stack e decisões limitadas ao ERP. Registrar resultado, evidência, tokens e duração; fazer revisão humana cega para qualidade que não cabe em assertions.
5. **Tratar comandos como instruções testáveis.** Incluir casos que percorram os comandos citados nas referências nos shells realmente usados. Comandos inválidos ou incompatíveis devem ser identificados como lacuna da instrução, não como erro de aplicação. A recomendação é baseada nos achados comunicados pelo coordenador.
6. **Não presumir ganho.** Se a comparação ficar empatada ou os resultados forem mistos, reportar empate/inconclusão no conjunto avaliado. Um resultado pequeno não demonstra melhora geral em outros modelos, usuários ou pedidos. O guia Agent Skills também recomenda observar custo de tokens/tempo em relação à qualidade obtida. [Agent Skills: Evaluating skill output quality](https://agentskills.io/skill-creation/evaluating-skills#aggregating-results)

## Fontes

- OpenAI, [Build skills](https://learn.chatgpt.com/docs/build-skills) — descrição, discovery e orçamento da lista inicial do Codex.
- Agent Skills, [Specification](https://agentskills.io/specification) — metadados, estrutura, referências e divulgação progressiva.
- Agent Skills, [Optimizing skill descriptions](https://agentskills.io/skill-creation/optimizing-descriptions) — avaliação de gatilho com consultas positivas, negativas e validação.
- Agent Skills, [Evaluating skill output quality](https://agentskills.io/skill-creation/evaluating-skills) — baseline, sessões limpas, assertions, métricas e limites de amostra.
- Anthropic, [Claude Code Skills](https://code.claude.com/docs/en/skills) — comparação com e sem skill em sessão fresca e avaliação cega A/B.

Fatos documentados estão ligados às fontes primárias. Diagnóstico e recomendações para `padroes-wellington` são inferências a partir da versão original e das informações locais atribuídas ao coordenador.
