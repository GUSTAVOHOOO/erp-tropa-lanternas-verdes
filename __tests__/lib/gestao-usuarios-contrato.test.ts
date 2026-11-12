// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const fakeEnv = vi.hoisted(() => ({ apiUrl: 'http://127.0.0.1:42814' }))
vi.mock('@/lib/env', () => ({
  get env() {
    return { API_URL: fakeEnv.apiUrl }
  },
}))
vi.mock('@/lib/dal', () => ({
  lerTokenObrigatorio: vi.fn(async () => 'fake-token-guardiao'),
}))

import {
  alterarPapel,
  listarUsuarios,
  vincularLanterna,
} from '@/lib/gestao-usuarios'

describe('serviço de gestão de usuários contra o contrato', () => {
  let servidor: {
    url: string
    setScenario: (id: string) => void
    reset: () => void
    close: () => Promise<void>
  }

  beforeAll(async () => {
    const { createContractServer } = await import('../../scripts/contrato/servidor.mjs')
    servidor = await createContractServer({ port: 42814 })
    fakeEnv.apiUrl = servidor.url
  })

  afterAll(async () => {
    await servidor?.close()
  })

  beforeEach(() => {
    servidor?.reset()
  })

  it('lista usuários com busca e ordenação no contrato', async () => {
    servidor.setScenario('listarUsuarios.200')
    const paginaPadrao = await listarUsuarios({ pagina: 1, limite: 20, ordenar: 'nome', ordem: 'asc' })
    expect(paginaPadrao.itens.length).toBeGreaterThan(0)
    expect(paginaPadrao.meta).toMatchObject({ pagina: 1, limite: 20 })

    servidor.setScenario('listarUsuarios.200.criadoEm-desc')
    const ordenado = await listarUsuarios({ ordenar: 'criadoEm', ordem: 'desc', limite: 3 })
    expect(ordenado.itens.length).toBeLessThanOrEqual(3)

    servidor.setScenario('listarUsuarios.200.busca-sem-acento')
    const filtrado = await listarUsuarios({ busca: 'vinculo' })
    expect(filtrado.itens.length).toBeGreaterThan(0)
  })

  it('recusa consulta com parâmetros fora do contrato antes do envio', async () => {
    await expect(listarUsuarios({ parametroInvalido: 'x' } as never)).rejects.toThrow(
      'Parâmetro fora do contrato em listarUsuarios: parametroInvalido',
    )
  })

  it('promove conta a Guardião conservando o setor', async () => {
    servidor.setScenario('alterarPapel.200.promocao')
    const promovido = await alterarPapel('00000000-0000-4000-8000-000000000102', { papel: 'guardiao' })
    expect(promovido.papel).toBe('guardiao')
  })

  it('descarta setorId ao promover para Guardião mesmo se informado na entrada', async () => {
    servidor.setScenario('alterarPapel.200.promocao')
    const promovido = await alterarPapel('00000000-0000-4000-8000-000000000102', {
      papel: 'guardiao',
      setorId: 2814,
    })
    expect(promovido.papel).toBe('guardiao')
  })

  it('rebaixa conta para Lanterna preservando o setor quando setorId é omitido', async () => {
    servidor.setScenario('alterarPapel.200.rebaixamento-preserva-setor')
    const rebaixado = await alterarPapel('00000000-0000-4000-8000-000000000106', {
      papel: 'lanterna',
    })
    expect(rebaixado.papel).toBe('lanterna')
    expect(rebaixado.setorId).toBe(2814)
  })

  it('rebaixa conta para Lanterna informando o novo setor', async () => {
    servidor.setScenario('alterarPapel.200.rebaixamento-com-setor')
    const rebaixado = await alterarPapel('00000000-0000-4000-8000-000000000101', {
      papel: 'lanterna',
      setorId: 674,
    })
    expect(rebaixado.papel).toBe('lanterna')
    expect(rebaixado.setorId).toBe(674)
  })

  it('rejeita alteração de papel do último Guardião com 409 ULTIMO_GUARDIAO', async () => {
    servidor.setScenario('alterarPapel.409.ULTIMO_GUARDIAO')
    await expect(
      alterarPapel('00000000-0000-4000-8000-000000000101', { papel: 'lanterna', setorId: 2814 }),
    ).rejects.toMatchObject({
      status: 409,
      codigo: 'ULTIMO_GUARDIAO',
    })
  })

  it('rejeita rebaixamento sem setor com 422 SETOR_OBRIGATORIO', async () => {
    servidor.setScenario('alterarPapel.422.SETOR_OBRIGATORIO')
    await expect(
      alterarPapel('00000000-0000-4000-8000-000000000101', { papel: 'lanterna' }),
    ).rejects.toMatchObject({
      status: 422,
      codigo: 'SETOR_OBRIGATORIO',
    })
  })

  it('vincula uma conta de Lanterna a uma Ficha', async () => {
    servidor.setScenario('vincularLanterna.200')
    const vinculado = await vincularLanterna('00000000-0000-4000-8000-000000000104', 'john-stewart')
    expect(vinculado.lanternaId).toBe('john-stewart')
  })

  it('desvincula Ficha passando null', async () => {
    servidor.setScenario('vincularLanterna.200.desvincular')
    const desvinculado = await vincularLanterna('00000000-0000-4000-8000-000000000102', null)
    expect(desvinculado.lanternaId).toBeNull()
  })

  it('rejeita vínculo em conta de Guardião com 422 VINCULO_NAO_PERMITIDO', async () => {
    servidor.setScenario('vincularLanterna.422.VINCULO_NAO_PERMITIDO.guardiao-sem-setor')
    await expect(
      vincularLanterna('00000000-0000-4000-8000-000000000101', 'john-stewart'),
    ).rejects.toMatchObject({
      status: 422,
      codigo: 'VINCULO_NAO_PERMITIDO',
    })
  })

  it('rejeita vínculo de Ficha já vinculada a outra conta com 409 LANTERNA_JA_VINCULADA', async () => {
    servidor.setScenario('vincularLanterna.409.LANTERNA_JA_VINCULADA')
    await expect(
      vincularLanterna('00000000-0000-4000-8000-000000000104', 'guy-gardner'),
    ).rejects.toMatchObject({
      status: 409,
      codigo: 'LANTERNA_JA_VINCULADA',
    })
  })
})
