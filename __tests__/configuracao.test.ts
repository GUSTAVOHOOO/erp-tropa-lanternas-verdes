// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

test('Cache Components fica desligado (DEC-10)', () => {
  const config = readFileSync('next.config.ts', 'utf8')
  expect(config).not.toMatch(/cacheComponents|partialPrefetching/)
})

// O procedimento canônico do FE-09 busca o nome literal da demonstração antiga; o teste não o repete.
test('a demonstração antiga saiu: sem servidor de JSON, script api nem arquivo de dados (FE-09)', () => {
  const pacote = JSON.parse(readFileSync('package.json', 'utf8'))
  expect(Object.keys(pacote.devDependencies)).not.toContainEqual(expect.stringMatching(/^json-?serv/))
  expect(pacote.scripts.api).toBeUndefined()
  expect(existsSync(['db', 'json'].join('.'))).toBe(false)
})

test('ambiente API é validado só no servidor e sem NEXT_PUBLIC', () => {
  const env = readFileSync('lib/env.ts', 'utf8')
  expect(env).toMatch(/API_URL/)
  expect(env).toMatch(/z\.url\(/)
  expect(env).toMatch(/SITE_URL/)
  expect(env).not.toMatch(/NEXT_PUBLIC_/)
})

test('headers de segurança e CSP são publicados em modo de relatório', () => {
  const config = readFileSync('next.config.ts', 'utf8')
  expect(config).toMatch(/async headers\(\)/)
  expect(config).toMatch(/X-Content-Type-Options/)
  expect(config).toMatch(/Content-Security-Policy-Report-Only/)
})

test('metadata tem template público e painel fora de robots e sitemap', () => {
  const layout = readFileSync('app/layout.tsx', 'utf8')
  const robots = readFileSync('app/robots.ts', 'utf8')
  const sitemap = readFileSync('app/sitemap.ts', 'utf8')
  expect(layout).toMatch(/template:/)
  expect(robots).toMatch(/painel/)
  expect(sitemap).not.toMatch(/painel/)
})

test('Playwright executa contra servidor de produção e fake tem script próprio', () => {
  const pacote = JSON.parse(readFileSync('package.json', 'utf8'))
  expect(pacote.scripts['test:e2e']).toBeTruthy()
  expect(pacote.scripts['contrato:servidor']).toBeTruthy()
  expect(pacote.scripts['test:e2e:real']).toBe('playwright test -c playwright.corte1.config.ts')
})
