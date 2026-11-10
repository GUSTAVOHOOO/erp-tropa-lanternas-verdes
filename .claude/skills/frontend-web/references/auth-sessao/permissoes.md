# O que pode: papel, escopo e CSRF

### AUTH-06: Sem permissão é 403: exigirPapel redireciona para /acesso-negado
**Fonte:** [DECISÃO] página `/acesso-negado` em vez de `forbidden()` + [SLIDE] APIS p. 5 ("403 Sem permissão — explique o bloqueio") + [DOCS] `.../03-api-reference/03-file-conventions/forbidden.md` (`version: experimental`)
**Regra:** Logado sem permissão é diferente de não logado. `exigirPapel(papel)` faz `redirect('/acesso-negado')` quando o papel não bate, e uma resposta 403 da API (API-12) leva ao mesmo lugar. A página explica o bloqueio e oferece um caminho de volta. Não usamos `forbidden()`/`unauthorized()`: seguem experimentais no Next 16.4 e exigem flag.
**✅ Certo:**
```ts
if (usuario.papel !== papel) redirect('/acesso-negado') // [AUTH-06]
```
**❌ Errado:** mandar para `/login` quem já está logado; esconder o botão e deixar a URL aberta; `experimental.authInterrupts` no `next.config.ts`.
**Como verificar:** `rg -n "acesso-negado" lib app` acha `exigirPapel` e a página; `rg -n "authInterrupts|forbidden\(" .` (sem `node_modules`) vazio.
**Nota de versão (Next 16.4):** em rota com `loading.tsx` a resposta começa a ser enviada com status `200`; `notFound()` ou `redirect()` chamados depois entregam o corpo certo (com `noindex` ou `<meta refresh>`), mas o status HTTP fica `200`. Para status exato, a checagem tem de rodar antes do primeiro `Suspense`/`loading.tsx` (ver `loading.md` da doc, seção "Status codes").

### AUTH-07: Escopo por papel: o filtro é aplicado no servidor, e a API é a autoridade
**Fonte:** [DECISÃO] regra de negócio por papel + [DOCS] `authentication.md` ("client-side UI restrictions alone are not sufficient for security"; DTO) + `backend-api` (dono vem do token; recurso alheio responde 404)
**Regra:** Quando o usuário só pode ver parte dos dados (um setor, uma conta), a página decide o filtro a partir do **usuário da sessão**, nunca de um parâmetro da URL. A API aplica o mesmo escopo e responde 404 para recurso alheio: o front trata esse 404 como qualquer outro (API-12). Esconder botões na UI é só conveniência. Os nomes `setor` e `ocorrência` abaixo são ilustração.
**✅ Certo:**
```tsx
const usuario = await verificarSessao()
const setorId = usuario.papel === 'admin' ? filtro.setor : usuario.setorId // [AUTH-07]
const itens = await listarOcorrencias({ setorId, status })
```
**❌ Errado:** buscar tudo e filtrar com `.filter()` no componente cliente; aceitar `?setor=` da URL para quem tem escopo fixo.
**Como verificar:** `rg -n "searchParams" app` e confirme que nenhum filtro de escopo vem direto da URL para usuário restrito; teste com dois usuários de escopos diferentes.

### AUTH-14: Mutação só por Server Action; GET nunca altera dados
**Fonte:** [DOCS] `data-security.md` ("Allowed origins": Server Actions comparam `Origin` e `Host`) + [DECISÃO] cookie `sameSite: 'lax'`
**Regra:** Como o cookie vai sozinho com a requisição, a proteção contra CSRF é: mutações só em Server Actions (o Next recusa origem diferente do host), cookie `sameSite: 'lax'` (AUTH-02) e nenhuma rota `GET` que grave algo. A única exceção é a rota de AUTH-13, que só apaga o cookie inválido do próprio navegador. `serverActions.allowedOrigins` entra só se houver proxy reverso com outro host, com cada origem justificada.
**✅ Certo:** `<form action={excluir}>` com `excluir` como Server Action.
**❌ Errado:** `app/api/excluir/route.ts` com `export async function GET`; `allowedOrigins: ['*']`.
**Como verificar:** `rg -n "export async function GET" app` e confirme que nenhuma escreve nada; `rg -n "allowedOrigins" next.config.ts`.
