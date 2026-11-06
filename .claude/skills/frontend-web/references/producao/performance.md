# Performance e Core Web Vitals

### PROD-09: Performance e Core Web Vitals medidos
**Fonte:** [DECISÃO] aprovada + [DOCS] `.../03-api-reference/02-components/image.md` (no Next 16, `priority` foi substituído por `preload`), `.../03-api-reference/04-functions/use-report-web-vitals.md`; limiares de web.dev (LCP até 2,5 s, INP até 200 ms, CLS até 0,1)
**Regra:** Meça antes de otimizar: Lighthouse (ou PageSpeed) em build de produção, e `useReportWebVitals` se houver coleta. Práticas: imagens por `next/image` com `width`/`height` (ou `fill` + `sizes`) para não deslocar o layout, e `preload` só na imagem do LCP; fontes por `next/font` (CSS-13); `'use client'` o mais fundo possível (ROTA-08); bibliotecas pesadas só de cliente com `next/dynamic`; dados lentos atrás de `Suspense` (API-10); buscas independentes em `Promise.all` (API-07); listas paginadas (API-19). Número de Lighthouse sem build de produção não vale.
**✅ Certo:** `<Image src={capa} alt="" width={1200} height={630} preload sizes="100vw" />` na imagem do topo e sem `preload` nas demais.
**❌ Errado:** `<img>` sem dimensões; `priority` (obsoleto no Next 16); `preload` em todas as imagens; medir em `npm run dev`.
**Como verificar:** `npm run build && npm run start` e Lighthouse em modo celular nas 3 páginas mais usadas; relate LCP, INP (ou TBT) e CLS.
