import { expect, test } from '@playwright/test'
import type { ServidorDeContrato } from '../scripts/contrato/servidor.mjs'

// Preparação P (FE-03): catálogo e Ficha públicos contra o servidor falso de contrato. Prova o consumidor.
const PORTA_FAKE = 32124
let fake: ServidorDeContrato

async function reiniciarFake(cenario?: string) {
  await fake?.close()
  // import dinâmico: o Playwright transpila o spec para CJS e o fake é ESM (usa import.meta)
  const { createContractServer } = await import('../scripts/contrato/servidor.mjs')
  fake = await createContractServer({ port: PORTA_FAKE })
  if (cenario) fake.setScenario(cenario)
}

test.describe.configure({ mode: 'serial' })
test.beforeEach(async () => { await reiniciarFake() })
test.afterAll(async () => { await fake?.close() })

test('catálogo lista pela API, filtra pela URL e mantém o filtro ao recarregar', async ({ page }) => {
  await page.goto('/lanternas?pagina=abc&setor=xyz') // parâmetros inválidos viram padrão, sem quebrar
  await expect(page.getByRole('heading', { name: 'Lanternas da Tropa' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Hal Jordan/ })).toHaveAttribute('href', '/lanternas/hal-jordan')
  await expect(page.getByText('1 lanterna', { exact: true })).toBeVisible() // total vem do meta da API

  await page.getByRole('combobox', { name: 'Status' }).click()
  await page.getByRole('option', { name: 'Em missão' }).click()
  await expect(page).toHaveURL(/status=em_missao/)
  await expect(page).not.toHaveURL(/pagina=/) // mudar filtro volta à primeira página

  await page.getByLabel('Buscar por codinome').fill('Hál')
  await page.getByRole('button', { name: 'Buscar' }).click()
  await expect(page).toHaveURL(/busca=H%C3%A1l/) // vai como digitado; a normalização é do servidor
  await page.reload()
  await expect(page.getByLabel('Buscar por codinome')).toHaveValue('Hál')
  await expect(page).toHaveURL(/status=em_missao/)
})

test('Ficha mostra dados do contrato, relações e estatísticas sem inventar campos', async ({ page }) => {
  await page.goto('/lanternas/hal-jordan')
  await expect(page.getByRole('heading', { level: 1, name: 'Hal Jordan' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Guy Gardner/ })).toHaveAttribute('href', '/lanternas/guy-gardner')
  await expect(page.getByText('Não registrado').first()).toBeVisible()
  await expect(page.getByText('não verificado').first()).toBeVisible() // fontes vazias = não verificado
})

test('Ficha inexistente chega ao 404 sem revelar dados', async ({ page }) => {
  await reiniciarFake('consultarFichaLanterna.404.NAO_ENCONTRADO.inexistente')
  await page.goto(`/lanternas/inexistente-${Date.now()}`)
  // A rota tem loading.tsx: a resposta já está em streaming quando notFound() roda, então o status
  // continua 200 e o Next injeta noindex (guia not-found.md da versão instalada). Provamos a tela 404.
  await expect(page.getByRole('heading', { name: 'Lanterna não encontrado' })).toBeVisible()
  await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached()
  await expect(page.getByRole('link', { name: 'Ver todos os lanternas' })).toHaveAttribute('href', '/lanternas')
})
