// @vitest-environment node
import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

test('Cache Components fica desligado (DEC-10)', () => {
  const config = readFileSync('next.config.ts', 'utf8')
  expect(config).not.toMatch(/cacheComponents|partialPrefetching/)
})

test('json-server fixado na versão estável (STACK-04)', () => {
  const pacote = JSON.parse(readFileSync('package.json', 'utf8'))
  expect(pacote.devDependencies['json-server']).toBe('0.17.4')
})
