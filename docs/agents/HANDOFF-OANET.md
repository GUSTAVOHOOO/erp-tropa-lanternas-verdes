# Handoff — adoção da UI oficial OANET

**Data:** 2026-11-09. **Tarefa inicial:** UI-01 de [PLANO.md](../PLANO.md).
**Estado atualizado em 2026-11-09:** planos, contratos e revisão documental da [DOC-03](DOC-03-PLANEJAMENTO.md) concluídos. Implementação permanece suspensa até tarefa explícita. Este handoff preserva o contexto e os arquivos parciais, sem autorizar retomada automática. A sequência vigente está em [PLANO.md](../PLANO.md).
**Histórico observado na DOC-03:** HEAD avançou externamente a `949b1e8`, após `5377e39` incorporar pacote/casca. As condições de checkout abaixo são o retrato da transferência; consulte `git status` e o registro DOC-03 para o estado posterior. Commit do parcial não equivale ao aceite UI-01.
> **Este documento é histórico.** Descreve a transferência de 2026-11-09, escrita no
> pretérito. Nenhuma frase abaixo autoriza começar ou retomar a implementação: ela
> depende de o usuário encerrar a pausa da DOC-03 e segue o
> [plano FE](../frontend/PLANO-IMPLEMENTACAO.md) (UI-01, depois UI-02.00).

**Preparação à época:** Codex. **Receptor então previsto:** um novo agente Codex, a
pedido do usuário; esse lançamento foi superado pela pausa e o receptor não consta
mais como responsável. A responsabilidade de implementação é atribuída na retomada.

### Reatribuição solicitada pelo usuário (histórico)

O primeiro agente Claude foi interrompido e seu terminal encerrado pelo Orca
(recibo `ptyKilled: true`), preservando o trabalho parcial. A checkout continha
`components/oanet/CascaOa.tsx`, alterações nos layouts público/privado e
`__tests__/components/casca-oanet.test.tsx`. Quem retomar a UI-01 deve inspecionar o
estado atual e continuar, sem sobrescrever ou recomeçar esse trabalho.
O antecessor relatou build interrompido pelo aviso de segurança conhecido do
Next; faltam confirmar build/lint, verificar fluxos no navegador e atualizar o
registro UI-01 e o estado das telas. Essas alterações parciais ainda não têm
aceite final. O baseline de 150 testes abaixo antecede esse incremento.

## Resultado solicitado pelo usuário

O laboratório aprovado passa a ser a base principal do sistema e da evolução
front/back documentada. Todos os componentes e assets visuais novos derivam
dele. O front anterior deixa de ser referência de design. Essa decisão está
registrada como D28 em [ESCOPO.md](../backend/ESCOPO.md); o contrato visual
canônico está em [UI.md](../UI.md).

Na época, o pedido de handoff previa começar a implementação sem nova aprovação da
direção visual; essa aprovação D28 continua válida e não se pede de novo. A preparação
documental não afirma que as rotas reais já foram migradas. A suspensão posterior
substituiu o plano de começar de imediato: o início da implementação agora depende
da autorização do usuário e da sequência do [plano FE](../frontend/PLANO-IMPLEMENTACAO.md).

## Estado confirmado na transferência

- Checkout: `C:/Users/Windows 11/Documents/Desenvolvimento web/TrabalhoWeb`.
- Branch `docs/migracao-back-end`, HEAD `148aa4f528030e2ea29e20165c37b303b1832718`.
- Há alterações locais e arquivos **não rastreados** do pacote OANET, testes e
  documentação. Eles são trabalho aprovado e parte essencial desta entrega.
  Confira `git status --short` e preserve tudo; uma worktree criada só do HEAD
  não contém esses assets. O handoff usa a mesma checkout deliberadamente.
- `/laboratorio` funciona com composições demonstrativas e estado local.
  Site e painel reais continuam usando os fluxos atuais de json-server.
- `backend/` ainda não existe na conferência de 2026-11-09. NestJS + TypeORM +
  SQLite, JWT, contratos e features novas são destino documentado.
- `db.json` permanece persistência da demonstração e fixture. Testes manuais
  de escrita exigem cópia isolada; não modificar os dados compartilhados.

## Leitura de entrada (nesta ordem)

1. [AGENTS.md](../../AGENTS.md), [guia dos agentes](README.md), [mapa](MAPA.md)
   e [modelo de tarefa](TAREFA.md).
2. [frontend-web](../../.claude/skills/frontend-web/SKILL.md) e [UI.md](../UI.md).
3. [PLANO.md](../PLANO.md), [arquitetura do front](../frontend/ARQUITETURA.md),
   [telas](../frontend/TELAS.md) e [migração de dados](../frontend/MIGRACAO.md).
4. Para código Next, guias locais em `node_modules/next/dist/docs/`, em especial
   `01-app/01-getting-started/05-server-and-client-components.md`, `11-css.md`
   e os de layouts/Link pertinentes à mudança.
5. Antes de implementar API: [backend-api](../../.claude/skills/backend-api/SKILL.md),
   [ESCOPO](../backend/ESCOPO.md), [API](../backend/API.md),
   [arquitetura BE](../backend/ARQUITETURA.md), [modelo](../backend/MODELO-DE-DADOS.md),
   [regras](../backend/REGRAS-DE-NEGOCIO.md), [DTOs](../backend/DTOS.md),
   [cenários](../backend/CENARIOS-DE-TESTE.md) e [seed](../backend/SEED.md).

## Pacote visual a reutilizar

Todos os caminhos desta tabela partem de `components/oanet/`, salvo indicação.

| Parte | Fontes e contrato de reutilização |
|---|---|
| Casca | `LaboratorioOa.tsx`: extrair fundo, cabeçalho e navegação; não copiar sua troca de telas por estado nem usuário fixo |
| Controles | `PainelOa.tsx`: `MolduraOa`, `BotaoOa`, `SeloOa`, `MedidorOa`, `LinhaSinal`; Base UI continua responsável pela semântica |
| Identidade | `IconeOa.tsx`, `EmblemaOa.tsx`, `ConstructosOa.tsx` (cidade e bateria) |
| Espaço | `FundoCosmico.tsx`: preto puro e verdes; `GalaxiaProcedural.tsx` + `galaxia.ts`: mapa Canvas e fallback SVG |
| Construtos | `ConstructosHumanos.tsx`, `ConstructosCosmicos.tsx`, `GaleriaConstructos.tsx`: 25 estudos originais; preservar nomes/IDs, identificar interpretação artística |
| Movimento | `movimento-vetores.css`, `movimento-construtos.css`, `movimento-componentes.css`, imports/tokens em `app/globals.css`, `useMovimentoOa.ts` |
| Composições | `CentralOa.tsx`, `TelasOa.tsx`, `ComponentesOa.tsx`: referências de apresentação; extrair para props reais, em vez de importar `dados-demo.ts` |

Preservar verde sobre preto, vidro escuro, formas angulares, bordas e luz,
fontes existentes, sidebar presa no scroll desktop/menu móvel e movimento
original. Cada SVG usa IDs por instância; animações não sobrescrevem transforms
geométricos. Modo calmo, aba oculta, offscreen e preferência reduzida precisam
continuar funcionando, inclusive em conteúdo trocado e Portals.

PNG de `public/assets/oanet/` e pranchas antigas são históricos. Capturas em
`docs/design/oanet/verificacao/` são evidências, não assets da aplicação.
Specs antigas sobre brilho apenas no foco e movimento apenas por estado
foram superadas visualmente por D28; foco, contraste e acessibilidade permanecem.

## Primeiro incremento: UI-01 (escopo original da transferência)

Histórico do escopo; a execução, quando autorizada, segue o UI-01 e o UI-02.00 do [plano FE](../frontend/PLANO-IMPLEMENTACAO.md), que prevalece sobre esta lista.

**Propriedade prevista para quem retomar:** componentes de casca extraídos em `components/oanet/`,
`app/(site)/layout.tsx`, `app/(painel)/layout.tsx`, ajustes necessários em
`app/globals.css`, testes correspondentes e atualização de estado em docs.
`app/layout.tsx` só se a composição exigir, preservando fontes e metadata.
Mudanças compartilhadas explicitamente incluídas: CSS global OANET e decisão D28.
Dependências, configuração de build, dados e contrato HTTP ficam fora de UI-01;
uma necessidade real deve virar tarefa explícita antes de alterar esses itens.

1. Conferir arquivos atuais e processos/portas (não confiar em servidores antigos).
   Registrar a tarefa UI-01 com escopo e baseline antes de editar.
2. Extrair uma casca reutilizável com `children` e props de navegação/identidade.
   Manter layouts e autorização no servidor; folhas interativas controlam menu
   e movimento. Não transformar a página inteira em uma cópia client do laboratório.
3. Integrar a casca aos layouts público e privado. Rotas usam `Link` e seleção
   pela URL; identidade vem da sessão atual; logout conserva a Server Action.
4. Manter o laboratório como vitrine isolada. Estado demonstrativo, login fake,
   métricas inventadas e envio simulado não entram nas rotas reais.
5. Verificar teclado, foco, menu móvel, scroll/sticky, movimento reduzido,
   modo calmo, conteúdo longo e ausência de regressões de sessão/permissão.
6. Entregar com testes, lint, build e evidências; atualizar `TELAS.md`, mapa e
   plano para distinguir casca migrada de conteúdo ainda pendente.

**Aceite:** casca OANET nas rotas reais; navegação e saída funcionais; usuário,
papel e setor reais; rotas protegidas preservadas; nenhum consumidor real de
`dados-demo.ts`; laboratório e seus 25 construtos permanecem funcionais.

## Continuação após UI-01

Antes das rotas, UI-02.00 trata os componentes compartilhados (inventário no plano FE).
UI-02 migra conteúdo, formulários e estados das rotas existentes, reutilizando
a mesma base (inclusive Sobre, loading/erro/vazio/404/acesso negado, ausentes
como composições completas no laboratório). Cada tela nova do plano usa OANET.
Enquanto a API não existe, conservar serviços/actions atuais funcionando.

BE-01 a BE-12 e FE-00 a FE-10 seguem [PLANO.md](../PLANO.md). Só trocar sessão,
envelope, filtros e persistência quando a API correspondente estiver implementada
e testada. A UI não exige endpoints inventados: o dashboard real usa as métricas
previstas na API, não os 7.200/3.600/98,7% da vitrine. Não gerar dados canônicos
a partir dos desenhos; a pesquisa aceita continua sendo a fonte do seed.

## Testes e evidências transferidos

- Baseline **executado em 2026-11-09**: `npm run test:run`, exit 0, **150 testes
  em 29 arquivos**. A falha antiga de descoberta de teste de pesquisa não se reproduziu.
- Testes do pacote: `__tests__/components/laboratorio-oanet.test.tsx`,
  `movimento-ciclo.test.tsx`, `galaxia-preferencias.test.tsx`,
  `__tests__/lib/galaxia.test.ts`; manter também os testes funcionais existentes.
- [Movimento: implementação e revisão](../design/oanet/movimento-cinematografico.md):
  25 seleções reais no navegador, movimento/cor, desktop/celular, pausa e Portals;
  [evidência por membro](../design/oanet/verificacao/movimento-25-construtos.json).
- [Galáxia e vidro](../design/oanet/galaxia-vidro.md) e
  [primeira implementação](../design/oanet/laboratorio-codigo.md): histórico e limites.
- Lint e build passaram em 2026-11-07; build exigiu repetição pelo aviso de
  segurança do Next 16.4.0. Não foram repetidos na preparação documental de hoje.
  Não declarar auditoria de segurança resolvida nem garantia de 60fps.
- O receptor executa `npm run test:run`, `npm run lint`, `npm run build` e
  verifica as telas afetadas. Baseline anterior não comprova sua alteração.

## Transferência e limites desta tarefa

Codex atualizou a documentação e os ponteiros canônicos, conferiu os links e
executou o baseline acima; não migrou as rotas nem criou o back-end neste handoff.
Verificação documental: 15 documentos, 169 links locais, nenhum destino ausente;
`git diff --check` exit 0. As alterações executáveis presentes no status são
o pacote aprovado das etapas anteriores, preservado nesta preparação.
À época, o prompt do Orca previa que o receptor implementasse UI-01 em seguida; a
pausa da DOC-03 o suspendeu, e este parágrafo não é instrução vigente. Quem retomar
assume os arquivos do incremento, registra resultados e pendências e não pede de novo
aprovação do design OANET já aprovado (D28).
