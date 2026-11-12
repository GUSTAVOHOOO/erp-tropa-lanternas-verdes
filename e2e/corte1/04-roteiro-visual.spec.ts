import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { entrar, lerManifesto } from './apoio'

// Roteiro visual do gate A (INTEGRACAO §3): 375 px, tablet, desktop, teclado/foco e movimento
// reduzido, contra a API real. Capturas de página inteira por rota e largura em
// .corte1/capturas/<rota>-<largura>.png, para revisão visual contra docs/UI.md.

const manifesto = lerManifesto()
const ocorrencia = manifesto.ocorrencias.find((item) => !item.excluidaEm)
if (!ocorrencia) throw new Error('Manifesto sem Ocorrência ativa para o roteiro visual')

const pastaCapturas = join(process.cwd(), '.corte1', 'capturas')
mkdirSync(pastaCapturas, { recursive: true })

const larguras = [
  { largura: 375, altura: 812 },
  { largura: 768, altura: 1024 },
  { largura: 1440, altura: 900 },
]

type Rota = { slug: string, caminho: string }

const rotasVisitante: Rota[] = [
  { slug: 'login', caminho: '/login' },
  { slug: 'cadastro', caminho: '/cadastro' },
  { slug: 'lanternas', caminho: '/lanternas' },
  { slug: 'lanternas-fixture-hal-2814', caminho: '/lanternas/fixture-hal-2814' },
]

const rotasGuardia: Rota[] = [
  { slug: 'painel', caminho: '/painel' },
  { slug: 'painel-ocorrencias', caminho: '/painel/ocorrencias' },
  { slug: 'painel-ocorrencias-nova', caminho: '/painel/ocorrencias/nova' },
  { slug: 'painel-ocorrencias-detalhe', caminho: `/painel/ocorrencias/${ocorrencia.id}` },
  { slug: 'painel-ocorrencias-atribuir', caminho: `/painel/ocorrencias/${ocorrencia.id}/atribuir` },
  { slug: 'painel-lanternas', caminho: '/painel/lanternas' },
  { slug: 'painel-setores', caminho: '/painel/setores' },
  { slug: 'painel-usuarios', caminho: '/painel/usuarios' },
]

const rotasLanterna: Rota[] = [
  { slug: 'painel-lanterna', caminho: '/painel' },
  { slug: 'painel-minha-fila', caminho: '/painel/minha-fila' },
]

/** Abre a rota, afirma ausência de rolagem horizontal e grava a captura de página inteira. */
async function capturar(page: Page, rota: Rota, largura: number) {
  const resposta = await page.goto(rota.caminho)
  expect.soft(resposta?.status() ?? 0, `${rota.caminho} @${largura}: status HTTP`).toBeLessThan(400)
  await expect(page.locator('main').first(), `${rota.caminho} @${largura}: sem <main>`).toBeVisible()
  // No painel, espera o conteúdo carregado (cabeçalho de moldura), não o skeleton do loading.
  if (rota.caminho.startsWith('/painel')) {
    await expect(page.locator('main h2').first(), `${rota.caminho} @${largura}: conteúdo não carregou`).toBeVisible()
  }
  const medida = await page.evaluate(() => ({
    rolagem: document.documentElement.scrollWidth,
    janela: document.documentElement.clientWidth,
  }))
  expect.soft(medida.rolagem, `${rota.caminho} @${largura}: rolagem horizontal (scrollWidth ${medida.rolagem} > clientWidth ${medida.janela})`).toBeLessThanOrEqual(medida.janela)
  await page.screenshot({ path: join(pastaCapturas, `${rota.slug}-${largura}.png`), fullPage: true })
}

test.describe('visitante — rotas públicas por largura', () => {
  for (const { largura, altura } of larguras) {
    test(`rotas públicas em ${largura}px`, async ({ page }) => {
      test.setTimeout(240_000)
      await page.setViewportSize({ width: largura, height: altura })
      for (const rota of rotasVisitante) await capturar(page, rota, largura)
    })
  }
})

test.describe('Guardiã (G) — rotas do painel por largura', () => {
  for (const { largura, altura } of larguras) {
    test(`painel do G em ${largura}px`, async ({ page }) => {
      test.setTimeout(300_000)
      await page.setViewportSize({ width: largura, height: altura })
      await entrar(page, 'G')
      for (const rota of rotasGuardia) await capturar(page, rota, largura)
    })
  }
})

test.describe('Lanterna (L2814) — rotas do painel por largura', () => {
  for (const { largura, altura } of larguras) {
    test(`painel do L2814 em ${largura}px`, async ({ page }) => {
      test.setTimeout(240_000)
      await page.setViewportSize({ width: largura, height: altura })
      await entrar(page, 'L2814')
      for (const rota of rotasLanterna) await capturar(page, rota, largura)
    })
  }
})

/**
 * Tab a partir do topo: o primeiro foco deve ser o link de pular para o conteúdo, e depois o
 * foco deve chegar a um elemento dentro de #oa-conteudo com contorno ou sombra visível.
 */
async function alcancarConteudoPorTeclado(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Ir para o conteúdo' })).toBeFocused()

  let dentroDoConteudo = false
  for (let i = 0; i < 40 && !dentroDoConteudo; i++) {
    await page.keyboard.press('Tab')
    dentroDoConteudo = await page.evaluate(() => {
      const principal = document.getElementById('oa-conteudo')
      return !!principal && principal.contains(document.activeElement) && document.activeElement !== principal
    })
  }
  expect(dentroDoConteudo, 'Tab não alcançou nenhum elemento dentro de #oa-conteudo em 40 toques').toBe(true)

  const foco = await page.evaluate(() => {
    const elemento = document.activeElement as HTMLElement
    const estilo = getComputedStyle(elemento)
    return {
      elemento: `${elemento.tagName.toLowerCase()} "${elemento.textContent?.trim().slice(0, 60) ?? ''}"`,
      contorno: `${estilo.outlineStyle} ${estilo.outlineWidth} ${estilo.outlineColor}`,
      contornoVisivel: estilo.outlineStyle !== 'none' && parseFloat(estilo.outlineWidth) > 0,
      sombra: estilo.boxShadow,
      sombraVisivel: estilo.boxShadow !== 'none',
    }
  })
  expect(foco.contornoVisivel || foco.sombraVisivel, `foco sem contorno nem sombra: ${JSON.stringify(foco)}`).toBe(true)
}

test.describe('teclado e foco', () => {
  test('em /login, Tab a partir do topo chega ao conteúdo com foco visível', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/login')
    await expect(page.locator('main').first()).toBeVisible()
    await alcancarConteudoPorTeclado(page)
  })

  test('em /painel/ocorrencias, Tab a partir do topo chega ao conteúdo com foco visível', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await entrar(page, 'G')
    await page.goto('/painel/ocorrencias')
    await expect(page.locator('main').first()).toBeVisible()
    await alcancarConteudoPorTeclado(page)
  })
})

test.describe('movimento reduzido', () => {
  test.use({ reducedMotion: 'reduce' })

  test('/painel com prefers-reduced-motion não gera erro de página', async ({ page }) => {
    const erros: string[] = []
    page.on('pageerror', (erro) => erros.push(erro.message))
    await page.setViewportSize({ width: 1440, height: 900 })
    await entrar(page, 'G')
    await page.goto('/painel')
    await expect(page.locator('main').first()).toBeVisible()
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)
    expect(erros, 'erros de página em /painel com movimento reduzido').toEqual([])
  })

  test('/lanternas com prefers-reduced-motion não gera erro de página', async ({ page }) => {
    const erros: string[] = []
    page.on('pageerror', (erro) => erros.push(erro.message))
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/lanternas')
    await expect(page.locator('main').first()).toBeVisible()
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)
    expect(erros, 'erros de página em /lanternas com movimento reduzido').toEqual([])
  })
})
