import { expect, test } from '@playwright/test'
import type { ServidorDeContrato } from '../scripts/contrato/servidor.mjs'

// Preparação P (FE-07a): o painel inicial mostra o /dashboard da API, sem contar a lista paginada.
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

test('métricas vêm do dashboard da API, com texto e tabela equivalentes ao gráfico', async ({ page }) => {
  await page.goto('/painel?setor=674&dias=abc') // Lanterna: setor forjado é ignorado; dias inválido vira padrão
  await expect(page.getByRole('heading', { level: 1, name: /Bem-vindo/ })).toBeVisible()
  const tempoMedio = page.locator('section', { has: page.getByRole('heading', { name: 'Tempo médio de resolução' }) }).last()
  await expect(tempoMedio).toContainText(/48\s*horas/)
  await expect(page.getByRole('link', { name: 'Hal Jordan' }).first()).toHaveAttribute('href', '/lanternas/hal-jordan')
  await expect(page.getByRole('img', { name: /série|últimos/i }).first()).toBeVisible()
  await page.getByText('Ver dados da série').click()
  await expect(page.getByRole('table').filter({ hasText: /Abertas/ }).getByRole('row')).toHaveCount(8) // cabeçalho + 7 dias
  // Nada da vitrine do laboratório no conteúdo; a dica do globo na casca (REF-05) cita os 3.600 setores de propósito.
  await expect(page.locator('#oa-conteudo').getByText(/7\.200|3\.600|98,7/)).toHaveCount(0)
})

test('sem resoluções a média aparece por texto, não como zero', async ({ page }) => {
  fake.setScenario('consultarDashboard.200.sem-resolvidas')
  await page.goto('/painel')
  await expect(page.getByText('Sem resoluções ainda')).toBeVisible()
})

test('falha do dashboard oferece tentar de novo', async ({ page }) => {
  fake.setScenario('consultarDashboard.500.ERRO_INTERNO')
  await page.goto('/painel')
  await expect(page.getByRole('button', { name: 'Tentar de novo' })).toBeVisible()
})
