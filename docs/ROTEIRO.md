# Roteiro de apresentação: ERP da Tropa dos Lanternas Verdes

- **Data:** 2026-10-07 · **Versão:** `a9c1314` + auditoria desta atualização (`docs/AUDITORIA.md`)
- **Duração alvo:** 12 a 15 min · **Integrantes:** a definir pelo grupo antes da apresentação

Como usar: a pessoa que apresentar cada parte pode abrir o trecho indicado. "Slide" identifica material do professor (com deck e página); "Docs" identifica documentação oficial; "Decisão" identifica escolha do grupo. As fontes completas ficam em `.claude/skills/padroes-wellington/references/`. Os números de linha foram conferidos nesta versão do código; se o código mudar, rode de novo a auditoria.

## Ordem da demonstração

1. Homepage, Juramento, navegação e vitrine do design system no rodapé (a definir, 2 min).
2. Páginas públicas: lista de lanternas com filtro por setor na URL, detalhe e Sobre (a definir, 2 min).
3. Login e tentativa de abrir `/painel` sem sessão (a definir, 2 min).
4. Resumo e lista como Lanterna: só o setor dele; abrir ocorrência de outro setor leva a acesso negado (a definir, 3 min).
5. Painel como Guardião: todos os setores, filtros e atribuição de responsável (a definir, 2 min).
6. Nova ocorrência e mudança de status: validação no cliente e no servidor (a definir, 2 min).
7. Estados de tela: loading, vazio e erro, derrubando o json-server (a definir, 1 min).
8. Arquitetura: `lib/`, troca de `API_URL` para o back-end (a definir, 1 min).

---

## Feature: homepage e navegação

**O que é:** a entrada apresenta as três áreas (lanternas, Sobre e Central de Comando), o juramento e o emblema da Tropa. O menu leva às demais áreas e marca a página atual.

**Arquivos:**
- `app/(site)/page.tsx`: homepage, com `AREAS` (`:7-11`) e a lista de áreas (`:34-46`).
- `app/(site)/layout.tsx`: cabeçalho e rodapé montados entre as páginas (`:6-11` com os links do menu).
- `components/MenuNavegacao.tsx`: menu com `usePathname` (`:20`) e botão de abrir no celular (`:21`).

**Como funciona (fluxo):**
1. `app/(site)/layout.tsx:14` monta o cabeçalho e o rodapé; `{children}` entra no meio.
2. `app/(site)/page.tsx:14` é um Server Component; os links de ação usam `<Link>` (`:25-26`).
3. A lista de áreas é um `<ul>` com um `<Link>` por item (`:36-44`), não um grid de cartões.
4. `MenuNavegacao.tsx:20` lê a rota atual com `usePathname` e `aria-current` marca o link ativo (`:50`).
5. `MenuNavegacao.tsx:21` guarda se o menu do celular está aberto; é o único estado local desse componente.

**Por que assim:**
- **[ROTA-16]** `<Link>` em vez de `<a>` para navegação interna. Fonte: Slide ROTAS p. 19.
- **[ROTA-06]** o layout fica montado entre as páginas. Fonte: Slide ROTAS p. 14.
- **[DEC-09]** a homepage leva a todas as áreas. Fonte: Decisão do grupo.
- **[COMP-09]** estado local no menu, não em um estado global. Fonte: Slide PROPS p. 6 a 8.

**Trecho para mostrar na tela:** `components/MenuNavegacao.tsx:19-21`.

**Pergunta provável do professor:** Onde está o estado local da aplicação?
**Resposta:** `aberto` (`MenuNavegacao.tsx:21`) pertence só ao menu, porque só ele precisa saber se o menu do celular está aberto (COMP-09). Os filtros ficam na URL (ROTA-14) e os campos de formulário no React Hook Form (FORM-12).

**Quem apresenta:** a definir pelo grupo.

---

## Feature: páginas públicas

**O que é:** listagem de lanternas com filtro por setor, perfil de um lanterna (com 404 para ID inexistente) e a página institucional Sobre. Nenhuma delas pede login.

**Arquivos:**
- `app/(site)/lanternas/page.tsx`: listagem (`:19` função, `:20` lê `searchParams`, `:21` busca em paralelo, `:28-44` filtros, `:46` estado vazio).
- `app/(site)/lanternas/[id]/page.tsx`: perfil (`:16` função, `:20` busca, `:22` erro HTTP, `:24` `notFound()`).
- `app/(site)/sobre/page.tsx`: institucional (`:5` metadata, `:11` página estática).
- `lib/lanternas.ts`: `listarLanternas` (`:7`) e `buscarLanterna` (`:15`).

**Como funciona (fluxo):**
1. A listagem valida `searchParams` com `filtroLanternasSchema.parse(await searchParams)` (`lanternas/page.tsx:20`). O filtro `setor` é opcional e inválido vira `undefined`.
2. `setores` e `lanternas` são buscados juntos com `Promise.all` (`:21`).
3. Os filtros são `<Link>` com `aria-current` no setor ativo (`:30`, `:39`). Clicar muda a URL (`?setor=2814`).
4. Sem lanternas no filtro, aparece `EstadoVazio` com uma ação para ver todos (`:46-51`).
5. O perfil usa `notFound()` quando o ID não existe (`[id]/page.tsx:24`) e trata 401, 403 e 404 em `tratarErroDetalhe` (`lib/erro-detalhe.ts:7-9`).
6. Nenhuma das três páginas chama `verificarSessao` (busca em `app/(site)` sem ocorrência).

**Por que assim:**
- **[DEC-09]** as páginas públicas ficam fora do proxy (`proxy.ts:19` só cobre `/painel` e `/login`). Fonte: Decisão do grupo.
- **[ROTA-10]** `searchParams` e `params` são Promise; é preciso `await`. Fonte: Slide ROTAS p. 17, 18 e 22, com complemento das Docs do Next 16.
- **[ROTA-14]** o filtro fica na URL. Fonte: Slide ROTAS p. 18.
- **[API-07]** buscas independentes em paralelo. Fonte: Slide APIS p. 13.
- **[ROTA-12]** `notFound()` para ID inexistente. Fonte: Slide ROTAS p. 17 e 21.

**Trecho para mostrar na tela:** `app/(site)/lanternas/page.tsx:19-21`.

**Pergunta provável do professor:** Por que `await searchParams`?
**Resposta:** no Next atual `searchParams` é uma Promise (ROTA-10; Slide ROTAS p. 18). Acessar direto, como antes, não funciona mais no Next 16.

**Quem apresenta:** a definir pelo grupo.

---

## Feature: login

**O que é:** e-mail e senha liberam a Central de Comando. O login cria uma sessão em cookie assinado e leva ao painel sem permitir voltar ao login pelo botão Voltar.

**Arquivos:**
- `app/(site)/login/page.tsx:7`: página de login.
- `app/(site)/login/_components/FormLogin.tsx`: formulário (`:13` função, `:14-19` `useForm`, `:27` `handleSubmit`).
- `app/(site)/login/actions.ts`: Server Action `entrar` (`:12`).
- `lib/schemas/login.ts`: schema do e-mail e da senha.
- `lib/usuarios.ts:10`: busca do usuário pelo e-mail.
- `lib/sessao.ts:30`: assinatura HMAC do cookie.

**Como funciona (fluxo):**
1. `FormLogin.tsx:14-19` valida no cliente com `zodResolver(loginSchema)` e `mode: 'onBlur'`.
2. `entrar` valida de novo com `safeParse` (`login/actions.ts:13`). Erro de formato volta com a mensagem do campo.
3. A senha é conferida (`:24`). Se estiver errada, a mensagem é a mesma para e-mail e senha (`:25`), para não dizer qual dos dois errou.
4. `criarSessao` grava o cookie (`:28-34`), que é httpOnly, com dados e assinatura HMAC (`lib/sessao.ts:30`).
5. `redirect('/painel', RedirectType.replace)` (`:35`) troca a entrada do histórico: o Voltar não retorna ao login.
6. Para sair, o botão "Sair" do painel é um `<form action={sair}>` (`app/(painel)/layout.tsx:30`) que apaga o cookie e volta ao login.

**Por que assim:**
- **[AUTH-08]** a mensagem não diz qual campo errou. Fonte: Decisão do grupo, com Slide FORMS p. 16, 19 e 20.
- **[FORM-17]** a Server Action revalida com `safeParse`, porque é um endpoint público. Fonte: Slide FORMS p. 8, 13, 20 e 21.
- **[AUTH-03]** a sessão é assinada com HMAC e `node:crypto`, sem biblioteca extra. Fonte: Decisão do grupo, com Docs do Next (autenticação).
- **[ROTA-19]** `replace` após o login. Fonte: Slide ROTAS p. 20.
- **[FORM-01]** RHF com resolver Zod. Fonte: Slide FORMS p. 6, 9, 16 e 21.

**Trecho para mostrar na tela:** `app/(site)/login/actions.ts:13-35`.

**Pergunta provável do professor:** Por que validar duas vezes, no cliente e na action?
**Resposta:** a validação no cliente é experiência do usuário. A action é um endpoint público e precisa validar de novo (FORM-17; Slide FORMS p. 8: "a validação no servidor é segurança").

**Pergunta provável do professor:** Por que a senha está em texto puro no `db.json`?
**Resposta:** o json-server não tem autenticação; é limitação declarada da API fake (AUTH-11, Decisão do grupo). No back-end real a senha entra com hash.

**Quem apresenta:** a definir pelo grupo.

---

## Feature: controle de acesso (proxy e DAL)

**O que é:** visitante sem sessão que abre `/painel` vai para o login. Sessão inválida, adulterada ou expirada não abre o painel. O Next 16 chama o middleware de `proxy.ts`.

**Arquivos:**
- `proxy.ts`: checagem otimista, só lê o cookie (`:6` função, `:7` `decodificarSessao`, `:10-12` redirect, `:19` matcher).
- `lib/dal.ts`: checagem definitiva (`:30-34` `verificarSessao`, `:37-41` `exigirPapel`, `:25-27` `lerSessao`, `:11` cookie, `:21` apagar).
- `lib/sessao.ts:34-50`: `decodificarSessao` confere assinatura e expiração.
- `app/(painel)/painel/page.tsx:19`: exemplo de página protegida.

**Como funciona (fluxo):**
1. O proxy roda antes de `/painel` e `/login` (`proxy.ts:19`). Sem cookie válido, redireciona para `/login` (`:10-12`).
2. Logado em `/login`, o proxy manda para `/painel` (`:13-15`).
3. O proxy é otimista: só lê o cookie. A decisão definitiva fica no DAL, porque o cookie pode estar obsoleto.
4. Toda página e action do painel chama `verificarSessao()` (`lib/dal.ts:30-33`), que redireciona com `redirect('/login')` (`:32`).
5. Páginas que pedem papel usam `exigirPapel('guardiao')` (`lib/dal.ts:37-40`).

**Por que assim:**
- **[AUTH-01]** `proxy.ts` no lugar de `middleware.ts`. Fonte: Docs Next 16 (nota de versão em `autenticacao.md:50`) e Decisão para o matcher.
- **[AUTH-04]** a checagem fica em cada página, não só no proxy. Fonte: Docs Next (autenticação, DAL) e Slide ROTAS p. 20.
- **[AUTH-05]** actions também checam sessão. Fonte: Docs Next (proxy e autenticação) e Slide FORMS p. 20 ("Uma Server Action é um endpoint público").
- **[AUTH-10]** o layout do painel lê a sessão sem redirecionar, só para mostrar o nome (`lerSessao`, `lib/dal.ts:25`). Fonte: Docs Next (autenticação).

**Trecho para mostrar na tela:** `proxy.ts:6-12` e `lib/dal.ts:30-33`.

**Pergunta provável do professor:** O enunciado pede middleware. Cadê?
**Resposta:** no Next 16 o `middleware.ts` virou `proxy.ts` (AUTH-01, Docs do Next 16). Ele está na raiz e protege `/painel`. A mesma função é repetida no DAL.

**Pergunta provável do professor:** Se o proxy já protege, por que checar de novo na página e na action?
**Resposta:** o proxy é uma checagem otimista; a doc do Next diz para não confiar só nele. Server Action é endpoint público (Slide FORMS p. 20; AUTH-04, AUTH-05).

**Quem apresenta:** a definir pelo grupo.

---

## Feature: papéis e acesso negado

**O que é:** o Guardião vê todos os setores e atribui responsáveis. O Lanterna só vê e altera ocorrências do próprio setor. Quem está logado, mas sem permissão, vê a página de acesso negado.

**Arquivos:**
- `lib/sessao.ts:53-55` (`podeAcessarSetor`) e `:58-60` (`setorParaFiltro`).
- `app/(painel)/painel/ocorrencias/page.tsx:23` (checagem) e `:27` (filtro de setor).
- `app/(painel)/painel/ocorrencias/[id]/page.tsx:24` (checagem) e `:33` (redirect por setor).
- `app/(painel)/painel/ocorrencias/[id]/atribuir/page.tsx:18` (`exigirPapel`).
- `app/(site)/acesso-negado/page.tsx:7`: a página de acesso negado.

**Como funciona (fluxo):**
1. O setor efetivo do Lanterna vem da sessão, não da URL (`setorParaFiltro`, `lib/sessao.ts:59`). Um `?setor=` forjado é ignorado.
2. No detalhe, `podeAcessarSetor` compara o setor da ocorrência com o da sessão (`[id]/page.tsx:33`). Se não bater, redireciona para `/acesso-negado`.
3. A página de atribuir exige papel de Guardião (`atribuir/page.tsx:18`).
4. `app/(site)/acesso-negado/page.tsx:7` explica o bloqueio, com link para o painel.

**Por que assim:**
- **[AUTH-07]** o papel e o setor são decididos pelo servidor a partir da sessão. Fonte: Decisão do grupo (regra de negócio), com Docs do Next (autenticação).
- **[AUTH-06]** a página `/acesso-negado` faz o papel do 403. Fonte: Decisão do grupo, com Slide APIS p. 5 ("403 Sem permissão, explique o bloqueio") e Docs (`forbidden()` é experimental).

**Trecho para mostrar na tela:** `lib/sessao.ts:53-60` e `app/(painel)/painel/ocorrencias/[id]/page.tsx:33`.

**Pergunta provável do professor:** Trocar o setor na URL libera outra ocorrência?
**Resposta:** não. O detalhe confere o setor com a sessão (`podeAcessarSetor`, AUTH-07) e manda para `/acesso-negado`. A action de status também confere (`actions.ts:55`).

**Pergunta provável do professor:** Qual a diferença entre não logado e sem permissão?
**Resposta:** não logado vai para o login (401, Slide APIS p. 5). Logado sem permissão vê a página de acesso negado (403, AUTH-06).

**Quem apresenta:** a definir pelo grupo.

---

## Feature: resumo e lista de ocorrências com filtros

**O que é:** o Resumo mostra uma barra com a contagem por status e as cinco ocorrências mais recentes. A lista tem filtros de status, gravidade e setor, todos na URL.

**Arquivos:**
- `app/(painel)/painel/page.tsx:18`: Resumo, com `Promise.all` (`:20`).
- `components/BarraStatus.tsx:22`: barra de status, com a contagem por status (`:25`, JS-09) e links para a lista filtrada (`:41`).
- `app/(painel)/painel/ocorrencias/page.tsx:22`: lista, com `searchParams` (`:24`), `Suspense` (`:41`) e estado vazio (`:44`).
- `app/(painel)/painel/ocorrencias/_components/FiltroOcorrencias.tsx:14`: filtros (`:15` `useSearchParams`, `:23` `router.push`).
- `lib/filtro-ocorrencias.ts:6` e `:15`: normalização dos parâmetros.
- `lib/schemas/ocorrencia.ts:68`: `filtroOcorrenciasSchema`.

**Como funciona (fluxo):**
1. A lista lê os filtros de `searchParams` (`ocorrencias/page.tsx:24`), normaliza e busca na API (`:25`).
2. Parâmetros repetidos, inválidos ou de setor desconhecido são ignorados (`lib/filtro-ocorrencias.ts:15`).
3. `FiltroOcorrencias` troca a URL com `router.push` (`FiltroOcorrencias.tsx:23`). Assim o filtro sobrevive ao F5, pode ser compartilhado e o Voltar desfaz.
4. O componente que usa `useSearchParams` fica dentro de `<Suspense>` (`ocorrencias/page.tsx:41-43`).
5. No Resumo, cada item da barra é um link para `/painel/ocorrencias?status=...` (`BarraStatus.tsx:41`).

**Por que assim:**
- **[ROTA-14]** filtro na URL, não em `useState`. Fonte: Slide ROTAS p. 18 ("sobrevive ao F5, pode ser compartilhado e o botão voltar desfaz").
- **[ROTA-15]** `Suspense` em volta de `useSearchParams`. Fonte: Slide ROTAS p. 18.
- **[JS-09]** contagem por status com `filter` sobre o array. Fonte: Slide JS p. 8.
- **[API-09]** estado vazio explicado. Fonte: Slide APIS p. 20.

**Trecho para mostrar na tela:** `app/(painel)/painel/ocorrencias/_components/FiltroOcorrencias.tsx:14-23`.

**Pergunta provável do professor:** Por que o filtro não é `useState`?
**Resposta:** a URL conserva o filtro ao atualizar e ao compartilhar, e o Voltar desfaz a mudança (ROTA-14; Slide ROTAS p. 18). Isso dá para testar só com o link.

**Pergunta provável do professor:** Por que o filtro de setor some para o Lanterna?
**Resposta:** o Lanterna já está preso ao próprio setor pela sessão (`setorParaFiltro`, AUTH-07), então o filtro seria enganoso. O componente recebe `setores=[]` para ele (`ocorrencias/page.tsx:42`).

**Quem apresenta:** a definir pelo grupo.

---

## Feature: nova ocorrência

**O que é:** formulário para registrar um caso com título, descrição, planeta, setor, gravidade e envolvidos. O Lanterna registra sempre no próprio setor.

**Arquivos:**
- `app/(painel)/painel/ocorrencias/nova/page.tsx:10`: página, protegida em `:11`.
- `app/(painel)/painel/ocorrencias/_components/FormOcorrencia.tsx:20`: formulário (`:22` `useForm` com resolver, `:34` `handleSubmit`).
- `app/(painel)/painel/ocorrencias/actions.ts:15`: action `registrarOcorrencia`.
- `lib/schemas/ocorrencia.ts:38`: `novaOcorrenciaSchema`, com `z.coerce.number` em `:46`.

**Como funciona (fluxo):**
1. O formulário valida no cliente com o mesmo schema (`FormOcorrencia.tsx:22`).
2. `registrarOcorrencia` checa a sessão (`actions.ts:16`), valida com `safeParse` (`:17`) e decide o setor: Lanterna usa o da sessão, sem olhar o que veio no formulário (`:20`).
3. O cadastro passa pela camada `lib/` (`criarOcorrencia`, `lib/ocorrencias.ts:32`).
4. `revalidatePath('/painel', 'layout')` (`:41`) atualiza o Resumo e a lista antes do redirect.
5. `redirect` leva ao detalhe da ocorrência recém-criada (`:42`), fora do `try`.

**Por que assim:**
- **[FORM-17]** `safeParse` na action. Fonte: Slide FORMS p. 8, 13, 20 e 21.
- **[FORM-13]** `z.coerce.number` para o campo de envolvidos, porque o input HTML entrega texto. Fonte: Slide FORMS p. 5, 14, 15 e 21.
- **[AUTH-07]** o Lanterna não escolhe o setor. Fonte: Decisão do grupo.
- **[API-14]** `revalidatePath` depois da escrita. Fonte: Slide APIS p. 5 e 16; Slide FORMS p. 20.
- **[ROTA-20]** `redirect` fora de `try`. Fonte: Slide ROTAS p. 20; Docs do Next (redirect).

**Trecho para mostrar na tela:** `app/(painel)/painel/ocorrencias/actions.ts:15-42`.

**Pergunta provável do professor:** Por que `z.coerce` em envolvidos?
**Resposta:** o input HTML sempre entrega texto; o schema converte e valida o número (FORM-13; Slide FORMS p. 5 e 14).

**Pergunta provável do professor:** Por que validar no servidor se já valida no cliente?
**Resposta:** cliente é UX, servidor é segurança; o mesmo schema roda nos dois lados (FORM-17; Slide FORMS p. 8 e 20).

**Quem apresenta:** a definir pelo grupo.

---

## Feature: detalhe e mudança de status

**O que é:** mostra os dados da ocorrência e permite mudar o status. Para "Resolvida", o campo de explicação aparece e é obrigatório.

**Arquivos:**
- `app/(painel)/painel/ocorrencias/[id]/page.tsx:23`: detalhe. `:24` sessão, `:27-31` busca em `try`, `:32` `notFound()`, `:33` redirect por setor, `:83-88` formulário.
- `app/(painel)/painel/ocorrencias/_components/FormStatus.tsx:21`: formulário (`:22` estado da mensagem, `:23` `useForm`, `:29` `useWatch`).
- `app/(painel)/painel/ocorrencias/actions.ts:46`: `atualizarStatus`.
- `lib/schemas/ocorrencia.ts:53`: `atualizarStatusSchema`, com `.refine` e `path` em `:58`.

**Como funciona (fluxo):**
1. O detalhe busca a ocorrência, setores e lanternas em `try` (`[id]/page.tsx:27-31`). Erro HTTP passa por `tratarErroDetalhe`.
2. `FormStatus` mostra o campo "Como foi resolvida?" só quando o status atual é `resolvida` (`useWatch`, `FormStatus.tsx:29`).
3. `atualizarStatus` confere a sessão (`actions.ts:47`), o schema (`:49`) e o setor (`:55`) antes de gravar (`:59`).
4. Erro de campo volta para o formulário via `aplicarErrosDoServidor` (`FormStatus.tsx:34`), com o foco no primeiro campo inválido.

**Por que assim:**
- **[FORM-14]** `.refine` com `path` para a explicação de "Resolvida". Fonte: Slide FORMS p. 14, 19 e 21.
- **[FORM-21]** `useWatch` em vez de `watch`, para não re-renderizar o formulário todo. Fonte: Slide FORMS p. 10 e 21; ajuste de ESLint nas referências.
- **[FORM-19]** erro do servidor no campo com `setError`. Fonte: Slide FORMS p. 19.
- **[AUTH-05]** a action checa sessão. Fonte: Docs do Next (autenticação) e Slide FORMS p. 20.

**Trecho para mostrar na tela:** `lib/schemas/ocorrencia.ts:53-60`, a regra de "Resolvida" no servidor.

**Pergunta provável do professor:** Por que o `.refine` tem `path`?
**Resposta:** sem `path` o erro não aparece em campo nenhum; com `path: ['resolucao']` a mensagem fica ao lado da explicação (FORM-14; Slide FORMS p. 21).

**Quem apresenta:** a definir pelo grupo.

---

## Feature: atribuir responsável

**O que é:** o Guardião escolhe um lanterna para assumir a ocorrência. A lista de opções só aceita lanternas do setor da ocorrência.

**Arquivos:**
- `app/(painel)/painel/ocorrencias/[id]/atribuir/page.tsx:17` (função) e `:18` (`exigirPapel`).
- `app/(painel)/painel/ocorrencias/_components/FormAtribuir.tsx:20`: formulário (`:22` `useForm`).
- `app/(painel)/painel/ocorrencias/actions.ts:70`: `atribuirResponsavel`, com `exigirPapel` em `:71`.

**Como funciona (fluxo):**
1. A página exige papel de Guardião (`atribuir/page.tsx:18`). Lanterna cai em `/acesso-negado`.
2. A action repete a exigência de papel (`actions.ts:71`) porque a página não basta sozinha.
3. A action confere se o lanterna escolhido é do setor da ocorrência (`:80-82`). Se não for, o erro vai para o campo `responsavelId`.
4. Salva (`:83`), revalida (`:89`) e volta ao detalhe (`:90`).

**Por que assim:**
- **[AUTH-05]** e **[AUTH-06]** a action exige o papel, não só a página. Fonte: Docs do Next (autenticação) e Decisão do grupo.
- **[FORM-17]** `safeParse` mesmo com papel verificado. Fonte: Slide FORMS p. 8 e 20.

**Trecho para mostrar na tela:** `app/(painel)/painel/ocorrencias/actions.ts:70-83`.

**Pergunta provável do professor:** Chamar a action direto pelo console contorna a tela?
**Resposta:** não. A action verifica papel, sessão, schema e setor (AUTH-05, AUTH-06, FORM-17). Server Action é endpoint público, e por isso a checagem é no servidor.

**Quem apresenta:** a definir pelo grupo.

---

## Feature: estados de tela

**O que é:** loading, vazio, erro e sucesso, cada um com retorno claro para quem usa.

**Arquivos:**
- `components/EsqueletoLista.tsx:4`: esqueleto do loading.
- `components/EstadoVazio.tsx:12`: estado vazio com explicação e ação.
- `components/TelaDeErro.tsx:13`: mensagem para humanos, com "Tentar de novo" (`:25`). O detalhe técnico vai só para o console (`:15`).
- `app/(painel)/painel/ocorrencias/error.tsx:5-6` e `loading.tsx:3-4`: fronteiras de erro e de carregamento da rota.
- `lib/erro-detalhe.ts:5-12`: classifica o erro HTTP (404, 401, 403, e o resto segue).

**Como funciona (fluxo):**
1. `loading.tsx` mostra o esqueleto enquanto a página carrega (API-10).
2. Lista vazia mostra `EstadoVazio` com explicação (API-09; `lanternas/page.tsx:46`).
3. Falha da API abre o `error.tsx`, que mostra a mensagem e o botão "Tentar de novo" (`TelaDeErro.tsx:25`, `retry()`).
4. Erro HTTP 401 leva ao login, 403 a acesso negado, 404 a `notFound()`, e o resto sobe para o `error.tsx` (`lib/erro-detalhe.ts:7-11`).

**Por que assim:**
- **[API-09]** os quatro estados são desenhados antes do fetch. Fonte: Slide APIS p. 20 ("desenhe os quatro estados antes de escrever o fetch").
- **[API-10]** `loading.tsx` para a rota inteira. Fonte: Slide APIS p. 19 e 23; Slide ROTAS p. 21.
- **[API-11]** `error.tsx` com retry. Fonte: Slide APIS p. 21; nota de versão: `retry()` no Next 16.4 (ROTAS p. 21).
- **[API-13]** mensagem humana, detalhe no log. Fonte: Slide APIS p. 21 e 23.

**Trecho para mostrar na tela:** `components/TelaDeErro.tsx:13-27`.

**Pergunta provável do professor:** O que acontece se a API cair?
**Resposta:** a fronteira de erro mostra "Não foi possível falar com a Central de Oa" com "Tentar de novo". O erro técnico vai para o console, não para a tela (API-11, API-13; Slide APIS p. 21).

**Pergunta provável do professor:** E se a lista vier vazia?
**Resposta:** estado vazio com explicação e uma ação (API-09; Slide APIS p. 20: os quatro estados).

**Quem apresenta:** a definir pelo grupo.

---

## Feature: camada de serviço e reuso no back-end

**O que é:** as páginas dependem de funções de domínio, sem montar URLs da API. A troca do json-server pelo back-end real fica concentrada em `lib/`.

**Arquivos:**
- `lib/api.ts:2-5`: `urlDaApi`, que monta a URL a partir de `API_URL`.
- `lib/ocorrencias.ts`: `listarOcorrencias` (`:10`), `buscarOcorrencia` (`:24`), `criarOcorrencia` (`:32`), `atualizarOcorrencia` (`:44`).
- `lib/lanternas.ts:7` e `:15`; `lib/setores.ts:7`; `lib/usuarios.ts:10`.
- `lib/api-error.ts:2`: `ApiError` com o status HTTP.
- `lib/schemas/ocorrencia.ts:21`: schema de resposta (`ocorrenciaSchema`).
- `.env.example:2`: `API_URL=http://localhost:3001`.

**Como funciona (fluxo):**
1. Cada função de `lib/` monta a URL com `urlDaApi` (`lib/api.ts:5`).
2. Cada chamada checa `res.ok` (API-02) e lança `ApiError` com o status (API-03).
3. A resposta é validada com Zod (`ocorrenciaSchema`, `lib/schemas/ocorrencia.ts:21`). Se o formato mudar, o erro aparece aqui.
4. O cache é declarado em cada fetch (API-06).
5. Para o back-end real, muda-se `API_URL`; se o contrato mudar, muda-se o schema. As páginas não mudam.

**Por que assim:**
- **[API-01]** uma função por operação, em `lib/<recurso>.ts`. Fonte: Slide APIS p. 14 e 3.
- **[API-04]** resposta validada com Zod. Fonte: Slide APIS p. 14, 21 e 23; Docs do json-server (`id` é string).
- **[API-06]** cache explícito. Fonte: Slide APIS p. 12 e 23; Decisão do grupo.
- **[DEC-04]** pensar para reuso no back-end. Fonte: Decisão do grupo; texto do professor.

**Trecho para mostrar na tela:** `lib/ocorrencias.ts:10-22` e `lib/api.ts:2-5`.

**Pergunta provável do professor:** Como vocês vão aproveitar isso na etapa de back-end?
**Resposta:** toda chamada HTTP está em `lib/`; troca-se `API_URL`, e só os schemas mudam se o formato mudar. Login e sessão precisam de autenticação real (AUTH-11 é limitação da API fake).

**Pergunta provável do professor:** Por que checar `res.ok`?
**Resposta:** `fetch` só rejeita em falha de rede; 404 e 500 chegam como resposta normal (API-02; Slide APIS p. 7).

**Quem apresenta:** a definir pelo grupo.

---

## Feature: design system

**O que é:** o visual da Central de Oa segue um sistema único: tokens de cor em tema escuro (Noite), um espectro de gravidade, foco em anel, três fontes com papéis definidos, um emblema próprio e uma vitrine em `/design-system` que mostra tudo.

**Arquivos:**
- `app/globals.css`: tokens. `:8` bloco `@theme inline`; `:53` `--shadow-anel`; `:57` `:root` com as cores (`:61-86`) e o espectro (`:88-91`); `:100` `color-scheme: dark`; `:111-114` anel de foco; `:118-127` reduz movimento.
- `app/layout.tsx:5-8`: as três fontes (Barlow, Barlow Condensed e IBM Plex Mono).
- `components/BadgeGravidade.tsx:5-10` e `:13`: espectro de gravidade (losango colorido + texto).
- `components/IconeStatus.tsx:5`: ícone de carga do status (vazio, meio, cheio).
- `components/BarraStatus.tsx:7-11`: barra do Resumo, com a mesma metáfora.
- `components/Emblema.tsx:3-4`: emblema próprio da Tropa.
- `app/(site)/design-system/page.tsx:77` (página) e `:28` (dados fixos, sem API).
- `app/(site)/design-system/_components/SecaoVitrine.tsx:9`: seção reutilizável da vitrine.
- `components/ui/button.tsx:5` e `:7`: botões com o anel no foco (DEC-11, CSS-08).

**Como funciona (fluxo):**
1. Os tokens são variáveis CSS em `:root` e viram classes Tailwind pelo `@theme inline` (`globals.css:8-55`). Não há `tailwind.config`.
2. O tema é só o escuro: `color-scheme: dark` (`:100`) e nenhuma variante `dark:` (DEC-13).
3. O gravidade tem quatro cores (`--gravidade-baixa` a `--gravidade-critica`, `:88-91`). `BadgeGravidade` mostra a cor com um losango e o texto, para não depender só da cor.
4. O foco de teclado é um anel: `a:focus-visible` (`:111-114`) e os botões (`components/ui/button.tsx:7`) usam `--shadow-anel` (`:53`), que é o mesmo anel do emblema.
5. As fontes são carregadas uma vez em `app/layout.tsx:6-8` e cada uma tem um papel: `font-sans` (interface), `font-heading` (títulos) e `font-mono` (dados).
6. `/design-system` mostra cores, tipografia, emblema, ícones, badges e componentes, com dados fixos (`design-system/page.tsx:28`). Não chama a API.

**Por que assim:**
- **[CSS-12]** tokens e espectro com classe inteira por valor, para o Tailwind gerar as classes. Fonte: Decisão do grupo (design system), com Slide CSS p. 13.
- **[DEC-13]** tema único escuro, sem variante `dark:`. Fonte: Decisão do grupo.
- **[CSS-14]** o anel é o único brilho do foco e do emblema. Fonte: Decisão do grupo, com Slide CSS p. 15.
- **[CSS-13]** três famílias, uma para cada papel. Fonte: Docs do Next (`next/font`) e Decisão do grupo.
- **[CSS-15]** quem pede menos movimento não vê transição. Fonte: Decisão do grupo, com Docs (MDN, `prefers-reduced-motion`).
- **[DEC-12]** a vitrine usa dados fixos e não depende da API. Fonte: Decisão do grupo.
- **[CSS-09]** tema em CSS, sem `tailwind.config`. Fonte: Slide CSS p. 16 e Docs do shadcn (variáveis CSS).

**Trecho para mostrar na tela:** `app/globals.css:111-114` (foco) e `components/BadgeGravidade.tsx:5-10` (espectro).

**Pergunta provável do professor:** Por que o foco é um anel e não o `outline` padrão?
**Resposta:** o anel aparece só no foco de teclado (`:focus-visible`), tem contraste e segue o formato do elemento. Mesmo brilho do emblema, então o sistema tem uma única ideia visual (CSS-14; Decisão do grupo).

**Pergunta provável do professor:** Por que cores em `oklch` e não em hexadecimal?
**Resposta:** `oklch` separa luminosidade, croma e matiz, então dá para ajustar o contraste sem mudar a cor. Os tokens estão em `:root` (`globals.css:57`).

**Pergunta provável do professor:** Por que só o tema escuro?
**Resposta:** é a direção aprovada para o trabalho (Noite). Ter uma única variante evita duplicar cada classe com `dark:` (DEC-13).

**Pergunta provável do professor:** O emblema é o logo da DC?
**Resposta:** não. O `Emblema.tsx` (`:3`) é um desenho próprio da Tropa, feito pelo grupo, e o comentário do arquivo deixa isso explícito.

**Quem apresenta:** a definir pelo grupo.

---

## Feature: estilo e componentes

**O que é:** interface responsiva com componentes reutilizáveis, HTML semântico e formulários com campos acessíveis.

**Arquivos:**
- `components/CampoTexto.tsx:19`: campo de texto com label, erro acessível e registro do RHF.
- `components/CampoSelect.tsx:21`: select controlado (`:26` `onValueChange`, FORM-16).
- `components/BadgeStatus.tsx:6`: badge de status, com `IconeStatus` (CSS-02).
- `components/CabecalhoPagina.tsx:9`: título e descrição de página, com `children` para ações (COMP-12).
- `components/Juramento.tsx:9`: o juramento da Tropa, um verso por linha.
- `app/(site)/page.tsx:19`: título de página com `font-heading` (CSS-13).

**Como funciona (fluxo):**
1. Classes Tailwind fazem a grade mudar com a largura da tela (`lanternas/page.tsx:53`: uma coluna no celular, duas e três em telas maiores).
2. Campos e badges concentram o padrão em um componente, para não repetir em cada formulário.
3. Links e botões têm semântica (`<Link>`, `<button>`) e foco visível (o anel do design system).
4. Não há `style={{}}` nem `class=` em JSX (CSS-02, COMP-15).

**Por que assim:**
- **[CSS-03]** mobile-first, com `sm:`, `md:` e `lg:`. Fonte: Slide CSS p. 11, 12 e 16.
- **[CSS-06]** lista vertical no celular, grade em telas maiores. Fonte: Slide CSS p. 12 e 14.
- **[COMP-03]** componentes com props configuráveis. Fonte: Slide PROPS p. 9 e 3.
- **[FORM-22]** `CampoTexto` reúne label, erro e registro. Fonte: Slide FORMS p. 17 e 21.
- **[CSS-10]** `@apply` não foi usado; o padrão repetido virou componente React (`Juramento`, `CabecalhoPagina`). Fonte: Slide CSS p. 18 e Decisão do grupo.

**Trecho para mostrar na tela:** `components/CampoTexto.tsx:19-36` e `app/(site)/lanternas/page.tsx:53`.

**Pergunta provável do professor:** Por que não repetir o campo em cada formulário?
**Resposta:** `CampoTexto` reúne label, erro acessível e registro do RHF (FORM-22; Slide FORMS p. 17 e 21).

**Pergunta provável do professor:** Por que não tem `style={{}}`?
**Resposta:** inline é para evitar, difícil de manter e de reutilizar (CSS-02; Slide CSS p. 4). Estilo é por classe Tailwind, e o design system fica nos tokens.

**Pergunta provável do professor:** Por que tem `@theme` em `globals.css` se o slide diz para não escrever CSS?
**Resposta:** o slide é do Tailwind 3. No Tailwind 4 os tokens são declarados no CSS (CSS-09 e a nota de versão em `estilo-tailwind.md:88`). O `globals.css` é o único lugar com CSS próprio (CSS-01).

**Quem apresenta:** a definir pelo grupo.

---

## Perguntas gerais (qualquer integrante deve saber responder)

| Pergunta | Resposta curta | Regras |
|---|---|---|
| O enunciado pede middleware; onde está? | No Next 16 chama `proxy.ts`; ele protege `/painel`. | AUTH-01 · Docs Next 16 |
| O cookie pode ser adulterado? | Mudança quebra a assinatura HMAC; cookie inválido vira sessão ausente. | AUTH-03 · Decisão + Docs Next |
| Por que `fetch`, não Axios? | O grupo escolheu `fetch` para dados em Server Components e cache do Next. | DEC-01 · Decisão + Slide APIS p. 9 |
| Por que `Link`, não `<a>`? | Navegação interna sem recarga completa. | ROTA-16 · Slide ROTAS p. 19 |
| Por que os grupos têm parênteses? | Permitem layouts diferentes sem entrar no endereço. | ROTA-04 · Slide ROTAS p. 15 |
| Por que há senhas em texto no `db.json`? | É dado de demonstração da API fake; a API real usará hash. | AUTH-11 · Decisão do grupo |
| Qual o estado local do app? | O menu do celular (`MenuNavegacao.tsx:21`) e a mensagem de sucesso do status (`FormStatus.tsx:22`). Filtros estão na URL. | COMP-09, ROTA-14 · Slide PROPS p. 6 a 8 |
| Por que tokens de cor e não o `tailwind.config`? | No Tailwind 4 os tokens ficam em `@theme` no CSS; um só lugar (`globals.css:8`). | CSS-09 · Slide CSS p. 16 e Docs shadcn |
| Por que o foco é um anel? | Só aparece no teclado (`:focus-visible`), com contraste; mesmo brilho do emblema. | CSS-14 · Decisão do grupo |
| Há modo claro? | Não. Tema único escuro (Noite), sem `dark:`. | DEC-13 · Decisão do grupo |
| O emblema é o logo da DC? | Não; é um desenho próprio da Tropa (`Emblema.tsx:3`). | DEC-12 · Decisão do grupo |
