import { configDefaults, defineConfig } from 'vitest/config'

// Configuração do guia oficial do Next.js (testing/vitest.md), adaptada ao Vite 8: [DEC-06]
// o alias @/ é resolvido nativamente e o JSX é transformado sem plugin.
export default defineConfig({
  // 'server-only' é resolvido pelo Next no build; nos testes vira o módulo vazio que o próprio Next usa no servidor.
  resolve: { tsconfigPaths: true, alias: { 'server-only': 'next/dist/compiled/server-only/empty.js' } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // lib/env.ts valida o ambiente ao importar; os testes usam endereços fixos e nunca abrem a API real.
    env: { API_URL: 'http://localhost:3001', SITE_URL: 'http://localhost:3000' },
    // backend/ tem o próprio runner (Jest) e dependências; o vitest do front não o executa.
    exclude: [...configDefaults.exclude, 'backend/**', 'e2e/**', 'scripts/contrato/*.test.mjs'],
  },
})
