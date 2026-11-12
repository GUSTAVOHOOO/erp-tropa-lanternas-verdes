import { defineConfig } from '@playwright/test'

// E2E do Corte 1 contra a API NestJS real (INTEGRACAO §3, §4): banco SQLite novo + fixture etapa e
// a cada execução, login real e build do Next. Exige `npm ci` e `npm run build` em backend/ e o
// build do front. Comando: SITE_URL=http://127.0.0.1:32133 npx playwright test -c playwright.corte1.config.ts
const site = 'http://127.0.0.1:32133'
const api = 'http://127.0.0.1:32134'

export default defineConfig({
  testDir: './e2e/corte1',
  // Os specs dividem o mesmo banco: um worker por vez, na ordem dos arquivos (leituras antes das escritas).
  workers: 1,
  reporter: 'list',
  timeout: 60_000,
  use: { baseURL: site, browserName: 'chromium', headless: true },
  webServer: [
    {
      command: 'node scripts/corte1/api.mjs',
      url: `${api}/saude`,
      reuseExistingServer: true,
      timeout: 120_000,
      env: { ...process.env, CORTE1_SITE_URL: site },
    },
    {
      // O cache de dados do Next sobrevive ao reinício; apagá-lo evita respostas de um banco anterior.
      command: `node -e "require('node:fs').rmSync('.next/cache/fetch-cache', { recursive: true, force: true })" && npm run start -- --hostname 127.0.0.1 --port 32133`,
      url: `${site}/login`,
      reuseExistingServer: true,
      timeout: 120_000,
      env: { ...process.env, API_URL: api, SITE_URL: site },
    },
  ],
})
