import { expect, test } from '@playwright/test'
import type { ServidorDeContrato } from '../scripts/contrato/servidor.mjs'

// Preparação P (FE-04/FE-05): lista, registro, detalhe e ciclo de vida contra o servidor falso.
// A sessão do fake é o Lanterna 2814 (consultarUsuarioAtual.200), criador da Ocorrência O1.
const PORTA_FAKE = 32124
const O1 = '00000000-0000-4000-8000-000000000201'
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

test('lista vem paginada da API, mostra o atraso por texto e filtra pela URL', async ({ page }) => {
  await page.goto('/painel/ocorrencias?setor=674&pagina=abc')
  await expect(page.getByRole('link', { name: 'Ocorrência de contrato O1', exact: true })).toBeVisible()
  await expect(page.getByText('Vencida').first()).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Setor' })).toHaveCount(0) // Lanterna não escolhe setor

  await page.getByRole('combobox', { name: 'Status' }).click()
  await page.getByRole('option', { name: 'Aberta' }).click()
  await expect(page).toHaveURL(/status=aberta/)
  await expect(page).not.toHaveURL(/pagina=/)
})

test('Lanterna registra sem escolher setor e chega ao detalhe criado', async ({ page }) => {
  await page.goto('/painel/ocorrencias/nova')
  await expect(page.getByRole('combobox', { name: 'Setor' })).toHaveCount(0)
  await page.getByLabel('Título').fill('Ocorrência nova de teste')
  await page.getByLabel('Descrição').fill('Descrição fictícia com extensão válida.')
  await page.getByLabel('Planeta').fill('Terra')
  await page.getByRole('combobox', { name: 'Gravidade' }).click()
  await page.getByRole('option', { name: 'Alta' }).click()
  await page.getByLabel('Seres envolvidos').fill('3')
  await page.getByRole('button', { name: 'Registrar ocorrência' }).click()
  await expect(page).toHaveURL(/\/painel\/ocorrencias\/00000000-0000-4000-8000-000000000911$/)
})

test('resolver pelo sub-recurso de status; recusa da API volta ao campo sem anunciar sucesso', async ({ page }) => {
  await page.goto(`/painel/ocorrencias/${O1}`)
  await expect(page.getByRole('heading', { level: 1, name: 'Ocorrência de contrato O1' })).toBeVisible()

  fake.setScenario('alterarStatusOcorrencia.422.RESOLUCAO_OBRIGATORIA.curta')
  await page.getByRole('combobox', { name: 'Status' }).click()
  await page.getByRole('option', { name: 'Resolvida' }).click()
  await page.getByLabel('Como foi resolvida?').fill('Explicação suficiente para o cliente.')
  await page.getByRole('button', { name: 'Salvar status' }).click()
  await expect(page.getByText(/resolução da ocorrência com pelo menos 10 caracteres/i)).toBeVisible()
  await expect(page.getByText('Status atualizado.')).toHaveCount(0)

  fake.setScenario('alterarStatusOcorrencia.200.resolver')
  await page.getByRole('button', { name: 'Salvar status' }).click()
  await expect(page.getByText('Status atualizado.')).toBeVisible()
})

test('detalhe inexistente ou de outro setor mostra o 404 sem revelar dados', async ({ page }) => {
  fake.setScenario('consultarOcorrencia.404.NAO_ENCONTRADO.outro-setor')
  await page.goto(`/painel/ocorrencias/${O1}`)
  await expect(page.getByRole('heading', { name: 'Ocorrência não encontrada' })).toBeVisible()
  await expect(page.getByText('Ocorrência de contrato O1')).toHaveCount(0)
})
