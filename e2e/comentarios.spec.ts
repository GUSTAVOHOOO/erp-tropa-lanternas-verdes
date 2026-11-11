import { expect, test } from '@playwright/test'
import type { ServidorDeContrato } from '../scripts/contrato/servidor.mjs'

// Preparação P (FE-06): linha do tempo e comentários no detalhe, contra o servidor falso.
// A sessão do fake é o Lanterna 2814 (autor do primeiro comentário do exemplo).
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

test('linha do tempo e comentários vêm da API; só o próprio comentário pode ser apagado', async ({ page }) => {
  await page.goto(`/painel/ocorrencias/${O1}?eventos=abc`)
  await expect(page.getByText('registrou a ocorrência')).toBeVisible()
  await expect(page.getByText('apagou um comentário')).toBeVisible()
  await expect(page.getByText('Comentário fictício de contrato.')).toBeVisible()
  await expect(page.getByText('Orientação fictícia do Guardião.')).toBeVisible()
  await expect(page.getByRole('button', { name: /Apagar/ })).toHaveCount(1) // Lanterna só apaga o próprio
  await expect(page.getByRole('button', { name: /Editar comentário/ })).toHaveCount(0)
})

test('comentar publica e limpa o campo; recusa da API não anuncia sucesso', async ({ page }) => {
  await page.goto(`/painel/ocorrencias/${O1}`)
  const campo = page.getByLabel('Comentário')
  await campo.fill('Comentário novo de teste.')
  await page.getByRole('button', { name: 'Comentar' }).click()
  await expect(page.getByText('Comentário publicado.')).toBeVisible()
  await expect(campo).toHaveValue('')

  fake.setScenario('criarComentario.404.NAO_ENCONTRADO.ocorrencia-excluida')
  await campo.fill('Outro comentário de teste.')
  await page.getByRole('button', { name: 'Comentar' }).click()
  await expect(page.getByText(/não existe mais|não foi possível/i)).toBeVisible()
  await expect(campo).toHaveValue('Outro comentário de teste.')
})

test('apagar pede confirmação acessível e mostra a recusa de outro autor', async ({ page }) => {
  await page.goto(`/painel/ocorrencias/${O1}`)
  fake.setScenario('excluirComentario.403.SEM_PERMISSAO.outro-autor')
  await page.getByRole('button', { name: /Apagar/ }).click()
  const dialogo = page.getByRole('alertdialog')
  await expect(dialogo).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialogo).toHaveCount(0)

  await page.getByRole('button', { name: /Apagar/ }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: /Apagar|Confirmar|Excluir/ }).click()
  await expect(page.getByText('Só o autor ou um Guardião pode apagar este comentário.')).toBeVisible()
})
