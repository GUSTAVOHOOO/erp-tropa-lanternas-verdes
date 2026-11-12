import { expect, test, type Page } from '@playwright/test'
import { conta, entrar, lerManifesto } from './apoio'

const manifesto = lerManifesto()
const fixture = manifesto.ocorrencias.filter((item) => !item.excluidaEm)
const contar = (setorId?: number) => {
  const itens = fixture.filter((item) => setorId === undefined || item.setorId === setorId)
  return {
    abertas: itens.filter((item) => item.status === 'aberta').length,
    andamento: itens.filter((item) => item.status === 'em_andamento').length,
    resolvidas: itens.filter((item) => item.status === 'resolvida').length,
    vencidas: itens.filter((item) => item.vencida).length,
    gravidade: Object.fromEntries(['baixa', 'media', 'alta', 'critica'].map((g) => [g, itens.filter((item) => item.gravidade === g).length])),
  }
}

// O Dashboard mostra o número e o rótulo em elementos separados; zero vira "Nenhuma vencida".
async function conferirVencidas(page: Page, quantidade: number) {
  if (quantidade === 0) {
    await expect(page.getByText('Nenhuma vencida')).toBeVisible()
    return
  }
  await expect(page.getByText('vencidas', { exact: true }).locator('..')).toContainText(String(quantidade))
}

test.describe.serial('G7a — métricas gerais do Guardião contra o manifesto', () => {
  test('Guardiã confere contagens da fixture e dias na URL', async ({ page }) => {
    const esperado = contar()
    const esperadoSetor = contar(674)
    await entrar(page, 'G')
    await page.goto('/painel?dias=7')
    await expect(page).toHaveURL(/dias=7/)
    await expect(page.getByRole('heading', { name: 'Série dos últimos 7 dias' })).toBeVisible()
    await expect(page.getByRole('img', { name: /Série dos últimos 7 dias:/ })).toBeVisible()
    await expect(page.getByText('Sem resoluções ainda')).toHaveCount(0)
    await expect(page.getByText(String(esperado.abertas), { exact: true }).first()).toBeVisible()
    await expect(page.getByText(String(esperado.andamento), { exact: true }).first()).toBeVisible()
    await expect(page.getByText(String(esperado.resolvidas), { exact: true }).first()).toBeVisible()
    await conferirVencidas(page, esperado.vencidas)

    await page.getByRole('combobox', { name: 'Setor' }).click()
    await page.getByRole('option', { name: /Setor 674/ }).click()
    await expect(page).toHaveURL(/setor=674/)
    await expect(page.getByText(/Setor 674/).first()).toBeVisible()
    await expect(page.getByText(String(esperadoSetor.abertas), { exact: true }).first()).toBeVisible()
    await expect(page.getByText(String(esperadoSetor.andamento), { exact: true }).first()).toBeVisible()
    await expect(page.getByText(String(esperadoSetor.resolvidas), { exact: true }).first()).toBeVisible()
    await conferirVencidas(page, esperadoSetor.vencidas)

    await page.goto('/painel?setor=9999&dias=7')
    await expect(page.getByText('Sem resoluções ainda')).toBeVisible()
    await expect(page.getByText('Nenhuma vencida')).toBeVisible()
    await expect(page.getByRole('img', { name: 'Série dos últimos 7 dias: 0 abertas e 0 resolvidas' })).toBeVisible()
    await expect(page.getByText('0', { exact: true }).first()).toBeVisible()
  })
})

test.describe.serial('G7a — métricas da Lanterna contra o manifesto', () => {
  test('Lanterna só vê o próprio setor e mantém dias da série na URL', async ({ page }) => {
    const esperado = contar(conta('L2814').setorId!)
    await entrar(page, 'L2814')
    await page.goto('/painel?dias=30&setor=674')
    await expect(page).toHaveURL(/dias=30/)
    await expect(page.getByRole('heading', { name: 'Série dos últimos 30 dias' })).toBeVisible()
    await expect(page.getByText('Sem resoluções ainda')).toHaveCount(0)
    await expect(page.getByText(String(esperado.abertas), { exact: true }).first()).toBeVisible()
    await expect(page.getByText(String(esperado.andamento), { exact: true }).first()).toBeVisible()
    await expect(page.getByText(String(esperado.resolvidas), { exact: true }).first()).toBeVisible()
    await conferirVencidas(page, esperado.vencidas)
    await expect(page.getByRole('combobox', { name: 'Setor' })).toHaveCount(0)
  })
})

test('lista mantém paginação e filtros na URL; Lanterna não alcança Setor 674 nem por URL', async ({ page }) => {
  // Paginação com o Guardião: ele vê as 21 ativas da fixture (limite 20); o Setor 2814 sozinho cabe numa página.
  await entrar(page, 'G')
  await page.goto('/painel/ocorrencias?pagina=2')
  await expect(page).toHaveURL(/pagina=2/)
  const paginacao = page.getByRole('navigation', { name: 'Paginação' })
  await expect(paginacao).toContainText('Página 2 de 2')
  await expect(paginacao.getByRole('link', { name: /Anterior/ })).toBeVisible()
  await page.context().clearCookies()
  await entrar(page, 'L2814')
  await page.goto('/painel/ocorrencias?status=aberta&gravidade=critica')
  await expect(page).toHaveURL(/status=aberta.*gravidade=critica|gravidade=critica.*status=aberta/)
  await expect(page.getByRole('combobox', { name: 'Status' })).toBeVisible()
  await page.goto('/painel/ocorrencias?setor=674')
  await expect(page.getByText('Ocorrência fixture 04')).toHaveCount(0)
  await page.goto(`/painel/ocorrencias/${manifesto.ocorrencias.find((item) => item.setorId === 674)!.id}`)
  await expect(page.getByRole('heading', { name: 'Ocorrência não encontrada' })).toBeVisible()
})

test('Lanterna cria no próprio setor, recarrega e Guardiã exclui com confirmação', async ({ page }) => {
  const titulo = `Corte1 L ${Date.now()}`
  await entrar(page, 'L2814')
  await page.goto('/painel/ocorrencias/nova')
  await expect(page.getByRole('combobox', { name: 'Setor' })).toHaveCount(0)
  await page.getByLabel('Título').fill(titulo)
  await page.getByLabel('Descrição').fill('Descrição suficientemente longa para validar o registro da ocorrência.')
  await page.getByLabel('Planeta').fill('Terra')
  await page.getByLabel('Seres envolvidos').fill('2')
  await page.getByRole('button', { name: 'Registrar ocorrência' }).click()
  await expect(page.getByRole('heading', { name: titulo })).toBeVisible()
  const url = page.url()
  await page.reload()
  await expect(page.getByRole('heading', { name: titulo })).toBeVisible()
  await page.context().clearCookies()
  await entrar(page, 'G')
  await page.goto(url)
  await page.getByRole('button', { name: 'Excluir ocorrência' }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Excluir', exact: true }).click()
  await expect(page).toHaveURL(/\/painel\/ocorrencias$/)
})

test('Lanterna consegue editar o título da ocorrência criada', async ({ page }) => {
  const titulo = `Corte1 editar ${Date.now()}`
  await entrar(page, 'L2814')
  await page.goto('/painel/ocorrencias/nova')
  await page.getByLabel('Título').fill(titulo)
  await page.getByLabel('Descrição').fill('Descrição suficientemente longa para validar o registro da ocorrência.')
  await page.getByLabel('Planeta').fill('Terra')
  await page.getByLabel('Seres envolvidos').fill('2')
  await page.getByRole('button', { name: 'Registrar ocorrência' }).click()
  await expect(page.getByRole('heading', { name: titulo })).toBeVisible()
  await page.locator('input[name="titulo"]').last().fill(`${titulo} editada`)
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByRole('heading', { name: `${titulo} editada` })).toBeVisible()
})

test('Guardiã cria escolhendo setor e completa ciclo de atribuição e status', async ({ page }) => {
  const titulo = `Corte1 ciclo ${Date.now()}`
  await entrar(page, 'G')
  const aberta = manifesto.ocorrencias.find((item) => item.status === 'aberta' && item.setorId === 2814)!
  await page.goto(`/painel/ocorrencias/${aberta.id}/atribuir`)
  await page.getByRole('combobox', { name: 'Lanterna responsável' }).click()
  await page.getByRole('option', { name: 'Lanterna Fixture 2814' }).click()
  await page.getByRole('button', { name: 'Atribuir responsável' }).click()
  await page.goto(`/painel/ocorrencias/${aberta.id}/atribuir`)
  await page.getByRole('combobox', { name: 'Lanterna responsável' }).click()
  await page.getByRole('option', { name: 'Sem responsável (liberar)' }).click()
  await page.getByRole('button', { name: 'Atribuir responsável' }).click()
  await page.goto(`/painel/ocorrencias/${aberta.id}`)
  await expect(page.getByText('Sem responsável')).toBeVisible()

  await page.goto('/painel/ocorrencias/nova')
  await page.getByLabel('Título').fill(titulo)
  await page.getByLabel('Descrição').fill('Registro da fixture de integração para provar o ciclo completo.')
  await page.getByLabel('Planeta').fill('Terra')
  await page.getByRole('combobox', { name: 'Setor' }).click()
  await page.getByRole('option', { name: /Setor 2814/ }).click()
  await page.getByLabel('Seres envolvidos').fill('1')
  await page.getByRole('button', { name: 'Registrar ocorrência' }).click()
  await expect(page.getByRole('heading', { name: titulo })).toBeVisible()
  const id = new URL(page.url()).pathname.split('/').at(-1)!

  await page.getByRole('link', { name: 'Atribuir responsável' }).click()
  await page.getByRole('combobox', { name: 'Lanterna responsável' }).click()
  await page.getByRole('option', { name: 'Lanterna Fixture 2814' }).click()
  await page.getByRole('button', { name: 'Atribuir responsável' }).click()
  await expect(page).toHaveURL(new RegExp(`/painel/ocorrencias/${id}$`))
  await page.goto(`/painel/ocorrencias/${id}`)
  await page.getByRole('combobox', { name: 'Status' }).click()
  await page.getByRole('option', { name: 'Em andamento' }).click()
  await page.getByRole('button', { name: 'Salvar status' }).click()
  await expect(page.getByText('Em andamento', { exact: true }).first()).toBeVisible()
  await page.reload()
  await page.getByRole('combobox', { name: 'Status' }).click()
  await page.getByRole('option', { name: 'Resolvida' }).click()
  await page.getByLabel('Como foi resolvida?').fill('A equipe estabilizou a situação e confirmou o retorno seguro.')
  await page.getByRole('button', { name: 'Salvar status' }).click()
  await expect(page.getByText('Resolvida', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('A equipe estabilizou a situação e confirmou o retorno seguro.').first()).toBeVisible()
  await page.reload()
  await page.getByRole('combobox', { name: 'Status' }).click()
  await page.getByRole('option', { name: 'Aberta' }).click()
  await page.getByLabel('Motivo da reabertura').fill('A análise posterior identificou nova atividade no local.')
  await page.getByRole('button', { name: 'Salvar status' }).click()
  await expect(page.getByText('Aberta', { exact: true }).first()).toBeVisible()
})

test('Guardiã consegue reatribuir para outra Lanterna do mesmo setor', async ({ page }) => {
  const momento = Date.now()
  const slug = `c1-${momento}`
  const codinome = `Lanterna C1 ${momento}`
  const titulo = `Corte1 reatribuir ${momento}`
  await entrar(page, 'G')
  await page.goto('/painel/lanternas')
  await page.getByLabel('Identificador (slug)').fill(slug)
  await page.getByLabel('Codinome').fill(codinome)
  await page.getByLabel('Espécie').fill('Humano')
  await page.getByLabel('Planeta natal').fill('Terra')
  await page.getByRole('combobox', { name: 'Setor' }).last().click()
  await page.getByRole('option', { name: /Setor 2814/ }).click()
  await page.getByRole('button', { name: 'Cadastrar Lanterna' }).click()
  await expect(page.getByText(codinome)).toBeVisible()

  await page.goto('/painel/ocorrencias/nova')
  await page.getByLabel('Título').fill(titulo)
  await page.getByLabel('Descrição').fill('Registro exclusivo para validar a reatribuição de responsável.')
  await page.getByLabel('Planeta').fill('Terra')
  await page.getByRole('combobox', { name: 'Setor' }).click()
  await page.getByRole('option', { name: /Setor 2814/ }).click()
  await page.getByLabel('Seres envolvidos').fill('1')
  await page.getByRole('button', { name: 'Registrar ocorrência' }).click()
  await expect(page.getByRole('heading', { name: titulo })).toBeVisible()
  const id = new URL(page.url()).pathname.split('/').at(-1)!
  await page.goto(`/painel/ocorrencias/${id}/atribuir`)
  await page.getByRole('combobox', { name: 'Lanterna responsável' }).click()
  await expect(page.getByRole('option', { name: codinome })).toHaveCount(1)
})

test('seletor de responsável só oferece Lanternas do setor da ocorrência', async ({ page }) => {
  const ocorrencia = manifesto.ocorrencias.find((item) => item.status === 'em_andamento' && item.setorId === 2814)!
  await entrar(page, 'G')
  await page.goto(`/painel/ocorrencias/${ocorrencia.id}/atribuir`)
  await page.getByRole('combobox', { name: 'Lanterna responsável' }).click()
  await expect(page.getByRole('option', { name: 'Lanterna Fixture 2814' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'Lanterna Fixture 674' })).toHaveCount(0)
})

test('seletor não oferece liberação de ocorrência em andamento', async ({ page }) => {
  const ocorrencia = manifesto.ocorrencias.find((item) => item.status === 'em_andamento' && item.setorId === 2814)!
  await entrar(page, 'G')
  await page.goto(`/painel/ocorrencias/${ocorrencia.id}/atribuir`)
  await page.getByRole('combobox', { name: 'Lanterna responsável' }).click()
  await expect(page.getByRole('option', { name: 'Lanterna Fixture 2814' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'Sem responsável (liberar)' })).toHaveCount(0)
})
