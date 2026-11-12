# Mapa da codebase

Levantamento conferido em 2026-11-06, a partir de `f819c48` e do estado local.
Planejamento documental atualizado em 2026-11-09; a UI-01 foi concluída e integrada à `main` pela PR #1 em 2026-11-10 (merge `f0cb363`). A pausa de planejamento registrada em [DOC-03](DOC-03-PLANEJAMENTO.md) deixou de valer para o front em 2026-11-10.
Use este mapa para encontrar os arquivos; confirme contratos no código antes
de alterá-los. As regras de código estão nas skills
[`frontend-web`](../../.claude/skills/frontend-web/SKILL.md) e
[`backend-api`](../../.claude/skills/backend-api/SKILL.md).

> **Estado atual (2026-11-11).** Este mapa descreve o **código de hoje**: front-end
> Next.js ligado à API NestJS real em `backend/` (Corte 1 ativado, registro em
> [INTEGRACAO §3](../INTEGRACAO.md#registro-de-ativação-a--corte-1-e-aditivos)).
> O json-server e o `db.json` foram removidos na FE-09. O histórico da migração está em
> [frontend/MIGRACAO.md](../frontend/MIGRACAO.md).

## Arquitetura atual

Aplicação Next.js com App Router, TypeScript e React. Toda chamada HTTP passa por
`lib/api.ts` para a API NestJS. `backend/` contém bootstrap HTTP, persistência
SQLite/TypeORM, autenticação, seeds mínimo/completo, rotas de Usuários, Setores,
Lanternas, Ocorrências, linha do tempo de Eventos e Comentários e Dashboard
(BE-01/02/03/04/05/06/07a/07b/08/09/10/07c/11). A entrega de contrato completa
segue no [plano BE](../backend/PLANO-IMPLEMENTACAO.md).
Consulte versões e scripts em [package.json](../../package.json), sem pressupor
as APIs de outra versão do framework.

```mermaid
flowchart TD
  N[Navegador] --> P[Proxy: pré-checagem da sessão]
  P --> R[Página no servidor: sessão e permissão]
  R --> S[Serviços em lib: fetch e validação da resposta]
  S --> J[API NestJS: backend/ com SQLite]
  R --> C[Componentes e formulários: props e RHF]
  C --> A[Server Action: autorização e validação]
  A --> S
  A --> U[Revalidação e navegação ou ResultadoAcao]
  U --> N
```

O proxy só cobre as rotas configuradas em [proxy.ts](../../proxy.ts).
Leituras públicas não exigem sessão; cada página privada faz a própria checagem.
O diagrama representa fluxos de aplicação. A autorização real fica na API
(JWT validado a cada requisição); o proxy só confere a presença do cookie.

## Onde trabalhar

| Pedido | Ponto de entrada | Dependências a consultar |
|---|---|---|
| Home, Sobre e navegação pública | `app/(site)/page.tsx`, `sobre/`, layout público | `components/oanet/CascaOa.tsx` (substitui `MenuNavegacao` e `Marca`, removidos na UI-02.00), `Juramento` |
| Lista e detalhe de lanternas | `app/(site)/lanternas/` | `lib/lanternas.ts`, `lib/setores.ts`, `lib/schemas/lanterna.ts`, `lib/schemas/setor.ts`, `components/Paginacao.tsx`, `components/FichaLanterna.tsx` |
| Login | `app/(site)/login/` | `lib/auth.ts`, `lib/schemas/login.ts`, `lib/schemas/senha.ts`, DAL e sessão |
| Cadastro | `app/(site)/cadastro/` | `lib/cadastro.ts`, `lib/schemas/cadastro.ts`, `lib/schemas/senha.ts`, DAL e sessão |
| Logout | `app/(painel)/actions.ts` e layout privado | `lib/dal.ts` |
| Dashboard (painel inicial, substitui o Resumo) | `app/(painel)/painel/page.tsx`, `app/(painel)/painel/_components/Dashboard.tsx` | `lib/dashboard.ts`, `lib/schemas/dashboard.ts`, `FiltroDashboard.tsx` |
| Listagem e filtros privados | `app/(painel)/painel/ocorrencias/page.tsx`, `_components/FiltroOcorrencias.tsx` | `lib/schemas/ocorrencia.ts` (filtro da URL), `lib/ocorrencias.ts` |
| Criar, editar, alterar status, atribuir ou excluir | `app/(painel)/painel/ocorrencias/actions.ts` | `FormOcorrencia`, `FormEditarOcorrencia`, `FormStatus`, `FormAtribuir`, `ConfirmarExclusao`, schemas, DAL e `lib/ocorrencias.ts` |
| Detalhe e atribuição | `app/(painel)/painel/ocorrencias/[id]/` | `tratarErroDetalhe`, `lib/permissoes-ocorrencia.ts`, autorização e formulários |
| Eventos e comentários | `app/(painel)/painel/ocorrencias/comentarios-actions.ts` | `lib/eventos.ts`, `lib/comentarios.ts`, `lib/schemas/evento.ts`, `lib/schemas/comentario.ts` |
| Minha fila | `app/(painel)/painel/minha-fila/` | `listarMinhaFila` em `lib/ocorrencias.ts`; link só para o Lanterna em `components/oanet/navegacao.ts` |
| Gestão de setores | `app/(painel)/painel/setores/` | `lib/setores.ts` (`criarSetor`, `editarSetor`, `excluirSetor`), `lib/schemas/setor.ts` (`setorFormularioSchema`, `edicaoSetorSchema`), `actions.ts`, `FormSetor`, `ExcluirSetor`, `exigirPapel('guardiao')` |
| Gestão e ficha de lanternas no painel | `app/(painel)/painel/lanternas/`, `app/(painel)/painel/lanternas/[id]/` | `lib/lanternas.ts` (`criarLanterna`, `editarLanterna`, `alterarStatusLanterna`, `buscarLanterna`), `lib/schemas/gestao-lanterna.ts`, `actions.ts`, `FormLanterna`, `StatusLanterna`, `components/FichaLanterna.tsx`, `exigirPapel` |
| Gestão de usuários | `app/(painel)/painel/usuarios/` | `lib/gestao-usuarios.ts` (`listarUsuarios`, `alterarPapel`, `vincularLanterna`), `lib/schemas/gestao-usuario.ts` (`filtroUsuariosSchema`, `papelFormularioSchema`, `vinculoFormularioSchema`), `actions.ts`, `FormPapel` (com transferência de setor opcional para Lanterna), `FormVinculo`, `exigirPapel('guardiao')` |
| Permissões de ocorrência | `lib/permissoes-ocorrencia.ts` | `acoesPermitidas` e `transicoesPermitidas` pela matriz de [TELAS.md](../frontend/TELAS.md); só visibilidade, a API decide ([matriz](../backend/API.md#matriz-de-permissões)) |
| UI oficial e assets | `components/oanet/`, `app/globals.css`, `app/laboratorio/` | `docs/UI.md` (D28), `docs/agents/HANDOFF-OANET.md`; `/design-system` antigo é histórico |
| Dados de demonstração | `backend/` (`npm run seed -- --etapa completa`) | [SEED.md](../backend/SEED.md); o front não lê arquivos de dados locais |
| Adoção nas rotas reais | Layouts `(site)`/`(painel)`, páginas e componentes OANET | UI-01/UI-02 em `docs/PLANO.md`; propriedade transferida pelo handoff, conferir alterações locais |
| Regras, rotas e dados da API | `docs/backend/` (`ESCOPO`, `REGRAS-DE-NEGOCIO`, `API`, `MODELO-DE-DADOS`, `ARQUITETURA`) | Skill `backend-api`; o código está em `backend/` (NestJS) |
| Telas atuais e planejadas | `docs/frontend/TELAS.md` | `docs/frontend/ARQUITETURA.md` |
| Trabalho independente FE/BE | `docs/frontend/PLANO-IMPLEMENTACAO.md`, `docs/backend/PLANO-IMPLEMENTACAO.md` | `docs/PLANO.md`, `docs/INTEGRACAO.md` |
| Contrato verificável e exemplos | `docs/contratos/` | `docs/backend/API.md`, `DTOS.md`; a API real está em `backend/`; o servidor falso de contrato (FE-00, `scripts/contrato/`) serve só a testes de consumidor |
| Componentes compartilhados (cabeçalho, tabela, badges, campos, estados) | `components/*.tsx`, `components/ui/*` | Inventário e destino em UI-02.00 do plano FE; consumidores em `app/` |
| Ordem de ativação real (Corte 1 e aditivos) e fixture de integração | `docs/INTEGRACAO.md` §3 e §4 | Planos FE/BE; BE-01/02/03/04/05/06/07a/07b/08/09/10 e fixture etapas a–e existem |

`(site)` e `(painel)` organizam layouts sem aparecer na URL. `_components`
contém componentes locais da rota. `components/` concentra os compartilhados.
O alias `@/` aponta para a raiz, conforme [tsconfig.json](../../tsconfig.json).

## Fronteiras e contratos

| Fronteira | Contrato e fonte |
|---|---|
| Navegador → action | RHF chama action com dados; a action recebe `unknown`, valida e usa `parsed.data`. Exemplo: [FormOcorrencia](../../app/(painel)/painel/ocorrencias/_components/FormOcorrencia.tsx) e [actions](../../app/(painel)/painel/ocorrencias/actions.ts) |
| Action → formulário | [ResultadoAcao](../../lib/resultado-acao.ts): `ok`, `erro` geral e `errors` por campo; [aplicarErrosDoServidor](../../lib/erros-formulario.ts) aplica os erros no RHF |
| Página/action → autorização | [DAL](../../lib/dal.ts): `verificarSessao`, `exigirPapel`, criação/leitura/remoção de cookie |
| Sessão → setor | [escopo.ts](../../lib/escopo.ts): `podeAcessarSetor`, `setorParaFiltro`; o setor vem do `Usuario` devolvido por `/auth/me` |
| Servidor → HTTP | [api.ts](../../lib/api.ts) tem o cliente único `requisitarApi` e `requisitarApiSemConteudo`: valida o envelope `{ sucesso, dados }` com o schema do serviço, exige cache explícito (`SEM_CACHE` no painel) e envia Bearer quando há token; `registrarErro` loga 4xx previstos como `console.warn` e 5xx/respostas inválidas como `console.error` [SEG-08]; todos os serviços passam por ele |
| HTTP → erro de detalhe | [ApiError](../../lib/api-error.ts) carrega status, código e detalhes; [tratarErroDetalhe](../../lib/erro-detalhe.ts) navega em 401/403, chama `notFound` em 404 e converte 400 de leitura de detalhe em `notFound` |
| HTTP → erro de Action | [resultadoDeErroApi](../../lib/api-error.ts) e [destinoDoErro](../../lib/api-error.ts) tratam `ApiError` em Actions |
| Persistência → tela | Actions de escrita revalidam `/painel` no escopo `layout` (Setores também revalida `/painel/setores`, `/lanternas` e `/cadastro`; Lanternas revalida `/painel/lanternas`, `/lanternas` e `/lanternas/${slug}`); cadastro/atribuição redirecionam e status retorna `{ ok: true }` |

Os serviços de `lib/` não recebem sessão. Quem chama `listarOcorrencias` precisa
aplicar o filtro autorizado; quem busca um detalhe privado precisa conferir seu
setor. Reutilizar um serviço não aplica automaticamente essas permissões.

## Domínio e permissão

As regras abaixo são as **atuais**. As do destino (máquina de estados, Prazo,
Lanterna afastado, 404 em vez de acesso negado para outro Setor) estão em
[REGRAS-DE-NEGOCIO.md](../backend/REGRAS-DE-NEGOCIO.md) e a matriz completa em
[API.md](../backend/API.md#matriz-de-permissões).

As coleções atuais são setores, lanternas, usuários e ocorrências. Os schemas
em [lib/schemas](../../lib/schemas) definem campos, tipos e enums. Vários IDs são
normalizados para string; preserve os contratos nas relações entre coleções.

> **Conta vs Ficha:** Atribuição de ocorrências e catálogo listam Fichas de Lanternas, não contas de usuário. Uma conta criada no cadastro público (`/cadastro`) nasce sem Ficha vinculada. Para receber ocorrências ou acessar a Minha Fila, o Guardião precisa criar a Ficha em Lanternas (gestão) e vinculá-la à conta em Usuários (`/painel/usuarios`) → Gerenciar.

| Operação | Guardião | Lanterna |
|---|---|---|
| Consultar ocorrências | Todos os setores, com filtro opcional | Somente o setor da sessão |
| Abrir detalhe e mudar status | Qualquer setor | Somente o próprio setor |
| Registrar ocorrência | Escolhe um setor existente | Servidor fixa o setor da sessão |
| Atribuir responsável | Responsável deve pertencer ao setor da ocorrência | Bloqueado por papel |

Fontes: [escopo.ts](../../lib/escopo.ts),
[actions de ocorrências](../../app/(painel)/painel/ocorrencias/actions.ts), páginas
privadas e DEC-03/AUTH-07 da skill. O acesso negado é apresentado pela navegação
para `/acesso-negado`; isso não equivale a devolver um status HTTP 403 da API.

Ao cadastrar, o servidor define `status: 'aberta'`, responsável/resolução nulos,
criador a partir da sessão e data atual. O
[schema de status](../../lib/schemas/ocorrencia.ts) exige explicação de pelo menos
dez caracteres para resolver; a action limpa resolução nos outros status.

## Sessão e dados privados

> Estado **ativo** desde o Corte 1 (2026-11-11), com a API NestJS real. O contrato é
> o v1.0.0 da API; a decisão de manter o JWT no servidor do Next está na
> [ADR 0001](../adr/0001-token-jwt-fica-no-servidor-do-next.md).

O login chama `POST /auth/login` e grava o JWT devolvido só no cookie `sessao`:
`httpOnly`, `sameSite: 'lax'`, path `/`, `secure` em produção e validade igual a
`expiresIn`. O cookie não guarda dados do usuário; [cookie.ts](../../lib/cookie.ts)
define só o nome do cookie, compartilhado com o proxy.

[auth.ts](../../lib/auth.ts) (`server-only`) concentra `entrarNaApi`,
`buscarUsuarioAtual` (GET `/auth/me` com Bearer), `gravarCookieSessao`,
`apagarCookieSessao` e `lerToken`.

[dal.ts](../../lib/dal.ts) é a fronteira de autorização:

- `lerSessao` devolve o `Usuario` do contrato, ou `null` sem token ou com 401;
- `verificarSessao` vai para `/login` sem token e para
  [sessao-expirada](../../app/sessao-expirada/route.ts) com 401;
- `exigirPapel` vai para `/acesso-negado` quando o papel não basta;
- `lerTokenObrigatorio` devolve o token para chamadas à API.

Papel e setor não ficam no cookie: vêm de `/auth/me` a cada requisição. Uma
promoção ou um rebaixamento na API vale na próxima requisição. `setorId` é
inteiro ou `null`.

[app/sessao-expirada/route.ts](../../app/sessao-expirada/route.ts) apaga o cookie
e redireciona para `/login?expirou=1`. Sem cookie, o proxy não manda de volta
ao painel, então não há laço entre `/login` e `/painel`.

[proxy.ts](../../proxy.ts) só verifica a presença do cookie: `/painel` sem cookie
vai para `/login`, e `/login` ou `/cadastro` com cookie vão para `/painel`. A
validade do token é decidida pela API, na DAL.

[escopo.ts](../../lib/escopo.ts) concentra `podeAcessarSetor` e `setorParaFiltro`.
Lanterna sem setor recebe `-1`, que não casa com nenhum setor.

`lib/sessao.ts` (HMAC) e `lib/usuarios.ts` (busca de usuário com senha) foram
removidos, e `SESSION_SECRET` não existe mais. A senha é verificada só pela API
(bcrypt), e a sessão é o JWT dela; o [README](../../README.md) descreve a execução.

## Leitura, cache e erros

- [Lanternas](../../lib/lanternas.ts) e [setores](../../lib/setores.ts):
  a revalidação de 60 segundos fica restrita às leituras das páginas públicas (`app/(site)`: `listarLanternas`, `buscarLanterna`, `listarTodosLanternas`, `listarSetores`, `buscarSetor`).
  TODO o painel (`app/(painel)`) lê Setores e Lanternas sem cache através da constante `SEM_CACHE` de [api.ts](../../lib/api.ts) (`{ cache: 'no-store' }`) para que alterações, criações e vínculos apareçam imediatamente nos seletores, tabelas e fichas.
  As mutações restritas ao Guardião em [lanternas.ts](../../lib/lanternas.ts) e em [setores.ts](../../lib/setores.ts) usam `no-store` e Bearer obrigatório. Ao criar, alterar ou excluir Setor, a Action revalida `/painel/setores`, `/lanternas`, `/cadastro` e `/painel` no escopo `layout`; ao criar, editar ou alterar status de Lanterna, a Action revalida `/painel/lanternas`, `/painel` no escopo `layout`, `/lanternas` e `/lanternas/${slug}`.
- [Gestão de usuários](../../lib/gestao-usuarios.ts): chamadas restritas ao Guardião
  (`listarUsuarios` com paginação, busca e ordenação, `alterarPapel` e `vincularLanterna`)
  sem cache (`no-store`) e com Bearer.
- [Ocorrências](../../lib/ocorrencias.ts): leituras sem cache e com Bearer; criação
  por POST, edição por PATCH só com os campos alterados, status e responsável em
  `/status` e `/responsavel`. Parâmetro fora do contrato falha antes do envio.
- Filtros privados são validados pelo schema de [ocorrências](../../lib/schemas/ocorrencia.ts)
  tanto no servidor quanto nos controles para manter a interpretação consistente;
  os schemas de gestão [gestao-lanterna.ts](../../lib/schemas/gestao-lanterna.ts),
  [gestao-usuario.ts](../../lib/schemas/gestao-usuario.ts) e [setor.ts](../../lib/schemas/setor.ts)
  validam formulários e comparam alterações antes do envio à API.
- Componentes como `EstadoVazio`, `EsqueletoLista` e `TelaDeErro`, além dos
  `loading.tsx`, `error.tsx` e `not-found.tsx`, representam os estados das rotas.
- Filtros, ordenação e paginação seguem o contrato da API (parâmetros da URL validados
  pelos schemas de cada serviço). Parâmetro fora do contrato falha antes do envio.

## Interface e referências

Os formulários usam React Hook Form e Zod 4. `CampoTexto` usa registro do RHF;
`CampoSelect` integra o select controlado via `Controller`. O visual compartilhado
usa Base UI sob os componentes shadcn já personalizados. Preserve exports e props
quando a alteração for apenas visual.

Tokens estão em [globals.css](../../app/globals.css); fontes no
[layout raiz](../../app/layout.tsx). O escopo `.oa-lab` e as três folhas
`movimento-*.css` compõem a UI oficial OANET (D28); sua extração para as rotas
reais segue [UI.md](../UI.md) e o [handoff](HANDOFF-OANET.md).
A vitrine `/design-system` antiga é histórica. STACK-02/03, DEC-05/11/12/13 e
as regras de formulário/semântica continuam aplicáveis.

## Testes e documentação existentes

`__tests__/lib/` cobre schemas, serviços e helpers; `__tests__/acoes/` cobre
actions com dependências simuladas; há testes de proxy, componentes e páginas
síncronas. Consulte o [guia de trabalho](README.md#verificar-e-entregar) para executar
as verificações. A pesquisa registra cobertura observada e lacunas sem pressupor
cobertura completa ou resultado aprovado.

| Documento | Uso |
|---|---|
| [Escopo e decisões](../backend/ESCOPO.md) | Enunciado e decisões vigentes; números antigos não limitam as decisões aplicáveis |
| [Índice da documentação](../README.md) | Todos os documentos e se descrevem o estado atual ou o destino |
| [Spec visual antiga](../superpowers/specs/2026-10-07-design-system-tropa-design.md) | Histórico; não orienta o design novo |
| [UI.md](../UI.md) | UI oficial OANET, assets e movimento aprovados (D28) |
| [Handoff OANET](HANDOFF-OANET.md) | Histórico da transferência da UI-01 e evidências; a sequência vigente está no plano FE |

Em divergência entre documentação e implementação, registre a diferença e
confira a decisão em `ESCOPO.md` antes de mudar ambos.
