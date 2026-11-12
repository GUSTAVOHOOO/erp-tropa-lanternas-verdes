import { expect, test } from '@playwright/test'
import { execFileSync } from 'node:child_process'

test('portal e login carregam sem chamadas do navegador à API', async ({ page }) => {
  const chamadasExternas: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:32123') chamadasExternas.push(request.url())
  })

  const respostaPortal = await page.goto('/')
  expect(respostaPortal).not.toBeNull()
  const headers = respostaPortal!.headers()
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(headers['x-frame-options']).toBe('DENY')
  expect(headers['content-security-policy-report-only']).toContain("default-src 'self'")
  const curl = process.platform === 'win32' ? 'curl.exe' : 'curl'
  const respostaCurl = execFileSync(curl, ['-I', 'http://127.0.0.1:32123/'], { encoding: 'utf8' })
  expect(respostaCurl.toLowerCase()).toContain('content-security-policy-report-only')
  await expect(page.getByRole('heading', { name: /central de ocorrências/i })).toBeVisible()
  await page.getByRole('link', { name: /entrar na central de comando/i }).click()
  await expect(page.getByRole('heading', { name: /entrar na central de comando/i })).toBeVisible()
  await expect(page.getByLabel(/e-mail/i)).toBeVisible()
  const robots = await page.request.get('/robots.txt')
  expect(await robots.text()).toContain('Disallow: /painel')
  const sitemap = await page.request.get('/sitemap.xml')
  expect(await sitemap.text()).not.toContain('/painel')
  expect(chamadasExternas).toEqual([])
})
