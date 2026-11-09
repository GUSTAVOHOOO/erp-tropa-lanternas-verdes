# Movimento cinematográfico OANET — 2026-11-07

**Estado:** concluído e revisado. **Integração:** Codex. **Base:** HEAD 148aa4f,
com a implementação local da galáxia, vidro, sidebar sticky e 25 construtos
preservada. Pedido explícito: animações originais em vetores, construtos e
componentes, com reações e variações leves de cor; delegação ao Claude Code.

## Desenho e aceite

Camadas complementares: movimentos próprios dos construtos; rotação lenta
de instrumentação, energia da bateria e atmosfera da cidade/galáxia; respostas
de controles e painéis a hover/foco/seleção. Mantém-se preto puro e verdes,
sem flashes ou deslocar texto enquanto o usuário lê. Tempos lentos para ambiente,
150–300ms para respostas. SVG/CSS originais; sem bibliotecas novas ou assets raster.

- Cada um dos 25 construtos recebe movimento visível com identidade temática.
- Emblema, bateria, cidade e estrelas/nebulosa recebem camadas animáveis.
- Botões, navegação, campos, selos, medidores, gráficos e molduras respondem.
- Movimento contínuo para com modo calmo, preferência reduzida, aba oculta ou
  objeto fora da área visível; listeners/observers são liberados.
- Nenhuma alteração em API, dados reais, dependências ou permissões persistentes.
- Verificação: suíte pertinente, lint, build e observação do movimento em runtime
  quando a conexão do navegador permitir; limitações precisam ser relatadas.

## Responsáveis e contratos

1. Claude/construtos: somente `ConstructosHumanos.tsx`,
   `ConstructosCosmicos.tsx`, `movimento-construtos.css` em `components/oanet/`.
2. Claude/vetores: somente `EmblemaOa.tsx`, `ConstructosOa.tsx`,
   `FundoCosmico.tsx`, `movimento-vetores.css` na mesma pasta.
3. Claude/componentes: somente `components/oanet/movimento-componentes.css`.
4. Codex: `app/globals.css` (imports e política de pausa), `LaboratorioOa.tsx`,
   `PainelOa.tsx`, hook de ciclo de vida, testes, integração e este registro.

Contrato CSS: escopo `.oa-lab`; keyframes `oa-motion-*`; nenhum seletor global
de SVG/path; não substituir transform geométrico SVG existente. Objetos vetoriais
animados marcam o SVG raiz com `data-oa-motion="..."`; o coordenador controla
`data-offscreen="true"` nesse objeto ou painel. Não usar SMIL, timers internos,
loops JS, animar filtros de tela inteira nem ocultar conteúdo antes de interação.
Cada worker verifica seu lint e relata comandos/resultado. Não comitar.

Fontes de instrução: AGENTS.md, docs/agents/README.md/MAPA.md/TAREFA.md,
frontend-web, Next local CSS e Server/Client Components; skills impeccable
(`reference/animate.md`) e orchestration/orca-cli carregadas nesta sessão.

## Implementação e evidências

Três workers reais de Claude Code no Orca (`run_93bd862b7fca`) entregaram
os arquivos sob propriedade exclusiva. Correções de integração: índice das
janelas de TorreOa; prefixos dos keyframes ambientais para impedir colisão;
highlights dos construtos por tokens; varredura de moldura em filetes com
transform/opacity, substituindo gradientes que repintavam o painel inteiro.

O hook `useMovimentoOa` centraliza IntersectionObserver e MutationObserver,
registrando também SVGs substituídos pelo seletor. Inicializa cada alvo pausado,
ativa ao entrar na área visível, remove alvos antigos e libera os observers.
O diálogo em Portal recebe modo calmo e aba oculta explicitamente.

- `npm exec -- vitest run __tests__`: exit 0, 29 arquivos, 150 testes.
  Inclui entrada/saída de viewport, troca dinâmica de SVG, cleanup e
  propagação das preferências ao diálogo em Portal. Os dois casos de lifecycle
  falharam antes da implementação e passaram após o hook.
- `npm run lint`: exit 0. Um alias de `this` no mock de teste foi corrigido.
- `npm run build`: exit 0 na repetição, com TypeScript e 13 páginas geradas.
  A primeira execução novamente foi interrompida pelo aviso de segurança
  pré-existente do Next 16.4.0; dependências não foram alteradas.
- `git diff --check`: exit 0.
- Navegador real do Orca, prévia de produção na porta 3002: todos os 25
  construtos foram selecionados pelo controle nativo e inspecionados entre
  quadros. Todos mostraram mudanças efetivas e 8–16 animações em camadas.
  [Resultado por membro](verificacao/movimento-25-construtos.json).
- Auditoria da cor no jato de Hal: oito camadas `oa-motion-pulso` tiveram
  valores OKLab diferentes entre quadros (luminosidade próxima de 0,84),
  confirmando highlight verde sutil real, além de movimento/opacidade.
- Desktop: sidebar em `top:18px` após scroll de 900px; zero animações rodando
  nos alvos fora da tela e nenhuma rolagem horizontal. Hover deslocou o ícone
  de ação em 2px; foco de campo manteve outline visível. Console sem erros.
- Celular de 390×844: SVG de 312×208 dentro do viewport, sem overflow horizontal;
  animações do mecha ativas. [Desktop](verificacao/movimento-desktop.png) e
  [celular](verificacao/movimento-celular.png) são capturas da página real.
- `prefers-reduced-motion: reduce`: zero animações em execução e zero no
  construto. Modo calmo com diálogo aberto: zero no documento e no diálogo.
  Ocultação de aba e retorno também cobertos pelo teste do evento visibilitychange.
- Fluidez: amostras curtas de rAF no host variaram, com média próxima de 42ms
  no painel com o mapa Canvas, inclusive após trocar o material da borda.
  Não constitui garantia de 60fps ou auditoria de desempenho. A versão anterior
  com gradientes animados no painel foi substituída; não há animação de filtros
  de tela inteira nem novos loops JS. O mapa Canvas existente continua usando
  seu próprio ciclo de pausa.

## Revisão final

Claude Code (`ctx_59a307bdec94`, tarefa `task_358397ea9ccb`) revisou a integração
em modo somente leitura e não encontrou defeitos acionáveis. Conferiu a
correspondência classes/estilos, wrappers sem transform geométrico sobrescrito,
escopo `.oa-lab`, preferências de pausa e propagação ao Portal. Observação sem
bloqueio: construtos reiniciam a animação ao voltar à área visível; os demais
vetores retomam o mesmo ponto. Não ficaram ajustes obrigatórios.

Aceite: movimento dos 25 construtos e dos vetores ambientais, reações dos
componentes, variação sutil de cor, integração e controles de pausa verificados.
Prévia de produção atualizada mantida em `http://localhost:3002/laboratorio`.
