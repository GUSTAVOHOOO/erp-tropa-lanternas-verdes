# Redesign OANET

**Direção aprovada em 2026-11-06:** uma Central de Oa cinematográfica,
com componentes arrojados e visuais produzidos integralmente em código.
**Entrega atual:** laboratório navegável em `/laboratorio`.

Este documento orienta a continuação do redesign. O
[registro da implementação](design/oanet/laboratorio-codigo.md) reúne arquivos,
comandos, resultados e limites da verificação. [PRODUCT.md](../PRODUCT.md)
registra o propósito; [DESIGN.md](../DESIGN.md) preserva a exploração inicial.

## Identidade escolhida

- Preto esverdeado profundo, superfícies sólidas e energia verde como destaque.
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

Os exports ficam em `components/oanet/`. As telas são montadas por composição
em `CentralOa`, `TelasOa` e `ComponentesOa`, coordenadas por `LaboratorioOa`.
`dados-demo.ts` pertence somente à vitrine e não é fonte de dados do ERP.

## Regras para continuar o trabalho

1. Estilos e tokens permanecem em `app/globals.css`; o escopo `.oa-lab` isola
   a aparência atual da vitrine. A migração para outras rotas deve ser explícita.
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
O comando geral `npm run test:run` ainda encontra indevidamente um teste de
pesquisa destinado ao executor Node. O Next 16.4.0 instalado continua emitindo
alerta de segurança; o build só concluiu após repetir o comando conforme o
aviso da ferramenta. Essas pendências estão registradas, não corrigidas por
esta mudança visual.

## Próximas etapas do redesign

- Aplicar o vocabulário aprovado às rotas públicas reais, incluindo Sobre e
  estados de carregamento, vazio, erro e acesso negado.
- Integrar os componentes ao painel e aos formulários reais, mantendo
  autorização, filtros, atribuição e persistência.
- Ajustar o layout com dados reais e conteúdo longo; verificar novamente
  acessibilidade, responsividade e desempenho em cada fluxo migrado.

O laboratório é a referência interativa aprovada, não a conclusão da migração
visual de todas as rotas do ERP.
