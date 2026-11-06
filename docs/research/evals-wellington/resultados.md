# Avaliação e melhoria de padrões Wellington

> Versão atual: [otimização da leitura](otimizacao.md). Este documento registra
> a rodada de qualidade anterior à otimização de tokens.

> Complemento posterior: [tokens e tempo medidos](eficiencia.md), recuperados dos
> registros locais das 11 execuções. O ganho de qualidade abaixo não implica
> economia: a versão final consumiu mais entrada e tempo que o controle.

Data: 2026-11-06. A skill foi revisada no caminho canônico
`.claude/skills/padroes-wellington/`. A pesquisa de fontes primárias está em
[2026-11-06-skills-padroes-wellington.md](../2026-11-06-skills-padroes-wellington.md).

## Resultado observado

Na rubrica principal, a versão final atendeu aos 16 critérios nas três execuções.
A original obteve 15 e 14; o controle sem skill, 14 e 14. O ganho observado foi
na revisão da Server Action: receber `unknown`, usar dados validados e aplicar
o formato de erro definido pelo projeto para Zod 4 no código proposto.
Isso é evidência exploratória nestes casos, não prova de qualidade geral.

| Condição | Execuções | Pontos por execução, de 16 |
|---|---:|---|
| Sem skill | 2 | 14, 14 |
| Skill original | 2 | 15, 14 |
| Primeira revisão | 2 | 16, 15 |
| Segunda tentativa | 2 | 14, 15 |
| Skill final | 3 | 16, 16, 16 |

Onze agentes de avaliação novos, todos configurados como `gpt-6-luna`, com
`fork_turns=none` e sem override de esforço, responderam aos mesmos quatro
casos: 44 propostas de resposta. Um agente separado fez a pesquisa e não leu
os resultados. Não eram 44 amostras independentes: cada agente resolveu quatro
casos no mesmo contexto. A extração posterior confirmou `gpt-6-luna` nos registros
`turn_context`, sem verificar a identidade interna do backend servido.

## Casos, rubrica e evidência

Os [casos](casos.md) e o [protocolo](protocolo.md) foram escritos antes da primeira
revisão. Cada caso tem quatro critérios binários; a pontuação foi manual,
com leitura do código, pelo autor das mudanças, sem julgamento cego.

| Resposta bruta | C1 | C2 | C3 | C4 | Total |
|---|---:|---:|---:|---:|---:|
| [Controle 1](respostas/controle-1.md) | 2 | 4 | 4 | 4 | 14 |
| [Controle 2](respostas/controle-2.md) | 2 | 4 | 4 | 4 | 14 |
| [Original 1](respostas/original-1.md) | 3 | 4 | 4 | 4 | 15 |
| [Original 2](respostas/original-2.md) | 2 | 4 | 4 | 4 | 14 |
| [Intermediária 1](respostas/intermediaria-1.md) | 4 | 4 | 4 | 4 | 16 |
| [Intermediária 2](respostas/intermediaria-2.md) | 3 | 4 | 4 | 4 | 15 |
| [Tentativa 2, execução 1](respostas/tentativa-2-1.md) | 2 | 4 | 4 | 4 | 14 |
| [Tentativa 2, execução 2](respostas/tentativa-2-2.md) | 3 | 4 | 4 | 4 | 15 |
| [Final 1](respostas/final-1.md) | 4 | 4 | 4 | 4 | 16 |
| [Final 2](respostas/final-2.md) | 4 | 4 | 4 | 4 | 16 |
| [Final 3](respostas/final-3.md) | 4 | 4 | 4 | 4 | 16 |

Evidências das falhas e das correções:

- **C1, entrada validada:** os controles e Original 2 mantiveram o objeto tipado
  na entrada, apesar de validarem e usarem `parsed.data`. Original 1 já recebeu
  `unknown`. As três respostas finais usam `unknown` e `parsed.data` juntos.
- **C1, erro Zod:** controles e originais mantiveram `parsed.error.flatten()`.
  Original 1 reconheceu FORM-18 no texto, mas conservou a chamada no código para
  “conservar o formato solicitado”. O caso não exigia essa chamada antiga.
  A avaliação cobra o padrão registrado pelo projeto; não afirma que `.flatten()`
  seja necessariamente inexistente em toda instalação de Zod 4.
- **C1, bloco completo:** Intermediária 2 usou `z.flattenError` sem importar `z`
  no bloco; recomendou acrescentar o import apenas depois. O critério foi
  considerado incompleto porque o código apresentado não sustentava a correção.
- **Variabilidade:** a segunda tentativa voltou a manter `.flatten()` em ambas
  as execuções e omitiu `unknown` em uma. A melhoria textual genérica não bastou.
  O ajuste final tornou explícita uma checagem condicional das regras que uma
  action precisa aplicar juntas. As três execuções finais fizeram isso.
- **C2:** todas as condições propuseram sessão na página, setor derivado da
  sessão, serviço em `lib/`, `searchParams` assíncrono e os quatro estados de tela.
- **C3:** o controle admitiu desconhecimento das decisões locais, recebendo
  crédito por honestidade, conforme previsto. Os braços com skill separaram
  decisões do projeto de exigências docentes. A rubrica não exige reprodução
  exaustiva de cada citação; precisão fina foi observada separadamente abaixo.
- **C4:** todas as condições mantiveram tema e componente servidor, alterando
  apenas tipografia responsiva e propondo verificação visual proporcional.

## Mudanças aplicadas

1. Descrição com escopo explícito neste ERP, reduzida de 645 para 279 caracteres.
2. Roteamento por assunto com cruzamentos: action privada também envolve
   autenticação; gravação envolve API; navegação envolve regras de redirect.
3. Checagem condicional de Server Actions com dados, baseada nas falhas observadas.
   Os outros assuntos continuam nas referências consultadas sob demanda.
4. Conferência dos imports, das assinaturas reais e da coerência entre explicação
   e código proposto. Exemplos não substituem o contrato real do projeto.
5. Distinção entre fonte mista, escolha local e conteúdo do professor, inclusive
   a limitação de não ter conferido o PDF.
6. Catálogo de PDFs e manutenção movidos para referência própria, com a base
   correta dos caminhos. Nenhum PDF foi revalidado nesta tarefa.
7. Dez trechos de verificação corrigidos em quatro referências: `rg -L` foi
   substituído por `--files-without-match` quando aplicável; pipelines de `xargs`
   receberam versões PowerShell. Busca textual foi identificada como triagem.
8. Apontador curto em `AGENTS.md` para o arquivo canônico. Não se criou uma cópia
   concorrente nem se registrou a skill no catálogo nativo de descoberta.

O entrypoint passou de 106 para 87 linhas e de 5.974 para 5.467 bytes UTF-8.
Isso mede tamanho de arquivo, não tokens, latência ou custo total. As referências
foram mantidas; os agentes finais declararam consultar seis, sete e seis
referências respectivamente, contra seis em cada execução original. Não houve
redução demonstrada de leituras totais.

## Verificações realizadas

- Validador oficial de skill-creator: `Skill is valid!`, executado via
  `uv run --with pyyaml python -X utf8 .../skill-creator/scripts/quick_validate.py`.
  O modo UTF-8 foi necessário porque o Python do Windows tentou CP1252.
- [verificar.py](verificar.py): 130 IDs únicos com fontes e verificações,
  nove referências vinculadas existentes e apontador em `AGENTS.md`. Comparação
  com a cópia original confirmou os mesmos IDs, títulos e arquivos de regras.
- Dois pipelines corrigidos, de API e resolver de formulário, foram executados
  em fixtures PowerShell com um arquivo correto e um defeituoso: encontraram
  somente o defeituoso. Isso não valida automaticamente todos os comandos das
  referências nem a lógica completa da aplicação.
- `git diff --check` nos arquivos alterados pela tarefa: sem erros de whitespace.
- Não foram executados testes, lint ou build da aplicação: esta tarefa alterou
  instruções, documentação e artefatos da avaliação, não código do produto.

Para repetir a validação estrutural a partir da raiz:

```powershell
uv run python -X utf8 docs/research/evals-wellington/verificar.py
```

A versão original corresponde à skill no commit
`77a0c39c0cd1ba73a01d987a169000140f17b691`.
Os entrypoints intermediários foram preservados em
[primeira revisão](entrypoint-intermediario.md) e
[segunda tentativa](entrypoint-tentativa-2.md).
O SHA-256 do entrypoint final nesta avaliação é
`5B7D8F079544612B085FE58C23F204E40A838FA76D5226F046DA0DC8C9989CF2`.
Para repetir a comparação comportamental, siga o protocolo e use agentes novos;
não reutilize os resultados salvos como parte do prompt.

## Limites e pontos que ainda merecem atenção

- Os mesmos casos orientaram as revisões. Não há conjunto inédito de validação,
  significância estatística nem comparação equilibrada de três repetições em
  todos os braços. A última rodada indica melhora local, sujeita a sobreajuste.
- A skill foi indicada explicitamente nos testes. Não se mediu descoberta
  automática, falsos acionamentos ou funcionamento do catálogo do cliente.
  O apontador de `AGENTS.md` é orientação de projeto, não registro nativo.
- Os agentes produziram propostas em Markdown. Elas não foram compiladas,
  renderizadas ou exercitadas em uma aplicação. O controle recebeu crédito pela
  intenção de exigir Guardião; o literal interno `'guardiao'` não estava informado
  no contexto comum, portanto não penalizamos sua grafia `'Guardião'`.
- Os 16 critérios não esgotam as regras. Final 2, por exemplo, cita AUTH-02 ao
  falar de HMAC, cujo ID específico é AUTH-03. Também captura o erro da listagem
  numa mensagem estática, sem implementar a tentativa novamente. Esses detalhes
  limitam o significado de 16/16: não equivale a aderência integral da resposta.
- A rodada inicial não instrumentou tokens/tempo; a [análise posterior](eficiencia.md)
  recuperou essas métricas dos registros locais. Não houve auditoria completa de
  atualização de todas as regras ou dos slides. As respostas são artefatos brutos; suas afirmações
  não são endosso automático de cada trecho de código ou citação.

A recomendação decorrente é manter o fluxo curto, as fontes e os IDs estáveis,
e reaplicar estes testes quando surgir uma falha real. Uma próxima avaliação
mais forte usaria tarefas inéditas, compilação dos exemplos e rubrica ampliada
para fontes exatas e comportamento de retry, além de discovery no cliente real.
