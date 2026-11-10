# OANET — laboratório gerado em código

**Data:** 2026-11-06. **Endereço:** `/laboratorio`.
**Estado:** prévia aprovada pelo usuário; migração das rotas reais ainda pendente.
**Guia para continuidade:** [Redesign OANET](../../UI.md).
**Prévia local deixada em execução:** `http://localhost:3002/laboratorio`,
com `npm run start -- --port 3002`. Porta 3000 estava ocupada; nenhum processo
desconhecido foi encerrado para liberá-la.
**Responsável e integração:** Codex; SVG e galáxia tiveram responsáveis
independentes, com revisão estática adicional.

## Escopo entregue

Vitrine navegável com sete telas demonstrativas: Central, Ocorrências,
Lanternas com ficha selecionável, Componentes, Portal de Oa, Acesso e
Nova ocorrência. Ocorrências têm busca, filtro, estado vazio e dossiê.
Formulários validam localmente e informam que não houve persistência.

Os visuais usados no laboratório são gerados em código:

- Molduras CSS com recortes assimétricos, terminais e linhas de energia.
- 26 ícones SVG originais e emblema com instrumentação circular.
- Bateria de energia dimensional e arquitetura de Oa em SVG.
- Galáxia Canvas com 4.200 partículas, estrelas, órbitas, seleção de setor,
  zoom, pausa e recentralização. Não utiliza a imagem da exploração anterior.
- Gráficos, medidores e indicadores vetoriais.

Reutiliza botões e campos Base UI existentes, com aparência própria.
Nenhuma nova dependência. As fontes já existentes no projeto continuam
servidas localmente pelo Next. Nenhuma imagem, ícone de biblioteca ou recurso
externo é solicitado pelo laboratório durante a navegação verificada.

O nome OANET e o universo da Tropa vêm das referências fornecidas. Dados,
indicadores e operações são ilustrativos; a vitrine não implementa uma nova
API nem altera os dados de demonstração do ERP.

## Arquivos e contratos

- `app/laboratorio/page.tsx`: rota pública e metadados.
- `components/oanet/LaboratorioOa.tsx`: casca e navegação das telas.
- `CentralOa.tsx`, `TelasOa.tsx`, `ComponentesOa.tsx`: composição das telas.
- `PainelOa.tsx`: molduras, botão, selo, medidor e linha de sinal reutilizáveis.
- `IconeOa.tsx`, `EmblemaOa.tsx`, `ConstructosOa.tsx`: arte vetorial.
- `GalaxiaProcedural.tsx`, `galaxia.ts`: desenho e geração determinística.
- `dados-demo.ts`: exemplos locais e nomes das telas.
- `app/globals.css`: estilos e tokens sob o prefixo `oa-`, com tema
  limitado a `.oa-lab`; preserva os tokens e estilos das telas atuais.
- `__tests__/components/laboratorio-oanet.test.tsx`: interação e acessibilidade.
- `__tests__/lib/galaxia.test.ts`: partículas, limites e precisão de serialização.

Os dados reais, sessão, serviços, actions, configuração, dependências e regras
acadêmicas não foram alterados. Alterações locais anteriores foram preservadas.

## Verificações e ajustes

- Testes escritos antes da implementação; a ausência inicial dos módulos
  foi observada. Testes de interação detectaram números decorativos entrando
  no nome acessível dos botões e nomes de campos contaminados por mensagens
  de erro. Ambos foram corrigidos.
- Revisão adicional detectou foco do menu mobile e atualização de luminosidade
  no Canvas; corrigidos, com foco e estado verificados no navegador.
- O navegador detectou diferenças de precisão entre Node e Chromium em
  atributos SVG calculados por trigonometria. Atributos serializados com
  precisão fixa; recarga limpa mostrou apenas logs informativos do React/HMR.
- Inspeção visual no navegador integrado do Orca em 1536px, 820px e 375px.
  Documento sem overflow horizontal nos tamanhos conferidos; tabela tem
  sua própria área de rolagem em telas pequenas.
- Confirmados no navegador: setor, zoom, pausa, luminosidade, menu com foco,
  fechamento de diálogo por Escape e preferência de movimento reduzido.
- Leitura dos recursos de navegação: zero URLs de origem externa e zero
  elementos `img` ou `image` no laboratório.
- Revisão estática final: nenhum achado substantivo restante.

### Comandos executados

| Comando | Resultado |
|---|---|
| `npm exec -- vitest run __tests__` | 27 arquivos / 143 testes aprovados, saída 0 |
| `npm exec -- vitest run __tests__/components/laboratorio-oanet.test.tsx __tests__/lib/galaxia.test.ts` | 19 testes aprovados após o último ajuste do teste de acessibilidade |
| `npm run lint` | Saída 0, sem erros |
| `npm run test:run` | 143 testes aprovados, mas saída 1 pela falha histórica de coleta de `docs/research/evals-wellington/consultar.test.mjs` |
| `node --test docs/research/evals-wellington/consultar.test.mjs` | Cinco testes aprovados no executor correto |
| `npm run build` | Primeira tentativa detectou uma opção inválida no tipo de um teste; corrigida. Tentativa seguinte compilou, passou TypeScript e gerou as rotas, mas terminou com o alerta de segurança histórico do Next 16.4.0 |
| Repetição de `npm run build` | Saída 0: compilação, TypeScript e 13 páginas estáticas geradas; incluiu `/laboratorio`. O aviso sobre a versão do Next permanece |
| `npm exec -- tsc --noEmit --incremental false` | Saída 0 após a correção da opção do teste |
| `npm run start -- --port 3002` | Servidor de produção pronto; rota aberta e inspecionada no navegador |
| Busca por imagens, URLs externas, lucide e estilo inline no código novo | Nenhuma ocorrência |
| `git diff --check` | Sem erros; avisos LF/CRLF em README e db.json preexistentes |

O aviso de segurança do Next continua aplicável: a dependência não foi
atualizada nesta tarefa visual. O erro histórico do comando geral de testes
também não foi alterado. Não foi declarada uma auditoria WCAG completa.

## Como revisar

Abra `/laboratorio` com o servidor local em execução. A aba Componentes reúne
os elementos reutilizáveis; Visão geral mostra a galáxia. As outras opções
do menu trocam os estudos de tela. O link Voltar ao sistema atual retorna
ao ERP existente.

Os PNGs da primeira exploração foram preservados como referência histórica,
mas não são usados pelo laboratório. A próxima integração aos fluxos reais
deve preservar a autenticação, os contratos e as permissões existentes.

Capturas de inspeção em `verificacao/`: Central e Componentes em desktop,
e Componentes em 375px. São evidências de QA, não assets utilizados pela UI.

## Documentação e versionamento

Em 2026-11-06 o usuário aprovou a prévia e solicitou seu commit e documentação.
O guia `docs/UI.md` consolida a identidade, o inventário dos componentes e a
continuação do trabalho. A suíte foi reexecutada antes do commit: 143 testes
da aplicação aprovados; lint com saída 0 e links locais da documentação válidos.

O escopo do commit reúne o laboratório, os testes, o contexto de design e os
artefatos desta exploração visual. As alterações anteriores em AGENTS.md,
CLAUDE.md, README.md, db.json, skills de backend e documentação de agentes
permanecem fora deste commit.
