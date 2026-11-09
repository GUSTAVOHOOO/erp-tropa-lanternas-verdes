# OANET — UI oficial do sistema

**Decisão D28, confirmada pelo usuário em 2026-11-09:** o laboratório passa a
ser a base visual oficial do front existente e das features planejadas com a
API NestJS. Toda tela nova ou migrada deriva dos componentes e assets abaixo.
O front antigo conserva valor funcional durante a transição; sua aparência,
`/design-system` antigo e as pranchas raster não orientam o design novo.

**Estado real:** a base visual está implementada; as rotas reais ainda não
foram migradas integralmente. Não confundir aprovação do design com integração
pronta. [Handoff de implementação](agents/HANDOFF-OANET.md),
[plano](PLANO.md), [migração de dados](frontend/MIGRACAO.md).

Em 2026-11-09, a casca UI-01 herdada permanece parcial, sem aceite final. O usuário suspendeu a implementação para estruturar e revisar a [DOC-03](agents/DOC-03-PLANEJAMENTO.md); a decomposição por tela está no [plano FE/UI](frontend/PLANO-IMPLEMENTACAO.md).

**Direção aprovada em 2026-11-06:** uma Central de Oa cinematográfica,
com componentes arrojados e visuais produzidos integralmente em código.
**Entrega atual:** laboratório navegável em `/laboratorio`.
Evolução de 2026-11-07: céu estelar SVG, vidro escuro, molduras pulsantes e
arquivo de construtos por Lanterna; ver [escopo e verificação](design/oanet/galaxia-vidro.md).
Movimento original em SVG/CSS integrado aos 25 construtos, aos vetores ambientais
e aos controles; [desenho e evidências](design/oanet/movimento-cinematografico.md).

Este documento orienta a continuação do redesign. O
[registro da implementação](design/oanet/laboratorio-codigo.md) reúne arquivos,
comandos, resultados e limites da verificação. [PRODUCT.md](../PRODUCT.md)
registra o propósito; [DESIGN.md](../DESIGN.md) preserva a exploração inicial.

## Identidade escolhida

- Fundo preto puro, nebulosa e estrelas em verdes, vidro escuro translúcido e energia verde como destaque.
- Molduras com cantos recortados, encaixes assimétricos e terminais técnicos.
- Emblemas, arquitetura, bateria e instrumentação desenhados em SVG.
- Galáxia de partículas em Canvas; gráficos e indicadores vetoriais.
- Barlow para leitura, Barlow Condensed para títulos e IBM Plex Mono para
  identificadores, aproveitando as fontes já presentes no projeto.

O usuário pediu explicitamente mais expressão que o tema anterior. Bordas
recortadas, brilho emissivo e movimento da simulação fazem parte dessa direção.
Os PNGs gerados na primeira exploração são referências históricas e não devem
virar fundos ou controles da interface. A implementação atual não usa imagens
externas nem biblioteca de ícones.

## O que já pode ser explorado

| Tela do laboratório | Interações |
|---|---|
| Visão geral | Galáxia com zoom, pausa, recentralização e três setores; período do gráfico |
| Ocorrências | Busca, filtro de status, estado vazio e dossiê selecionável |
| Lanternas | Seleção de membro e ficha com estado de energia |
| Construtos | Arquivo selecionável de 25 estudos vetoriais por membro pesquisado |
| Componentes | Botões, selos, campos, abas, 26 ícones e confirmação |
| Portal de Oa | Apresentação com arquitetura vetorial e navegação |
| Acesso à Central | Validação e controle de visibilidade da senha |
| Nova ocorrência | Campos, validação e confirmação local do envio simulado |

Os dados são ilustrativos e identificados como demonstração. O laboratório
não chama a API, não cria sessões reais e não persiste registros. O ERP
existente continua com seus fluxos e permissões.

## Componentes para reutilizar

| Export | Responsabilidade |
|---|---|
| `MolduraOa` | Painel com geometria técnica, título, ícone e ação opcionais |
| `BotaoOa` | Aparência OANET sobre o botão Base UI; tons energia, linha e perigo |
| `SeloOa` | Estado por texto, símbolo e cor |
| `MedidorOa` | Indicador circular SVG com valor textual |
| `LinhaSinal` | Pequeno gráfico vetorial |
| `IconeOa` | Vocabulário próprio de 26 símbolos, configurado por `nome` |
| `EmblemaOa` | Emblema vetorial da Tropa com instrumentação circular |
| `BateriaOa` / `CidadeOa` | Constructos de energia e arquitetura vetorial |
| `GalaxiaProcedural` | Cartografia Canvas interativa e fallback SVG |
| `FundoCosmico` | Céu SVG verde sobre preto, sem imagens externas |
| `constructosHumanos` / `constructosCosmicos` | Coleções dos 25 estudos SVG originais com identidade e movimento próprios |
| `GaleriaConstructos` / `ConstructoDoLanterna` | Exibição dos estudos; os objetos são interpretações artísticas, não fatos canônicos |
| `useMovimentoOa` | Visibilidade, registro dinâmico de SVGs e cleanup dos observers |

As três folhas `components/oanet/movimento-{vetores,construtos,componentes}.css`
são importadas por `app/globals.css`. Preserve o conjunto: copiar apenas um
SVG sem seus tokens, classes, escopo e controle de pausa perde parte do asset.

Os exports ficam em `components/oanet/`. As telas são montadas por composição
em `CentralOa`, `TelasOa` e `ComponentesOa`, coordenadas por `LaboratorioOa`.
`dados-demo.ts` pertence somente à vitrine e não é fonte de dados do ERP.

## Regras para continuar o trabalho

1. Estilos e tokens permanecem em `app/globals.css`; o escopo `.oa-lab` isola
   a aparência atual. Na adoção real, extraia uma casca reutilizável que carregue
   esse escopo e o ciclo de movimento, sem alterar as rotas por troca de estado
   local. Use `Link`, URL, sessão real e ações existentes. A sidebar do painel
   fica presa durante o scroll no desktop e recolhe no celular.
2. Reutilizar os controles Base UI existentes e preservar suas semânticas,
   foco, estados desabilitados e interação por teclado.
3. SVGs com gradientes/filtros usam IDs por instância. Coordenadas calculadas
   devem ser serializadas com precisão fixa para evitar diferenças entre
   Node e navegador durante a hidratação.
4. Animação respeita movimento reduzido e pausa fora da área visível ou com
   a aba oculta. Observers, listeners e quadros agendados são liberados.
5. Gravidade e status sempre incluem texto; cores não comunicam sozinhas.
   Mensagens de validação precisam de associação acessível ao campo.
6. Novas telas usam os contratos reais, a sessão e as permissões existentes.
   Indicadores ilustrativos do laboratório não podem aparecer como dados reais.
7. `LaboratorioOa`, `CentralOa`, `TelasOa` e `dados-demo.ts` são composições
   demonstrativas. Extraia a apresentação e injete dados/ações; não promova o
   usuário fixo, métricas simuladas, envio local ou login simulado a produção.
8. Em divergência visual com specs antigas ou regras anteriores sobre brilho
   apenas no foco/movimento só por estado, prevalece D28 e o movimento OANET
   aprovado. Isso não dispensa foco, contraste, rótulos e movimento reduzido.

Essas orientações complementam a skill acadêmica canônica; não alteram
suas regras ou a lista de dependências. Regras consultadas nesta entrega:
CSS-01/02/03/07/09/11/12/14/15, COMP-02/03/08/09/12 e STACK-06.

## Executar e conferir

Com as dependências instaladas:

```powershell
npm run dev
```

Abra `http://localhost:3000/laboratorio`. A vitrine não precisa do json-server.
Para testar a versão compilada em outra porta:

```powershell
npm run build
npm run start -- --port 3002
```

Antes de integrar alterações, execute a suíte de aplicação, lint e build;
confira também desktop, tablet, celular de 375px, teclado e movimento reduzido.

```powershell
npm exec -- vitest run __tests__
npm run lint
npm run build
```

Na entrega inicial passaram 143 testes da aplicação, lint, TypeScript e build.
Na etapa de movimento passaram 150 testes; evidências de navegador e revisão
estão em [movimento cinematográfico](design/oanet/movimento-cinematografico.md).
São resultados datados, não garantia de aprovação de uma migração futura.
No handoff de 2026-11-09, `npm run test:run` passou com 150 testes em 29 arquivos;
a falha antiga de descoberta de teste de pesquisa não se reproduziu. O último
build registrado, em 2026-11-07, concluiu após repetir pelo aviso de segurança
do Next 16.4.0. O handoff documental não atualizou dependências nem repetiu build.

## Próximas etapas do redesign

- Aplicar o vocabulário aprovado às rotas públicas reais, incluindo Sobre e
  estados de carregamento, vazio, erro e acesso negado.
- Integrar os componentes ao painel e aos formulários reais, mantendo
  autorização, filtros, atribuição e persistência.
- Ajustar o layout com dados reais e conteúdo longo; verificar novamente
  acessibilidade, responsividade e desempenho em cada fluxo migrado.

O laboratório é a referência interativa aprovada, não a conclusão da migração
visual de todas as rotas do ERP.
