# Ambiente validado e monitoramento

### PROD-01: Variáveis de ambiente validadas na subida; sem elas, o servidor não inicia
**Fonte:** [DECISÃO] aprovada + [DOCS] `node_modules/next/dist/docs/01-app/02-guides/instrumentation.md` (`register` roda uma vez e termina antes de o servidor atender) e `.../03-api-reference/03-file-conventions/instrumentation.md` (`NEXT_RUNTIME`)
**Regra:** `lib/env.ts` valida `process.env` com Zod e exporta `env`. Chave obrigatória ausente ou malformada lança erro na subida, com a lista do que falta, em vez de falhar na primeira requisição. `instrumentation.ts` importa `lib/env` dentro de `register`, só no runtime `nodejs`. Nenhuma variável com `NEXT_PUBLIC_` (ela é gravada no bundle em tempo de build). O resto do código importa `env`, nunca `process.env` (API-08). `.env.example` lista as mesmas chaves.
**✅ Certo:**
```ts
// lib/env.ts
import * as z from 'zod'
export const env = z.object({
  API_URL: z.url(),
  SITE_URL: z.url(),
  SENTRY_DSN: z.url().optional(),
}).parse(process.env) // [PROD-01] lança na importação
```
```ts
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') await import('./lib/env')
}
```
**❌ Errado:** `process.env.API_URL!` espalhado; valor padrão para segredo ou URL de produção; descobrir a falta da variável só quando o usuário clica.
**Como verificar:** apague `API_URL` do ambiente e rode `npm run start`: o processo deve encerrar com a mensagem do Zod; `rg -n "process\.env" app components lib` acha só `lib/env.ts`.

### PROD-05: Monitoramento de erros: onRequestError e global-error; Sentry é opcional
**Fonte:** [DECISÃO] aprovada (Sentry como opção) + [DOCS] `.../03-api-reference/03-file-conventions/instrumentation.md` (`onRequestError`) e `error.md` (`global-error`)
**Regra:** Sem ferramenta, `onRequestError` em `instrumentation.ts` escreve uma linha de log estruturada (rota, método, `digest`) e `global-error.tsx` mostra a mensagem humana (API-13). Com Sentry, instale `@sentry/nextjs` (STACK-06) seguindo a documentação da versão instalada, mantendo: DSN em `env` (PROD-01); `onRequestError` ligado ao Sentry; `sendDefaultPii` desligado; token, cookie e `Authorization` fora dos eventos (AUTH-12); `ApiError` 4xx esperado (401, 404, 409, 422) **não** vira evento, 5xx e schema inválido (API-04) viram. Erro de monitoramento nunca derruba a requisição.
**✅ Certo:**
```ts
// instrumentation.ts (sem Sentry)
export function onRequestError(err: unknown, request: { path: string; method: string }) {
  console.error(JSON.stringify({ nivel: 'erro', rota: request.path, metodo: request.method, erro: String(err) })) // [PROD-05]
}
```
**❌ Errado:** `catch (e) { console.log(e) }` espalhado como única observabilidade; mandar o corpo da requisição de login ao Sentry; capturar cada 404.
**Como verificar:** provoque um erro 500 em desenvolvimento e confira o log (ou o evento no Sentry) com rota e sem token; `rg -n "global-error" app` acha o arquivo.
