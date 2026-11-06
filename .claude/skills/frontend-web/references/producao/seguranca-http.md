# Cabeçalhos de segurança e CSP

### PROD-02: Cabeçalhos de segurança no next.config.ts
**Fonte:** [DECISÃO] aprovada + [DOCS] `.../03-api-reference/05-config/01-next-config-js/headers.md`
**Regra:** `headers()` aplica a todas as rotas: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy` desligando o que o app não usa. `Strict-Transport-Security` só quando o site é servido por HTTPS (confirme com quem hospeda). A CSP é outra regra (PROD-03).
**✅ Certo:**
```ts
const cabecalhos = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]
const nextConfig = { async headers() { return [{ source: '/:path*', headers: cabecalhos }] } } // [PROD-02]
```
**❌ Errado:** nenhum cabeçalho; `X-Frame-Options: ALLOWALL`; HSTS em site servido por HTTP.
**Como verificar:** `npm run build && npm run start`, depois `curl -sI http://localhost:3000/ | rg -i "x-content-type|referrer-policy|x-frame"` mostra os três.

### PROD-03: CSP com nonce, primeiro em modo relatório
**Fonte:** [DECISÃO] aprovada + [DOCS] `.../02-guides/content-security-policy.md` (nonce gerado no Proxy; exige renderização dinâmica)
**Regra:** Gere um nonce por requisição no `proxy.ts` e envie `Content-Security-Policy` com `default-src 'self'`, `script-src 'self' 'nonce-…' 'strict-dynamic'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`. Como o navegador nunca chama a API (AUTH-12), `connect-src` fica em `'self'`. `'unsafe-eval'` só em desenvolvimento. Nonce obriga renderização dinâmica; páginas autenticadas já são dinâmicas (leem cookie), as públicas deixam de ser estáticas. Ative antes como `Content-Security-Policy-Report-Only`, corrija o que ela acusar no console, e só então imponha. O proxy de AUTH-01 e a CSP vivem no mesmo arquivo.
**✅ Certo:** use o `proxy.ts` do guia, com `isDev` para `'unsafe-eval'`, e passe `x-nonce` por cabeçalho de requisição.
**❌ Errado:** `script-src 'unsafe-inline'` para "fazer parar de reclamar"; CSP copiada sem testar login, formulários e fontes.
**Como verificar:** `curl -sI http://localhost:3000/login | rg -i content-security-policy` mostra o nonce mudando a cada requisição; o console do navegador não acusa violação nas rotas principais.
