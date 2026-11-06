# Medição de tokens, cache e tempo no Codex

## Fatos documentados

`codex exec --json` emite JSON Lines. Um evento `turn.completed` pode incluir `usage` com `input_tokens`, `cached_input_tokens`, `output_tokens` e `reasoning_output_tokens`; a documentação apresenta esses campos em um exemplo de execução. [OpenAI: Non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode)

O Codex define telemetria de tokens como uso **por turno**, tipado como `total`, `input`, `cached_input`, `output` ou `reasoning_output`. Também documenta métricas de latência distintas: duração fim a fim do turno (`turn.e2e_duration_ms`), tempo até o primeiro token (`turn.ttft.duration_ms`) e tempo até o primeiro item de saída do modelo (`turn.ttfm.duration_ms`). [OpenAI: Advanced configuration — turn and tool activity](https://learn.chatgpt.com/docs/config-file/config-advanced#turn-and-tool-activity)

Na API Agents, `cached_tokens` está incluído em `input_tokens`, e `reasoning_tokens` está incluído em `output_tokens`; portanto, esses valores são subcategorias, não valores a somar novamente ao total. Uso de sessão/turno é best effort, pode ser `null` ou mudar quando a contabilidade chega, e não equivale à fatura final. A documentação também permite inspecionar uso por turno de agente raiz e subagentes. [OpenAI: Agents API observability and usage](https://developers.openai.com/api/docs/guides/agents-api/observability)

Prompt caching reutiliza prefixos idênticos. Cache hit reduz processamento de entrada e latência até a resposta começar; tokens lidos do cache ainda são tokens de entrada. Reutilizar a mesma sessão não garante cache hit: o prefixo precisa corresponder. Preços de cache variam por modelo. [OpenAI: Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)

## Recomendação metodológica

- Preserve o `usage` bruto por `turn.completed` e agregue-o por execução. Para cada condição, reporte separadamente: soma de input, cached input, output e reasoning output, além de soma `total` quando fornecida. Não some `cached_input_tokens` outra vez a `input_tokens`; trate cache como classificação do input. Não some reasoning novamente ao output/total. Se calcular input sem cache, use `input_tokens - cached_input_tokens`, identificando a métrica como derivada; para eficiência geral, retenha o input total e o cache separado.
- Uma execução de agente pode conter vários turnos. Somar uso por turno estima consumo acumulado da execução; não representa o tamanho de uma única janela de contexto. Para aproximação da maior entrada ativa, reporte também o maior `input_tokens` observado em um turno. Se houver subagentes, agregue seus turnos à execução total uma única vez, evitando contar a mesma atividade tanto no pai quanto no filho.
- Compare cache hit rate (`cached_input_tokens / input_tokens`) à parte do total de tokens. Cache pode reduzir custo computacional/latência mesmo quando o número de tokens de entrada permanece semelhante; não descreva cached input como “tokens eliminados”. Uma sessão/contexto reutilizado também pode aquecer cache de forma diferente entre runs. [OpenAI: Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Para tempo, use a mesma fronteira de medição em todas as condições: preferencialmente elapsed de processo/execução medido pelo harness, e, se disponível, compare também duração fim a fim do turno. Reporte mediana e dispersão sobre repetições; TTFT mede início da resposta, não conclusão do trabalho. Ferramentas, setup, cache e variabilidade do modelo afetam latência; não atribua toda diferença à skill.
- Token usage não se converte automaticamente em dólares. Não estime preço de Luna, nem aplique a ele preço de outro modelo. Registre apenas métricas observadas; qualquer estimativa de API exigiria o modelo e tarifas aplicáveis à execução. [OpenAI: API pricing](https://developers.openai.com/api/docs/pricing)

**Limite:** tokens por turno e elapsed são medidas de eficiência, não prova isolada de qualidade. Interprete-os junto aos critérios de resultado e registre configuração/modelo, número de turnos, subagentes, cache e repetições.
