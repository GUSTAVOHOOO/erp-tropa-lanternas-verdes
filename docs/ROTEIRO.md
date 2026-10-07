# Roteiro de apresentação: ERP da Tropa dos Lanternas Verdes

- **Data:** 2026-10-07 · **Versão:** `3224aa4` + auditoria final desta tarefa
- **Duração alvo:** 12 a 15 min · **Integrantes:** definir a distribuição antes da apresentação

Como usar: a pessoa que apresentar cada parte pode abrir o trecho indicado. “Slide” identifica material do professor; “Docs” identifica documentação oficial; “Decisão” identifica escolha do grupo. As fontes completas ficam em `.claude/skills/padroes-wellington/references/`.

## Ordem da demonstração

1. Homepage, navegação, lista pública de lanternas e página Sobre.
2. Abrir `/painel` sem sessão, entrar como Hal Jordan e mostrar o setor 2814.
3. Mostrar filtros, detalhe, bloqueio de setor alheio e de atribuição.
4. Registrar uma ocorrência e atualizar o status; mostrar validação de campo.
5. Entrar como Ganthet, ver todos os setores e atribuir responsável.
6. Mostrar estados vazio, carregando e erro com a API indisponível; encerrar com `lib/`.

## Feature: homepage e navegação

**O que é:** a entrada apresenta as três áreas e o menu leva a lanternas, Sobre, login e painel.

**Arquivos:** `app/(site)/page.tsx:5`, `app/(site)/layout.tsx:4`, `components/MenuNavegacao.tsx:18`.

**Como funciona:** `AREAS` alimenta cartões com `<Link>`; o layout mantém cabeçalho e rodapé; o menu usa `usePathname` para indicar a rota atual e `useState` para abrir no celular.

**Por que assim:** ROTA-16 vem do **slide de Rotas, p. 19 e 22** (`Link` para navegação interna). ROTA-06 vem do **slide de Rotas, p. 14 e 22** (layout persistente). COMP-09 vem do **slide de Props e Estado, p. 6 a 8** (estado local do menu).

**Trecho para mostrar:** `components/MenuNavegacao.tsx:18`.

**Pergunta provável:** Onde está o estado local? **Resposta:** `aberto` pertence só ao menu; filtros pertencem à URL (COMP-09, ROTA-14).

## Feature: páginas públicas

**O que é:** listagem de lanternas com filtro de setor, perfil de um lanterna e página institucional.

**Arquivos:** `app/(site)/lanternas/page.tsx:18`, `app/(site)/lanternas/[id]/page.tsx:13`, `app/(site)/sobre/page.tsx:9`, `lib/lanternas.ts:7`.

**Como funciona:** a página lê `searchParams` com `await`, valida o filtro, busca setores e lanternas em paralelo; a rota `[id]` busca o perfil e usa `notFound()` para um ID ausente. Não há chamada de sessão nas páginas públicas.

**Por que assim:** ROTA-10 usa o **slide de Rotas, p. 17, 18 e 22**, complementado pelas **Docs do Next 16** (params assíncronos). API-07 usa o **slide de Consumo de APIs, p. 13 e 23**. ROTA-12 usa o **slide de Rotas, p. 17 e 22**.

**Trecho para mostrar:** `app/(site)/lanternas/page.tsx:18`.

**Pergunta provável:** Por que `await searchParams`? **Resposta:** no Next atual é uma Promise (ROTA-10).

## Feature: login

**O que é:** e-mail e senha liberam a Central de Comando conforme o papel do usuário.

**Arquivos:** `app/(site)/login/_components/FormLogin.tsx:13`, `app/(site)/login/actions.ts:13`, `lib/schemas/login.ts:3`, `lib/usuarios.ts:7`, `lib/dal.ts:7`.

**Como funciona:** React Hook Form e Zod validam no cliente; `entrar` valida de novo, consulta o usuário na API, compara credenciais, cria cookie assinado e redireciona com `replace`. E-mail com espaços ou maiúsculas é normalizado. O formulário mostra erro humano se a API falhar.

**Por que assim:** FORM-01 vem do **slide de Formulários, p. 6, 9, 16 e 21**; FORM-17, do **slide de Formulários, p. 8, 13, 20 e 21**. ROTA-19 vem do **slide de Rotas, p. 20**, com complemento das **Docs do Next** sobre `redirect` em Server Actions. Assinatura HMAC (AUTH-03) é **decisão do grupo** baseada nas **Docs de autenticação do Next**.

**Trecho para mostrar:** `app/(site)/login/actions.ts:13`.

**Pergunta provável:** Por que validar duas vezes? **Resposta:** validação no cliente ajuda a pessoa; a action é um endpoint público e precisa validar por segurança (FORM-17).

## Feature: controle de acesso (proxy e DAL)

**O que é:** visitante vai ao login; sessão inválida não abre o painel.

**Arquivos:** `proxy.ts:7`, `lib/dal.ts:29`, `lib/sessao.ts:30`, `app/(painel)/painel/page.tsx:18`.

**Como funciona:** o proxy lê e valida o cookie antes da rota; páginas e actions repetem a checagem no servidor por `verificarSessao()` ou `exigirPapel()`. A sessão tem assinatura HMAC e expiração.

**Por que assim:** AUTH-01 e AUTH-04 vêm das **Docs do Next 16**; AUTH-04 também tem apoio no **slide de Rotas, p. 20**, e no **slide de Consumo de APIs, p. 5 e 21**. O arquivo `proxy.ts` é a convenção atual para o que o enunciado chama middleware.

**Trecho para mostrar:** `proxy.ts:7` e `lib/dal.ts:29`.

**Pergunta provável:** Por que checar nas páginas se já há proxy? **Resposta:** o proxy faz uma checagem antecipada; a autorização definitiva fica junto dos dados e das actions (AUTH-04, AUTH-05; Docs do Next e slide de Formulários, p. 20).

## Feature: papéis, setores e acesso negado

**O que é:** Guardião vê todos os setores; Lanterna só vê e altera ocorrências do próprio setor. Só Guardião atribui responsável.

**Arquivos:** `lib/sessao.ts:52`, `app/(painel)/painel/ocorrencias/page.tsx:24`, `app/(painel)/painel/ocorrencias/[id]/page.tsx:25`, `app/(painel)/painel/ocorrencias/[id]/atribuir/page.tsx:16`, `app/(site)/acesso-negado/page.tsx:8`.

**Como funciona:** o setor do Lanterna vem da sessão, nunca do filtro enviado; detalhe e actions verificam setor e papel. Quem está logado, mas sem permissão, recebe a página de acesso negado.

**Por que assim:** AUTH-07 é **decisão do grupo** com apoio nas **Docs de autenticação do Next**; AUTH-06 é **decisão do grupo** para a tela 403, com apoio no **slide de Consumo de APIs, p. 5**.

**Trecho para mostrar:** `app/(painel)/painel/ocorrencias/actions.ts:16`.

**Pergunta provável:** Trocar o setor na URL libera outra ocorrência? **Resposta:** não; a action e a página usam o setor autenticado (AUTH-07).

## Feature: lista de ocorrências e filtros

**O que é:** o painel lista ocorrências e filtra por status, gravidade e setor.

**Arquivos:** `app/(painel)/painel/ocorrencias/page.tsx:20`, `app/(painel)/painel/ocorrencias/_components/FiltroOcorrencias.tsx:14`, `lib/schemas/ocorrencia.ts:67`, `components/TabelaOcorrencias.tsx:15`.

**Como funciona:** a página valida os parâmetros de URL; o filtro cliente altera a URL por `router.push`, preservando compartilhamento, F5 e histórico; `lib/ocorrencias.ts` faz a consulta.

**Por que assim:** ROTA-14 vem do **slide de Rotas, p. 18 e 22**. API-01 vem do **slide de Consumo de APIs, p. 3, 14 e 23**. O filtro de gravidade segue a regra local ROTA-14; paginação ficou fora do escopo do trabalho.

**Trecho para mostrar:** `app/(painel)/painel/ocorrencias/_components/FiltroOcorrencias.tsx:14`.

**Pergunta provável:** Por que o filtro não é `useState`? **Resposta:** a URL conserva o filtro ao atualizar e ao compartilhar (ROTA-14).

## Feature: nova ocorrência

**O que é:** registra um novo caso com título, descrição, planeta, setor, gravidade e envolvidos.

**Arquivos:** `app/(painel)/painel/ocorrencias/nova/page.tsx:9`, `app/(painel)/painel/ocorrencias/_components/FormOcorrencia.tsx:20`, `app/(painel)/painel/ocorrencias/actions.ts:15`, `lib/schemas/ocorrencia.ts:37`.

**Como funciona:** o formulário usa campos reutilizáveis e `Controller` para selects; a action verifica sessão antes de `safeParse`, ignora setor forjado por Lanterna, grava pela camada `lib/` e invalida a rota antes de redirecionar.

**Por que assim:** FORM-16 vem do **slide de Formulários, p. 18** e das **Docs do shadcn/ui**. FORM-17 vem do **slide de Formulários, p. 8, 13, 20 e 21**. API-14 vem do **slide de Consumo de APIs, p. 18 e 22**, com complemento das **Docs do Next**.

**Trecho para mostrar:** `app/(painel)/painel/ocorrencias/actions.ts:15`.

**Pergunta provável:** Por que `z.coerce` em envolvidos? **Resposta:** o input HTML entrega texto; o schema converte e valida o número (FORM-13; slide de Formulários, p. 5, 14 e 15).

## Feature: detalhe e mudança de status

**O que é:** mostra dados da ocorrência e permite registrar andamento ou resolução.

**Arquivos:** `app/(painel)/painel/ocorrencias/[id]/page.tsx:20`, `app/(painel)/painel/ocorrencias/_components/FormStatus.tsx:20`, `app/(painel)/painel/ocorrencias/actions.ts:46`, `lib/schemas/ocorrencia.ts:53`.

**Como funciona:** ID inexistente vira 404; setor alheio vira acesso negado. O formulário pede explicação quando o status é resolvida; o schema repete a regra no servidor e associa o erro ao campo `resolucao`.

**Por que assim:** FORM-14 vem do **slide de Formulários, p. 14, 19 e 21**. FORM-21 usa `useWatch` para um campo, conforme **slide de Formulários, p. 10 e 21**, com ajuste da **doc do React Hook Form** para o ESLint atual.

**Trecho para mostrar:** `lib/schemas/ocorrencia.ts:53`.

**Pergunta provável:** Por que `.refine` tem `path`? **Resposta:** assim a mensagem aparece ao lado de `resolucao` (FORM-14).

## Feature: atribuir responsável

**O que é:** Guardião escolhe um lanterna do setor da ocorrência para assumir o caso.

**Arquivos:** `app/(painel)/painel/ocorrencias/[id]/atribuir/page.tsx:15`, `app/(painel)/painel/ocorrencias/_components/FormAtribuir.tsx:20`, `app/(painel)/painel/ocorrencias/actions.ts:70`.

**Como funciona:** página e action exigem papel de Guardião; a action verifica se o responsável escolhido pertence ao mesmo setor da ocorrência antes de salvar.

**Por que assim:** AUTH-05 vem das **Docs de autenticação do Next** e do **slide de Formulários, p. 20**; AUTH-06 usa a **decisão do grupo** de mostrar uma tela 403; FORM-17 vem do **slide de Formulários, p. 8 e 20**.

**Trecho para mostrar:** `app/(painel)/painel/ocorrencias/actions.ts:70`.

**Pergunta provável:** Chamar a action diretamente contorna a tela? **Resposta:** não; a action verifica papel, sessão, schema e setor (AUTH-05, FORM-17).

## Feature: estados de tela

**O que é:** loading, vazio, erro e sucesso dão retorno claro durante a consulta.

**Arquivos:** `components/EsqueletoLista.tsx:4`, `components/EstadoVazio.tsx:11`, `components/TelaDeErro.tsx:12`, `app/(painel)/painel/ocorrencias/error.tsx:5`.

**Como funciona:** `loading.tsx` mostra esqueleto; lista sem dados mostra explicação; falha da API abre mensagem amigável com “Tentar de novo”; lista recebida mostra cartões ou tabela. Páginas públicas com `revalidate` podem conservar a última resposta boa enquanto a API está fora.

**Por que assim:** API-09 a API-11 vêm do **slide de Consumo de APIs, p. 19 a 21 e 23**. O botão usa `retry` conforme a **documentação do Next 16** e as regras locais ROTA-21/API-11.

**Trecho para mostrar:** `components/TelaDeErro.tsx:12`.

**Pergunta provável:** O que acontece se a API cair? **Resposta:** no painel sem cache a fronteira de erro apresenta “Tentar de novo”; dados públicos em cache podem continuar aparecendo.

## Feature: camada de serviço e reuso no back-end

**O que é:** as páginas dependem de funções de domínio, sem montar URLs da API.

**Arquivos:** `lib/api.ts:3`, `lib/ocorrencias.ts:10`, `lib/lanternas.ts:7`, `lib/setores.ts:7`, `lib/usuarios.ts:7`, `.env.example:2`.

**Como funciona:** `API_URL` aponta para o json-server; `lib/<recurso>.ts` centraliza leitura e escrita, checa `res.ok`, valida respostas Zod e declara cache. Na etapa de back-end, o adaptador de `lib/` e o endereço podem ser atualizados sem reescrever telas.

**Por que assim:** API-01, API-02, API-04 e API-06 vêm do **slide de Consumo de APIs, p. 7, 12, 14 e 23**. DEC-04 é **decisão do grupo** para atender ao texto do professor sobre reuso. A senha em texto no `db.json` é limitação declarada da API fake (AUTH-11, **decisão do grupo**).

**Trecho para mostrar:** `lib/ocorrencias.ts:10`.

**Pergunta provável:** Como aproveitar na próxima etapa? **Resposta:** conservar componentes e actions e trocar a integração em `lib/`, ajustando schemas se o contrato da API mudar (DEC-04).

## Feature: estilo e componentes

**O que é:** interface responsiva com componentes reutilizáveis e HTML semântico.

**Arquivos:** `app/(site)/page.tsx:19`, `components/CampoTexto.tsx:17`, `components/BadgeStatus.tsx:1`, `components/MenuNavegacao.tsx:18`, `app/globals.css:1`.

**Como funciona:** classes Tailwind fazem a grade adaptar ao tamanho; campos e badges concentram padrões; links e botões mantêm semântica e foco visível.

**Por que assim:** CSS-03 e CSS-06 vêm do **slide de CSS e Tailwind, p. 11, 12 e 14**. COMP-03 vem do **slide de Props e Estado, p. 3 e 9**; FORM-22 vem do **slide de Formulários, p. 17 e 21**.

**Trecho para mostrar:** `app/(site)/page.tsx:19`.

**Pergunta provável:** Por que não repetir o campo em cada formulário? **Resposta:** `CampoTexto` reúne label, erro acessível e registro do RHF (FORM-22).

## Perguntas gerais

| Pergunta | Resposta curta | Regra e origem |
|---|---|---|
| O enunciado pede middleware; onde está? | No Next 16 chama `proxy.ts`; ele protege `/painel`. | AUTH-01 · Docs Next 16 |
| O cookie pode ser adulterado? | Mudança quebra a assinatura HMAC; cookie inválido vira sessão ausente. | AUTH-03 · Decisão + Docs Next |
| Por que `fetch`, não Axios? | O grupo escolheu `fetch` para dados em Server Components e cache do Next. | DEC-01 · Decisão + slide de Consumo de APIs p. 9 |
| Por que `Link`, não `<a>`? | Navegação interna sem recarga completa. | ROTA-16 · slide de Rotas p. 19 |
| Por que os grupos têm parênteses? | Permitem layouts diferentes sem entrar no endereço. | ROTA-04 · slide de Rotas p. 15 |
| Por que há senhas em texto no `db.json`? | É dado de demonstração da API fake; a API real usará hash. | AUTH-11 · Decisão do grupo |
