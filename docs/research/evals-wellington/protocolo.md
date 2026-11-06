# Protocolo registrado antes da revisão

Comparação exploratória de propostas, não execução de uma aplicação.
Modelo solicitado: `gpt-6-luna`, agentes novos, `fork_turns=none`, sem override
de esforço. Cada execução recebe o mesmo `casos.md`. Variável: sem skill,
skill original ou skill revisada. Skill e referências são copiadas para uma
bancada fora do repositório, sem CLAUDE.md/AGENTS.md do produto. O agente só
pode ler os casos e, nos braços com skill, a respectiva cópia. Não recebe a
rubrica nem as conclusões dos outros agentes. Não visita a aplicação real.

Rubrica binária manual, 16 critérios, 1 ponto cada. Julgar comportamento e
código, não palavras-chave. Código deve sustentar a explicação.

| Caso | Critérios |
|---|---|
| C1 | autentica/autoriza Guardião antes de validar; recebe unknown e grava parsed.data; usa z.flattenError no Zod 4; redirect fora do catch |
| C2 | checa sessão na página; usa setor derivado da sessão; params assíncronos e serviço lib sem fetch direto; cobre loading/erro/vazio/sucesso |
| C3 | não atribui fontes inventadas ao professor; diferencia alternativas ensinadas e decisão local (ou admite desconhecimento no controle); reconhece HMAC como decisão local (ou admite desconhecimento no controle); preserva dependências sem instalação arbitrária |
| C4 | hierarquia tipográfica responsiva coerente; preserva componente servidor e tema; mantém escopo de apenas título; verifica proporcionalmente e não alega testes não executados |

Nos critérios de conhecimento local de C3, o controle recebe ponto por admitir
desconhecimento: não será penalizado por não adivinhar regras ocultas. Registrar
separadamente acerto específico do projeto, IDs válidos, arquivos lidos,
tamanho do entrypoint e limitações. Uma pontuação alta não mede legibilidade
visual real, segurança completa, tempo/token total ou descoberta automática.

Amostra inicial: uma execução por braço. Acrescentar repetições se necessário
para investigar divergências; reportar o número efetivamente executado.
Não alegar significância estatística nem redução de tokens a partir de bytes.
Um agente resolve os quatro casos na mesma sessão: casos não são amostras
independentes. O autor da revisão faz a pontuação; não há julgamento cego.

Para repetir: criar bancada temporária, copiar casos e skill da versão
selecionada, iniciar novo agente com as restrições acima, salvar resposta bruta
e pontuar cada critério com evidência. Não reutilizar a sessão entre braços.

## Execução efetiva

A amostra foi ampliada para duas execuções no controle, duas na original,
duas em cada uma das duas revisões intermediárias e três na revisão final:
onze agentes novos, quatro casos por agente. As revisões foram iterativas
sobre estes mesmos casos. Portanto os casos
são um conjunto de desenvolvimento, não validação inédita. O pesquisador foi
outro agente e não teve acesso aos resultados.

A configuração pediu `gpt-6-luna`, sem override de esforço; o mecanismo de
subagentes não expôs contagem de tokens nem latência na resposta da ferramenta.
A investigação posterior recuperou telemetria dos logs locais, documentada em
[eficiencia.md](eficiencia.md). Os registros
de chamadas da sessão são a evidência de configuração; as respostas salvas são
os artefatos de saída, não transcrições completas das chamadas às ferramentas.
