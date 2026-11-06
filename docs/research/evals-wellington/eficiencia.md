# Eficiência: tokens e tempo medidos nos registros

> Continuação: [otimização aplicada e medida](otimizacao.md), com consulta por
> regra e nova rodada de qualidade, tokens e tempo. Os números abaixo descrevem
> a versão anterior a essa otimização.

Data: 2026-11-06. Complemento aos [resultados de qualidade](resultados.md).
Recuperamos telemetria das 11 execuções anteriores, sem chamar novamente o
modelo para refazer os testes. Um agente separado pesquisou a interpretação das
métricas em [fontes oficiais](fontes-eficiencia.md).

**Conclusão local:** a skill final melhorou a aderência à rubrica, mas não
demonstrou economia. Frente ao controle sem skill, teve aproximadamente
**141% mais tokens de entrada acumulados e 21% mais tempo nas medianas**.
Encurtar `SKILL.md` não reduziu o consumo completo do agente.

## Comparação principal

Cada execução respondeu aos mesmos quatro casos. Medianas são calculadas
separadamente por métrica; medianas de input/cache não devem ser somadas como
se representassem a mesma execução.

| Métrica por execução | Sem skill (n=2) | Original (n=2) | Final (n=3) | Final vs. sem skill |
|---|---:|---:|---:|---:|
| Tempo fim a fim | 60,89 s | 69,85 s | 73,66 s | +20,97% |
| Entrada acumulada, incluindo cache | 100.134,5 | 238.455,5 | 241.016 | +140,69% |
| Entrada acumulada sem cache | 15.718,5 | 30.583,5 | 34.302 | +118,23% |
| Entrada acumulada em cache | 84.416 | 207.872 | 202.624 | +140,03% |
| Saída acumulada, incluindo reasoning | 2.794,5 | 2.838 | 3.276 | +17,23% |
| Total acumulado, input + output | 102.929 | 241.293,5 | 243.854 | +136,91% |
| Maior entrada de uma requisição | 26.829 | 49.283 | 54.317 | +102,46% |
| Requisições ao modelo | 4 | 6,5 | 6 | +50% |
| Critérios de qualidade, de 16 | 14 | 14,5 | 16 | +2 pontos |

Comparada à original, a final teve +1,07% de entrada acumulada, +12,16% de
entrada sem cache e +5,47% de tempo nas medianas. A revisão anterior melhorou
resultados nestes casos sem demonstrar ganho de eficiência.

## Variação que a mediana esconde

| Condição | Tempo mínimo–máximo | Tempo médio | Entrada média |
|---|---:|---:|---:|
| Sem skill | 46,78–75,01 s | 60,89 s | 100.134,5 |
| Original | 65,04–74,65 s | 69,85 s | 238.455,5 |
| Final | 71,50–131,71 s | 92,29 s | 287.876 |

Pelas médias, o aumento final vs. controle foi **51,56% de tempo** e **187,49%
de entrada acumulada**. A terceira execução final fez dez requisições ao modelo,
contra cinco e seis nas outras. A amostra é pequena e não estabelece uma
porcentagem universal de lentidão. Tempo inclui ferramentas e espera do serviço,
não só processamento do modelo; houve agentes rodando simultaneamente.

## De onde veio o excesso

Os registros mostram leituras integrais de várias referências, resultados
truncados e novas consultas às mesmas regras. As finais tiveram entre **90.648
e 103.154 caracteres de resultados de ferramentas**, incluindo releituras e
mensagens operacionais, contra cerca de 3.800–3.900 no controle. São caracteres
observados, não uma conversão estimada para tokens.

Houve indicadores de truncamento nas três finais: três, dois e um. No controle
não houve. Na primeira final, uma leitura ampla foi seguida de duas buscas
extensas; na terceira houve várias extrações parciais depois da leitura inicial.
Isso evidencia trabalho adicional, mas não isola causalmente o custo de cada
trecho da skill.

Cada chamada recebe o contexto acumulado, sujeito ao cache. A soma de input de
seis chamadas pode passar de 200 mil tokens embora a maior entrada individual
esteja perto de 54 mil. **A skill não tem 241 mil tokens**: o número soma toda
a execução, incluindo instruções do host, casos, ferramentas, referências e
histórico das chamadas.

## Cache e dinheiro

Sobre as somas dos grupos, o cache correspondeu a 84,30% da entrada no controle,
87,17% na original e 87,90% na final. Cache está **dentro** de input. Reasoning
também não deve ser somado outra vez ao output quando já incluído, como indicam
estes registros. As distinções são consistentes com a documentação de
[usage](https://developers.openai.com/api/docs/guides/agents-api/observability) e
[prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching).

**+141% de entrada não significa automaticamente +141% de cobrança.** Não
consultamos fatura, tarifas específicas do modelo/conta ou regras de consumo da
assinatura. Uma simulação de API precisaria das tarifas aplicáveis a input sem
cache, input com cache e output, além de outras cobranças eventualmente
aplicáveis. Não se aplicaram preços de outro modelo ao Luna.

## Método e auditoria

O [extrator](extrair-metricas.py) lê somente sessões cujo `agent_path` corresponda
à lista das 11 avaliações Wellington. Não exporta conteúdo de chat, prompts,
instruções completas ou credenciais. Os [dados exportados](metricas-eficiencia.json)
contêm métricas, horários, identificadores técnicos e hashes dos arquivos-fonte.

No formato local observado, `token_usage_record.usage` é por requisição e
`turn_token_usage` é acumulado. Somamos os primeiros e conferimos a igualdade
com o último acumulado. **Não somamos acumulados intermediários**, pois isso
contaria tokens repetidamente. O formato interno pode mudar em versões futuras.
A documentação pública mostra campos análogos em
[execuções JSONL](https://learn.chatgpt.com/docs/non-interactive-mode).

O tempo usa a diferença entre timestamps UTC de `task_started` e `task_complete`,
com precisão de milissegundos. Não usamos data de modificação do arquivo nem
tempo de espera do agente principal. Todos os registros selecionados declaram
`gpt-6-luna` em `turn_context`.

Para reproduzir neste computador:

```powershell
uv run python -X utf8 docs/research/evals-wellington/extrair-metricas.py
```

`--sessions` permite indicar outra pasta histórica; `--out`, outro destino JSON.
Os dados exportados permitem recalcular resumos sem acesso aos chats.

## Limites e próximo alvo de otimização

A comparação é retrospectiva, com dois controles e três finais; ocorreu em
momentos distintos, sem randomização de ordem ou controle do cache. O contexto
base já consumia cerca de 23,1 mil tokens na primeira requisição.
`fork_turns=none` não removeu a injeção de ambiente e `AGENTS.md` feita pelo host;
o apontador acrescentado ao AGENTS durante o estudo foi injetado nas rodadas
posteriores. A bancada restringiu leituras manuais, não todo o contexto
automático. Isso corrige a interpretação de isolamento do protocolo inicial.

A prioridade para uma próxima revisão é **consultar regras por ID ou seção,
evitando seis referências inteiras e releituras de resultados truncados**.
Também vale limitar a saída ao pedido e comparar tarefas pequenas isoladamente:
um ajuste CSS não tem o mesmo custo de uma action com autorização. A otimização
precisa preservar a checagem que resolveu FORM-17/FORM-18 e ser medida junto com
qualidade. Esta análise não alterou a skill, portanto seu hash e os resultados
comportamentais anteriores continuam identificáveis.
