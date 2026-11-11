import { expect, test, type BrowserContext } from '@playwright/test'
import type { ServidorDeContrato } from '../scripts/contrato/servidor.mjs'

// Preparação P (FE-02): o Next do build conversa com o servidor falso de contrato na porta
// que playwright.config.ts passa como API_URL. Prova o consumidor, não a API real.
const PORTA_FAKE = 32124
let fake: ServidorDeContrato

/** O fake guarda um cenário escolhido para todas as operações; reiniciar volta aos cenários de sucesso. */
async function reiniciarFake(cenario?: string) {
  await fake?.close()
  // import dinâmico: o Playwright transpila o spec para CJS e o fake é ESM (usa import.meta)
  const { createContractServer } = await import('../scripts/contrato/servidor.mjs')
  fake = await createContractServer({ port: PORTA_FAKE })
  if (cenario) fake.setScenario(cenario)
}

async function cookieSessao(context: BrowserContext) {
  return (await context.cookies()).find((cookie) => cookie.name === 'sessao')
}

test.describe.configure({ mode: 'serial' })
test.beforeEach(async () => { await reiniciarFake() })
test.afterAll(async () => { await fake?.close() })

test('login válido grava só o cookie httpOnly e a identidade vem de /auth/me', async ({ page, context }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill('l2814@example.invalid')
  await page.getByLabel('Senha', { exact: true }).fill('SomenteTeste123!')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/painel$/)
  await expect(page.getByText('Lanterna 2814 de teste').first()).toBeVisible()
  const cookie = await cookieSessao(context)
  expect(cookie?.httpOnly).toBe(true)
  expect(cookie?.sameSite).toBe('Lax')
  expect(await page.evaluate(() => document.cookie)).not.toContain('sessao=')
  expect(await page.content()).not.toContain(cookie!.value) // [AUTH-12] o token não vai ao HTML/RSC

  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL(/\/login$/)
  expect(await cookieSessao(context)).toBeUndefined()
})

test('credencial inválida e excesso de tentativas não abrem sessão', async ({ page, context }) => {
  await reiniciarFake('entrar.401.CREDENCIAIS_INVALIDAS.senha-incorreta')
  await page.goto('/login')
  await page.getByLabel('E-mail').fill('l2814@example.invalid')
  await page.getByLabel('Senha', { exact: true }).fill('senha-errada')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)

  await reiniciarFake('entrar.429.MUITAS_TENTATIVAS')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByText(/Muitas tentativas/)).toBeVisible()
  expect(await cookieSessao(context)).toBeUndefined()
})

test('sem cookie o painel leva ao login; token recusado expira a sessão sem laço', async ({ page, context, baseURL }) => {
  await page.goto('/painel')
  await expect(page).toHaveURL(/\/login$/)

  await context.addCookies([{ name: 'sessao', value: 'token-adulterado', url: baseURL! }])
  await reiniciarFake('consultarUsuarioAtual.401.NAO_AUTENTICADO.token_adulterado')
  await page.goto('/painel')
  await expect(page).toHaveURL(/\/login\?expirou=1$/)
  await expect(page.getByRole('status')).toHaveText('Sua sessão expirou. Entre de novo.')
  expect(await cookieSessao(context)).toBeUndefined()
})

test('cadastro carrega setores no servidor e volta ao login', async ({ page }) => {
  await page.goto('/cadastro')
  await page.getByLabel('Nome').fill('Conta nova de teste')
  await page.getByLabel('E-mail').fill('nova@example.invalid')
  await page.getByLabel('Senha', { exact: true }).fill('SomenteTeste123!')
  await page.getByRole('combobox', { name: /setor/i }).click()
  await page.getByRole('option', { name: /2814/ }).click()
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page).toHaveURL(/\/login\?cadastro=1$/)
  await expect(page.getByRole('status')).toHaveText('Conta criada. Entre com o seu e-mail e senha.')
})

// Setores indisponíveis/vazios: provado em __tests__/components/cadastro-pagina.test.tsx. No E2E o
// cache de 60 s de GET /setores (dado público) devolve a lista anterior, então o caso não é determinístico.
