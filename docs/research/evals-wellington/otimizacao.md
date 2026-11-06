# Otimização da skill: leitura por regra

Data: 2026-11-06. Continuação da [medição inicial](eficiencia.md).
**A otimização foi aplicada** em `.claude/skills/padroes-wellington/`.

## Resultado medido

Nas três execuções finais com `gpt-6-luna`, a nova versão manteve **16/16** na
rubrica principal. Frente às três execuções da versão anterior, a mediana caiu
**26,00% em entrada acumulada, 45,47% em entrada sem cache e 12,92% em tempo**.
As consultas não tiveram saídas truncadas. Esses ganhos são locais ao conjunto
de quatro casos; não são garantia geral de desempenho ou redução de cobrança.

| Mediana por execução | Versão anterior, n=3 | Otimizada, n=3 | Diferença |
|---|---:|---:|---:|
| Entrada acumulada, incluindo cache | 241.016 | 178.353 | −26,00% |
| Entrada sem cache | 34.302 | 18.706 | −45,47% |
| Saída acumulada | 3.276 | 2.819 | −13,95% |
| Total acumulado, entrada + saída | 243.854 | 180.932 | −25,80% |
| Tempo fim a fim | 73,66 s | 64,15 s | −12,92% |
| Maior entrada de uma requisição | 54.317 | 34.480 | −36,52% |
| Caracteres de saída de ferramentas | 92.661 | 32.772 | −64,63% |
| Saídas com indicador de truncamento | 2 | 0 | eliminadas nesta amostra |
| Requisições ao modelo | 6 | 6 | mesma mediana |
| Critérios de qualidade, de 16 | 16 | 16 | preservados |

Cada linha é uma mediana calculada separadamente: medianas de componentes não
necessariamente somam a mediana do total. O principal ganho veio de contextos
menores, não de uma redução demonstrada do número de requisições.

O tempo otimizado variou de **63,87 a 88,08 segundos**, contra 71,50 a 131,71
na versão anterior. A entrada acumulada otimizada variou de **146.585 a 254.610**,
contra 189.718 a 432.894. Uma execução nova ainda usou mais entrada do que a
mediana anterior; não houve redução uniforme em todas as execuções.
Pelas médias, entrada caiu de 287.876 para 193.182,67 (−32,89%) e tempo de 92,29
para 72,03 segundos (−21,95%). Cache e concorrência não foram controlados.

## O que mudou

- **Leitor por ID:** `scripts/consultar.mjs` extrai a seção completa da referência
  canônica, com fonte, exemplos, verificação, notas e localização. Não há uma
  segunda cópia resumida das regras para manter atualizada.
- **Índice pequeno:** `--listar CSS` ou `--listar STACK DEC` mostra somente
  títulos. IDs já conhecidos podem ser consultados em um único lote.
- **Roteamento seletivo:** `SKILL.md` aponta regras iniciais por assunto e
  orienta reutilizar o que já foi lido. Uma análise abrangente ainda pode exigir
  o arquivo completo. A documentação local do Next continua sendo consultada
  quando a tarefa realmente envolve suas APIs.
- **Cobertura explícita:** o agente deve cobrir cada ponto do pedido. Se faltar
  base, faz uma consulta específica antes de encerrar o assunto. Isso corrigiu
  a omissão observada na primeira rodada da otimização.
- **Regras preservadas:** as nove referências ficaram byte a byte iguais à
  versão anterior. Todos os 130 IDs, fontes, exemplos e notas foram mantidos.

O entrypoint passou de 5.467 para 5.825 bytes. Ele não ficou menor; a economia
veio da quantidade de referências enviada ao modelo. Em uma amostra textual
determinística de 18 regras pertinentes aos casos, o leitor retornou 23.262
caracteres, contra 114.732 dos seis arquivos completos (−79,72%). Isso é tamanho
de texto, separado das medições reais de tokens acima.

## Qualidade e iterações

Os [casos](casos-eficiencia.md) mantêm os pedidos C1–C4. Apenas a restrição de
execução foi esclarecida para permitir o leitor da skill, sem executar a
aplicação. O [protocolo](protocolo-otimizacao.md) foi registrado antes das saídas.
O critério de aceitação de eficiência era reduzir pelo menos 25% da mediana de
entrada acumulada; o observado foi 26%. A rubrica e suas limitações são as da
[avaliação anterior](protocolo.md).

| Resposta bruta | C1 /4 | C2 /4 | C3 /4 | C4 /4 | Total /16 |
|---|---:|---:|---:|---:|---:|
| [Anterior — calibração](respostas-otimizacao/anterior-calibracao.md) | 4 | 4 | 4 | 4 | 16 |
| [Otimização v1 — 1](respostas-otimizacao/v1-1.md) | 4 | 4 | 3 | 4 | 15 |
| [Otimização v1 — 2](respostas-otimizacao/v1-2.md) | 4 | 4 | 4 | 4 | 16 |
| [Otimização v1 — 3](respostas-otimizacao/v1-3.md) | 4 | 4 | 4 | 4 | 16 |
| [Otimizada final — 1](respostas-otimizacao/final-1.md) | 4 | 4 | 4 | 4 | 16 |
| [Otimizada final — 2](respostas-otimizacao/final-2.md) | 4 | 4 | 4 | 4 | 16 |
| [Otimizada final — 3](respostas-otimizacao/final-3.md) | 4 | 4 | 4 | 4 | 16 |

Na v1, o primeiro agente deixou de consultar AUTH-03, embora C3 perguntasse sobre
HMAC; admitiu desconhecimento e perdeu esse critério. A instrução de cobertura
foi ajustada e os testes repetidos em três agentes novos. As três respostas
finais identificam HMAC como decisão local e mantêm a checagem de autorização,
`unknown`, `parsed.data`, `z.flattenError` com import e redirect fora do try.
As respostas v1 foram preservadas e não entram nas medianas da versão final.
O [entrypoint v1](entrypoint-otimizacao-v1.md) também foi preservado.

## Calibração e comparação com o controle

Uma nova execução da versão anterior, no mesmo período das novas, obteve
235.389 tokens de entrada, 39.037 sem cache e 82,07 segundos, com 16/16. Frente
a esse único ponto, a mediana otimizada teve −24,23% de entrada, −52,08% sem
cache e −21,84% de tempo. É calibração, não um braço com três repetições.

O controle histórico sem skill tinha mediana de 100.134,5 tokens de entrada e
60,89 segundos. A otimizada ainda ficou **78,11% acima em entrada** e **5,35%
acima em tempo**, enquanto preservou 16/16 em vez de 14/16. Portanto, a skill
continua tendo custo; a mudança reduziu esse custo mantendo o resultado na
rubrica. Não houve medição de produtividade futura ou retrabalho evitado.

## Verificação e reprodução

- Cinco testes do leitor passaram. Eles conferem todas as 130 extrações,
  preservação de notas/fontes, cabeçalhos dentro de blocos de código, ordem e
  deduplicação de IDs, rejeição de desconhecidos sem lote parcial, índice por
  prefixo e funcionamento fora da raiz.
- O teste foi escrito antes do leitor, falhou por módulo ausente e passou após
  a implementação. O leitor não mudou entre as duas rodadas comportamentais.
- Validador oficial de skill-creator e `verificar.py`: skill válida, 130 regras
  e nove links de referência; comparação confirmou IDs/títulos preservados.
- Não foram executados testes ou build da aplicação. Os snippets dos agentes
  são propostas, não uma entrega compilada do produto.

```powershell
node --test docs/research/evals-wellington/consultar.test.mjs
node .claude/skills/padroes-wellington/scripts/consultar.mjs FORM-17 FORM-18 AUTH-05
node .claude/skills/padroes-wellington/scripts/consultar.mjs --listar CSS
uv run python -X utf8 docs/research/evals-wellington/verificar.py
uv run python -X utf8 docs/research/evals-wellington/extrair-metricas.py --out docs/research/evals-wellington/metricas-otimizacao.json
```

Os [dados](metricas-otimizacao.json) incluem as 11 execuções históricas e as sete
novas, separadas por condição. O extrator confere a soma de usage por requisição
contra o acumulado do turno, sem dupla contagem. Não exporta chats ou credenciais.
Os dados originais permaneceram em [metricas-eficiencia.json](metricas-eficiencia.json).
O [entrypoint anterior](entrypoint-antes-otimizacao.md) identifica a versão de
comparação. O SHA-256 do entrypoint otimizado testado é
`8a2c109f64a902c4bde0af8158cd49e253b65ac4069ba111565c5607aa1fbab6`.

## Limites

A amostra continua pequena, sem randomização, julgamento cego ou controle de
cache/carga. São os mesmos casos usados para desenvolver a skill, não validação
inédita. O host injeta instruções/AGENTS mesmo em agentes sem histórico; o novo
teste de calibração compartilhou esse ambiente com os novos testes. O número
de tokens em cache não se traduz diretamente em cobrança ou consumo do plano.

16/16 cobre apenas a rubrica principal. As propostas de C2 ilustram componentes
de apresentação cujos caminhos e props precisam ser conferidos no projeto real;
não demonstram que o módulo compila. A comparação verifica a eficiência do
processo de consulta e a aderência aos critérios, não todos os aspectos do app.
Não se mediu descoberta automática da skill nem o custo isolado de uma tarefa
CSS curta.
