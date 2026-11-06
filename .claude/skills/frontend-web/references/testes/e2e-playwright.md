# Testes E2E com Playwright

### PROD-11: Testes E2E com Playwright sobre o build de produção e a API real
**Fonte:** [DECISÃO] aprovada + [DOCS] `.../02-guides/testing/playwright.md` (rodar `build` e `start`, ou `webServer`)
**Regra:** Pasta `e2e/`, `playwright.config.ts` com `webServer` que sobe `next build` + `next start` e a API com banco descartável (SQLite de teste, semeado). Fluxos mínimos: login válido e inválido; rota privada sem sessão leva a `/login`; sem o papel leva a `/acesso-negado`; criar, editar e excluir um registro; um erro de regra da API (409/422) aparece no campo ou na mensagem geral; lista vazia; paginação e filtro pela URL; axe nas páginas principais (PROD-08). Seletores por papel e rótulo (`getByRole`, `getByLabel`). Login uma vez e reuso do estado (`storageState`). Os fetches rodam no servidor do Next, então `page.route` do navegador **não** intercepta a API: provoque erro com dados semeados ou com a API real.
**✅ Certo:**
```ts
test('sem sessão vai ao login', async ({ page }) => {
  await page.goto('/painel')
  await expect(page).toHaveURL(/\/login/) // [PROD-11]
})
```
**❌ Errado:** E2E contra `npm run dev`; seletor por classe CSS; mockar a API no E2E; teste que depende da ordem de outro.
**Como verificar:** `npx playwright test` passa do zero em máquina limpa (banco recriado); relate quais fluxos rodaram.
