# Auditoria do projeto: ERP da Tropa dos Lanternas Verdes

- **Data:** 2026-10-07
- **Versão auditada:** branch `feat/design-system`, commit `a9c1314` (antes desta atualização)
- **Gerado por:** skill `auditoria-apresentacao`, com regras da skill `padroes-wellington`
- **Como reproduzir:** `bash .claude/skills/auditoria-apresentacao/scripts/verificar.sh .`

Legenda de origem: **Slide** = material do professor (sigla do deck e página); **Docs** = documentação oficial atual; **Decisão** = escolha do grupo. As siglas dos decks estão no `SKILL.md` de `padroes-wellington`. O texto dos requisitos é o repassado pelo grupo (`references/requisitos-enunciado.md`); o PDF original do enunciado não foi conferido.

## 1. Resumo

| Item | Resultado |
|---|---|
| Requisitos do enunciado atendidos | **6 de 6** (ressalvas na seção 2) |
| Violações confirmadas | **1** (ROTA-08, em 2 arquivos de `components/ui/`) |
| Itens para revisar | **4 de 4** decididos pelo script (`REVISAR`), sem violação |
| Regras com marcador no código | **84 de 130** (284 ocorrências) |
| Regras de slide sem aplicação | **0** faltando; **2** não se aplicam (seção 5.1); **30** aplicadas sem marcador (seção 5.2) |
| `npm run test:run` | **124 testes em 25 arquivos**, todos passando |
| `npm run lint` / `npm run build` | **sem erro** / **sem erro** (Next.js 16.4.0, 12 rotas de página) |
| Verificações manuais | M-01 a M-04, M-09 a M-11 feitas; M-05 a M-08 **não executadas** (seção 3.3) |

O projeto cobre os seis requisitos: homepage, páginas públicas, área privada com proxy e DAL, login, controle de acesso e a camada de serviços em `lib/`. O design system (tokens e tema Noite, espectro de gravidade, foco em anel, fontes, emblema e a vitrine `/design-system`) está implementado e coberto por testes. O único problema confirmado é um `'use client'` desnecessário em dois arquivos gerados pelo shadcn, fora do alcance do script. O que é mais arriscado na apresentação é o fluxo no navegador (M-05 a M-08), que não foi reexecutado nesta rodada.

## 2. Matriz de requisitos

| Req | Requisito (literal) | Arquivo:linha | Regra(s) | Fonte | Status |
|---|---|---|---|---|---|
| REQ-01 | Homepage: ponto de entrada, com navegação clara para as demais áreas. | `app/(site)/page.tsx:25-26`, `app/(site)/page.tsx:7-11`, `app/(site)/layout.tsx:6-11` | DEC-09, ROTA-16, ROTA-06 | Decisão; Slide ROTAS p. 14, 19, 22 | ✅ |
| REQ-02 | Páginas públicas: pelo menos duas, acessíveis sem autenticação (listagens, institucional, detalhes...). | `app/(site)/lanternas/page.tsx:19`, `app/(site)/lanternas/[id]/page.tsx:16`, `app/(site)/sobre/page.tsx:11`, `proxy.ts:19` (matcher só cobre `/painel` e `/login`) | DEC-09, ROTA-04, ROTA-07, API-05, ROTA-10, ROTA-12 | Decisão; Slide ROTAS p. 15, 17; APIS p. 10 | ✅ (ver ressalva) |
| REQ-03 | Área privada: acessível só para autenticados, acesso protegido. | `app/(painel)/painel/page.tsx:19`, `app/(painel)/painel/ocorrencias/page.tsx:23`, `app/(painel)/painel/ocorrencias/[id]/page.tsx:24`, `app/(painel)/painel/ocorrencias/[id]/atribuir/page.tsx:18`, `app/(painel)/painel/ocorrencias/nova/page.tsx:11`, `app/(painel)/painel/ocorrencias/actions.ts:16`, `app/(painel)/painel/ocorrencias/actions.ts:71`, `app/(painel)/actions.ts:8` | ROTA-04, AUTH-04, AUTH-05, AUTH-07, DEC-03 | Docs Next 16 (autenticação); Slide APIS p. 5; Decisão | ✅ (ver ressalva) |
| REQ-04 | Sistema de login funcional: tela de login que controla o acesso à área privada. | `app/(site)/login/page.tsx:7`, `app/(site)/login/_components/FormLogin.tsx:13-15`, `app/(site)/login/actions.ts:13` (safeParse), `app/(site)/login/actions.ts:24-25` (credencial errada), `app/(site)/login/actions.ts:28-35` (cookie e `replace`), `lib/sessao.ts:30` (assinatura HMAC), `app/(painel)/layout.tsx:30` (botão Sair) | AUTH-08, AUTH-02, AUTH-03, AUTH-09, FORM-01, FORM-17, FORM-18, FORM-19, ROTA-19 | Decisão; Slide FORMS p. 8, 16, 20; ROTAS p. 20; Docs Next 16 | ✅ (ver ressalva) |
| REQ-05a | Controle de acesso: verificar se está autenticado. | `proxy.ts:7` (`decodificarSessao`), `lib/dal.ts:30-33` (`verificarSessao`), `lib/sessao.ts:34-50` (assinatura e expiração) | AUTH-01, AUTH-03, AUTH-04 | Docs Next 16; Slide ROTAS p. 20 | ✅ |
| REQ-05b | Controle de acesso: permitir ou bloquear rotas privadas. | `proxy.ts:19` (matcher), `lib/dal.ts:37-40` (`exigirPapel`), `app/(painel)/painel/ocorrencias/[id]/atribuir/page.tsx:18`, `app/(site)/acesso-negado/page.tsx:7` | AUTH-01, AUTH-04, AUTH-05, AUTH-06 | Docs Next 16; Decisão; Slide APIS p. 5 | ✅ |
| REQ-05c | Controle de acesso: redirecionar não autenticados para o login. | `proxy.ts:10-12` (`NextResponse.redirect` para `/login`), `lib/dal.ts:32` (`redirect('/login')`), `app/(painel)/actions.ts:10` | AUTH-01, AUTH-04, ROTA-20 | Docs Next 16; Slide ROTAS p. 20 | ✅ |
| REQ-06a | Texto do professor: componentização. | `components/CampoTexto.tsx:19`, `components/CampoSelect.tsx:21`, `components/CabecalhoPagina.tsx:9`, `app/(site)/lanternas/_components/CartaoLanterna.tsx:12` | COMP-02, COMP-03, COMP-12, FORM-22, CSS-10 | Slide PROPS p. 9; JSX p. 10; FORMS p. 21 | ✅ |
| REQ-06b | Texto do professor: organização e estrutura de projeto. | `app/(site)/` e `app/(painel)/` (grupos), `lib/<recurso>.ts` (`lib/ocorrencias.ts:10`, `lib/lanternas.ts:7`, `lib/setores.ts:7`, `lib/usuarios.ts:10`), `lib/schemas/` | STACK-05, ROTA-01 a ROTA-04, FORM-02, API-01 | Decisão; Slide ROTAS p. 11, 15; APIS p. 14 | ✅ |
| REQ-06c | Texto do professor: estado local. | `components/MenuNavegacao.tsx:21` (menu no celular), `app/(painel)/painel/ocorrencias/_components/FormStatus.tsx:22` (mensagem de sucesso) | COMP-09, COMP-10, COMP-11 | Slide PROPS p. 6 a 8 | ✅ |
| REQ-06d | Texto do professor: hooks. | `components/MenuNavegacao.tsx:20` (`usePathname`), `app/(painel)/painel/ocorrencias/_components/FormStatus.tsx:23` (`useForm`), `FormStatus.tsx:29` (`useWatch`), `app/(painel)/painel/ocorrencias/_components/FiltroOcorrencias.tsx:15-16` (`useSearchParams`, `useRouter`) | COMP-09, FORM-01, FORM-21, ROTA-13, ROTA-14 | Slide ROTAS p. 17, 19, 20; FORMS p. 10 | ✅ |
| REQ-06e | Texto do professor: navegação entre telas. | `components/MenuNavegacao.tsx:48-51` (`Link`), `app/(painel)/painel/ocorrencias/_components/FiltroOcorrencias.tsx:23` (`router.push`), `app/(painel)/painel/ocorrencias/actions.ts:42` e `:90` (`redirect`), `app/(site)/login/actions.ts:35` (`replace`) | ROTA-16, ROTA-14, ROTA-19, ROTA-20 | Slide ROTAS p. 19, 20 | ✅ |
| REQ-06f | Texto do professor: pensar o front para reuso no back-end. | `lib/api.ts:2-5` (`urlDaApi`, base em `API_URL`), `lib/schemas/ocorrencia.ts:21` (resposta validada com Zod), `lib/erro-detalhe.ts:7-9` (401 e 403 tratados), `.env.example:2` | DEC-04, API-01, API-04, API-08, API-12 | Decisão; texto do professor; Slide APIS p. 14 | ✅ |

Status: ✅ atendido com evidência · ⚠️ atendido com ressalva · ❌ não atendido.

Ressalvas (para dizer na apresentação, antes que perguntem):

- **REQ-05:** o enunciado fala em "middleware". No Next 16 o arquivo chama `proxy.ts` (nota de versão em AUTH-01, `autenticacao.md`).
- **REQ-01:** a homepage não tem link direto para `/login`. O acesso ao login passa por `/painel`, que o proxy redireciona quando não há sessão.
- **REQ-02 a REQ-05:** a evidência é de código e de testes automatizados (`__tests__/proxy.test.ts`, `__tests__/acoes/login.test.ts`, `__tests__/acoes/status-atribuicao.test.ts`, `__tests__/app/paginas-publicas.test.tsx`). O comportamento no navegador (M-05) não foi reexecutado nesta rodada.
- **REQ-06c:** o `useState` legítimo é o do menu no celular (`MenuNavegacao.tsx:21`). Os filtros ficam na URL (ROTA-14) e os campos no RHF, então este é o único estado local que sobra no cliente além da mensagem de sucesso.

## 3. Violações e verificações

### 3.1 Confirmadas

| # | Check | Regra | Arquivo:linha | Problema | Como corrigir |
|---|---|---|---|---|---|
| 1 | C-38 (`REVISAR`, decidida como violação na revisão manual) | ROTA-08 | `components/ui/label.tsx:1`, `components/ui/table.tsx:1` | `'use client'` sem nenhum hook, estado ou evento. `Label` e `Table` são elementos puros. A regra pede a diretiva só em componentes interativos. | Remover a linha `"use client"` dos dois arquivos e rodar `npm run build`. Gravidade baixa. O script não cobre `components/ui/` (excluída de propósito), então isso só foi visto na revisão manual. |

### 3.2 Revisadas e descartadas (falso positivo)

| Check | Arquivo:linha | Por que não é violação |
|---|---|---|
| C-06 (`REVISAR`) | `app/(painel)/painel/ocorrencias/_components/FormStatus.tsx:22` e `:27` | O `useState` (`salvo`) controla só a mensagem "Status atualizado." O campo `resolucao` usa apenas `register` (`:49`). Não há o mesmo campo nos dois mecanismos. |
| C-16 (`REVISAR`) | `components/TelaDeErro.tsx:14-16` | O `useEffect` só registra o erro no console (`console.error`, API-13). Não busca dados. |
| C-26 (`REVISAR`) | `lib/schemas/ocorrencia.ts:29`, `lib/schemas/setor.ts:6` | São schemas de resposta da API (`ocorrenciaSchema` e `setorSchema`, marcados com API-04). O formulário usa `z.coerce.number` em `lib/schemas/ocorrencia.ts:46` (FORM-13). |
| C-38 (`REVISAR`) | 11 arquivos `'use client'` fora de `components/ui/` | Justificados: os 3 `error.tsx` são Client Components por convenção (ROTA-21); os demais têm hook (`useForm`, `useSearchParams`, `usePathname`, `useState`, `useEffect`) ou evento (`aoMudar`, `onClick`). |

### 3.3 Verificações manuais

| Check | Resultado | Observação |
|---|---|---|
| M-01 ROTA-20: `redirect` fora de `try` | ✅ | O único `try` perto de `redirect` é `app/(painel)/painel/ocorrencias/[id]/page.tsx:27-31`, e ele não contém `redirect`. Os `redirect` ficam fora do bloco ou dentro de `tratarErroDetalhe` (`lib/erro-detalhe.ts:8-9`), chamado no `catch`, o que a regra permite. |
| M-02 ROTA-15: `Suspense` com `useSearchParams` | ✅ | `useSearchParams` está em `FiltroOcorrencias.tsx:15`, renderizado dentro de `<Suspense>` em `app/(painel)/painel/ocorrencias/page.tsx:41-43`. |
| M-03 ROTA-14 / COMP-09: `useState` legítimo | ✅ | Dois `useState`: `components/MenuNavegacao.tsx:21` (menu aberto) e `app/(painel)/painel/ocorrencias/_components/FormStatus.tsx:22` (mensagem de sucesso). Nenhum guarda filtro, página, dado da API ou campo de formulário. |
| M-04 REQ-06 (c): estado local existe | ✅ | Mesmos dois `useState` acima. O menu no celular cumpre o requisito. |
| M-05 fluxo de acesso (passos 1 a 9) | não executado — pendente para o grupo | Não há navegador nesta rodada. Passo a passo em `checks.md`. |
| M-06 quatro estados | não executado — pendente para o grupo | Código existe: `components/EsqueletoLista.tsx:4`, `components/EstadoVazio.tsx:12`, `components/TelaDeErro.tsx:13`. O comportamento visual não foi observado. |
| M-07 rolagem horizontal em 375 px | não executado — pendente para o grupo | Exige DevTools. |
| M-08 teclado e mensagens de erro | não executado — pendente para o grupo | Exige navegador. A parte de código (FORM-10, FORM-11) está em `components/CampoTexto.tsx:22` e `components/MensagemErro.tsx:8`. |
| M-09 `npm run lint` e `npm run build` | ✅ | Lint saiu com código 0. Build saiu com código 0: 12 rotas de página, TypeScript sem erro. Não é verificação de navegador, mas faz parte da lista. |
| M-10 amostra de marcadores | ✅ | 13 marcadores conferidos. `proxy.ts:11` (AUTH-01); `lib/dal.ts:11` (AUTH-02), `:21` (AUTH-09), `:32` (AUTH-04), `:39` (AUTH-06); `lib/sessao.ts:30` (AUTH-03), `:54` (AUTH-07); `app/(site)/login/actions.ts:13` (FORM-17), `:25` (AUTH-08), `:35` (ROTA-19); `app/(painel)/actions.ts:8` (AUTH-05); `app/(painel)/painel/ocorrencias/actions.ts:20` (AUTH-07), `:71` (AUTH-05 e AUTH-06). Todos aplicam a regra marcada. |
| M-11 arquivos com mais de ~150 linhas | ✅ com ressalva | Só `app/(site)/design-system/page.tsx` passa de 150 linhas (251). A vitrine já tem `SecaoVitrine` em `_components`. Dividir por seção (COMP-02) fica como decisão do grupo, não como violação. |

### 3.4 Limitações desta auditoria

- **Checks de `REQ-03` e `C-12`:** a linha `rg -L "verificarSessao|exigirPapel" ...` das referências não faz o que diz. No ripgrep, `-L` segue links simbólicos, e o equivalente certo é `rg --files-without-match`. Nesta rodada a conferência foi refeita com o comando correto. As referências da skill (`requisitos-enunciado.md` e `checks.md`) precisam ser corrigidas numa tarefa própria; não foram alteradas aqui.
- **Escopo do `verificar.sh`:** a pasta `components/ui/` é excluída, então a violação ROTA-08 só apareceu na revisão manual. Vale considerar uma regra específica para `components/ui/`.
- **`db.json`:** já aparecia como modificado antes desta auditoria (`git status`). Não foi incluído no commit e não foi alterado por esta rodada.

## 4. Regras aplicadas

Marcadores no código (`app`, `components`, `lib`, `proxy.ts`), uma linha por regra. "Onde" mostra até três ocorrências; o número total está na coluna "Marcadores". Regras sem marcador estão nas seções 5.1 e 5.2.

| ID | Título | Origem | Fonte | Marcadores | Onde (até 3) |
|---|---|---|---|---|---|
| API-01 | Camada de serviço: uma função por operação em lib/<recurso>.ts | Slide | APIS p. 14 | 3 | `lib/lanternas.ts:7`, `lib/ocorrencias.ts:10`, `lib/setores.ts:7` |
| API-02 | Checar res.ok em todo fetch | Slide | APIS p. 7 | 6 | `lib/lanternas.ts:10`, `lib/lanternas.ts:18`, `lib/ocorrencias.ts:19` +3 |
| API-03 | ApiError com status em lib/api-error.ts | Slide | APIS p. 22 | 2 | `lib/api-error.ts:2`, `lib/setores.ts:9` |
| API-04 | Validar a resposta da API com Zod | Slide + Docs | APIS p. 14 | 9 | `lib/lanternas.ts:11`, `lib/lanternas.ts:19`, `lib/ocorrencias.ts:20` +6 |
| API-06 | Cache explícito em todo fetch | Slide + Decisão | APIS p. 12 | 3 | `lib/lanternas.ts:9`, `lib/ocorrencias.ts:18`, `lib/setores.ts:8` |
| API-07 | Promise.all para buscas independentes | Slide | APIS p. 13 | 5 | `app/(painel)/painel/ocorrencias/page.tsx:25`, `app/(painel)/painel/ocorrencias/[id]/page.tsx:28`, `app/(painel)/painel/page.tsx:20` +2 |
| API-09 | Toda tela com dados tem quatro estados | Slide | APIS p. 20 | 4 | `app/(painel)/painel/ocorrencias/page.tsx:44`, `app/(painel)/painel/page.tsx:40`, `app/(site)/lanternas/page.tsx:46` +1 |
| API-10 | loading.tsx ou Suspense em toda rota com dados | Slide | APIS p. 19; ROTAS p. 21 | 1 | `components/EsqueletoLista.tsx:4` |
| API-11 | error.tsx com "Tentar de novo" | Slide | APIS p. 21; ROTAS p. 21 | 4 | `app/(painel)/painel/error.tsx:6`, `app/(painel)/painel/ocorrencias/error.tsx:6`, `app/(site)/lanternas/error.tsx:6` +1 |
| API-12 | Classificar o erro e escolher a saída | Slide | APIS p. 5 | 7 | `app/(painel)/painel/ocorrencias/[id]/atribuir/page.tsx:24`, `app/(painel)/painel/ocorrencias/[id]/atribuir/page.tsx:31`, `app/(painel)/painel/ocorrencias/[id]/page.tsx:30` +4 |
| API-13 | Mensagem para humanos; detalhe técnico só no log | Slide | APIS p. 21 | 6 | `app/(painel)/painel/ocorrencias/actions.ts:38`, `app/(painel)/painel/ocorrencias/actions.ts:62`, `app/(painel)/painel/ocorrencias/actions.ts:86` +3 |
| API-14 | Escrita: método HTTP certo, JSON, revalidatePath depois | Slide | APIS p. 5; FORMS p. 20 | 5 | `app/(painel)/painel/ocorrencias/actions.ts:41`, `app/(painel)/painel/ocorrencias/actions.ts:65`, `app/(painel)/painel/ocorrencias/actions.ts:89` +2 |
| API-16 | Endereços de API montados com new URL a partir de API_URL | Slide + Decisão | APIS p. 17 | 1 | `lib/api.ts:5` |
| AUTH-01 | proxy.ts (não middleware.ts) protege /painel e redireciona para /login | Docs + Decisão | Docs + Decisão | 1 | `proxy.ts:11` |
| AUTH-02 | Sessão num cookie httpOnly criado no servidor | Docs | Docs | 1 | `lib/dal.ts:11` |
| AUTH-03 | Cookie assinado com HMAC (node:crypto) e SESSION_SECRET | Docs + Decisão | Docs + Decisão | 2 | `lib/sessao.ts:30`, `lib/sessao.ts:42` |
| AUTH-04 | verificarSessao() no DAL, chamada em toda página privada | Slide + Docs | ROTAS p. 20; APIS p. 5 | 5 | `app/(painel)/painel/ocorrencias/nova/page.tsx:11`, `app/(painel)/painel/ocorrencias/page.tsx:23`, `app/(painel)/painel/ocorrencias/[id]/page.tsx:24` +2 |
| AUTH-05 | Toda Server Action confere sessão (e papel) antes de agir | Slide + Docs | FORMS p. 20 | 4 | `app/(painel)/actions.ts:8`, `app/(painel)/painel/ocorrencias/actions.ts:16`, `app/(painel)/painel/ocorrencias/actions.ts:47` +1 |
| AUTH-06 | Sem permissão é 403: exigirPapel redireciona para /acesso-negado | Slide + Docs + Decisão | APIS p. 5 | 4 | `app/(painel)/painel/ocorrencias/actions.ts:71`, `app/(painel)/painel/ocorrencias/[id]/atribuir/page.tsx:18`, `app/(site)/acesso-negado/page.tsx:7` +1 |
| AUTH-07 | Lanterna só vê o próprio setor: o filtro é aplicado no servidor | Docs + Decisão | Docs + Decisão | 8 | `app/(painel)/painel/ocorrencias/actions.ts:20`, `app/(painel)/painel/ocorrencias/actions.ts:55`, `app/(painel)/painel/ocorrencias/page.tsx:27` +5 |
| AUTH-08 | Login com RHF + Server Action entrar | Slide + Docs + Decisão | FORMS p. 16; ROTAS p. 20 | 2 | `app/(site)/login/actions.ts:25`, `app/(site)/login/_components/FormLogin.tsx:13` |
| AUTH-09 | Sair = Server Action que apaga o cookie e redireciona | Docs | Docs | 3 | `app/(painel)/actions.ts:9`, `app/(painel)/layout.tsx:30`, `lib/dal.ts:21` |
| AUTH-10 | Não fazer a checagem de acesso no layout | Docs | Docs | 2 | `app/(painel)/layout.tsx:16`, `lib/dal.ts:25` |
| AUTH-11 | Limitações da API fake documentadas | Decisão | Decisão | 2 | `lib/schemas/usuario.ts:7`, `lib/usuarios.ts:14` |
| COMP-03 | Componentes reutilizáveis configurados por props | Slide | PROPS p. 9; PROPS p. 3; JSX p. 5 | 2 | `components/CabecalhoPagina.tsx:8`, `components/TabelaOcorrencias.tsx:14` |
| COMP-09 | Estado local com useState só para o que muda e pertence ao componente | Slide | PROPS p. 6 | 2 | `app/(painel)/painel/ocorrencias/_components/FormStatus.tsx:22`, `components/MenuNavegacao.tsx:21` |
| COMP-10 | Nunca mutar o estado diretamente | Slide | PROPS p. 7 | 1 | `components/MenuNavegacao.tsx:33` |
| COMP-13 | Listas com key única e estável | Slide + Docs | JSX p. 11 | 6 | `app/(site)/page.tsx:36`, `components/BarraStatus.tsx:34`, `components/EsqueletoLista.tsx:12` +3 |
| COMP-14 | Renderização condicional com ternário ou && | Slide | JSX p. 11; JSX p. 12 | 6 | `app/(painel)/painel/ocorrencias/[id]/page.tsx:43`, `app/(painel)/painel/ocorrencias/[id]/page.tsx:76`, `app/(painel)/painel/ocorrencias/_components/FormStatus.tsx:48` +3 |
| CSS-02 | Sem estilo inline | Slide | CSS p. 4; JS p. 12; CSS p. 16 | 2 | `components/BadgeStatus.tsx:8`, `components/BarraStatus.tsx:31` |
| CSS-03 | Mobile-first: classe base para celular, prefixos para telas maiores | Slide | CSS p. 11 | 5 | `app/(painel)/painel/ocorrencias/[id]/page.tsx:55`, `app/(painel)/painel/ocorrencias/_components/FiltroOcorrencias.tsx:33`, `app/(site)/lanternas/page.tsx:53` +2 |
| CSS-04 | Usar a escala do Tailwind; evitar valores mágicos | Slide | CSS p. 13; CSS p. 7 | 1 | `components/ui/select.tsx:87` |
| CSS-05 | Flexbox para alinhar em uma direção, com gap | Slide | CSS p. 8 | 2 | `app/(site)/layout.tsx:18`, `app/(site)/page.tsx:17` |
| CSS-06 | Grid para listas de cartões | Slide | CSS p. 12 | 1 | `app/(site)/lanternas/page.tsx:53` |
| CSS-07 | HTML semântico e hierarquia de títulos | Slide | CSS p. 2 | 4 | `app/(painel)/painel/page.tsx:39`, `app/(site)/design-system/_components/SecaoVitrine.tsx:8`, `components/CabecalhoPagina.tsx:8` +1 |
| CSS-08 | Estados interativos com prefixos (hover:, focus-visible:, disabled:) | Slide + Decisão | CSS p. 15 | 2 | `components/MenuNavegacao.tsx:52`, `components/ui/button.tsx:7` |
| CSS-09 | Tema e cores no globals.css (Tailwind 4), não em tailwind.config.js | Slide + Docs | CSS p. 16 | 1 | `app/globals.css:6` |
| CSS-10 | Repetição de classes vira componente, não @apply | Slide + Decisão | CSS p. 18 | 5 | `components/Juramento.tsx:8`, `components/LinkVoltar.tsx:9`, `components/Marca.tsx:4` +2 |
| CSS-12 | Tokens da Tropa: cor só por nome semântico, gravidade com texto | Slide + Decisão | CSS p. 13 | 3 | `app/globals.css:33`, `components/BadgeGravidade.tsx:4`, `components/BarraStatus.tsx:6` |
| CSS-13 | Três famílias com next/font, cada uma com um papel | Docs + Decisão | Docs + Decisão | 12 | `app/(painel)/painel/ocorrencias/[id]/page.tsx:62`, `app/(site)/lanternas/_components/CartaoLanterna.tsx:17`, `app/(site)/layout.tsx:26` +9 |
| CSS-14 | O foco do teclado é o brilho do anel | Slide + Decisão | CSS p. 15 | 10 | `app/(site)/login/page.tsx:10`, `app/(site)/page.tsx:29`, `app/globals.css:52` +7 |
| CSS-15 | Movimento só para mudança de estado, e respeitando reduced-motion | Docs + Decisão | Docs + Decisão | 8 | `app/globals.css:118`, `components/MenuNavegacao.tsx:52`, `components/ui/button.tsx:7` +5 |
| DEC-05 | Um único padrão de formulário: RHF chama a Server Action | Slide + Decisão | FORMS p. 16 | 1 | `lib/resultado-acao.ts:2` |
| DEC-09 | Mapa das áreas exigidas pelo enunciado | Decisão | Decisão | 1 | `app/(site)/page.tsx:14` |
| DEC-11 | Visual próprio sobre Base UI | Decisão | Decisão | 10 | `components/ui/alert.tsx:5`, `components/ui/badge.tsx:6`, `components/ui/button.tsx:5` +7 |
| DEC-12 | Vitrine do design system em /design-system | Decisão | Decisão | 2 | `app/(site)/design-system/page.tsx:28`, `app/(site)/layout.tsx:28` |
| DEC-13 | Tema único escuro ("Noite") | Decisão | Decisão | 2 | `app/globals.css:6`, `app/globals.css:100` |
| FORM-01 | Formulário = React Hook Form + zodResolver, nunca um useState por campo | Slide | FORMS p. 6 | 4 | `app/(painel)/painel/ocorrencias/_components/FormAtribuir.tsx:22`, `app/(painel)/painel/ocorrencias/_components/FormOcorrencia.tsx:22`, `app/(painel)/painel/ocorrencias/_components/FormStatus.tsx:24` +1 |
| FORM-02 | Schemas ficam em lib/schemas/ | Slide | FORMS p. 14 | 2 | `lib/schemas/login.ts:4`, `lib/schemas/ocorrencia.ts:38` |
| FORM-03 | O tipo nasce do schema (z.infer), sem interface duplicada | Slide + Docs | FORMS p. 15 | 5 | `lib/schemas/lanterna.ts:22`, `lib/schemas/login.ts:9`, `lib/schemas/ocorrencia.ts:50` +2 |
| FORM-04 | Sempre declarar defaultValues | Slide | FORMS p. 5 | 4 | `app/(painel)/painel/ocorrencias/_components/FormAtribuir.tsx:25`, `app/(painel)/painel/ocorrencias/_components/FormOcorrencia.tsx:25`, `app/(painel)/painel/ocorrencias/_components/FormStatus.tsx:27` +1 |
| FORM-05 | mode 'onBlur' + reValidateMode 'onChange' | Slide | FORMS p. 12 | 4 | `app/(painel)/painel/ocorrencias/_components/FormAtribuir.tsx:23`, `app/(painel)/painel/ocorrencias/_components/FormOcorrencia.tsx:23`, `app/(painel)/painel/ocorrencias/_components/FormStatus.tsx:25` +1 |
| FORM-06 | Sempre handleSubmit; nunca chamar onSubmit direto | Slide | FORMS p. 10 | 4 | `app/(painel)/painel/ocorrencias/_components/FormAtribuir.tsx:34`, `app/(painel)/painel/ocorrencias/_components/FormOcorrencia.tsx:34`, `app/(painel)/painel/ocorrencias/_components/FormStatus.tsx:39` +1 |
| FORM-07 | noValidate no form | Slide | FORMS p. 11 | 4 | `app/(painel)/painel/ocorrencias/_components/FormAtribuir.tsx:34`, `app/(painel)/painel/ocorrencias/_components/FormOcorrencia.tsx:34`, `app/(painel)/painel/ocorrencias/_components/FormStatus.tsx:39` +1 |
| FORM-08 | Botão desabilitado durante o envio (isSubmitting) | Slide | FORMS p. 11; APIS p. 16 | 4 | `app/(painel)/painel/ocorrencias/_components/FormAtribuir.tsx:53`, `app/(painel)/painel/ocorrencias/_components/FormOcorrencia.tsx:66`, `app/(painel)/painel/ocorrencias/_components/FormStatus.tsx:53` +1 |
| FORM-09 | Todo campo tem name, id e label ligada por htmlFor | Slide | FORMS p. 5; JSX p. 8 | 1 | `components/CampoTexto.tsx:27` |
| FORM-10 | Erro acessível: aria-invalid, aria-describedby e role="alert" | Slide | FORMS p. 11 | 3 | `components/CampoSelect.tsx:31`, `components/CampoTexto.tsx:22`, `components/MensagemErro.tsx:8` |
| FORM-11 | Mensagens específicas, em português, ao lado do campo | Slide | FORMS p. 14 | 1 | `lib/schemas/ocorrencia.ts:41` |
| FORM-13 | Número vindo de input passa por z.coerce | Slide | FORMS p. 5 | 2 | `app/(painel)/painel/ocorrencias/_components/FormOcorrencia.tsx:64`, `lib/schemas/ocorrencia.ts:46` |
| FORM-14 | Regra entre campos com .refine e path | Slide | FORMS p. 14 | 1 | `lib/schemas/ocorrencia.ts:58` |
| FORM-15 | Zod 4: validadores de formato são funções de topo | Slide + Docs | FORMS p. 14 | 1 | `lib/schemas/login.ts:5` |
| FORM-16 | Componente de UI controlado usa Controller; input nativo usa register | Slide + Docs | FORMS p. 18 | 5 | `app/(painel)/painel/ocorrencias/_components/FormAtribuir.tsx:38`, `app/(painel)/painel/ocorrencias/_components/FormOcorrencia.tsx:42`, `app/(painel)/painel/ocorrencias/_components/FormOcorrencia.tsx:60` +2 |
| FORM-17 | Revalidar tudo no servidor com safeParse | Slide | FORMS p. 8 | 4 | `app/(painel)/painel/ocorrencias/actions.ts:17`, `app/(painel)/painel/ocorrencias/actions.ts:49`, `app/(painel)/painel/ocorrencias/actions.ts:73` +1 |
| FORM-18 | Erros do servidor com z.flattenError (Zod 4) | Slide | FORMS p. 20 | 5 | `app/(painel)/painel/ocorrencias/actions.ts:18`, `app/(painel)/painel/ocorrencias/actions.ts:50`, `app/(painel)/painel/ocorrencias/actions.ts:74` +2 |
| FORM-19 | Erro que só o servidor conhece vai para o campo com setError | Slide | FORMS p. 19; APIS p. 16 | 5 | `app/(painel)/painel/ocorrencias/_components/FormAtribuir.tsx:30`, `app/(painel)/painel/ocorrencias/_components/FormOcorrencia.tsx:30`, `app/(painel)/painel/ocorrencias/_components/FormStatus.tsx:34` +2 |
| FORM-20 | Atributos nativos como reforço, nunca como validação | Slide | FORMS p. 7 | 1 | `app/(site)/login/_components/FormLogin.tsx:28` |
| FORM-21 | watch só de um campo, onde precisa | Slide | FORMS p. 21 | 1 | `app/(painel)/painel/ocorrencias/_components/FormStatus.tsx:29` |
| FORM-22 | Componente CampoTexto reutilizável | Slide | FORMS p. 17 | 1 | `components/CampoTexto.tsx:19` |
| JS-09 | Percorrer arrays com map/filter/find, não com for | Slide | JS p. 8; JSX p. 11 | 1 | `components/BarraStatus.tsx:25` |
| ROTA-05 | Um único layout raiz com html lang="pt-BR" | Slide | ROTAS p. 14 | 1 | `app/layout.tsx:17` |
| ROTA-06 | Layout para tudo que se repete entre rotas | Slide | ROTAS p. 14 | 1 | `app/(site)/layout.tsx:17` |
| ROTA-07 | Páginas são Server Components; podem ser async e ter metadata | Slide | ROTAS p. 13; APIS p. 11 | 1 | `app/(site)/sobre/page.tsx:5` |
| ROTA-10 | params e searchParams são Promise: sempre await | Slide + Docs | ROTAS p. 17 | 5 | `app/(painel)/painel/ocorrencias/page.tsx:24`, `app/(painel)/painel/ocorrencias/[id]/atribuir/page.tsx:19`, `app/(painel)/painel/ocorrencias/[id]/page.tsx:25` +2 |
| ROTA-11 | Validar params antes de usar | Slide | ROTAS p. 16 | 5 | `app/(painel)/painel/ocorrencias/page.tsx:26`, `app/(site)/lanternas/page.tsx:20`, `lib/filtro-ocorrencias.ts:16` +2 |
| ROTA-12 | notFound() quando o registro não existe | Slide | ROTAS p. 17; APIS p. 5; APIS p. 22 | 3 | `app/(painel)/painel/ocorrencias/[id]/atribuir/page.tsx:26`, `app/(painel)/painel/ocorrencias/[id]/page.tsx:32`, `app/(site)/lanternas/[id]/page.tsx:24` |
| ROTA-13 | useParams/usePathname/useSearchParams/useRouter vêm de next/navigation | Slide | ROTAS p. 17 | 2 | `app/(painel)/painel/ocorrencias/_components/FiltroOcorrencias.tsx:15`, `components/MenuNavegacao.tsx:20` |
| ROTA-14 | Filtros e paginação vivem na URL (searchParams), não em useState | Slide | ROTAS p. 18 | 3 | `app/(painel)/painel/ocorrencias/_components/FiltroOcorrencias.tsx:23`, `app/(site)/lanternas/page.tsx:20`, `components/BarraStatus.tsx:41` |
| ROTA-15 | useSearchParams dentro de Suspense | Slide | ROTAS p. 18 | 1 | `app/(painel)/painel/ocorrencias/page.tsx:41` |
| ROTA-16 | Link para toda navegação interna; nunca a href nem window.location | Slide | ROTAS p. 19; ROTAS p. 8 | 9 | `app/(painel)/painel/ocorrencias/page.tsx:36`, `app/(painel)/painel/page.tsx:32`, `app/(site)/lanternas/_components/CartaoLanterna.tsx:14` +6 |
| ROTA-17 | Link ativo com usePathname + aria-current | Slide | ROTAS p. 19 | 1 | `components/MenuNavegacao.tsx:50` |
| ROTA-19 | Depois do login, substituir o histórico (replace) | Slide + Docs | ROTAS p. 20 | 1 | `app/(site)/login/actions.ts:35` |
| ROTA-20 | redirect() no servidor para navegar após ação ou bloquear acesso | Slide + Docs | ROTAS p. 20; APIS p. 21 | 2 | `app/(painel)/painel/ocorrencias/actions.ts:42`, `app/(painel)/painel/ocorrencias/actions.ts:90` |
| ROTA-21 | loading.tsx e error.tsx em toda rota que busca dados | Slide | ROTAS p. 21; ROTAS p. 22; APIS p. 19 | 6 | `app/(painel)/painel/error.tsx:6`, `app/(painel)/painel/loading.tsx:4`, `app/(painel)/painel/ocorrencias/error.tsx:6` +3 |
| ROTA-22 | not-found.tsx para 404 com saída clara | Slide | ROTAS p. 21; ROTAS p. 12 | 1 | `app/not-found.tsx:6` |
## 5. Regras dos slides ainda não aplicadas

Só regras com etiqueta `[SLIDE]` que não têm marcador. Das 32 nessa situação, 2 não se aplicam (5.1) e 30 estão aplicadas com evidência (5.2).

### 5.1 Não aplicadas

Nenhuma regra de slide está como "falta implementar" ou "feature ainda não existe". Duas não se aplicam ao projeto:

| ID | Título | Fonte | Motivo | Ação |
|---|---|---|---|---|
| COMP-07 | Separar lógica de negócio da apresentação | Slide PROPS p. 9; Decisão | Não se aplica como o slide descreve: o projeto não tem busca de dados no cliente (API-05), então não há hook customizado do tipo `useUserData()`. A lógica de dados fica em `lib/` e nas páginas de servidor. | Explicar na banca que o caminho escolhido é `lib/` com Server Components. |
| API-15 | Não buscar dados no cliente (decisão do MVP) | Slide APIS p. 10, 15; Decisão (DEC-02) | Não se aplica: nenhuma busca no cliente. Os filtros mudam a URL (ROTA-14) e o servidor recarrega a lista. | Nenhuma. |

### 5.2 Aplicadas sem marcador (com evidência)

Estas 30 regras de slide não têm `// [ID]` no código, mas a evidência está no código ou em um check automático que deu OK. Não são pendência. ROTA-08 aparece aqui, mas tem violação (seção 3.1).

| ID | Título | Evidência (arquivo:linha) |
|---|---|---|
| API-05 | Buscar dados em Server Components, sem useEffect | `app/(site)/lanternas/page.tsx:19` (página `async`, sem `useEffect` de dados); `components/TelaDeErro.tsx:14` só registra o erro |
| API-08 | Endereço e segredos sem `NEXT_PUBLIC_` | C-03 sem ocorrência; `lib/api.ts:3` lê `API_URL` só no servidor |
| COMP-01 | Nomes em PascalCase para componentes e camelCase para props | `components/MenuNavegacao.tsx:19` |
| COMP-02 | Responsabilidade única | Componentes pequenos, como `components/IconeStatus.tsx`. Exceção avaliada em M-11 (`design-system/page.tsx`, ressalva) |
| COMP-04 | Props são somente leitura | Grep de atribuição a `props.x` sem ocorrência |
| COMP-05 | Desestruturar props na assinatura | `components/MenuNavegacao.tsx:19` |
| COMP-06 | Tipar as props com TypeScript | `components/MenuNavegacao.tsx:13-16`; C-45 sem `any` |
| COMP-08 | Documentar componentes reutilizáveis com JSDoc curto | JSDoc em 59 arquivos, ex.: `components/MenuNavegacao.tsx:18`. Aplicada, mas não em todos os componentes |
| COMP-11 | Dados descem por props, eventos sobem por callback | `components/CampoSelect.tsx:13-14` (`aoMudar`, `aoSair`) |
| COMP-12 | Montar telas por composição | `app/(painel)/layout.tsx:15` (`children`); `components/CabecalhoPagina.tsx:9` (`children`) |
| COMP-15 | Sintaxe JSX: `className`, `htmlFor`, eventos em camelCase | C-53 e C-20 sem ocorrência; `components/BarraStatus.tsx:32` usa `className` |
| COMP-16 | Nunca injetar HTML cru | C-19 sem ocorrência de `dangerouslySetInnerHTML` |
| CSS-01 | Tailwind utility-first; CSS próprio só no `globals.css` | Aplicada com ressalva: `app/globals.css:57-91` (tokens) e `:111-114` (foco global). Ver seção 6 |
| FORM-12 | Nunca misturar `useState` com `register` no mesmo campo | `app/(painel)/painel/ocorrencias/_components/FormStatus.tsx:22` e `:49`; ver seção 3.2 |
| JS-01 | `const` por padrão, nunca `var` | C-21 sem ocorrência; `app/(site)/login/actions.ts:13` |
| JS-02 | Comparação estrita (`===`) | C-22 sem ocorrência |
| JS-03 | Early return em vez de `if` aninhado | `app/(site)/login/actions.ts:13-14`; `lib/dal.ts:32` |
| JS-04 | Funções nomeadas com verbo | `app/(painel)/painel/ocorrencias/actions.ts:15` (`registrarOcorrencia`); `lib/ocorrencias.ts:24` (`buscarOcorrencia`) |
| JS-05 | Arrow functions para callbacks | `components/MenuNavegacao.tsx:33` |
| JS-06 | Não manipular o DOM direto | C-19 sem ocorrência de manipulação de DOM |
| JS-07 | Cuidar de `null` e `undefined` | `app/(painel)/painel/ocorrencias/[id]/page.tsx:62` (`setor?.nome`); `app/(site)/login/actions.ts:24` (`!usuario`) |
| JS-08 | Truthy e falsy: cuidado com 0 e string vazia | C-44 sem ocorrência; `components/BarraStatus.tsx:30` compara `ocorrencias.length > 0` |
| ROTA-01 | Pasta é segmento de URL; `page.tsx` só onde há tela | `app/(site)/lanternas/[id]/page.tsx:16` |
| ROTA-02 | Arquivos especiais por convenção | `app/(site)/layout.tsx:14`; `app/not-found.tsx:6` |
| ROTA-03 | Pastas com `_` são privadas | `app/(site)/login/_components/FormLogin.tsx:13` |
| ROTA-04 | Grupos de rotas `(site)` e `(painel)` | `app/(site)/layout.tsx:14`; `app/(painel)/layout.tsx:15` |
| ROTA-08 | `'use client'` só nos componentes interativos | 11 arquivos justificados (seção 3.2). **Violação** em `components/ui/label.tsx:1` e `components/ui/table.tsx:1` (seção 3.1) |
| ROTA-09 | Segmentos dinâmicos com colchetes | `app/(site)/lanternas/[id]/page.tsx:16` |
| ROTA-18 | Nunca importar de `next/router` | C-01 sem ocorrência |
| STACK-03 | react-hook-form + @hookform/resolvers + Zod 4 | `package.json:18` (`@hookform/resolvers`), `:25` (`react-hook-form`), `:28` (`zod` ^4.6.5) |

## 6. Pontos de atenção para a banca

Diferenças entre o slide e a versão atual que vale explicar antes que perguntem (notas de versão das regras usadas):

- **AUTH-01:** o slide mostra `middleware.ts`; no Next 16 o arquivo é `proxy.ts` (`autenticacao.md:50`).
- **ROTA-10:** `params` e `searchParams` são Promise; o acesso síncrono foi removido no Next 16 (`rotas-layouts.md:171`).
- **ROTA-21 e API-11:** o slide usa `reset()` no `error.tsx`; no Next 16.4 a doc recomenda `retry()`, que é o que o projeto usa (`rotas-layouts.md:328`).
- **ROTA-21 e ROTA-20:** com `loading.tsx`, o Next envia `200` antes de a página terminar. Por isso `notFound()` e `redirect()` chegam com status `200`: o `redirect` vira `<meta http-equiv="refresh">` e o navegador segue. Para o usuário o resultado é o mesmo (`rotas-layouts.md:198`).
- **FORM-15 e FORM-18:** Zod 4 usa `z.email()` e `z.flattenError()`, em vez dos métodos do Zod 3 que aparecem no slide (`formularios-rhf-zod.md:214`).
- **FORM-03:** `useForm` sem genérico, porque o schema usa `z.coerce` (`formularios-rhf-zod.md:91`).
- **API-06:** a partir do Next 15, `fetch` não guarda cache por padrão; por isso cada chamada declara `cache`/`revalidate` (`consumo-apis.md:123`).
- **CSS-01:** o slide é do Tailwind 3; o projeto usa Tailwind 4, com tokens em `@theme inline` (`estilo-tailwind.md:88`).
- **AUTH-06:** o 403 é a página `/acesso-negado`, porque `forbidden()` é experimental (`autenticacao.md`, AUTH-06).
- **AUTH-11:** senhas em texto puro no `db.json` são limitação da API fake, declarada como decisão do grupo.
