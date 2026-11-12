import { expect, test } from '@playwright/test'
import type { ServidorDeContrato } from '../scripts/contrato/servidor.mjs'

// Preparação P (FE-08): a gestão é só do Guardião. O fake tem um único usuário em /auth/me (Lanterna),
// então aqui se prova o bloqueio; os fluxos do Guardião estão nos testes de Action e componente.
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

test('o Lanterna não vê os links de gestão', async ({ page }) => {
  await page.goto('/painel')
  const navegacao = page.getByRole('navigation')
  await expect(navegacao.getByRole('link', { name: /Minha fila/ })).toBeVisible()
  for (const nome of [/Lanternas \(gestão\)/, /^Setores/, /Usuários/]) {
    await expect(navegacao.getByRole('link', { name: nome })).toHaveCount(0)
  }
})

for (const rota of ['/painel/setores', '/painel/lanternas', '/painel/usuarios']) {
  test(`o Lanterna que abre ${rota} pela URL vai para o acesso negado`, async ({ page }) => {
    await page.goto(rota)
    await expect(page).toHaveURL(/\/acesso-negado$/)
  })
}
