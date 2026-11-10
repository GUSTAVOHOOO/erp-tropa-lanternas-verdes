# Galáxia, vidro e construtos — 2026-11-07

**Estado:** implementação concluída. A inspeção de navegador, inicialmente indisponível,
foi complementada na [etapa de movimento](movimento-cinematografico.md).
**Responsável e integração:** Codex.
**Base:** árvore inicialmente limpa; continuação da direção aprovada em docs/UI.md.

## Escopo e desenho

Pedido: espaço sutil atrás de uma interface de vidro, molduras angulares mais
espessas com pulsação e construtos próprios para os Lanternas pesquisados.
Camadas: campo estelar SVG determinístico, nebulosas desfocadas, vidro escuro
translúcido e conteúdo opaco legível. Sem imagens raster ou dependências novas.
A animação não altera o espaço ocupado; modo calmo, aba oculta e preferência
de movimento reduzido suspendem os efeitos. O mapa interativo continua separado.

## Responsáveis e contratos

- Codex: `FundoCosmico.tsx`, `GaleriaConstructos.tsx`, integração em
  `LaboratorioOa.tsx`/`TelasOa.tsx`, `app/globals.css` (somente `.oa-lab`), documentação.
- Agente SVG humanos: somente `components/oanet/ConstructosHumanos.tsx` — grupo A.
- Agente SVG cósmicos: somente `components/oanet/ConstructosCosmicos.tsx` — grupos B/C/D.
- Cada coleção exporta um array `{ nome, titulo, descricao, Arte }`; Arte recebe
  `{ className?: string }`, desenha SVG viewBox 0 0 480 320, usa currentColor,
  IDs por instância e não depende de CSS novo. Sem mudar os dados do ERP.
- Codex também possui `dados-demo.ts` (somente união de telas e título da nova
  navegação), `PainelOa.tsx` (pausa de molduras fora da área visível),
  `GalaxiaProcedural.tsx` (modo calmo pausa o mapa) e testes correspondentes.

Tentativas de delegação pelo `agy`: primeira recusou `--print-timeout 600`
(requer unidade); nova execução com `600s` foi negada por permissão de comando
no modo sem interface. Tentativas com regra temporária `command(*)` ficaram
mais de seis minutos sem saída ou arquivos; os dois processos próprios foram
encerrados. A implementação foi redistribuída a agentes internos, com os mesmos
limites de propriedade. Nenhuma configuração persistente de permissão mudou.

Interpretações artísticas são identificadas como estudos, não como fatos canônicos.
Referências: pesquisa existente em `docs/research/lanternas/`;
[construtos na DC](https://www.dc.com/blog/2024/03/14/green-with-creativity-the-five-best-green-lantern-constructs),
[John Stewart](https://www.dc.com/characters/john-stewart),
[campo estelar Webb](https://www.jpl.nasa.gov/news/nasas-webb-explores-largest-star-forming-cloud-in-milky-way/).
As referências informam a composição; nenhum asset externo é incorporado.

## Plano e aceite

- [x] Criar campo cósmico estático determinístico e vidro com fallback sem blur.
- [x] Refinar molduras sem deslocamento de layout e com pausa dos efeitos.
- [x] Produzir construtos distintos dos 25 membros pesquisados e galeria com seletor nativo rotulado.
- [x] Integrar construto à ficha dos quatro membros da demonstração.
- [x] Verificar suíte da aplicação, lint, TypeScript e build.
- [ ] Conferir layout em navegador desktop/celular e foco visual: conexão indisponível.
- [x] Registrar comandos, resultados e limites nesta tarefa.

Guias consultados: Next local `01-app/01-getting-started/11-css.md`;
skill canônica frontend-web e referência `estilo/tema-e-tokens.md`.
Estende o CSS artístico existente, autorizado pelo pedido; tokens locais,
Base UI e contratos de dados permanecem preservados.

## Verificação e evidências

- `npm exec -- vitest run __tests__`: exit 0, 28 arquivos e 146 testes.
  Inclui seleção de construtos humanos/cósmicos, preservação dos quatro membros
  da demonstração e modo calmo sem possibilidade de retomar movimento.
- `npm run lint`: exit 0, após remover os scripts temporários de renderização.
  Uma tentativa intermediária encontrou apenas imports CommonJS desses scripts,
  que não fazem parte da entrega.
- `npm run build`: compilação e TypeScript passaram; primeira execução terminou
  com exit 1 pelo aviso de segurança do Next 16.4.0 já registrado anteriormente.
  Repetição do mesmo comando: exit 0, 13 páginas geradas, incluindo `/laboratorio`.
  Atualização de dependências não faz parte desta tarefa; o aviso continua válido.
- `git diff --check`: exit 0.
- `npm run start -- --port 3002`: servidor de prévia iniciado; requisição HTTP
  para `http://localhost:3002/laboratorio`: 200, com céu, painéis, navegação de
  construtos e conteúdo inicial presentes no HTML. Servidor mantido para revisão.
- Renderização estática com React DOM Server + Sharp dos 25 SVGs: exit 0.
  Revisão visual das duas pranchas e do céu; SVGs sem imagens externas,
  títulos identificados por instância e silhuetas distintas. A primeira passagem
  encontrou título SVG cósmico com filhos múltiplos; corrigido para string única,
  e a renderização foi repetida sem avisos.
- Revisão independente estática: corrigiu gradientes das nebulosas e pausa do
  mapa no modo calmo; nova revisão não encontrou pendências nesses pontos.
- Navegador: falhou a conexão tanto com host do navegador quanto com pipe de
  aplicativos nativos. Nenhuma afirmação de auditoria de acessibilidade,
  responsividade ou desempenho em navegador decorre dos testes unitários.

Pranchas de arte (não capturas da página):
[céu](verificacao/ceu-svg.png),
[sete humanos](verificacao/construtos-humanos.png),
[dezoito cósmicos](verificacao/construtos-cosmicos.png).
As imagens são evidências de QA; o laboratório continua renderizando a arte
em SVG, sem carregar esses PNGs.

## Ajustes solicitados após a primeira revisão

- Fundo do laboratório e do cenário em preto puro; nebulosas somente em
  verdes de matiz 151, com estrelas claras levemente esverdeadas.
- Sidebar fixa durante o scroll no desktop (a partir de 1100px) por `sticky`,
  com altura limitada à janela e rolagem interna quando necessário. O menu
  recolhível do celular mantém seu comportamento.
- Verificação desses ajustes: `npm run lint` exit 0; `npm run build` exit 0
  após repetir pelo mesmo aviso já conhecido do Next. Prévia do céu SVG
  renderizada novamente e conferida em verde sobre preto; servidor da porta
  3002 reiniciado com o build atualizado. Scroll real no navegador permanece
  sem inspeção nesta sessão.
