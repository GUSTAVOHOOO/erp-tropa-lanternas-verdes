# Erros da API no front

### API-12: Cada status da API tem um destino no front
**Fonte:** [SLIDE] APIS p. 5 (tabela de status: "401 Não autenticado — mande ao login"; "403 Sem permissão — explique o bloqueio"; "404 Não encontrado — notFound()"; "500/503 tentar de novo"), p. 21, p. 22 ("Relance o que você não sabe tratar. Engolir o erro com um catch vazio esconde o problema") + [DECISÃO] estende com 400/409/422/429; status definidos na `backend-api` (`SKILL.md`, "Status")
**Regra:** Leitura em página ou action, sem exceção:

| Status | Significa | No front |
|---|---|---|
| 400 | formato inválido | bug de contrato com o schema do front: mensagem geral, `console.error`, monitoramento (PROD-05) |
| 401 | token vencido ou inválido | `redirect('/sessao-expirada')` (AUTH-13); no login, "e-mail ou senha incorretos" (AUTH-08) |
| 403 | sem permissão | `redirect('/acesso-negado')` (AUTH-06) |
| 404 | não existe (ou é de outro dono) | leitura: `notFound()`; escrita: "não existe mais" |
| 409 / 422 | conflito com o estado / regra violada | mensagem pelo `codigo` no campo ou geral (API-18) |
| 429 | limite de tentativas | "Muitas tentativas, aguarde" (respeite `Retry-After` se vier); sem repetir sozinho |
| 5xx, rede, timeout | falha nossa ou de infra | leitura: relance, vai para `error.tsx` com `retry` (API-11); escrita: mensagem geral (API-13) |

Nunca `catch {}` vazio.
**✅ Certo:**
```ts
// lib/tratar-erro.ts: uma função para toda página de leitura
export function tratarErroDeLeitura(e: unknown): never {
  if (e instanceof ApiError) {
    if (e.status === 404) notFound() // [API-12]
    if (e.status === 401) redirect('/sessao-expirada')
    if (e.status === 403) redirect('/acesso-negado')
  }
  throw e
}
```
```tsx
const ocorrencia = await buscarOcorrencia(id).catch(tratarErroDeLeitura)
```
**❌ Errado:** `catch (e) {}` ou `catch (e) { return null }`; tratar 404 e 401 do mesmo jeito; repetir 429 em laço.
**Como verificar:** `rg -n -U "catch\s*(\([^)]*\))?\s*\{\s*\}" app lib` vazio; páginas `[id]` usam `tratarErroDeLeitura` ou bloco equivalente.

### API-13: Mensagem para humanos; detalhe técnico só no log
**Fonte:** [SLIDE] APIS p. 21 ("Mensagem para humanos: 'Sem conexão. Verifique a internet e tente de novo.' em vez de 'TypeError: Failed to fetch'"; "Detalhes ficam no log"), p. 23 (armadilha "Mostrar a mensagem técnica ao usuário") + [DECISÃO] vale para 5xx, rede, 401, 403 e 404
**Regra:** O texto exibido é escrito por nós, em português, e escolhido pelo `status` ou pelo `codigo` (API-18). `e.message` de erro 5xx, de rede ou de schema, e a stack, nunca vão para a tela. Na action: `console.error(e)` e devolver a mensagem geral. A `mensagem` que a API manda em 409/422 foi escrita para pessoas (`backend-api`): só entra na tela quando o `codigo` não está no dicionário do front, e só em 4xx.
**✅ Certo:**
```ts
try {
  await salvarOcorrencia(parsed.data)
} catch (e) {
  console.error(e)
  return resultadoDeErro(e) // [API-13][API-18]
}
redirect('/painel/ocorrencias') // fora do try (ROTA-20)
```
**❌ Errado:** `return { ok: false, erro: String(e) }`; exibir "Erro interno" bruto ou `TypeError: fetch failed`.
**Como verificar:** `rg -n "erro: (String\(|e\.message|error\.message)" app lib` vazio.

### API-18: Código estável da API vira erro de campo ou erro geral
**Fonte:** [DECISÃO] aprovada: códigos estáveis como `SEM_SALDO` (`backend-api`, `references/http-erros.md`: "`mensagem` vai para pessoas e `codigo` é para o front tratar sem comparar textos") + [SLIDE] FORMS p. 19 (`setError` com resposta do servidor)
**Regra:** Um arquivo `lib/erros-api.ts` tem o dicionário `codigo` para mensagem em português e, para os códigos que pertencem a um campo (ex.: e-mail duplicado), o nome do campo. A função `resultadoDeErro(e): ResultadoAcao` converte `ApiError` em `{ ok: false, errors: { campo: [msg] } }` (vai para `setError` no campo: FORM-19) ou `{ ok: false, erro: msg }` (vai para `errors.root`). Código desconhecido em 4xx usa a `mensagem` da API; todo o resto, a mensagem geral (API-13). `detalhes` (400) é lista de textos sem campo: mostre como lista geral ou trate como bug de contrato. Combine códigos novos com quem mantém a API; o front não inventa.
**✅ Certo:**
```ts
const CAMPO_POR_CODIGO: Record<string, string> = { EMAIL_DUPLICADO: 'email' } // ilustração
const TEXTO_POR_CODIGO: Record<string, string> = {
  SEM_SALDO: 'Não há saldo suficiente para esta operação.',
  EMAIL_DUPLICADO: 'Este e-mail já está cadastrado.',
}

export function resultadoDeErro(e: unknown): ResultadoAcao {
  if (!(e instanceof ApiError)) return { ok: false, erro: MENSAGEM_GERAL }
  const texto = e.codigo && TEXTO_POR_CODIGO[e.codigo] // [API-18]
  const campo = e.codigo && CAMPO_POR_CODIGO[e.codigo]
  if (texto && campo) return { ok: false, errors: { [campo]: [texto] } }
  if (texto) return { ok: false, erro: texto }
  if (e.status >= 400 && e.status < 500 && e.status !== 401 && e.status !== 403) return { ok: false, erro: e.message }
  return { ok: false, erro: MENSAGEM_GERAL }
}
```
**❌ Errado:** `if (e.message.includes('saldo'))`; um `switch` de códigos em cada action; mostrar o `codigo` ao usuário.
**Como verificar:** `rg -n "SEM_SALDO|codigo ===" app components` vazio (códigos só em `lib/erros-api.ts`); teste de unidade de `resultadoDeErro` com `ApiError` de cada tipo.
