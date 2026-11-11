import { expect, test } from '@playwright/test'
import type { ServidorDeContrato } from '../scripts/contrato/servidor.mjs'

// Preparação P (FE-07b): Minha fila do Lanterna contra o servidor falso.
const PORTA_FAKE = 32124
let fake: ServidorDeContrato

test.describe.configure({ mode: 'serial' })
test.beforeAll(async () => {
  // import dinâmico: o Playwright transpila o spec para CJS e o fake é ESM (usa import.meta)
  const { createContractServer } = await import('../scripts/contrato/servidor.mjs')
  fake = await createContractServer({ port: PORTA_FAKE })
})
test.beforeEach(async ({ context, baseURL }) => {
  fake.reset()
  await context.addCookies([{ name: 'sessao', value: 'token-de-teste', url: baseURL! }])
})
test.afterAll(async () => { await fake?.close() })

test('o Lanterna vê o link e a fila na ordem da API', async ({ page }) => {
  await page.goto('/painel')
  await page.getByRole('navigation').getByRole('link', { name: /Minha fila/ }).click()
  await expect(page).toHaveURL(/\/painel\/minha-fila$/)
  const titulos = page.getByRole('link', { name: /^Ocorrência de contrato O\d+$/ })
  await expect(titulos).toHaveText(['Ocorrência de contrato O1', 'Ocorrência de contrato O9', 'Ocorrência de contrato O8', 'Ocorrência de contrato O10'])
})

test('fila vazia e conta sem Ficha têm mensagens diferentes', async ({ page }) => {
  fake.setScenario('listarMinhaFila.200.fila-vazia-sem-pendentes')
  await page.goto('/painel/minha-fila')
  await expect(page.getByText('Nenhuma ocorrência na sua fila')).toBeVisible()

  fake.setScenario('listarMinhaFila.409.CONTA_SEM_LANTERNA')
  await page.goto('/painel/minha-fila')
  await expect(page.getByText('Sua conta ainda não tem uma Ficha de Lanterna vinculada')).toBeVisible()
  await expect(page.getByText('Nenhuma ocorrência na sua fila')).toHaveCount(0)
})
