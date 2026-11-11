# Auditoria: camada de acesso à API do front vs contrato e back real

- **Data:** 2026-11-11
- **Repositório:** `C:\Users\Windows 11\Documents\Desenvolvimento web\TrabalhoWeb`, branch `integracao/back-front`
- **Método:** somente leitura. Nenhum arquivo do repositório foi editado e nenhum servidor foi iniciado. Não foram rodados testes, lint, build, Vitest, Jest nem o back. Python não existe no ambiente, então `validar.py` e `--conferir-hash` não foram executados. O OpenAPI foi lido com Node.
- **Convenção de estado:**
  - **CONSOME CONTRATO REAL:** rota, método, query, corpo, auth, envelope e erros corretos.
  - **PARCIAL:** rota, método e auth corretos, mas envelope, schema, query ou tratamento de erro errados.
  - **ESTILO ANTIGO:** usa a forma do json-server (`setorId`, `_sort`, `_order`, PATCH base como atalho, corpo com campos extras).
  - **NÃO CONSOME:** não existe chamada no front.

---

## 0. Resumo

1. **Nenhuma das 30 operações é consumida de forma correta.** O resultado é 0 em CONSOME CONTRATO REAL, 3 PARCIAL, 5 ESTILO ANTIGO e 22 NÃO CONSOME.
2. **O front inteiro fala com o json-server.** São 8 pontos de `fetch`, todos em `lib/`. Nenhum envia `Authorization`, nenhum desembrulha `{sucesso, dados}`, nenhum usa `dados.itens/meta`, e os parâmetros são `setorId`, `_sort`, `_order`.
3. **Contra o back real, o front não consegue nem entrar.** O login chama `GET /usuarios?email=` sem token. O `JwtGuard` global (`backend/src/auth/auth.module.ts:43`) responde 401, e a action cai na mensagem genérica de "API não responde". Mesmo com token, `email` não é filtro do contrato.
4. **Listas e criações também quebram.** `setorId`, `_sort` e `_order` são campos desconhecidos para `forbidNonWhitelisted` (`backend/src/comum/configurar-http.ts:16`), então a API responde 400. Criação envia `status`, `responsavelId`, `resolucao`, `criadaPor` e `criadaEm`, todos fora de `CriarOcorrenciaDto`.
5. **Status e atribuição usam o PATCH base.** Eles deveriam ir para `/status` e `/responsavel`. Além disso, `resolucao: null` é recusado pela API (`backend/src/ocorrencias/dto/status-ocorrencia.dto.ts:8-11`, `IsString` sem permitir null).
6. **Os schemas zod não batem com o contrato.** O front exige `numero` em Setor (que não existe), `nome` em Lanterna (o contrato usa `codinome`), `senha` em Usuário (proibido pelo contrato) e `criadaPor` em Ocorrência (o contrato usa `criadaPorId`).
7. **Erros da API não são mapeados.** Todo erro de action vira `MENSAGEM_ERRO_API`, que diz "verifique se a API está ligada". Isso também vale para 409 e 422, que são regras de negócio.
8. **Risco de loop de redirect.** Um 401 em página de detalhe manda para `/login` sem apagar o cookie, e o `proxy.ts` devolve para `/painel`.
9. **Sessão atual é a que o ADR 0001 proíbe.** O cookie HMAC é fabricado pelo front (`lib/sessao.ts`), com papel e setor congelados por 8 horas. Não há JWT.
10. **Segredo público por padrão.** `.env.example:4` versiona um `SESSION_SECRET`, e `scripts/iniciar.sh:24-35` copia o arquivo sem trocar esse valor.
11. **Porta 3001 em conflito.** O json-server e o back usam a mesma porta por padrão. Nada no front distingue os dois.
12. **Documentação desatualizada.** README, `docs/PLANO.md`, `docs/README.md` e `docs/agents/MAPA.md` dizem que o back "não existe", mas `backend/` tem código, testes e README próprios.

---

## 1. Inventário das chamadas HTTP do front

Todas as chamadas usam `urlDaApi` (`lib/api.ts:2-10`), que monta a URL a partir de `API_URL` e ignora filtros vazios. Nenhuma passa por cliente único. Nenhuma envia `Authorization`. Nenhum componente cliente importa esses módulos. Os imports são só de páginas (RSC) e Server Actions.

| # | Arquivo:linha | Método | Rota e query | Corpo | Auth | Tratamento da resposta | Operação do contrato |
|---|---|---|---|---|---|---|---|
| 1 | `lib/ocorrencias.ts:18` (URL em 11-17) | GET | `/ocorrencias?setorId=&status=&gravidade=&_sort=criadaEm&_order=desc` | — | nenhuma | `!res.ok` lança `ApiError(status)`; `z.array(ocorrenciaSchema)` direto, sem envelope; `cache: 'no-store'` | 17 |
| 2 | `lib/ocorrencias.ts:25` | GET | `/ocorrencias/{id}` | — | nenhuma | 404 vira `null`; outro erro lança; `ocorrenciaSchema.parse` direto | 20 |
| 3 | `lib/ocorrencias.ts:33` (chamado de `ocorrencias/actions.ts:27-35`) | POST | `/ocorrencias` | `{titulo, descricao, planeta, setorId, gravidade, envolvidos, status, responsavelId, resolucao, criadaPor, criadaEm}` | nenhuma | `!res.ok` lança; `ocorrenciaSchema.parse` direto | 18 |
| 4 | `lib/ocorrencias.ts:45` (chamado de `ocorrencias/actions.ts:59` e `:83`) | PATCH | `/ocorrencias/{id}` | Partial com `status`/`resolucao` ou `responsavelId` | nenhuma | igual ao 3 | 21 (e deveria ser 23 e 24) |
| 5 | `lib/lanternas.ts:8-9` | GET | `/lanternas?setorId=&_sort=nome` | — | nenhuma | `next: { revalidate: 60 }`; `z.array(lanternaSchema)` direto | 12 |
| 6 | `lib/lanternas.ts:16` | GET | `/lanternas/{id}` | — | nenhuma | `revalidate: 60`; 404 vira `null`; schema direto | 14 |
| 7 | `lib/setores.ts:8` | GET | `/setores?_sort=numero` | — | nenhuma | `revalidate: 60`; `z.array(setorSchema)` direto | 7 |
| 8 | `lib/usuarios.ts:11-12` (chamado de `app/(site)/login/actions.ts:18`) | GET | `/usuarios?email=` | — | nenhuma | `cache: 'no-store'`; `usuarios[0]` com `senha`; comparação em texto puro em `login/actions.ts:24` | 4 (usado como login) |

Não há outras chamadas. Não existe `POST /auth/login`, `POST /auth/cadastro`, `GET /auth/me`, `/dashboard`, `/saude`, nem qualquer uso de `Authorization`, `localStorage` ou `sessionStorage` (grep sobre `app/`, `lib/` e `components/`).

**Dados de demonstração fora das telas reais.** `components/oanet/{CentralOa,TelasOa,ComponentesOa,LaboratorioOa}.tsx` importam `dados-demo.ts`. Esses componentes são usados só pelo laboratório. Nenhuma página real importa dados de demonstração.

---

## 2. Tabela das 30 operações

Os 30 `operationId` foram extraídos do `docs/contratos/openapi.json` (versão 1.0.0). Os 30 batem com `docs/backend/API.md`. O SHA-256 do OpenAPI (LF) é `1836fa15…7166`, igual ao registro complementar do G-1.

| # | Operação (método, rota) | Chamada no front (arquivo:linha) | Estado | Divergências concretas |
|---|---|---|---|---|
| 1 | POST /auth/cadastro (`cadastrarUsuario`) | nenhuma; não existe `app/(site)/cadastro` | NÃO CONSOME | Plano FE-02 prevê a página e a action; ainda não existem. |
| 2 | POST /auth/login (`entrar`) | nenhuma. O login usa a op 4 (`login/actions.ts:18`) | NÃO CONSOME | O login não chama o endpoint de JWT; compara senha em texto. |
| 3 | GET /auth/me (`consultarUsuarioAtual`) | nenhuma. `lib/dal.ts:30-34` não consulta a API | NÃO CONSOME | Papel e setor vêm do cookie HMAC assinado no login (`lib/sessao.ts:28-31`). Viola RN-06. |
| 4 | GET /usuarios (`listarUsuarios`) | `lib/usuarios.ts:10-16` | ESTILO ANTIGO | Filtro `email` não existe no contrato (`FiltroUsuariosDto` só tem busca, paginação, ordenar e ordem). Sem Bearer: a rota é só para Guardião, então 401 (`PapeisGuard` e `JwtGuard`). Resposta exige `senha` (`schemas/usuario.ts:11`), que o contrato proíbe (`Usuario` não tem senha). |
| 5 | PATCH /usuarios/:id/papel (`alterarPapel`) | nenhuma | NÃO CONSOME | Sem UI de gestão (FE-08). |
| 6 | PATCH /usuarios/:id/lanterna (`vincularLanterna`) | nenhuma | NÃO CONSOME | Sem UI de gestão (FE-08). |
| 7 | GET /setores (`listarSetores`) | `lib/setores.ts:7-11` | PARCIAL | Rota, método e acesso público estão certos. Mas `_sort=numero` não é parâmetro (o controller não tem `@Query`, então é ignorado), a resposta não é desembrulhada (`dados` é array, `setores.ts:10`), e `setorSchema` exige `numero` (`schemas/setor.ts:6`), que o back não devolve (`setor-resposta.dto.ts` só tem id, nome e descricao). `id` é coerce string, mas o contrato usa inteiro. |
| 8 | POST /setores (`criarSetor`) | nenhuma | NÃO CONSOME | — |
| 9 | GET /setores/{id} (`consultarSetor`) | nenhuma. Busca de setor usa a lista inteira (`setor.find`) | NÃO CONSOME | Sem uso da rota de detalhe. |
| 10 | PATCH /setores/{id} (`editarSetor`) | nenhuma | NÃO CONSOME | — |
| 11 | DELETE /setores/{id} (`excluirSetor`) | nenhuma | NÃO CONSOME | — |
| 12 | GET /lanternas (`listarLanternas`) | `lib/lanternas.ts:7-12`; chamado por `lanternas/page.tsx:21` e `atribuir/page.tsx:30` | ESTILO ANTIGO | `setorId` e `_sort` são desconhecidos para `FiltroLanternasDto`, então 400 `DADOS_INVALIDOS` (o contrato usa `setor`, `ordenar` com `codinome|setor|anoIngresso`, `ordem`). Sem `dados.itens/meta`. `lanternaSchema` (`schemas/lanterna.ts:13-20`) exige `nome`, `especie` e `planetaNatal` como string, mas o back devolve `codinome` e pode devolver null. |
| 13 | POST /lanternas (`criarLanterna`) | nenhuma | NÃO CONSOME | — |
| 14 | GET /lanternas/{id} (`consultarFichaLanterna`) | `lib/lanternas.ts:15-20`; chamado por `ocorrencias/actions.ts:79` e `lanternas/[id]/page.tsx:29` | PARCIAL | URL, método, acesso público e 404→null estão certos. Sem envelope. Schema não bate (`codinome`, nulls). A validação do Guardião em `ocorrencias/actions.ts:79` usa cache de 60 s. |
| 15 | PATCH /lanternas/{id} (`editarLanterna`) | nenhuma | NÃO CONSOME | — |
| 16 | PATCH /lanternas/{id}/status (`alterarStatusLanterna`) | nenhuma | NÃO CONSOME | — |
| 17 | GET /ocorrencias (`listarOcorrencias`) | `lib/ocorrencias.ts:10-21`; chamado por `painel/page.tsx:21` e `ocorrencias/page.tsx:27` | ESTILO ANTIGO | `setorId`, `_sort` e `_order` são desconhecidos para `FiltroOcorrenciasDto` (400). Sem Bearer (401). Não envia `pagina` nem `limite`, então só vem a 1ª página de 20. O Resumo calcula contagens sobre essa página (`painel/page.tsx:20-24`). `ocorrenciaSchema` exige `criadaPor` (o contrato usa `criadaPorId`) e não lê `prazoEm`, `vencida` e `resolvidaEm`. |
| 18 | POST /ocorrencias (`criarOcorrencia`) | `lib/ocorrencias.ts:32-41`; chamado por `ocorrencias/actions.ts:27-35` | ESTILO ANTIGO | Corpo traz `status`, `responsavelId`, `resolucao`, `criadaPor` e `criadaEm`, que não existem em `CriarOcorrenciaDto` (400). Lanterna envia `setorId` (`actions.ts:20`), e o back recusa (`ocorrencias.service.ts:67`). Sem Bearer (401). Hoje o 400 impede a gravação. Se o corpo fosse aceito, a resposta viria em envelope e `ocorrenciaSchema.parse` falharia depois da gravação (ver R6). |
| 19 | GET /ocorrencias/minha-fila (`listarMinhaFila`) | nenhuma | NÃO CONSOME | Aditivo, FE-07b. |
| 20 | GET /ocorrencias/{id} (`consultarOcorrencia`) | `lib/ocorrencias.ts:24-29`; chamado por `[id]/page.tsx:29`, `atribuir/page.tsx:23` e `actions.ts:53,77` | PARCIAL | 404→null está certo. Sem Bearer. Sem envelope. Schema não bate com o contrato. Id não-UUID devolve 400, que vira erro de boundary, não 404. |
| 21 | PATCH /ocorrencias/{id} (`editarOcorrencia`) | `lib/ocorrencias.ts:44-53`; usado por `actions.ts:59` (status) e `actions.ts:83` (responsável) | ESTILO ANTIGO | PATCH base usado como atalho. `status`, `resolucao` e `responsavelId` não estão em `EditarOcorrenciaDto` (400). `resolucao: null` (`actions.ts:59`) é recusado (`StatusOcorrenciaDto`: null não é aceito). O contrato só aceita titulo, descricao, planeta, gravidade e envolvidos neste PATCH. |
| 22 | DELETE /ocorrencias/{id} (`excluirOcorrencia`) | nenhuma | NÃO CONSOME | Sem UI de exclusão (FE-05). |
| 23 | PATCH /ocorrencias/{id}/status (`alterarStatusOcorrencia`) | nenhuma. A mudança de status vai para a op 21 (`actions.ts:59`) | NÃO CONSOME | Rota certa não é usada. Lanterna também recebe a opção "aberta" em `FormStatus.tsx`, e a API responde 403 para reabrir. |
| 24 | PATCH /ocorrencias/{id}/responsavel (`atribuirResponsavel`) | nenhuma. A atribuição vai para a op 21 (`actions.ts:83`) | NÃO CONSOME | Rota certa não é usada. Liberar responsável (`null`) não existe no front. |
| 25 | GET /ocorrencias/{id}/eventos (`listarEventos`) | nenhuma | NÃO CONSOME | FE-06 (aditivo). |
| 26 | GET /ocorrencias/{id}/comentarios (`listarComentarios`) | nenhuma | NÃO CONSOME | FE-06 (aditivo). |
| 27 | POST /ocorrencias/{id}/comentarios (`criarComentario`) | nenhuma | NÃO CONSOME | FE-06 (aditivo). |
| 28 | DELETE /comentarios/{id} (`excluirComentario`) | nenhuma | NÃO CONSOME | FE-06 (aditivo). |
| 29 | GET /dashboard (`consultarDashboard`) | nenhuma. O Resumo monta contagens a partir de listas (`painel/page.tsx:20-24`) | NÃO CONSOME | FE-07a. Contagens hoje estão erradas com mais de 20 registros. |
| 30 | GET /saude (`consultarSaude`) | nenhuma | NÃO CONSOME | Seria o jeito de distinguir json-server de back na porta 3001. O json-server não tem `/saude`. |

**Totais:** 0 CONSOME CONTRATO REAL · 3 PARCIAL (7, 14, 20) · 5 ESTILO ANTIGO (4, 12, 17, 18, 21) · 22 NÃO CONSOME.

---

## 3. Sessão, login e proteção de rotas

**Como o front guarda a sessão hoje.**
- `entrar` (`app/(site)/login/actions.ts:12-35`) busca o usuário por e-mail em `GET /usuarios`, compara a senha em texto (`:24`) e chama `criarSessao` (`:28-34`).
- `criarSessao` (`lib/dal.ts:8-18`) grava o cookie `sessao` com um JSON `{id, nome, papel, setorId, lanternaId, expiraEm}` assinado por HMAC-SHA256 com `SESSION_SECRET` (`lib/sessao.ts:21-31`). O cookie é `httpOnly` (`dal.ts:12`), `sameSite: 'lax'` (`:14`), `path: '/'`, e `secure` só em produção (`:13`). Expira em 8 h (`lib/sessao.ts:8`, `dal.ts:16`).
- Não há JWT. Não há `expiresIn` da API. Não há `/auth/me`. O papel e o setor são os valores de login (ADR 0001 proíbe: "o front não deve fabricar sessão").
- Não há token no navegador. Nenhum `localStorage`/`sessionStorage`. Isso vale hoje porque não há token.

**Expiração.** `decodificarSessao` recusa cookie com `expiraEm < agora` (`lib/sessao.ts:45`). Não há renovação. Não há tratamento de 401 da API para limpar o cookie.

**Logout.** `sair` (`app/(painel)/actions.ts:7-11`) chama `verificarSessao`, apaga o cookie e redireciona. Não chama a API. Em JWT stateless isso é aceitável, mas não há revogação antes das 8 h.

**Proteção por rota.**
- `proxy.ts:6-19` cobre `/painel/:path*` e `/login`. Confere só presença e validade do cookie HMAC. Sem checagem de papel. Quem tem cookie válido entra em `/login` e é redirecionado para `/painel` (`:13-15`).
- `verificarSessao` (`dal.ts:30-34`) é chamada no topo das páginas e actions do painel.
- `exigirPapel('guardiao')` (`dal.ts:37-41`) protege `atribuir/page.tsx:19` e `atribuirResponsavel` (`ocorrencias/actions.ts:71`).
- `[id]/page.tsx:34` manda para `/acesso-negado` quando o setor da ocorrência não é do usuário. O contrato pede 404 (`API.md:197`), e esse caminho local não deveria existir.
- Visitante: `(site)` só lê a sessão (`app/(site)/layout.tsx:19`). Não há cadastro.
- Papel na UI: `painel/ocorrencias/[id]/page.tsx:44` esconde "Atribuir responsável" para não-Guardião. O link do painel aparece para todos (`(painel)/layout.tsx:6-10`).
- O back exige papel em cada rota (`@Papeis` e `JwtGuard` global). O front não envia papel nem token, então toda chamada protegida volta 401 contra o back real.

**O que o back exige e o front não faz.**
- Bearer em toda rota não pública (`JwtGuard`, `auth.module.ts:43`).
- Recarga de papel e setor do banco a cada requisição (RN-06, `REGRAS-DE-NEGOCIO.md:21`). O front congela os valores por 8 h.
- Token recusado (401) deve limpar a sessão e ir para login sem loop (INTEGRACAO G2).
- 429 no login (throttle do back, `backend/src/auth/auth.controller.ts:21`).

---

## 4. Tratamento de erros

| Código | Onde é tratado | Comportamento atual | Lacuna |
|---|---|---|---|
| 400 DADOS_INVALIDOS (com `detalhes`) | `lib/api-error.ts:2-7` guarda só `status` | Actions caem em `MENSAGEM_ERRO_API` (`resultado-acao.ts:9-10`). Páginas caem no `error.tsx`. | Sem `codigo` nem `detalhes` no `ApiError`. Nada leva `campo` para o formulário. `lib/erros-formulario.ts:5-14` só recebe erros zod locais. |
| 401 NAO_AUTENTICADO | `lib/erro-detalhe.ts:8` | `redirect('/login')` sem apagar o cookie. `proxy.ts:13-15` manda de volta para `/painel`. | **Loop de redirect.** Não existe `/sessao-expirada` (AUTH-13). Actions mostram mensagem genérica. |
| 401 CREDENCIAIS_INVALIDAS | `login/actions.ts:19-22` | Não é chamado `POST /auth/login`. O 401 de `GET /usuarios` vira mensagem de API indisponível, não "credenciais inválidas". | — |
| 403 SEM_PERMISSAO | `lib/erro-detalhe.ts:9` | Páginas redirecionam para `/acesso-negado`. Actions dão mensagem genérica. | Sem mapeamento por código. |
| 404 NAO_ENCONTRADO | `buscarOcorrencia` e `buscarLanterna` devolvem `null`; páginas chamam `notFound()` (`[id]/page.tsx:33`, `atribuir/page.tsx:27`, `lanternas/[id]/page.tsx:33`) | Correto para detalhe. | Em PATCH, 404 vira mensagem genérica. Em lista, 404 vira `error.tsx`. |
| 409 (11 códigos) | Nenhum | Actions dão `MENSAGEM_ERRO_API`: "Verifique se a API está ligada". | Erro de regra de negócio é mostrado como API fora do ar. Sem mapeamento de códigos (API-18 do plano). |
| 422 (9 códigos) | Nenhum | Mesmo caso do 409. | `SEM_RESPONSAVEL`, `RESOLUCAO_OBRIGATORIA` e similares somem. |
| 429 MUITAS_TENTATIVAS | Nenhum | Mensagem genérica no login. | Sem espera manual nem mensagem própria. |
| 500 ERRO_INTERNO | Actions e páginas | Mensagem genérica (correto). | — |
| Falha de parse (zod) | Mesmo `try` das actions | Mesmo `MENSAGEM_ERRO_API`. | **Erro falso depois de sucesso.** Em POST/PATCH o servidor já gravou (`ocorrencias/actions.ts:27-39`, `:59-63`, `:83-87`). Retry pode duplicar criação quando o envelope for corrigido. |
| Id malformado (400 do back) | `[id]/page.tsx:31`, `lanternas/[id]/page.tsx:31` | `tratarErroDetalhe` relança. Vira `error.tsx`. | Plano FE-03/FE-04 diz "ID ausente dá 404". Id inválido precisa virar 404 ou validação antes da chamada. |
| Rede | `try` das actions; páginas sem `try` | Mensagem genérica nas actions; `error.tsx` nas páginas. | — |

**Pontos de `console.error`:** `login/actions.ts:20`, `ocorrencias/actions.ts:37`, `:61`, `:85`. Não verifiquei se mensagens de `ZodError` incluem valores do usuário (NÃO VERIFICADO).

---

## 5. Lista priorizada do que muda no front

### P0: bloqueia a ligação com o back real

1. **`lib/api.ts` e novo cliente único (server-only).**
   Adicionar `Authorization: Bearer` a partir do cookie httpOnly. Desembrulhar `{sucesso, dados}`. Desembrulhar `dados.itens` e `dados.meta` nas listas. Tratar 204 sem JSON. Retornar `ApiError` com `status`, `codigo` e `detalhes` (`lib/api-error.ts`). Remover `_sort`, `_order` e os filtros de json-server. Ref. FE-01.
2. **Login: `app/(site)/login/actions.ts:18-34` e `lib/usuarios.ts` (remover).**
   Chamar `POST /auth/login` com corpo `LoginEntrada`. Gravar `dados.token` em cookie httpOnly com validade de `expiresIn`. Nunca devolver o token em `ResultadoAcao`. Remover a comparação de senha (`:24`).
3. **Sessão: `lib/dal.ts:8-34`, `lib/sessao.ts` (remover), `proxy.ts:3-16`.**
   `verificarSessao` chama `GET /auth/me` (RN-06). Papel e setor vêm da resposta. `proxy.ts` só confere presença do cookie. `setorParaFiltro` e `podeAcessarSetor` migram para `lib/escopo.ts`. Ref. FE-02.
4. **`lib/ocorrencias.ts:10-53`.**
   - `listarOcorrencias`: `setor`, `status`, `gravidade`, `responsavel`, `vencida`, `busca`, `ordenar`, `ordem`, `pagina`, `limite`, com envelope.
   - `criarOcorrencia`: só campos de `CriarOcorrenciaDto`. `setorId` só para Guardião.
   - Novas funções: `alterarStatus` → `PATCH /:id/status`; `atribuirResponsavel` → `PATCH /:id/responsavel`.
   - `PATCH /:id` só para os campos de `OcorrenciaEdicao`.
   - Ref. FE-04 e FE-05.
5. **`app/(painel)/painel/ocorrencias/actions.ts:15-91`.**
   - `registrarOcorrencia` (`:27-35`): remover `status`, `responsavelId`, `resolucao`, `criadaPor`, `criadaEm`. Não enviar `setorId` para Lanterna (`:20`).
   - `atualizarStatus` (`:59`): usar `/status`, omitir `resolucao` quando não for `resolvida`, nunca enviar null.
   - `atribuirResponsavel` (`:83`): usar `/responsavel`.
   - Mapear 409 e 422 por código.
   - Não parsear o corpo antes de confirmar sucesso.
6. **`lib/lanternas.ts:7-20` e `lib/schemas/lanterna.ts`.** Trocar `setorId` por `setor`, `_sort` por `ordenar=codinome`, desembrulhar envelope, schema com `codinome`, `setorId` nullable, sem coerce de null para string. Separar lista (`LanternaLista`) e Ficha (`LanternaFicha`). Ref. FE-03.
7. **`lib/setores.ts:7-11` e `lib/schemas/setor.ts:4-9`.** Remover `_sort`. Desembrulhar `dados` (array). Remover `numero`. `id` inteiro. Ref. FE-03.
8. **`lib/schemas/ocorrencia.ts:21-34`.** `criadaPorId` (UUID), `setorId` inteiro, incluir `prazoEm`, `vencida` e `resolvidaEm`.
9. **`lib/schemas/usuario.ts:7-16`.** Remover `senha`. `lanternaId` e `setorId` nullable. `criadoEm` (ISO).
10. **`app/(painel)/painel/page.tsx:20-24` e `ocorrencias/page.tsx:25-27`.** Contagens do Resumo vêm de `/dashboard` (FE-07a). Listas usam `pagina` e `limite` pela URL (`lib/filtro-ocorrencias.ts` precisa de `responsavel`, `vencida`, `busca`, `ordenar`, `pagina` e `limite`).
11. **Porta 3001 e `scripts/iniciar.sh:48-53, 69`, `package.json:13`.** Escolher uma porta para cada processo. Antes de usar o back, validar com `GET /saude`.

### P1: segurança e tratamento de erro

12. **Loop de redirect: `lib/erro-detalhe.ts:8`.** Trocar `redirect('/login')` por Route Handler que apaga o cookie (AUTH-13, `/sessao-expirada`). Sem isso, o `proxy.ts:13-15` gera loop.
13. **Outro setor: `app/(painel)/painel/ocorrencias/[id]/page.tsx:34`.** Remover o `redirect('/acesso-negado')`. A API responde 404 (`API.md:197`), e `buscarOcorrencia` já devolve `null`.
14. **`.env.example:4` e `scripts/iniciar.sh:24-27, 35`.** O valor de `SESSION_SECRET` versionado não é o placeholder, então `iniciar.sh` não o troca quando cria `.env.local`. Trocar o valor versionado, ou gerar sempre, e remover `SESSION_SECRET` quando o HMAC sair. Invalidar cookies antigos (INTEGRACAO §8).
15. **`lib/resultado-acao.ts:9-10` e `lib/erros-formulario.ts:5-14`.** Mensagem por código. `detalhes` do 400 vão para os campos. 422 e 409 viram erro geral com texto próprio. Nunca "verifique se a API está ligada" quando a API respondeu.
16. **Cache de 60 s em `lib/lanternas.ts:9,16` e `lib/setores.ts:8`.** `buscarLanterna` é usada na validação do Guardião (`actions.ts:79`). Trocar por `no-store` ou usar tags. Verificar o comportamento de `revalidatePath` com `fetch` sem tag (NÃO VERIFICADO no guia local do Next).
17. **`next.config.ts` (sem headers).** Headers e CSP (FE-00).
18. **Cadastro.** Criar `app/(site)/cadastro` com `GET /setores` no servidor (FE-02). Hoje não existe.

### P2: testes, configuração e documentação

19. **Testes ancorados no formato antigo.** `__tests__/lib/servicos.test.ts` (importa `db.json` e assere `_sort`/`setorId`), `__tests__/lib/schemas.test.ts`, `__tests__/acoes/login.test.ts` (mocka `lib/usuarios` com senha), `__tests__/acoes/ocorrencias.test.ts`, `__tests__/acoes/status-atribuicao.test.ts`, `__tests__/configuracao.test.ts`, `__tests__/proxy.test.ts`. Trocar por fixtures do envelope (FE-09).
20. **Remoção do json-server (FE-09).** `package.json:13` (script `api`), `package.json:40` (`json-server`), `db.json`, `scripts/iniciar.sh`.
21. **Documentação de estado.** Itens da seção 6.

### Riscos

- **R1. Colisão de porta e sem handshake.** `API_URL=http://localhost:3001` (`.env.example:2`) é o mesmo endereço para json-server e back. O front não distingue. Mitigação: `GET /saude` no boot.
- **R2. Senha no cliente.** Hoje a API de demonstração devolve senha em texto (`db.json` tem senhas em texto para 3 usuários; não reproduzidas aqui). O front depende disso no login (`lib/usuarios.ts:4-9`).
- **R3. Forja de cookie.** Com `SESSION_SECRET` público (ver item 14), qualquer um forja cookie com `papel: guardiao`. Enquanto o HMAC existir, o risco é real.
- **R4. Papel congelado por 8 h.** Promoção ou rebaixamento não vale até o cookie expirar.
- **R5. Loop de redirect em 401** (item 12).
- **R6. Erro falso após sucesso** em POST e PATCH (seção 4).
- **R7. Cache de 60 s** em validação de lookup (item 16).
- **R8. CORS.** Não é risco hoje. As chamadas são server-to-server, e o `fetch` do Node não aplica CORS. `CORS_ORIGIN` é obrigatório no back (`backend/src/config/ambiente.ts:24`), mas só afeta chamadas feitas pelo navegador.
- **R9. Token no cliente.** Hoje não há token. Quando houver, nunca devolver o JWT em `ResultadoAcao`, props de RSC ou logs. O cookie precisa ser httpOnly.
- **R10. Logs de erro.** Os `console.error` podem expor dados de `ZodError` (NÃO VERIFICADO).
- **R11. Papel sem checagem na API.** O front esconde ações por papel, mas a API decide. Lanterna recebe "aberta" no `FormStatus` e leva 403 sem mapeamento.

---

## 6. Divergências entre documentos que afetam a integração

- **D1. Estado do back.** `README.md:13` diz `backend/` "Documentado, ainda não implementado". `README.md:133` diz "a criar". `docs/PLANO.md:17` diz "NestJS ainda não existe". `docs/README.md:3` diz "Destino: NestJS". `docs/agents/MAPA.md:61` diz "o código virá em `backend/`". Porém `backend/src/`, `backend/test/`, `backend/README.md` e `backend/data/dev.sqlite` existem, e `docs/backend/PLANO-IMPLEMENTACAO.md:15` diz que a entrega técnica está implementada. Commits `af0a6e6` e `d859ce5` trazem o back.
- **D2. Versão do Node.** `package.json:5` e `scripts/iniciar.sh:12-15` exigem Node 26. `backend/README.md` pede `^22.13.0` ou `>=24.11.0`.
- **D3. Porta 3001.** `README.md:64` diz "json-server na porta 3001" e `README.md:76`/`docs/CONTRIBUINDO.md:19` mantêm o mesmo número. `backend/.env.example:1` define `PORT=3001`. `docs/INTEGRACAO.md` §4 pede porta própria por processo, mas `scripts/iniciar.sh:48-53` fixa 3000 e 3001.
- **D4. Acesso a ocorrência de outro setor.** `API.md:197` diz que deve virar 404, e `[id]/page.tsx:34` ainda manda para `/acesso-negado`.
- **D5. ADR 0001 e código.** O ADR diz que o front não cria sessão. `README.md:82` diz que `SESSION_SECRET` some quando o back existir. `lib/sessao.ts` continua em uso. Os documentos tratam o HMAC como "modelo anterior", mas ele é o caminho ativo.
- **D6. Segredo versionado.** `.env.example:4` contém valor real-looking, enquanto `scripts/iniciar.sh:35` só regenera placeholder. A documentação não cita o risco.
- **D7. FE-00 (servidor falso).** `docs/frontend/PLANO-IMPLEMENTACAO.md` (FE-00) prevê `scripts/contrato/servidor.mjs`. Não existe. `scripts/` só tem `iniciar.sh`. Não há evidência de preparação P no front.
- **D8. Setor.** `db.json` tem `numero` em Setor; o contrato (`openapi.json`, `Setor`) não tem. `schemas/setor.ts:6` exige `numero`. `docs/frontend/MIGRACAO.md:41` fala só em `id` numérico. Vale conferir `docs/backend/SEED.md` antes de decidir o que o back deve devolver.
- **D9. Estado da integração.** `docs/INTEGRACAO.md` §3 diz que o Corte 1 é um só, com ativação única. A branch `integracao/back-front` já tem back (`d859ce5`) e front de UI (`1dcc81a`), mas o front ainda fala com json-server na mesma porta. Não encontrei no código nenhuma evidência de gate A; não li os registros de TAREFA, então não afirmo o que foi registrado neles.
- **D10. G-1.** `info.version` do OpenAPI (1.0.0) bate com `versaoContrato` dos cenários (1.0.0). O SHA-256 do OpenAPI bate com o registro complementar. O hash do conjunto de 12 arquivos (`validar.py --hash`) não foi recalculado (NÃO VERIFICADO, sem Python).
- **D11. Cenários.** Os cenários usam `setor` e `ordenar`/`ordem` (conforme o contrato). Nenhum usa `setorId` ou `_sort`. O back tem teste que espera 400 para query desconhecida (`backend/test/dashboard.e2e-spec.ts:249`, com `?campo=1`).

---

## 7. Limites deste relatório

- **Nada foi executado.** Os resultados de "400 para `setorId`", "401 sem Bearer" e "envelope não tratado" vêm da leitura de `configurar-http.ts`, `jwt.guard.ts`, `auth.module.ts` e dos DTOs. Não rodei o back para comprovar.
- **Não rodei testes do front nem do back.** `__tests__/` e `backend/test/` não foram executados.
- **Hash do conjunto G-1** não foi recalculado (depende de Python).
- **Cache do Next com `revalidatePath`** e **conteúdo de logs do `ZodError`** não foram verificados nos guias locais.
- **Segredos.** Não reproduzi valores de `.env.local`, `backend/.env` nem senhas de `db.json`. Só comparei o `SESSION_SECRET` local com o versionado (são diferentes). O valor versionado não foi copiado para este relatório.
- **Não li** os arquivos de `docs/design/`, `docs/research/`, `docs/superpowers/` nem o skill `frontend-web`, que não são fonte para esta camada.
