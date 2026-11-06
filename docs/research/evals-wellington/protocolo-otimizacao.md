# Otimização de leituras — protocolo antes das novas saídas

Usar os mesmos pedidos C1–C4 e a mesma rubrica de 16 critérios. A única mudança
no arquivo de casos é esclarecer que a proibição de executar código se refere
à aplicação: o leitor de referências da skill pode ser executado.

Modelo: `gpt-6-luna`, agentes novos com `fork_turns=none`, sem override de esforço.
Cada agente recebe apenas os casos, o caminho da cópia da skill e a autorização
para seus arquivos/referências/helpers, sem rubrica nem conclusões anteriores.
Artefatos ficam em pasta temporária; respostas brutas são preservadas depois.

Comparação: três execuções da skill otimizada contra as três da versão final
anterior já medidas. Uma nova execução da versão anterior serve de calibração
nas condições atuais, com o mesmo prompt de autorização. Não é um experimento
randomizado: relatar histórico, calibração e otimizada separadamente.

Critérios de aceitação: manter 16/16 na rubrica principal nas três novas saídas,
preservar as 130 regras/fontes/exemplos do catálogo, não produzir saídas de
consulta truncadas e reduzir a mediana da entrada acumulada em pelo menos 25%
frente à versão final anterior. O tempo é medido, sem promessa de redução fixa.

Métricas: telemetria local, com o extrator já validado; input acumulado, cache,
input sem cache, output, chamadas, maior entrada e tempo task_started/task_complete.
Não converter caracteres em tokens nem tokens em cobrança monetária. Registrar
também a qualidade fora da rubrica se surgirem citações ou trechos incompletos.

Validação do leitor: teste de seleção integral de todas as 130 regras, fontes e
notas; cabeçalhos dentro de code fences não delimitam regras; IDs duplicados na
consulta são deduplicados; desconhecidos rejeitam o lote sem saída parcial;
índice lista só títulos; execução funciona fora da raiz. Testes escritos antes
da implementação, falharam por leitor ausente e passaram após sua criação.

## Iteração adicional

Na primeira revisão otimizada, uma execução deixou de consultar o assunto HMAC
pedido em C3 e declarou desconhecimento: perdeu um critério. A instrução de
seleção foi ajustada para cobrir todos os pontos explícitos antes da entrega.
Preservar as três saídas v1 e repetir os três testes em agentes novos da versão
final; não misturar versões no resumo de aceitação. O leitor não mudou.
