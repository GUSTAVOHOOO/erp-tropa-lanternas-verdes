import { defineConfig } from 'vitest/config'

// Configuração do guia oficial do Next.js (testing/vitest.md), adaptada ao Vite 8: [DEC-06]
// o alias @/ é resolvido nativamente e o JSX é transformado sem plugin.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
