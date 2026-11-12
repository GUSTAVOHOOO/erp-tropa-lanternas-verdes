# Plano de implementação do front-end

> Plano para execução futura, por um desenvolvedor de front. A documentação DOC-03 foi concluída; a implementação só começa em tarefa explicitamente atribuída (a aprovação visual D28 continua válida e não é pedida de novo). Caixas abertas são trabalho planejado; nenhum teste ou aceite de implementação foi executado para este documento. Executar um incremento por vez, com revisão e registro em [TAREFA.md](../agents/TAREFA.md).

**Objetivo:** migrar todas as rotas reais para OANET e preparar os consumidores da API por contrato, permitindo desenvolver sem o back-end e ativar cada recurso somente após seu gate real.

**Arquitetura:** páginas e layouts continuam Server Components; folhas interativas usam RHF e Zod. Services usam um cliente HTTP servidor; Actions autorizam, validam e devolvem `ResultadoAcao` ou navegam. O servidor HTTP falso existe exclusivamente no ambiente de desenvolvimento/teste, fora da aplicação publicada.

**Stack:** a de `package.json`, sem atualização implícita; Playwright será introduzido em FE-00 com dependência e configuração explicitamente atribuídas. Next tem APIs incompatíveis: consultar os guias instalados antes de implementar cada fronteira.

## Entrada e autoridade

Os fechamentos técnicos da rodada 2 do contrato (busca, senha em bytes, vínculo de Ficha, liberação em andamento, precedência de erros) vivem no OpenAPI, na API e nas regras RN; este plano só aponta onde cada tarefa os consome e, se uma fonte ainda não os trouxer, a operação aguarda a fonte. Antes de qualquer tarefa, confirme G-1 ([INTEGRACAO §2](../INTEGRACAO.md#g-1--aceite-do-contrato)) e anote no registro a versão e o hash do contrato que você consome. Leia [AGENTS.md](../../AGENTS.md), [guia](../agents/README.md), [mapa](../agents/MAPA.md), skill [frontend-web](../../.claude/skills/frontend-web/SKILL.md), [UI](../UI.md) e, como histórico da UI-01 parcial, o [handoff](../agents/HANDOFF-OANET.md). Para HTTP, use [API](../backend/API.md), [DTOs](../backend/DTOS.md), [pacote contratual](../contratos/README.md) e `docs/contratos/openapi.json`. Para telas/regras, consulte [TELAS](TELAS.md), [arquitetura](ARQUITETURA.md), [migração](MIGRACAO.md) e regras RN do back-end. A ordem de merge e os gates estão em [INTEGRACAO](../INTEGRACAO.md).

Os exemplos de entrada/saída estão em `docs/contratos/exemplos/cenarios.json`. Executar da raiz `py -3 docs/contratos/validar.py` (ou `python3 docs/contratos/validar.py`, Python>=3.10) antes dos testes de consumidor; esse comando documental valida referências, cobertura e o subconjunto de schema declarado no pacote, sem provar provedor/integração ou toda a OpenAPI.

Confirme o código atual antes de editar. `components/oanet/CascaOa.tsx`, layouts e teste da casca são trabalho herdado **parcial, sem aceite**. O laboratório está aprovado como referência visual, com dados demonstrativos; isso não aprova as telas reais.

## Propriedade e modos de trabalho

O dev front responde pelos arquivos abaixo e testes correspondentes. O dev back responde apenas por `backend/`. Integração atribui edição de contratos, índices/documentação compartilhada e `.env.example`. `package.json`, `package-lock.json`, configurações e `db.json` têm **dono único por tarefa: o dev front** em FE-00 (novas dependências e configuração de teste) e em FE-09 (remoções de dependências e dados); o integrador revisa. Os demais incrementos não têm essa autorização: se precisarem de dependência ou script, pedem ao dono e registram.

Há duas entregas separadas por recurso:

1. **Preparação (P):** branch front, API HTTP falsa em processo separado, `API_URL` apenas no ambiente local. O cliente usa as mesmas URLs, status, envelopes e schemas da API de destino. O fake valida pedidos e respostas contra `openapi.json`, carrega exemplos do pacote e recusa rotas/campos desconhecidos. Inclua cenários adicionais válidos pelo mesmo schema para vazio, erro e permissões. Isso prova o consumidor, não as regras reais do back.
2. **Ativação (A):** branch integrada, API real aceita no gate do recurso, banco isolado, mesmo conjunto de cenários no navegador. Sem fallback para dados fictícios. Só a entrega A permite marcar a migração HTTP como atual em produção.

As preparações de FE-01 a FE-08 podem avançar sem entrega BE. Na branch de demonstração atual, UI-01/UI-02 preservam json-server e sessão existentes. Mantenha a preparação de contratos em branch própria até ativar o conjunto coerente de cliente/sessão/consumidores: alternar apenas `API_URL` não converte contratos json-server em contratos NestJS. Não remover serviços antigos em uma branch que ainda dependa deles.

### Primeiro corte integrado e aditivos

A ativação real é **um corte único** ([INTEGRACAO §3](../INTEGRACAO.md#3-matriz-de-recursos-e-gates)), sem adaptador legado e sem publicação intermediária. Entram juntos: FE-01 (cliente), FE-02 (sessão JWT e cadastro), FE-03, FE-04, FE-05 e FE-07a (dashboard que substitui o Resumo), de modo que toda rota existente que usa dados tenha endpoint real. FE-06, FE-07b (Minha fila) e FE-08 (gestão) são **aditivos**, depois do corte, porque só criam rotas novas. FE-09 e FE-10 fecham após os aditivos.

### Sequência de posse por arquivo

Há um só dev front e cada arquivo tem uma posse em sequência, sem duas implementações dos mesmos arquivos:

1. UI-01, depois **UI-02.00** (componentes compartilhados), depois as linhas UI-02.01 a 02.12, que possuem as páginas e os formulários.
2. Cada FE que toca página ou formulário **assume o arquivo só depois da linha UI correspondente aceita** e rebaseia a branch de preparação sobre essa base UI. A tabela abaixo é a regra; cada tarefa FE repete as suas linhas.
3. Preparação que não toca arquivos de UI (FE-00, FE-01, `lib/`, schemas, services, Actions, fake HTTP) pode avançar antes de qualquer UI-02.
4. Branches: a de UI-01/UI-02 preserva json-server; a de preparação recebe cada linha UI aceita por rebase explícito; as duas só se encontram no Corte 1.

| Arquivos de página ou formulário | Linha UI que os entrega | Tarefa FE que os assume depois |
|---|---|---|
| `app/(site)/layout.tsx`, `app/(painel)/layout.tsx`, `components/oanet/CascaOa.tsx` | UI-01 | FE-02, FE-07b, FE-08 (links por papel, em sequência) |
| `app/(site)/login/page.tsx`, `_components/FormLogin.tsx` | UI-02.03 | FE-02 |
| `app/(site)/lanternas/page.tsx`, `_components/CartaoLanterna.tsx` | UI-02.04 | FE-03 |
| `app/(site)/lanternas/[id]/page.tsx` | UI-02.05 | FE-03 |
| `app/(painel)/painel/page.tsx` | UI-02.06 | FE-07a |
| `ocorrencias/page.tsx`, `_components/FiltroOcorrencias.tsx` | UI-02.07 | FE-04 |
| `ocorrencias/nova/page.tsx`, `_components/FormOcorrencia.tsx` | UI-02.08 | FE-04 |
| `ocorrencias/[id]/page.tsx`, `_components/FormStatus.tsx` | UI-02.09 | FE-04 (detalhe), FE-05 (status), FE-06 (timeline) |
| `ocorrencias/[id]/atribuir/page.tsx`, `_components/FormAtribuir.tsx` | UI-02.10 | FE-05 |
| boundaries `loading`/`error`/`not-found` | UI-02.11 | FE-04, FE-07a em suas rotas |
| `components/*.tsx`, `components/ui/*` | UI-02.00 | todas, só consumindo; mudança nova só por tarefa que registre o arquivo |

(Caminhos de `ocorrencias/` partem de `app/(painel)/painel/`.)

Variáveis de ambiente da tarefa (`API_URL`, portas) vão no ambiente do processo que ela inicia; ninguém edita `.env.local`.

## Ciclo obrigatório de cada incremento

- [ ] Registrar base/arquivos/responsável e baseline antes da edição; preservar alterações locais.
- [ ] Escrever primeiro os casos de sucesso e erro da tabela do incremento. Executar o teste focado e registrar a falha que demonstra a lacuna; implementar a menor mudança do escopo.
- [ ] Repetir teste focado, depois `npm run test:run`, `npm run lint`, `npm run build`; resultados são futuros e devem conter comando, exit e falhas anteriores separadas.
- [ ] Conferir 375 px, tablet e desktop, teclado/foco, conteúdo longo, movimento reduzido, modo calmo, aba oculta e elementos fora da tela. Registrar capturas e roteiro por URL.
- [ ] Rever diff, atualizar o estado real da tela e entregar revisão. Em P, registrar “preparado contra contrato”; em A, registrar API/banco/fluxos reais. Componentes assíncronos precisam de navegador/E2E; Vitest não prova Server Components assíncronos.

Para testes focados: `npm exec -- vitest run <caminho-do-teste>`; substituir pelo arquivo indicado no incremento, com resultado esperado após implementação exit 0. Os caminhos de testes novos abaixo são propostas explícitas. Guias locais a consultar por necessidade: `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`, guias de layouts/CSS, `01-app/02-guides/testing/vitest.md`, cookies, redirect, cache e Server Actions. Revalidar os caminhos na instalação usada. Cada registro inclui `info.version` e SHA-256 do conjunto contratual (linha `conjunto` de `py -3 docs/contratos/validar.py --hash`), cenários usados e próximo passo. Antes da tarefa, conferir `--conferir-hash HASH_DO_G1` e os testes documentais do pacote.

## UI-01 — concluir a casca herdada

**Depende:** assets OANET já no HEAD (`5377e39`; conferir com `git ls-files components/oanet`); nenhuma API nova. **Dono:** dev front; os layouts passam depois a FE-02, FE-07b e FE-08 em sequência (tabela de posse). **Modificar existentes:** `components/oanet/CascaOa.tsx`, `app/(site)/layout.tsx`, `app/(painel)/layout.tsx`, `app/globals.css`, `__tests__/components/casca-oanet.test.tsx`; `app/layout.tsx` somente se a composição exigir, preservando fontes/metadata.

- [ ] Inspecionar contrato de `CascaOa` e slots, comparar layouts/actions antes da extração e testar links ativos aninhados, Escape/restauração de foco e menu móvel.
- [ ] Integrar identidade derivada da sessão e saída real por Action. Manter layouts servidores e `children` da página sem promover a árvore toda para client.
- [ ] Validar sticky no desktop, menu no celular, skip link, IDs SVG únicos e cleanup do movimento. Conservar as 25 seleções da vitrine.

**Aceite:** visitante, Lanterna e Guardião navegam por URL com identidade correta, saída funciona e rota privada segue protegida. Sem import de `dados-demo.ts` em consumidor real; foco retorna ao controle após Escape. Só então UI-01 pode ser concluída.

## UI-02.00 — componentes compartilhados (antes de qualquer rota)

**Dono:** dev front. **Depende:** UI-01. **Passo inicial:** inspecionar `components/oanet/{PainelOa,IconeOa,EmblemaOa,CascaOa}.tsx` e reutilizar o que já existir (`MolduraOa`, `BotaoOa`, `SeloOa`, `IconeOa`) antes de criar qualquer coisa; o que a UI-01 já extraiu é preservado. Inventário conferido em 2026-11-09 (lista completa, sem curinga; “usado por” vem de `import` em `app/` e `components/`):

| Arquivo | Usado por | Testes | Destino |
|---|---|---|---|
| `components/CabecalhoPagina.tsx` | 8 páginas do painel e do site, `design-system` | `__tests__/components/dados.test.tsx` | Adaptar à moldura OANET; mesmas props |
| `components/TabelaOcorrencias.tsx` | `painel/page.tsx`, `ocorrencias/page.tsx`, `design-system` | `compartilhados.test.tsx`, `dados.test.tsx` | Adaptar sobre `ui/table.tsx`; mesmas props |
| `components/BadgeStatus.tsx`, `BadgeGravidade.tsx` | detalhe, `TabelaOcorrencias`, `design-system` | `dados.test.tsx` | Adaptar sobre `SeloOa`; o texto continua o significado |
| `components/IconeStatus.tsx` | `BadgeStatus`, `BarraStatus`, `design-system` | `marca.test.tsx` | Adaptar com `IconeOa` ou manter |
| `components/BarraStatus.tsx` | `painel/page.tsx`, `design-system` | `dados.test.tsx` | Adaptar em UI-02.06; **remover em FE-07a**, quando o dashboard substitui o Resumo |
| `components/LinkVoltar.tsx` | nova, detalhe, atribuir, ficha | `navegacao.test.tsx` | Adaptar |
| `components/CampoTexto.tsx` | `FormLogin`, `FormOcorrencia`, `FormStatus` | `compartilhados.test.tsx` | Adaptar sobre `ui/input`, `ui/textarea`, `ui/label`, mantendo `register` do RHF |
| `components/CampoSelect.tsx` | `FiltroOcorrencias`, `FormAtribuir`, `FormOcorrencia`, `FormStatus` | indireto em `filtro-ocorrencias.test.tsx` | Adaptar sobre `ui/select`, mantendo `Controller`; acrescentar caso direto em `compartilhados.test.tsx` |
| `components/MensagemErro.tsx` | `CampoTexto`, `CampoSelect`, formulários | `compartilhados.test.tsx` | Adaptar; associação acessível preservada |
| `components/EstadoVazio.tsx`, `TelaDeErro.tsx` | listas, painel, `error.tsx` das rotas | `compartilhados.test.tsx` | Adaptar |
| `components/EsqueletoLista.tsx` | três `loading.tsx` | nenhum | Adaptar sobre `ui/skeleton`; o teste novo fica em `estados-oanet.test.tsx` (UI-02.11) |
| `components/PaginaAviso.tsx` | `not-found` e `acesso-negado` | `navegacao.test.tsx` | Adaptar |
| `components/Juramento.tsx` | portal, Sobre | `navegacao.test.tsx` | Adaptar; texto preservado |
| `components/Emblema.tsx` | login, portal, `design-system`, `Marca`, `PaginaAviso` | `marca.test.tsx` | Substituir por `components/oanet/EmblemaOa.tsx`; remover com o último consumidor (`design-system`, UI-02.12) |
| `components/Marca.tsx` | nenhum import em `app/` ou `components/` | `marca.test.tsx` | Remover (a casca a substitui); mantém no teste só as asserções dos outros componentes |
| `components/MenuNavegacao.tsx` | nenhum import em `app/` ou `components/` | `compartilhados.test.tsx`, `navegacao.test.tsx` | Remover; mover o caso de link ativo e `aria-current` para `casca-oanet.test.tsx` |
| `components/ui/button.tsx` | 10 arquivos, `PainelOa` | `ui.test.tsx` | Manter como primitiva; `BotaoOa` nos chamados à ação |
| `components/ui/{input,label,select,textarea,table,skeleton}.tsx` | via `Campo*`, `TabelaOcorrencias`, `EsqueletoLista` | `ui.test.tsx` | Adaptar aos tokens OANET |
| `components/ui/{badge,card}.tsx` | `CartaoLanterna`, `design-system` | nenhum | Substituir na composição de UI-02.04; remover se sem uso depois |
| `components/ui/alert.tsx` | só `design-system` | nenhum | Remover em UI-02.12 |

- [ ] Para cada linha, criar ou ajustar primeiro o teste que prova o destino (props e semântica preservadas, ou remoção sem consumidor) e executar o ciclo obrigatório.
- [ ] Atualizar o inventário se `git status --short` ou `rg -l "@/components/" app components __tests__` mostrar arquivo que não está aqui.

**Aceite:** cada componente da tabela está no destino indicado e os testes citados passam; `npm run build` compila todos os consumidores; nenhum import resta de arquivo removido. Depois de UI-02.12, `rg -l "@/components/(Emblema|Marca|MenuNavegacao)'" app components __tests__` não encontra nada. Só então UI-02.01 em diante podem consumir os componentes.

## UI-02 — migração de cada rota existente (Concluída e Integrada à `main`)

> **Status em 2026-11-11:** Todas as linhas UI-02.01 a UI-02.12 foram concluídas, validadas com 204 testes e integradas à `main` através das PRs #6 (Bloco A: Públicas), #7 (Bloco B: Painel Operacional) e #8 (Bloco C: Gestão, Estados e Limpeza). O handoff de encerramento e os refinamentos visuais estão catalogados em [HANDOFF-UI-02](../agents/HANDOFF-UI-02.md).

Todas as linhas dependem de UI-01 e UI-02.00 e mantêm regras/actions atuais enquanto a branch usa json-server. Para **cada linha**, criar o caso visual/semântico do aceite, compor `MolduraOa`, `BotaoOa`, `SeloOa`, `IconeOa` e assets pertinentes com dados por props, executar o ciclo acima e atualizar apenas aquela tela em `TELAS.md`. Arquivos “novo” não existem na conferência; os demais existem.

| Incremento e arquivos atribuídos | Passos próprios | Aceite de sucesso e erro; teste focado | Status |
|---|---|---|---|
| UI-02.01 Portal: `app/(site)/page.tsx`; `__tests__/app/paginas-publicas.test.tsx` | Extrair composição do portal com arquitetura vetorial; manter Links reais e texto institucional. | Acesso ao catálogo e login por teclado; nenhuma métrica demonstrativa apresentada como real. Teste público existente. | Concluído (PR #6) |
| UI-02.02 Sobre: `app/(site)/sobre/page.tsx`; teste público existente | Compor conteúdo de Oa, Tropa e juramento com OANET; preservar leitura e landmarks. | Títulos/links/juramento legíveis em 375 px e com movimento reduzido; navegação de volta funciona. | Concluído (PR #6) |
| UI-02.03 Login: `app/(site)/login/page.tsx`, `_components/FormLogin.tsx`; `__tests__/components/form-login.test.tsx` | Aplicar controles OANET ao RHF; preservar action real e visibilidade de senha acessível. | Válido entra; inválido associa erro ao campo; falha de API mostra erro geral e permite nova tentativa, sem envio simulado. | Concluído (PR #6) |
| UI-02.04 Catálogo: `app/(site)/lanternas/page.tsx`, `_components/CartaoLanterna.tsx`; novo `__tests__/components/catalogo-oanet.test.tsx` | Compor lista/filtro atual pela URL; apresentar ficha por Link e selos com texto. | Filtro mantém seleção e Links; filtro sem resultados mostra vazio próprio, conteúdo longo não estoura. | Concluído (PR #6) |
| UI-02.05 Ficha: `app/(site)/lanternas/[id]/page.tsx`; novo `__tests__/components/ficha-oanet.test.tsx` | Compor dados disponíveis, sem preencher lacunas com dados da vitrine; usar construto como interpretação artística. | Ficha existente e incompleta legíveis; id ausente alcança 404; nenhum dado canônico inferido do desenho. | Concluído (PR #7) |
| UI-02.06 Resumo: `app/(painel)/painel/page.tsx`; novo `__tests__/components/resumo-oanet.test.tsx` | Exibir somente contagens dos serviços atuais; manter filtro de setor autorizado. | Guardião vê escopo permitido e Lanterna só seu setor; ausência de ocorrências tem vazio e ação útil. Sem indicadores 7.200/3.600/98,7% do laboratório. | Concluído (PR #7) |
| UI-02.07 Ocorrências: `app/(painel)/painel/ocorrencias/page.tsx`, `_components/FiltroOcorrencias.tsx`; `__tests__/components/filtro-ocorrencias.test.tsx` | Migrar lista/filtros e selos sem mudar a normalização nem buscar no cliente. | URL reproduz filtro após recarga; setor alheio não aparece ao Lanterna; vazio tem frase específica. | Concluído (PR #7) |
| UI-02.08 Nova: `app/(painel)/painel/ocorrencias/nova/page.tsx`, `_components/FormOcorrencia.tsx`; `__tests__/components/form-ocorrencia.test.tsx` | Manter RHF/Zod/action atual; estilizar seleção e mensagens por associação acessível. | Registro persiste em cópia isolada de dados e navega ao detalhe; Lanterna não escolhe setor; campo inválido e API indisponível preservam dados digitados. | Concluído (PR #7) |
| UI-02.09 Detalhe: `app/(painel)/painel/ocorrencias/[id]/page.tsx`, `_components/FormStatus.tsx`; `__tests__/components/form-status.test.tsx` | Compor dados e ação de status atual, sem antecipar máquina de estados da API nova na demonstração. | Resolução válida persiste; erro de campo/servidor é legível; detalhe ausente/sem acesso segue proteção atual, sem vazamento. | Concluído (PR #8) |
| UI-02.10 Atribuir: `app/(painel)/painel/ocorrencias/[id]/atribuir/page.tsx`, `_components/FormAtribuir.tsx`; novo `__tests__/components/form-atribuir.test.tsx` | Aplicar UI ao select RHF/Base UI e manter action do Guardião. | Responsável do setor persiste e navega; Lanterna não acessa por URL nem executa action; erro não fecha o formulário. | Concluído (PR #8) |
| UI-02.11 Estados globais/locais: `app/not-found.tsx`, `app/(site)/lanternas/{loading,error}.tsx`, `app/(site)/lanternas/[id]/not-found.tsx`, `app/(painel)/painel/{loading,error}.tsx`, `app/(painel)/painel/ocorrencias/{loading,error}.tsx`, `app/(painel)/painel/ocorrencias/[id]/not-found.tsx`, `app/(site)/acesso-negado/page.tsx`; novo `__tests__/components/estados-oanet.test.tsx` (inclui `EsqueletoLista`). Os componentes `EstadoVazio`, `EsqueletoLista` e `TelaDeErro` são de UI-02.00 | Migrar carregando/erro/vazio/404/403, manter botão “Tentar de novo” ligado ao reset da boundary. | Atraso mostra skeleton sem saltos graves; erro recuperável permite recarregar; 404 não revela recurso privado; acesso negado tem saída utilizável; status com texto. | Concluído (PR #8) |
| UI-02.12 Referência visual: `app/(site)/design-system/page.tsx`, `_components/SecaoVitrine.tsx`; `__tests__/app/design-system.test.tsx`, `__tests__/design-system.test.ts`; `app/laboratorio/page.tsx` só se necessário; remove `components/ui/alert.tsx` e, com o último consumidor, `components/Emblema.tsx` | Redirecionar `/design-system` à vitrine `/laboratorio` ou atualizar a vitrine na mesma linguagem, registrando a escolha; manter laboratório isolado. | Link antigo chega à referência OANET, sem página de design concorrente; laboratório continua identificado como demonstração e não grava dados. | Concluído (PR #8) |

UI-02.11 usa nomes abreviados `{loading,error}` apenas para os dois arquivos existentes de cada diretório; a tarefa atribui ambos. Inclui também os **novos planejados** `app/loading.tsx`, `app/error.tsx` e `app/global-error.tsx`: conferir guias locais, manter fallback global utilizável mesmo sem layout/casca e testar recuperação de falha no nível correto. O global error precisa funcionar sem depender de sessão, provider ou dados da API. Qualquer novo boundary adicional deve constar no registro da rota antes da edição.

## FE-00 — infraestrutura independente e servidor de contrato

> **Status em 2026-11-11:** **Ativado (A)** no Corte 1 e aditivos ([registro](../INTEGRACAO.md#registro-de-ativação-a--corte-1-e-aditivos)); antes, preparado contra contrato (P) na branch `front/fe-00-infra`, sem ativação real: `lib/env.ts` valida `API_URL` e `SITE_URL` ao iniciar, cabeçalhos e CSP estão em relatório no `next.config.ts`, robots e sitemap excluem `/painel`, e entram o servidor falso `scripts/contrato/servidor.mjs` (6 testes `node:test`) e o Playwright com `e2e/fumaca.spec.ts`. Consome o openapi v1.0.0 com pacote SHA-256 `cd91fef5a43bb239a67be5bbc1a942caedda7129bb268da7dbfdd0632b9a4730`, conferido por `python docs/contratos/validar.py --conferir-hash` (exit 0); o commit do dev front é de 2026-11-10 e foi rebaseado sobre a `main` 7648854 em 2026-11-11. Verificado em 2026-11-11 com `npm run build` (com `SITE_URL` no ambiente), `npx playwright test` (1 passou) e `node --test scripts/contrato/servidor.test.mjs` (6/6), todos exit 0; nada disso prova a API real, e o `.env.local` de quem roda o projeto precisa de `SITE_URL`, presente em `.env.example`.

**Depende:** G-1 (contrato aceito); UI pode avançar em paralelo. **Dono de `package.json`, lock e configuração:** dev front. **Existentes:** `next.config.ts`, `.env.example`, `package.json`, `package-lock.json`, `__tests__/configuracao.test.ts`, `app/layout.tsx`. **Novos planejados:** `lib/env.ts`, `app/robots.ts`, `app/sitemap.ts`, `playwright.config.ts`, `e2e/fumaca.spec.ts`, `scripts/contrato/servidor.mjs`, `scripts/contrato/servidor.test.mjs`, `__tests__/fixtures/contrato/cenarios.ts`.

- [ ] Registrar inclusão de Playwright e do validador compatível com a versão OpenAPI escolhida no contrato, revisar dependências antes de instalar; criar o script futuro `test:e2e` e um comando explícito para iniciar o fake, ambos documentados no package. Planejar também o download do navegador do Playwright (`npx playwright install chromium`, rede e disco fora de `package.json`), registrado com autorização explícita do dev front; `npm install` não o faz.
- [ ] Validar ambiente apenas servidor; aplicação falha sem `API_URL`. Aplicar headers/CSP em relatório e metadata pública; excluir painel do robots/sitemap.
- [ ] Criar fake HTTP loopback com `node:http` e testes `node:test`, porta exclusiva, sem persistência compartilhada. Carregar exemplos reais do pacote; validar request/response e simular latência/401/403/404/409/422/429/500 mediante cenário local controlado pelo teste, nunca parâmetro de produto. Depois de criar os arquivos, executar `node --test scripts/contrato/servidor.test.mjs`; esperado exit0 com recusa de rota/campo incompatível.
- [ ] Criar fumaça do build que abre portal/login e comprova que navegador conversa com Next; chamadas à API ficam no servidor. Configuração de publicação não inicia nem importa o fake.

**Aceite P:** inicialização sem variável falha claramente; headers observáveis; rota/campo fora do contrato é rejeitado pelo fake; teste usa porta isolada e encerra só seu processo. `npm run test:e2e` é **script futuro**, só será exigível após esta tarefa o criar. Um teste validado no fake não conclui nenhum gate real.

## FE-01 — cliente HTTP único preparado

> **Status em 2026-11-11:** **Ativado (A)** no Corte 1 e aditivos ([registro](../INTEGRACAO.md#registro-de-ativação-a--corte-1-e-aditivos)); antes, preparado contra contrato (P) na branch `front/fe-00-infra`, sem ativação real: `requisitarApi(caminho, schemaDosDados, opcoes)` e `requisitarApiSemConteudo` (204) em `lib/api.ts` exigem cache explícito (`{ cache: 'no-store' }` ou `{ revalidate, tags? }`), enviam Bearer quando há token, montam consulta sem vazios e validam o envelope `{ sucesso, dados }`; `urlDaApi` segue só para os serviços json-server até FE-02..FE-04 migrarem cada um. Falha de rede vira `ApiError(0, 'FALHA_REDE')` e corpo ilegível ou fora do schema vira `RESPOSTA_INVALIDA`; `lib/api-error.ts` traz `MENSAGENS_CODIGO` para os códigos 401/403/404/409/422/429 do contrato, `destinoDoErro` e `resultadoDeErroApi`, e `lib/erro-detalhe.ts` converte 400 em leitura de detalhe em `notFound`. Verificado em 2026-11-11 com `npm run test:run` (42 arquivos, 228 testes) e `npm run lint`, ambos exit 0; nada disso prova a API real, e o 401 ainda vai para `/login` até o FE-02 criar `/sessao-expirada`.

**Depende P:** FE-00 (a preparação do cliente não depende de nenhuma linha UI); **A (Corte 1):** BE-01 e G1, ativado junto com os consumidores, nunca sozinho. **Existentes:** `lib/api.ts`, `lib/api-error.ts`, `lib/erro-detalhe.ts`, `lib/erros-formulario.ts`, `__tests__/lib/servicos.test.ts`, `__tests__/lib/erro-detalhe.test.ts`, `__tests__/lib/erros-formulario.test.ts`. **Novos:** `lib/schemas/paginacao.ts`, `__tests__/lib/api.test.ts`.

- [ ] Testar sucesso objeto, lista, lista vazia, 204, corpo ilegível, envelope incompatível, falha de rede e cada status contratual; registrar `status`, `codigo`, `detalhes` sem comparar mensagem.
- [ ] Centralizar fetch/URL/Authorization no cliente servidor; estabelecer retorno genérico validado pelo schema do service e cache explícito. `204` retorna ausência de dados sem tentar JSON.
- [ ] Mapear 400 a campo, 401 ao encerramento da sessão, 403 a acesso negado, 404 a not-found, 409/422 por código, 429 a espera manual e 5xx a retry. Logs preservam privacidade.

**Aceite:** pedidos serializados no formato OpenAPI; 204 não falha no parser; resposta fora do schema não chega à página como tipo afirmado; código desconhecido tem mensagem geral segura. A prova HTTP real usa a API, sem mudança de parser entre P e A.

## FE-02 — sessão JWT, cadastro, login e saída

> **Status em 2026-11-11:** **Ativado (A)** no Corte 1 e aditivos ([registro](../INTEGRACAO.md#registro-de-ativação-a--corte-1-e-aditivos)); antes, preparado contra contrato (P) na branch `front/fe-02-sessao`, empilhada sobre `front/fe-00-01-infra-cliente` (PR #11), sem ativação real. Contrato v1.0.0 (SHA-256 do pacote `cd91fef5a43bb239a67be5bbc1a942caedda7129bb268da7dbfdd0632b9a4730`). Verificado com `npm run test:run` (49 arquivos, 252 testes), `lint`, `tsc --noEmit`, `build` e `npx playwright test` (5 passaram, contra o servidor falso de contrato). Os estados de setores indisponíveis ou vazios são provados só em `__tests__/components/cadastro-pagina.test.tsx`, porque o cache de 60 s torna o caso não determinístico no E2E.

**Depende P:** FE-01, UI-01 e UI-02.03 (assume `FormLogin.tsx` e a página de login só depois dela); **A (Corte 1):** BE-03, **BE-05 (leitura pública de Setores)**, BE-07a, BE-FX a e G2. **Existentes:** `lib/dal.ts`, `lib/sessao.ts`, `proxy.ts`, `lib/schemas/login.ts`, `lib/schemas/usuario.ts`, `app/(site)/login/actions.ts`, `app/(site)/login/_components/FormLogin.tsx`, `app/(painel)/actions.ts`, `app/(site)/layout.tsx`, `app/(painel)/layout.tsx`; testes `__tests__/acoes/{login,sair}.test.ts`, `__tests__/proxy.test.ts`, `__tests__/lib/sessao.test.ts`, `__tests__/components/{form-login,casca-oanet}.test.tsx`. **Novos:** `lib/escopo.ts` (destino de `podeAcessarSetor` e `setorParaFiltro`), `__tests__/lib/escopo.test.ts`, `lib/auth.ts`, `lib/schemas/cadastro.ts`, `app/(site)/cadastro/page.tsx`, `app/(site)/cadastro/actions.ts`, `app/(site)/cadastro/_components/FormCadastro.tsx`, `app/sessao-expirada/route.ts`, `__tests__/acoes/cadastro.test.ts`, `e2e/sessao.spec.ts`.

- [ ] Conferir guias locais de cookies/redirect/Route Handlers e a exceção AUTH-13 antes de editar sessão e sua expiração.
- [ ] Preparar `/auth/login`, `/auth/cadastro`, `/auth/me`; gravar JWT só no cookie `httpOnly`, `secure` em produção e validade por `expiresIn`. DAL consulta `/auth/me`; proxy só detecta cookie e cobre todo painel novo.
- [ ] Cadastro não recebe papel nem cria ficha; após sucesso navega a `/login`. Login bem sucedido usa replace a `/painel`, sem `?next=`. 401 de login é credencial inválida, sem iniciar sessão; 401 autenticado limpa cookie em `/sessao-expirada` e volta a login. Saída continua Action.
- [ ] Cadastro carrega a lista de Setores com `GET /setores` **no servidor** (página ou Action), sem lista fixa nem json-server. Testes de consumidor para a origem com erro (retry, formulário não enviável) e com lista vazia (mensagem própria, sem cadastro). Senha: limites de caracteres e de bytes conforme o OpenAPI (a senha não é aparada nem truncada), validados no schema do cadastro e do login; excesso mostra o erro no campo `senha`.
- [ ] Converter os consumidores de sessão na mesma ativação. `podeAcessarSetor` e `setorParaFiltro` (usados por `actions.ts` e pelas páginas de ocorrências e do painel) migram para `lib/escopo.ts` com seus casos de `__tests__/lib/sessao.test.ts`; os casos de `codificarSessao`/`decodificarSessao` saem com `lib/sessao.ts`, assim como a busca de senha em `lib/usuarios.ts`, quando nenhum consumidor os usar. O futuro serviço de gestão de usuários será contrato distinto, sem senha.
- [ ] Links por papel em `app/(site)/layout.tsx` (visitante: Cadastrar) e `app/(painel)/layout.tsx`, com teste “links por papel” em `__tests__/components/casca-oanet.test.tsx`; edição sequencial depois de UI-01.

**Aceite:** sem cookie→login; token inválido→cookie removido→login sem loop; promoção/rebaixamento na API altera navegação na próxima requisição; 403 papel→acesso negado. Cadastro inválido/duplicado mostra campo ou erro geral; 429 não repete sozinho. Setores indisponíveis ou vazios impedem o envio com mensagem útil. Nenhum arquivo removido deixa importador (`rg -l "lib/sessao|lib/usuarios" app lib __tests__` sem resultado). Token/senhaHash ausentes de props, HTML, RSC, storage, retorno de Action e logs; logout invalida o cookie do navegador.

## FE-03 — domínio público, busca e Ficha

> **Status em 2026-11-11:** **Ativado (A)** no Corte 1 e aditivos ([registro](../INTEGRACAO.md#registro-de-ativação-a--corte-1-e-aditivos)); antes, preparado contra contrato (P) na branch `front/fe-03-lanternas`, empilhada sobre `front/fe-02-sessao` (PR #12), com contrato v1.0.0 (pacote `cd91fef5a43bb239a67be5bbc1a942caedda7129bb268da7dbfdd0632b9a4730`). Lista e Ficha usam schemas separados, preservam campos nulos e marcam a fonte de cada campo; busca, status, setor, ordenação e página ficam na URL, e a paginação preserva esses parâmetros. Verificações: `npm run test:run` (51 arquivos, 275 testes), lint, tsc, build e `npx playwright test` (8 passaram, com 1 worker porque os specs dividem a porta do servidor falso). A ativação real segue como corte único (A), descrito em INTEGRACAO.

**Depende P:** FE-02 e UI-02.04/05 (assume as páginas de `/lanternas` só depois delas); **A (Corte 1):** BE-05/06/07b, BE-FX b e G3. **Existentes:** `lib/setores.ts`, `lib/lanternas.ts`, `lib/schemas/{setor,lanterna}.ts`, páginas/cartão de `/lanternas`; testes schemas/services. **Novos:** `components/Paginacao.tsx`, `__tests__/components/paginacao.test.tsx`, `e2e/lanternas.spec.ts`.

- [ ] Separar schema da lista e Ficha; consumir Setores sem paginação e Lanternas com `dados.itens/meta`. Setor inteiro, Lanterna slug; null preservado como null, sem coerção de ID herdada.
- [ ] Fazer busca (por codinome; o texto é enviado como digitado, a normalização de caixa e acento é do servidor)/status/setor/ordenação/página pela URL e reset de página ao mudar filtro; validar parâmetros inválidos com padrões seguros. Setor ou ano de ingresso nulos aparecem ao fim em qualquer direção de ordenação; limites dos campos da Ficha (como `primeiraAparicao`) vêm do OpenAPI.
- [ ] Exibir mentor/aprendizes navegáveis, estatísticas, fontes/selo “não verificado”, campos ausentes e construto artístico sem inventar fatos. Estados carregando/erro/vazio/dados em OANET.

**Aceite:** recarga mantém filtros; página vazia não quebra; ficha completa e com campos nulos respondem; ID ausente dá 404, falha de API dá retry. Dados de 25 Lanternas vêm do BE real em A; imagens/estudos do laboratório não viram dados canônicos.

## FE-04 — lista, detalhe e registro de ocorrências

> **Status em 2026-11-11:** **Ativado (A)** no Corte 1 e aditivos ([registro](../INTEGRACAO.md#registro-de-ativação-a--corte-1-e-aditivos)); antes, preparado contra contrato (P) na branch `front/fe-04-05-ocorrencias`, empilhada sobre `front/fe-03-lanternas` (PR #13), com contrato v1.0.0 e pacote `cd91fef5a43bb239a67be5bbc1a942caedda7129bb268da7dbfdd0632b9a4730`. A lista lê status, gravidade, setor, responsável, vencida, busca, ordenação e página da URL, e mostra as contagens por status de `meta.total` do servidor, nunca de uma página, até o dashboard do FE-07a. O Lanterna não escolhe setor e não envia `setorId` no registro, enquanto o Guardião registra no setor escolhido, inclusive o Setor `0`; detalhe de outro setor recebe 404 e o selo "Vencida" é texto. Verificado em 2026-11-11: `npm run test:run` (54 arquivos, 320 testes, exit 0), lint, tsc, build e `node --test` do servidor falso (7/7) com exit 0, e `npx playwright test` com 12 testes passados; nada disso prova a API real.

**Depende P:** FE-03, UI-02.07, UI-02.08 e UI-02.09 (assume lista, formulário de registro e página de detalhe só depois delas; a lista nunca calcula contagens a partir de uma única página); **A (Corte 1):** BE-08, BE-FX c e G4. **Existentes:** `lib/ocorrencias.ts`, `lib/filtro-ocorrencias.ts`, `lib/schemas/ocorrencia.ts`, páginas de lista/nova/detalhe, `FiltroOcorrencias.tsx`, `FormOcorrencia.tsx`, `app/(painel)/painel/ocorrencias/actions.ts`; testes filtros/services/schemas/registro. **Novo:** `e2e/ocorrencias.spec.ts`.

- [ ] Usar UUID e ISO de resposta; separar DTO de criação do objeto persistido. Status, prazo, criador, resolução e responsável não são enviados no POST.
- [ ] Implementar todos os filtros, responsável/vencida/busca (por título, normalização no servidor), ordenação e paginação conforme DTO na URL. Lanterna ignora setor de URL no escopo servidor e não envia `setorId` na criação; Guardião envia setor escolhido, inclusive Setor `0` válido (validar existência/tipo, não truthiness).
- [ ] Exibir prazo/vencida por texto e tempo formatado; tratar detalhe de outro setor como 404; preservar proteção servidor e resposta da API como autoridade.

**Aceite:** L2814 com URL forjada para 674 só lista seu setor e recebe 404 no detalhe alheio; Guardião cria em setor escolhido; campo extra/setor indevido é recusado. POST válido persiste no banco isolado e recarregar detalhe mantém dado. Query inválida não quebra o render, lista vazia e erro de rede têm estado próprio.

## FE-05 — ciclo de vida, edição e exclusão

> **Status em 2026-11-11:** **Ativado (A)** no Corte 1 e aditivos ([registro](../INTEGRACAO.md#registro-de-ativação-a--corte-1-e-aditivos)); antes, preparado contra contrato (P) na mesma branch `front/fe-04-05-ocorrencias`, feito junto com FE-04 porque o serviço de ocorrências é um único arquivo e as Actions de status e atribuição já dependiam dele. `/status` e `/responsavel` são chamados separadamente do PATCH de dados, e `null` em `/responsavel` libera o responsável; `lib/permissoes-ocorrencia.ts` decide só a visibilidade das ações (o Lanterna criador edita enquanto a ocorrência não estiver resolvida), e a API continua sendo a autoridade. A exclusão usa `ConfirmarExclusao` (role alertdialog, Escape cancela e devolve o foco) e volta à lista; RESOLUCAO_OBRIGATORIA, MOTIVO_OBRIGATORIO, SEM_RESPONSAVEL, RESPONSAVEL_DE_OUTRO_SETOR e LANTERNA_AFASTADO vão ao campo, e conflito nunca anuncia sucesso. As ações exclusivas do Guardião (atribuir, liberar, reabrir, excluir) estão provadas em testes de Action e de componente, não nos E2E, porque o servidor falso tem um único usuário em `/auth/me`; as molduras recebem o padding da UI-03 (PR #10) quando a cadeia for rebaseada.

**Depende P:** FE-04, UI-02.09 e UI-02.10 (assume `FormStatus.tsx`, `FormAtribuir.tsx` e as páginas de detalhe e atribuir só depois delas); **A (Corte 1):** BE-09, BE-FX d e G5. Os endpoints de status e atribuição que as telas atuais já usam precisam existir no mesmo corte. **Existentes:** actions de ocorrências, `FormStatus.tsx`, `FormAtribuir.tsx`, detalhe/atribuir e schema; `__tests__/acoes/status-atribuicao.test.ts`, `__tests__/components/form-status.test.tsx`. **Novos:** `app/(painel)/painel/ocorrencias/_components/FormEditarOcorrencia.tsx`, `ConfirmarExclusao.tsx`, `__tests__/acoes/ciclo-vida.test.ts`, `e2e/ciclo-vida.spec.ts`.

- [ ] Chamar `/status` e `/responsavel` distintos de PATCH de dados. Incluir resolução/motivo condicionais; `null` libera responsável de uma Ocorrência aberta; em andamento a API recusa com 422 `SEM_RESPONSAVEL` e a tela mostra o motivo sem mudar nada (reatribuir a outro responsável válido continua possível). Atribuir, reatribuir e liberar geram Evento `atribuida`, que a timeline de FE-06 exibe. Conferir Action por papel antes da validação, revalidar após persistência e redirecionar fora do try.
- [ ] Implementar a matriz inteira de ações de `TELAS.md`: editar para G/criador não resolvida; excluir/reabrir só G; atribuir não resolvida só G. Visibilidade não substitui API.
- [ ] Mapear `TRANSICAO_INVALIDA`, `SEM_RESPONSAVEL`, `RESOLUCAO_OBRIGATORIA`, `MOTIVO_OBRIGATORIO`, `RESPONSAVEL_DE_OUTRO_SETOR`, `LANTERNA_AFASTADO`, `OCORRENCIA_RESOLVIDA` a campos/erro geral. Em conflito reconsultar sem anunciar sucesso.

**Aceite:** aberta→andamento com responsável→resolvida com explicação→reaberta com motivo por G; a reabertura conserva prazo. Recusa de afastado mostra razão; dado desatualizado recebe erro e permanece corrigível. Exclusão exige confirmação acessível, retorna à lista e detalhe vira 404; papel indevido não executa action.

## FE-06 — Eventos e Comentários

> **Status em 2026-11-11:** **Ativado (A)** no Corte 1 e aditivos ([registro](../INTEGRACAO.md#registro-de-ativação-a--corte-1-e-aditivos)); antes, preparado contra contrato (P) na branch `front/fe-06-eventos-comentarios`, empilhada sobre `front/fe-07a-dashboard` (PR #15), com contrato v1.0.0 e pacote `cd91fef5a43bb239a67be5bbc1a942caedda7129bb268da7dbfdd0632b9a4730`. O detalhe ganhou Linha do tempo (frase por tipo de evento, com codinome do responsável) e Comentários (texto puro, "Apagar" só para o autor ou Guardião, com confirmação acessível, e formulário que limpa e anuncia "Comentário publicado."), com cada coleção paginada pela URL (`?eventos=` e `?comentarios=`) preservando a outra; `Paginacao` ganhou a prop opcional `parametro`. Verificado em 2026-11-11: `npm run test:run` (60 arquivos, 388 testes), lint, tsc, build e `npx playwright test` (18 testes), todos com exit 0; nada disso prova a API real, e não há edição de comentário ou evento.

**Depende P:** FE-05 e UI-02.09; **A (aditivo, depois do Corte 1):** BE-10, BE-FX etapa e e G6. **Existentes:** detalhe/schema de ocorrência; **novos:** `lib/{eventos,comentarios}.ts`, `lib/schemas/{evento,comentario}.ts`, `app/(painel)/painel/ocorrencias/_components/{LinhaDoTempo,Comentarios,FormComentario}.tsx`, `app/(painel)/painel/ocorrencias/comentarios-actions.ts`, `__tests__/acoes/comentarios.test.ts`, `__tests__/components/comentarios.test.tsx`, `e2e/comentarios.spec.ts`.

- [ ] Validar formatos de eventos por tipo e autor/datas pelo contrato; buscar detalhe/eventos/comentários independentes em paralelo, sem cache privado, paginação de cada coleção pela URL.
- [ ] Renderizar timeline em ordem e dados históricos; RHF/Action para comentar; excluir comentário só para autor/G, com confirmação e revalidação das duas coleções.

**Aceite:** comentário em resolvida funciona; exclusão some da lista e mostra Evento; outro autor L recebe 403, setor alheio 404. Sem controles de edição de comentário/evento. Coleções vazias/carregando/erro têm mensagens próprias, paginação não duplica itens.

## FE-07a — dashboard no lugar do Resumo (parte do Corte 1)

> **Status em 2026-11-11:** **Ativado (A)** no Corte 1 e aditivos ([registro](../INTEGRACAO.md#registro-de-ativação-a--corte-1-e-aditivos)); antes, preparado contra contrato (P) na branch `front/fe-07a-dashboard`, empilhada sobre `front/fe-04-05-ocorrencias` (PR #14), com contrato v1.0.0 e pacote `cd91fef5a43bb239a67be5bbc1a942caedda7129bb268da7dbfdd0632b9a4730`. `/painel` passou a mostrar o `GET /dashboard` (contagens por status e gravidade, vencidas, tempo médio, série em SVG com tabela equivalente, ranking e mais recentes), sem contagem vinda da lista paginada, e falha cai no `error.tsx` com "Tentar de novo". Verificado em 2026-11-11: `npm run test:run` (56 arquivos, 339 testes), lint, tsc, build e `npx playwright test` (15 testes), todos com exit 0; nada disso prova a API real. Com este passo, fecha a preparação do Corte 1 (FE-01 a FE-05 e FE-07a).

**Depende P:** FE-04 e UI-02.06 (assume `app/(painel)/painel/page.tsx` só depois dela); **A (Corte 1):** BE-11, BE-FX d e G7a. **Existentes:** `app/(painel)/painel/page.tsx`, `components/BarraStatus.tsx` (removida aqui, ver UI-02.00), `__tests__/components/dados.test.tsx`; **novos:** `lib/dashboard.ts`, `lib/schemas/dashboard.ts`, `app/(painel)/painel/_components/Dashboard.tsx`, `__tests__/components/dashboard.test.tsx`, `e2e/dashboard.spec.ts`.

- [ ] Trocar o resumo pelo `/dashboard` real: status, gravidade, vencidas, média (horas, arredondamento conforme o contrato; nula sem resoluções), série e ranking. Nenhuma contagem é calculada a partir da lista paginada de Ocorrências. Filtro de setor só G; `dias` validado na URL limita só a série em UTC incluindo hoje; outros agregados consideram todo o histórico não excluído. Gráficos vetoriais com tabela/texto equivalente, zero e média nula explícitos.
- [ ] Remover `BarraStatus` e seus casos de teste só quando nenhuma rota a importar; `design-system` já terá saído em UI-02.12.

**Aceite:** G vê todos os setores ou o filtro; L filtra apenas o próprio setor apesar de query forjada. Métricas correspondem ao manifesto da fixture e mudam após mutação/revalidação; sem as métricas da vitrine (7.200/3.600/98,7%). Falha da consulta permite tentar novamente; estados carregando/erro/vazio/dados.

## FE-07b — Minha fila (aditivo, depois do Corte 1)

> **Status em 2026-11-11:** **Ativado (A)** no Corte 1 e aditivos ([registro](../INTEGRACAO.md#registro-de-ativação-a--corte-1-e-aditivos)); antes, preparado contra contrato (P) na branch `front/fe-07b-minha-fila`, aditivo depois do Corte 1. `/painel/minha-fila` usa `GET /ocorrencias/minha-fila` na ordem da API, com paginação, vazio próprio e, para `409 CONTA_SEM_LANTERNA`, a mensagem de vínculo pendente (nunca uma fila vazia falsa); o Guardião é barrado por `exigirPapel`. O link "Minha fila" só aparece para o Lanterna (`linksDoPainel` em `components/oanet/navegacao.ts`), com o teste "links por papel".

**Depende P:** FE-04, UI-01 e UI-02.11; **A:** BE-08/09, BE-FX d e G7b. **Edita em sequência:** `app/(painel)/layout.tsx` (link “Minha fila” só para Lanterna) e `__tests__/components/casca-oanet.test.tsx` (teste “links por papel”). **Novos:** `app/(painel)/painel/minha-fila/page.tsx`, `loading.tsx`, `error.tsx`, `__tests__/components/minha-fila.test.tsx`, `e2e/fila.spec.ts`.

- [ ] Usar `/ocorrencias/minha-fila` do usuário, só atribuídas não resolvidas e não excluídas, sem enviar um responsável arbitrário. G não vê o link e o acesso direto é bloqueado; conta sem ficha mostra a mensagem útil de `CONTA_SEM_LANTERNA`, sem fingir fila vazia.

**Aceite:** fila ordenada por prazo/gravidade, paginação e vazio próprio; G direto recebe 403; resolver ou excluir retira da fila e reabrir atribuída a repõe. Links por papel corretos para visitante, Lanterna e Guardião no teste da casca.

## FE-08 — gestão restrita ao Guardião (aditivo, depois do Corte 1)

> **Status em 2026-11-11:** **Ativado (A)** no Corte 1 e aditivos ([registro](../INTEGRACAO.md#registro-de-ativação-a--corte-1-e-aditivos)); antes, preparado contra contrato (P) na branch `front/fe-08-gestao`, PR draft empilhado sobre #17 (aditivo depois do Corte 1), com contrato v1.0.0 e pacote `cd91fef5a43bb239a67be5bbc1a942caedda7129bb268da7dbfdd0632b9a4730`. As três telas de gestão restritas ao Guardião (`/painel/setores`, `/painel/lanternas` e `/painel/usuarios`) usam `exigirPapel('guardiao')` na primeira linha de páginas e Actions; `components/oanet/navegacao.ts` exibe os links de gestão apenas para o Guardião (`linksDoPainel`), verificado em `__tests__/components/casca-oanet.test.tsx`. Provado só contra o servidor falso do contrato: Lanterna barrado com redirecionamento a `/acesso-negado` e links ocultos em `e2e/gestao.spec.ts` (4 testes), e fluxos do Guardião cobertos em testes de Action, componente e contrato de serviço (o fake possui apenas um usuário Lanterna em `/auth/me`); nada disso prova a API real.

**Depende P:** FE-03, UI-01 e UI-02.11; **A:** BE-04/05/06 e G8, já sobre o Corte 1 e a fixture (as Ocorrências históricas e excluídas existem). **Edita em sequência:** `app/(painel)/layout.tsx` (links Lanternas (gestão), Setores, Usuários só para G), `app/(site)/layout.tsx` se necessário, e `__tests__/components/casca-oanet.test.tsx` (teste “links por papel”). **Novos:** `lib/gestao-usuarios.ts`, `lib/schemas/gestao-usuario.ts`; `app/(painel)/painel/setores/{page.tsx,actions.ts,_components/FormSetor.tsx}`; `app/(painel)/painel/lanternas/{page.tsx,actions.ts,_components/FormLanterna.tsx}`; `app/(painel)/painel/usuarios/{page.tsx,actions.ts,_components/FormPapel.tsx,_components/FormVinculo.tsx}`; `loading.tsx`/`error.tsx` em cada uma das três rotas; `__tests__/acoes/gestao.test.ts`, `e2e/gestao.spec.ts`. **Existentes:** services/schemas Setor e Lanterna e navegação OANET.

- [ ] Em todas as páginas/actions exigir G; construir CRUD de Setor, criar/editar/afastar/reativar Lanterna e listar/promover/vincular Usuário. Lanterna não tem DELETE nem aceita `em_missao` como estado editável; afastar/reativar a Ficha em missão recebe 409 `LANTERNA_EM_MISSAO`. A busca de Usuário é por nome ou e-mail.
- [ ] Validar slug, setor opcional/nulo, mentor sem presumir que o front prova ausência de ciclo; exibir erro de domínio. PATCH envia só alteração e preserva diferença entre campo omitido e null. Troca/remoção de Setor da Ficha incompatível com conta ou ocorrência, inclusive histórica, mostra `LANTERNA_EM_USO` e preserva formulário/valor anterior (RN-34).
- [ ] Usuário: mudar papel com setor obrigatório quando destino Lanterna ainda sem setor; conservar setor/vínculo ao promover, sem usá-los como escopo de G. Vincular/desvincular ficha por slug/null; vínculo a conta Guardião mostra `VINCULO_NAO_PERMITIDO` e Ficha sem Setor ou de outro Setor mostra `SETOR_DIFERENTE`. Recarregar `/auth/me` quando o próprio usuário muda.

**Aceite:** L não acessa nenhuma das três por URL nem chama Actions; Setor em uso mostra `SETOR_EM_USO`; Lanterna ligada a conta ou Ocorrência histórica/excluída mostra `LANTERNA_EM_USO` (casos da fixture); duplicados mostram `SETOR_JA_CADASTRADO`/`LANTERNA_JA_CADASTRADA`; mentor inválido, afastamento em missão, último G, setor obrigatório/diferente, vínculo não permitido e ficha já vinculada mostram erro útil. Sucessos persistem após recarga, quatro estados e teclado cobertos em cada lista/formulário. Se a prova for antecipada com o fake ou só em B, registrar P/B, nunca A.

## FE-09 — remoção da demonstração de dados e fechamento

> **Status em 2026-11-11:** **Concluído** na branch `front/fe-09-10-entrega`, sobre o Corte 1 ativado. Remoções: json-server (script `api` e dependência), `db.json` e `SESSION_SECRET` (`.env.example` fica com `API_URL=http://localhost:3001` e `SITE_URL=http://localhost:3000`). `scripts/iniciar.sh` foi reescrito para checar Node 26, instalar raiz e `backend/`, criar `.env.local` e `backend/.env` se faltarem, compilar o back, migrar, semear (`--etapa completa`) e subir API e Next juntos. O procedimento canônico de remoção é a conferência de encerramento deste item; o resultado da execução aparece no registro de entrega da branch.

**Depende:** Corte 1 (FE-01 a FE-05 e FE-07a) mais os aditivos FE-06, FE-07b e FE-08, UI-02 inteira (UI-02.00 a UI-02.12) e os gates G1–G8. **Dono único de `package.json`, `package-lock.json`, `scripts/iniciar.sh` e `db.json`:** dev front (o integrador revisa). `.env.example`, `AGENTS.md`, README e mapa seguem o [INTEGRACAO §1](../INTEGRACAO.md#1-fontes-e-papéis): o integrador os atualiza com a lista de mudanças que o dev front entrega. **Front:** `__tests__/configuracao.test.ts`, testes que importam db, marcadores removidos em `lib/` e rotas.

- [ ] Migrar todas as fixtures de teste para respostas do contrato/banco isolado; confirmar que nenhum consumidor exige json-server, sessão HMAC ou senha retornada pelo serviço.
- [ ] Remover json-server/script `api` e `db.json`; reescrever inicialização real ou remover `scripts/iniciar.sh` e atualizar instruções em conjunto. Remover `SESSION_SECRET` após a troca completa de sessão, mantendo variáveis servidor reais. Nenhum dado é apagado antes de todos os consumidores migrarem.
- [ ] Rever headers/CSP em relatório, metadata, robots e sitemap, erros sem segredos, medidas de acessibilidade/teclado e desempenho em build. Monitoramento opcional não exige contratar serviço.

### Procedimento canônico de remoção

Única definição do critério de remoção. [PLANO](../PLANO.md) e [INTEGRACAO](../INTEGRACAO.md) apontam para cá e não repetem o comando. Ele só é executado quando FE-09 entrega as remoções acima.

**Escopo operacional:** `app`, `lib`, `components`, `__tests__`, `scripts`, `package.json`, `package-lock.json`. Caminho inexistente (por exemplo `scripts/`, se o script foi removido) é omitido da lista; a conferência abaixo faz isso por `Test-Path`.

```powershell
$alvos = 'app','lib','components','__tests__','scripts','package.json','package-lock.json' |
  Where-Object { Test-Path -LiteralPath $_ }
Get-ChildItem -LiteralPath $alvos -Recurse -File |
  Select-String -Pattern 'json-server|db\.json'
```

Equivalente com ripgrep, quando instalado: `rg -n "json-server|db\.json" app lib components __tests__ scripts package.json package-lock.json`, sem os caminhos que não existam. **Saída esperada: vazia** (no ripgrep, exit 1 = sem ocorrência; um caminho inexistente na lista causa erro, por isso é omitido).

Conferência da árvore de dependências: `npm ls json-server --all`. Resultado esperado: árvore vazia, sem `json-server`; o exit code pode ser 1 justamente quando o pacote está ausente, e isso é o sucesso.

**Menções que não são dependência operacional:** documentação em `docs/`, `.claude/skills/frontend-web/references/removidas.md`, `tsconfig.tsbuildinfo` (artefato gerado, ignorado) e textos históricos de README e AGENTS. Antes de aceitar, ler o resultado de `rg -n "npm run api|json-server" README.md AGENTS.md docs/CONTRIBUINDO.md docs/agents/README.md` e confirmar que são só relatos históricos, sem instrução de execução.

**Aceite:** o procedimento acima sai vazio; `npm run test:run`, `npm run lint` e `npm run build` passam ou as falhas baseline estão relatadas separadamente, sem declarar aprovação. Nenhum fake é inicializado no start da demonstração; indisponibilidade real gera erro visível.

## FE-10 — E2E real e entrega independente concluída

> **Status em 2026-11-11:** **Concluído como ferramenta** na branch `front/fe-09-10-entrega`: o E2E contra a API NestJS real é `npm run test:e2e:real` (`playwright test -c playwright.corte1.config.ts`), e exige o build do back (`backend/`) e do front, com a API no ar, banco migrado e semeado. O aceite final e o registro de evidências (roteiro visual e gate G9) seguem pendentes até a execução registrada em [INTEGRACAO](../INTEGRACAO.md). `npm run test:e2e` continua no servidor falso de contrato.

**Depende:** FE-09, BE-12 e BE-FX completo, gate G9. **Novos/ajustar:** `e2e/*.spec.ts` dos incrementos, `playwright.config.ts`; documentação final atribuída à integração.

- [ ] Rodar o build com API real em porta exclusiva e SQLite temporário migrado; executar `npm run fixture:integracao` (planejado, do dev back) com `DATABASE_PATH` e `FIXTURE_SENHA` no ambiente do processo e ler o manifesto; obter sessões reais por `/auth/login` e reiniciar o estado por teste. Não depende do seed demonstrativo.
- [ ] Cobrir cadastro→login, vínculo por G, registro L/G, atribuição, início, resolução, reabertura, comentário/apagar, gestão, fila/dashboard e saída. Incluir rotas diretas autenticadas, sem sessão, papel errado, setor alheio e expiração durante uma Action. Datas relativas ao instante do manifesto, com margem de pelo menos 1 hora; os casos exatos de Prazo ficam no teste do provedor.
- [ ] Verificar persistência após recarga/reinício da API, revalidação de listas/métricas, ausência de token no browser e estados recuperáveis. Roteiro visual (375 px, tablet, desktop, teclado, movimento reduzido) com capturas. Registrar ambiente, comandos, resultados e capturas; seguir [integração](../INTEGRACAO.md) para merge/rollback.

**Aceite final:** a execução por uma pessoa nova a partir do guia instala, migra, aplica a fixture, inicia e passa a suíte sobre API real; nenhum cenário depende do fake ou do `db.json`. Marcar telas/contratos como atuais somente com essas evidências. O plano não autoriza iniciar implementação enquanto a pausa DOC-03 vigorar.
