# Testes unitários com Vitest

### DEC-06: Testes unitários com Vitest, como no guia oficial do Next.js
**Fonte:** [DOCS] `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md` + [SLIDE] PROPS p. 9 (item 7 do checklist: "Testes Unitários... `describe('Component')`") + [DECISÃO] ajustes de instalação
**Regra:** Testes em `__tests__/`, rodados com `npm run test:run`. Testamos schemas, o cliente HTTP (`lib/api.ts`, com `fetch` simulado: sucesso, 204, cada status de erro, rede/timeout), `ApiError.deResposta` e `resultadoDeErro` (API-03, API-18), `proxy.ts`, Server Actions (com `next/navigation`, `next/cache`, `@/lib/dal` e `@/lib/api` simulados) e componentes cliente ou síncronos com React Testing Library. Server Components `async` não são suportados pelo Vitest (o guia avisa): são cobertos por `npm run build` e pelos testes E2E (PROD-11). PropTypes não: a tipagem é TypeScript (COMP-06).
**Diferenças em relação ao guia:** (1) sem `@vitejs/plugin-react`: uma dependência opcional dele exige Babel 8 e conflita com o Babel 7 do pacote `shadcn`; o Vite 8 já transforma JSX sozinho. (2) sem `vite-tsconfig-paths`: o Vite 8 resolve o alias `@/` com `resolve.tsconfigPaths: true`. (3) `vitest.setup.ts` chama `cleanup()` depois de cada teste.
**Como verificar:** `npm run test:run` passa; `package.json` não tem os dois plugins acima.
