import { expect, test } from '@playwright/test'
import { conta, entrar, lerManifesto, SENHA } from './apoio'

// E2E do Corte 1 — Gates aditivos G6, G7b e G8 contra a API NestJS real.
// POSSE exclusiva: e2e/corte1/03-aditivos.spec.ts
test.describe.configure({ mode: 'serial' })

test('G6: comentário apagado no histórico da ocorrência do manifesto (como Guardião)', async ({ page }) => {
  const manifesto = lerManifesto()
  const o4Id = manifesto.ocorrencias[3].id

  await entrar(page, 'G')
  await page.goto(`/painel/ocorrencias/${o4Id}`)
  await expect(page.getByText('apagou um comentário')).toBeVisible()
  await expect(page.getByText('Comentário histórico da ocorrência resolvida.')).toHaveCount(0)
})

test('G6: linha do tempo, comentar, autor apaga próprio comentário e outro autor não tem ação', async ({ page }) => {
  const manifesto = lerManifesto()
  const o1Id = manifesto.ocorrencias[0].id

  // 1. Linha do tempo de O1 (como Lanterna L2814)
  await entrar(page, 'L2814')
  await page.goto(`/painel/ocorrencias/${o1Id}`)
  await expect(page.getByText('registrou a ocorrência')).toBeVisible()
  await expect(page.getByText('atribuiu a Lanterna Fixture 2814')).toBeVisible()
  await expect(page.getByText('iniciou o atendimento')).toBeVisible()

  // 2. Comentários existentes: autor próprio pode apagar, outro autor não tem a ação
  const comentarioProprio = page.locator('li').filter({ hasText: 'A Lanterna registrou o acompanhamento do Setor.' })
  await expect(comentarioProprio.getByRole('button', { name: 'Apagar' })).toHaveCount(1)
  const comentarioOutro = page.locator('li').filter({ hasText: 'O Guardião confirmou o recebimento do relato.' })
  await expect(comentarioOutro.getByRole('button', { name: 'Apagar' })).toHaveCount(0)

  // 3. Comentar na ocorrência
  const textoComentario = `Comentário L2814 ${Date.now()}`
  const campoComentario = page.getByRole('textbox', { name: 'Comentário' })
  await campoComentario.fill(textoComentario)
  await page.getByRole('button', { name: 'Comentar' }).click()
  await expect(page.getByText('Comentário publicado.')).toBeVisible()
  await expect(page.getByText(textoComentario)).toBeVisible()

  // 4. Autor apaga o próprio comentário e evento aparece na linha do tempo
  const itemNovo = page.locator('li').filter({ hasText: textoComentario })
  await itemNovo.getByRole('button', { name: 'Apagar' }).click()
  const modalApagar = page.getByRole('alertdialog')
  await expect(modalApagar).toBeVisible()
  await modalApagar.getByRole('button', { name: 'Apagar' }).click()
  await expect(modalApagar).not.toBeVisible()
  await expect(page.getByText(textoComentario)).toHaveCount(0)
  await expect(page.getByText('apagou um comentário').first()).toBeVisible()
})

test('G7b: Minha fila lista as ocorrências atribuídas ao Lanterna L2814', async ({ page }) => {
  await entrar(page, 'L2814')
  await page.goto('/painel/minha-fila')
  await expect(page.getByRole('heading', { name: 'Minha fila' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ocorrência fixture 01' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ocorrência fixture 02' })).toBeVisible()
  await expect(page.getByText('Nenhuma ocorrência na sua fila')).toHaveCount(0)
})

test('G7b: Lanterna sem ficha recebe mensagem de CONTA_SEM_LANTERNA (409)', async ({ page }) => {
  await entrar(page, 'L-sem-ficha')
  await page.goto('/painel/minha-fila')
  await expect(page.getByText('Sua conta ainda não tem uma Ficha de Lanterna vinculada')).toBeVisible()
  await expect(page.getByText('Nenhuma ocorrência na sua fila')).toHaveCount(0)
})

test('G8: Guardião gerencia setores: cria, edita, remove e valida bloqueio SETOR_EM_USO no 2814', async ({ page }) => {
  await entrar(page, 'G')
  await page.goto('/painel/setores')

  // 1. Criar Setor novo com número único 9000..9999
  const numeroSetor = 9000 + Math.floor(Math.random() * 950) + 1
  const nomeSetor = `Setor Teste ${numeroSetor}`
  const descSetor = `Descrição do setor ${numeroSetor}`
  await page.getByLabel('Número do setor').fill(String(numeroSetor))
  await page.getByLabel('Nome').fill(nomeSetor)
  await page.getByLabel('Descrição').fill(descSetor)
  await page.getByRole('button', { name: 'Cadastrar setor' }).click()
  await expect(page).toHaveURL(/\/painel\/setores$/)

  const linhaNovo = page.locator('tr').filter({ hasText: String(numeroSetor) })
  await expect(linhaNovo).toBeVisible()
  await expect(linhaNovo.getByText(nomeSetor)).toBeVisible()

  // 2. Editar setor novo
  await linhaNovo.getByRole('link', { name: 'Editar' }).click()
  await expect(page).toHaveURL(new RegExp(`/painel/setores\\?editar=${numeroSetor}`))
  const nomeAtualizado = `Setor Atualizado ${numeroSetor}`
  await page.getByLabel('Nome').fill(nomeAtualizado)
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page).toHaveURL(/\/painel\/setores$/)
  await expect(page.locator('tr').filter({ hasText: String(numeroSetor) }).getByText(nomeAtualizado)).toBeVisible()

  // 3. Remover setor novo
  const linhaParaRemover = page.locator('tr').filter({ hasText: String(numeroSetor) })
  await linhaParaRemover.getByRole('button', { name: 'Excluir' }).click()
  const modalExcluir = page.getByRole('alertdialog')
  await expect(modalExcluir).toBeVisible()
  await modalExcluir.getByRole('button', { name: 'Confirmar exclusão' }).click()
  await expect(modalExcluir).not.toBeVisible()
  await expect(page.locator('tr').filter({ hasText: String(numeroSetor) })).toHaveCount(0)

  // 4. Remover Setor 2814 resulta em SETOR_EM_USO
  const linha2814 = page.locator('tr').filter({ hasText: '2814' })
  await linha2814.getByRole('button', { name: 'Excluir' }).click()
  const modalBloqueio = page.getByRole('alertdialog')
  await expect(modalBloqueio).toBeVisible()
  await modalBloqueio.getByRole('button', { name: 'Confirmar exclusão' }).click()
  await expect(modalBloqueio.getByText(/Este setor tem lanternas, ocorrências ou contas ligadas e não pode ser removido/i)).toBeVisible()
  await modalBloqueio.getByRole('button', { name: 'Cancelar' }).click()
  await expect(modalBloqueio).not.toBeVisible()
})

test('G8: Guardião gerencia fichas de Lanterna: cria, edita, afasta, reativa e valida LANTERNA_EM_USO', async ({ page }) => {
  await entrar(page, 'G')
  await page.goto('/painel/lanternas')

  // 1. Criar Ficha de Lanterna nova
  const sufixo = Date.now()
  const slugFicha = `lanterna-aditivo-${sufixo}`
  const codinomeFicha = `Lanterna Aditivo ${sufixo}`
  await page.getByLabel('Identificador (slug)').fill(slugFicha)
  await page.getByLabel('Codinome').fill(codinomeFicha)
  await page.getByLabel('Espécie').fill('Humano')
  await page.getByLabel('Planeta natal').fill('Terra')
  await page.getByRole('combobox', { name: 'Setor' }).click()
  await page.getByRole('option', { name: /Setor 2814/ }).click()
  await page.getByRole('button', { name: 'Cadastrar Lanterna' }).click()
  await expect(page).toHaveURL(/\/painel\/lanternas$/)

  const linhaFicha = page.locator('tr').filter({ hasText: codinomeFicha })
  await expect(linhaFicha).toBeVisible()

  // 2. Editar Ficha
  await linhaFicha.getByRole('link', { name: 'Editar' }).click()
  await expect(page).toHaveURL(new RegExp(`/painel/lanternas\\?editar=${slugFicha}`))
  await page.getByLabel('Planeta natal').fill('Oa')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page).toHaveURL(/\/painel\/lanternas$/)

  // 3. Afastar e reativar Ficha
  const linhaStatus = page.locator('tr').filter({ hasText: codinomeFicha })
  await expect(linhaStatus.getByText('Ativo')).toBeVisible()
  await linhaStatus.getByRole('button', { name: 'Afastar' }).click()
  await expect(linhaStatus.getByText('Afastado')).toBeVisible()
  await expect(linhaStatus.getByRole('button', { name: 'Reativar' })).toBeVisible()
  await linhaStatus.getByRole('button', { name: 'Reativar' }).click()
  await expect(linhaStatus.getByText('Ativo')).toBeVisible()
  await expect(linhaStatus.getByRole('button', { name: 'Afastar' })).toBeVisible()

  // 4. Trocar o setor de fixture-hal-2814 resulta em LANTERNA_EM_USO
  await page.goto('/painel/lanternas?editar=fixture-hal-2814')
  await page.getByRole('combobox', { name: 'Setor' }).click()
  await page.getByRole('option', { name: /Setor 674/ }).click()
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByText('O setor da ficha não pode mudar: há conta ou ocorrência ligada a ele.')).toBeVisible()
})

test('G8: gestão de usuários com conta nova: busca, papéis, vínculos e validações de domínio', async ({ page }) => {
  // 1. Cadastrar nova conta via /cadastro
  const timestamp = Date.now()
  const emailNovo = `recruta-${timestamp}@fixture.invalid`
  const nomeNovo = `Recruta Teste ${timestamp}`

  await page.goto('/cadastro')
  await page.getByLabel('Nome').fill(nomeNovo)
  await page.getByLabel('E-mail').fill(emailNovo)
  await page.getByLabel('Senha', { exact: true }).fill(SENHA)
  await page.getByRole('combobox', { name: 'Setor' }).click()
  await page.getByRole('option', { name: /Setor 2814/ }).click()
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page).toHaveURL(/\/login/)

  // 2. Criar uma Ficha no setor 2814 para o teste de vínculo/desvínculo
  await entrar(page, 'G')
  await page.goto('/painel/lanternas')
  const slugFichaTeste = `lanterna-recruta-${timestamp}`
  const codinomeFichaTeste = `Lanterna Recruta ${timestamp}`
  await page.getByLabel('Identificador (slug)').fill(slugFichaTeste)
  await page.getByLabel('Codinome').fill(codinomeFichaTeste)
  await page.getByLabel('Espécie').fill('Humano')
  await page.getByLabel('Planeta natal').fill('Terra')
  await page.getByRole('combobox', { name: 'Setor' }).click()
  await page.getByRole('option', { name: /Setor 2814/ }).click()
  await page.getByRole('button', { name: 'Cadastrar Lanterna' }).click()
  await expect(page).toHaveURL(/\/painel\/lanternas$/)

  // 3. Usuários: busca
  await page.goto('/painel/usuarios')
  await page.getByLabel('Buscar por nome ou e-mail').fill(emailNovo)
  await page.getByRole('button', { name: 'Filtrar' }).click()
  await expect(page).toHaveURL(/busca=/)
  const linhaConta = page.locator('tr').filter({ hasText: emailNovo })
  await expect(linhaConta).toBeVisible()
  await expect(linhaConta.getByText('Lanterna')).toBeVisible()
  await expect(linhaConta.getByText('Sem vínculo')).toBeVisible()

  // 4. Abrir gerenciamento da conta nova
  const linkGerenciar = linhaConta.getByRole('link', { name: 'Gerenciar' })
  const hrefGerenciar = await linkGerenciar.getAttribute('href')
  expect(hrefGerenciar).toBeTruthy()
  await page.goto(hrefGerenciar!)
  await expect(page.getByText(`Gerenciar conta: ${nomeNovo}`)).toBeVisible()

  // 5. Vínculo duplicado: tentar vincular Lanterna Fixture 2814 -> LANTERNA_JA_VINCULADA
  await page.getByRole('combobox', { name: 'Ficha de Lanterna' }).click()
  await page.getByRole('option', { name: 'Lanterna Fixture 2814' }).click()
  await page.getByRole('button', { name: 'Salvar vínculo' }).click()
  await expect(page.getByText('Este Lanterna já está vinculado a outra conta.')).toBeVisible()

  // 6. Vínculo com ficha disponível (sucesso)
  await page.getByRole('combobox', { name: 'Ficha de Lanterna' }).click()
  await page.getByRole('option', { name: codinomeFichaTeste }).click()
  await page.getByRole('button', { name: 'Salvar vínculo' }).click()
  await expect(page.locator('tr').filter({ hasText: emailNovo }).getByText(codinomeFichaTeste)).toBeVisible()

  // 7. SETOR_DIFERENTE: tentar alterar o setor da conta para 674 enquanto vinculada a ficha do setor 2814
  await page.getByRole('combobox', { name: 'Setor da conta' }).click()
  await page.getByRole('option', { name: /Setor 674/ }).click()
  await page.getByRole('button', { name: 'Salvar papel' }).click()
  await expect(page.getByText('O setor informado é diferente do setor da ficha vinculada.')).toBeVisible()

  // 8. Desvínculo da Ficha
  await page.getByRole('combobox', { name: 'Ficha de Lanterna' }).click()
  await page.getByRole('option', { name: 'Sem vínculo' }).click()
  await page.getByRole('button', { name: 'Salvar vínculo' }).click()
  await expect(page.locator('tr').filter({ hasText: emailNovo }).getByText('Sem vínculo')).toBeVisible()

  // 9. SETOR_OBRIGATORIO: tentar rebaixar Guardião sem setor (G2) sem indicar setor
  const g2 = conta('G2')
  await page.goto(`/painel/usuarios?conta=${g2.id}`)
  await expect(page.getByRole('heading', { name: /Gerenciar conta:/ })).toBeVisible()
  await page.getByRole('combobox', { name: 'Papel da conta' }).click()
  await page.getByRole('option', { name: 'Lanterna' }).click()
  await page.getByRole('button', { name: 'Salvar papel' }).click()
  await expect(page.getByText('É obrigatório informar um setor para o Lanterna.')).toBeVisible()

  // 10. Papel: promover a conta nova a Guardião e rebaixar de volta a Lanterna
  await page.goto('/painel/usuarios')
  await page.getByLabel('Buscar por nome ou e-mail').fill(emailNovo)
  await page.getByRole('button', { name: 'Filtrar' }).click()
  await expect(page).toHaveURL(/busca=/)
  const hrefPapel = await page.locator('tr').filter({ hasText: emailNovo }).getByRole('link', { name: 'Gerenciar' }).getAttribute('href')
  expect(hrefPapel).toBeTruthy()
  await page.goto(hrefPapel!)

  await page.getByRole('combobox', { name: 'Papel da conta' }).click()
  await page.getByRole('option', { name: 'Guardião' }).click()
  await page.getByRole('button', { name: 'Salvar papel' }).click()
  await expect(page.locator('tr').filter({ hasText: emailNovo }).getByText('Guardião')).toBeVisible()

  await page.getByRole('combobox', { name: 'Papel da conta' }).click()
  await page.getByRole('option', { name: 'Lanterna' }).click()
  await page.getByRole('combobox', { name: 'Setor da conta' }).click()
  await page.getByRole('option', { name: /Setor 2814/ }).click()
  await page.getByRole('button', { name: 'Salvar papel' }).click()
  await expect(page.locator('tr').filter({ hasText: emailNovo }).getByText('Lanterna')).toBeVisible()
})

test('G8: Lanterna L2814 recebe acesso negado nas rotas de gestão', async ({ page }) => {
  await entrar(page, 'L2814')
  for (const rota of ['/painel/setores', '/painel/lanternas', '/painel/usuarios']) {
    await page.goto(rota)
    await expect(page).toHaveURL(/\/acesso-negado$/)
  }
})
