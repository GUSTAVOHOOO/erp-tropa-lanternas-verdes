import { expect, test, type BrowserContext } from '@playwright/test'
import { NOME_COOKIE } from '../../lib/cookie'
import { conta, SENHA } from './apoio'

async function cookieSessao(context: BrowserContext) {
  const cookies = await context.cookies()
  return cookies.find((cookie) => cookie.name === NOME_COOKIE)
}

test.describe('Gate G2 — Sessão e Autenticação', () => {
  test('login real de G cai no /painel com o nome certo e saída apaga cookie', async ({ page, context }) => {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill(conta('G').email)
    await page.getByLabel('Senha', { exact: true }).fill(SENHA)
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/painel/)
    await expect(page.getByText('Guardião de Teste').first()).toBeVisible()

    const cookie = await cookieSessao(context)
    expect(cookie?.httpOnly).toBe(true)
    expect(cookie?.sameSite).toBe('Lax')
    expect(await page.evaluate(() => document.cookie)).not.toContain(`${NOME_COOKIE}=`)

    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/login$/)
    expect(await cookieSessao(context)).toBeUndefined()
  })

  test('login real de L2814 cai no /painel com o nome certo e saída apaga cookie', async ({ page, context }) => {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill(conta('L2814').email)
    await page.getByLabel('Senha', { exact: true }).fill(SENHA)
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/painel/)
    await expect(page.getByText('Lanterna Setor 2814').first()).toBeVisible()

    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/login$/)
    expect(await cookieSessao(context)).toBeUndefined()
  })

  test('login real de L-sem-ficha cai no /painel com o nome certo e saída apaga cookie', async ({ page, context }) => {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill(conta('L-sem-ficha').email)
    await page.getByLabel('Senha', { exact: true }).fill(SENHA)
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/painel/)
    await expect(page.getByText('Lanterna sem Ficha').first()).toBeVisible()

    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/login$/)
    expect(await cookieSessao(context)).toBeUndefined()
  })

  test('senha errada mostra erro em português sem vazar detalhe e não abre sessão', async ({ page, context }) => {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill(conta('G').email)
    await page.getByLabel('Senha', { exact: true }).fill('senha-incorreta')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
    expect(await cookieSessao(context)).toBeUndefined()
  })

  test('sem cookie, /painel leva ao /login', async ({ page }) => {
    await page.goto('/painel')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('cookie adulterado gera 401, limpa cookie e volta ao login sem laço', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: NOME_COOKIE, value: 'token-adulterado-invalido', url: baseURL! }])
    await page.goto('/painel')

    await expect(page).toHaveURL(/\/login\?expirou=1$/)
    await expect(page.getByRole('status')).toHaveText('Sua sessão expirou. Entre de novo.')
    expect(await cookieSessao(context)).toBeUndefined()
  })

  test('/cadastro carrega setores, cria nova conta Lanterna, entra e rejeita e-mail duplicado', async ({ page, context }) => {
    await page.goto('/cadastro')
    await expect(page.getByRole('heading', { level: 1, name: 'Criar conta na Central' })).toBeVisible()

    const sufixo = Date.now()
    const nomeNovo = `Lanterna Recruta ${sufixo}`
    const emailNovo = `recruta-${sufixo}@fixture.invalid`
    const senhaNova = 'SomenteTeste123!'

    await page.getByLabel('Nome').fill(nomeNovo)
    await page.getByLabel('E-mail').fill(emailNovo)
    await page.getByLabel('Senha', { exact: true }).fill(senhaNova)
    await page.getByRole('combobox', { name: /setor/i }).click()
    await page.getByRole('option', { name: /2814/ }).click()
    await page.getByRole('button', { name: 'Criar conta' }).click()

    await expect(page).toHaveURL(/\/login\?cadastro=1$/)
    await expect(page.getByRole('status')).toHaveText('Conta criada. Entre com o seu e-mail e senha.')

    await page.getByLabel('E-mail').fill(emailNovo)
    await page.getByLabel('Senha', { exact: true }).fill(senhaNova)
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/painel/)
    await expect(page.getByText(nomeNovo).first()).toBeVisible()

    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/login$/)
    expect(await cookieSessao(context)).toBeUndefined()

    await page.goto('/cadastro')
    await page.getByLabel('Nome').fill('Outro Nome')
    await page.getByLabel('E-mail').fill(emailNovo)
    await page.getByLabel('Senha', { exact: true }).fill('SomenteTeste123!')
    await page.getByRole('combobox', { name: /setor/i }).click()
    await page.getByRole('option', { name: /2814/ }).click()
    await page.getByRole('button', { name: 'Criar conta' }).click()

    await expect(page.getByText('Este e-mail já está cadastrado.')).toBeVisible()
    await expect(page).toHaveURL(/\/cadastro/)
  })
})

test.describe('Gate G3 — Domínio Público', () => {
  test('/lanternas lista pública, busca, filtros, ordenação e paginação na URL', async ({ page }) => {
    await page.goto('/lanternas?pagina=invalida&setor=invalido')
    await expect(page.getByRole('heading', { level: 1, name: 'Lanternas da Tropa' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Lanterna Fixture 2814/ })).toHaveAttribute('href', '/lanternas/fixture-hal-2814')

    await page.getByRole('combobox', { name: 'Status' }).click()
    await page.getByRole('option', { name: 'Em missão' }).click()
    await expect(page).toHaveURL(/status=em_missao/)
    await expect(page).not.toHaveURL(/pagina=/)

    await page.getByRole('combobox', { name: 'Setor' }).click()
    await page.getByRole('option', { name: /2814/ }).click()
    await expect(page).toHaveURL(/setor=2814/)

    await page.getByLabel('Buscar por codinome').fill('Fixture 2814')
    await page.getByRole('button', { name: 'Buscar' }).click()
    await expect(page).toHaveURL(/busca=Fixture(\+|%20)2814/)

    await page.getByRole('combobox', { name: 'Ordenar' }).click()
    await page.getByRole('option', { name: 'Setor' }).click()
    await expect(page).toHaveURL(/ordenar=setor/)

    await page.getByRole('combobox', { name: 'Ordem' }).click()
    await page.getByRole('option', { name: 'Decrescente' }).click()
    await expect(page).toHaveURL(/ordem=desc/)

    await page.reload()
    await expect(page.getByLabel('Buscar por codinome')).toHaveValue('Fixture 2814')
    await expect(page).toHaveURL(/busca=Fixture(\+|%20)2814/)
    await expect(page).toHaveURL(/status=em_missao/)
    await expect(page).toHaveURL(/setor=2814/)
    await expect(page).toHaveURL(/ordenar=setor/)
    await expect(page).toHaveURL(/ordem=desc/)

    await page.goto('/lanternas?pagina=999')
    await expect(page.getByText('Nenhum lanterna nesta página')).toBeVisible()
    await page.getByRole('link', { name: 'Voltar à página 1' }).click()
    await expect(page).toHaveURL(/\/lanternas(\?.*)?$/)
  })

  test('Ficha com campos null e fontes exibe não registrado e não verificado', async ({ page }) => {
    await page.goto('/lanternas/fixture-hal-2814')
    await expect(page.getByRole('heading', { level: 1, name: 'Lanterna Fixture 2814' })).toBeVisible()
    await expect(page.getByText('Não registrado').first()).toBeVisible()
    await expect(page.getByText('não verificado').first()).toBeVisible()
  })

  test('Ficha inexistente apresenta tela 404 sem vazar dados', async ({ page }) => {
    await page.goto(`/lanternas/inexistente-${Date.now()}`)
    await expect(page.getByRole('heading', { name: 'Lanterna não encontrado' })).toBeVisible()
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached()
    await expect(page.getByRole('link', { name: 'Ver todos os lanternas' })).toHaveAttribute('href', '/lanternas')
  })
})
