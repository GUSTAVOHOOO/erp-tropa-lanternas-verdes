// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const fakeEnv = vi.hoisted(() => ({ apiUrl: 'http://127.0.0.1:39722' }))
vi.mock('@/lib/env', () => ({ get env() { return { API_URL: fakeEnv.apiUrl } } }))
vi.mock('@/lib/dal', () => ({ lerTokenObrigatorio: vi.fn(async () => 'fake-token') }))

import { ApiError } from '@/lib/api-error'
import { listarMinhaFila } from '@/lib/ocorrencias'

describe('serviço de Minha fila contra o contrato', () => {
  let servidor: { url: string; setScenario: (id: string) => void; close: () => Promise<void> }

  beforeAll(async () => {
    const { createContractServer } = await import('../../scripts/contrato/servidor.mjs')
    servidor = await createContractServer({ port: 39700 + (process.pid % 80) })
    fakeEnv.apiUrl = servidor.url
  })

  afterAll(async () => {
    await servidor?.close()
  })

  it('listarMinhaFila.200 valida e manda pagina/limite', async () => {
    servidor.setScenario('listarMinhaFila.200')
    const pagina = await listarMinhaFila(1)
    expect(pagina.meta.total).toBe(4)
    expect(pagina.meta.pagina).toBe(1)
    expect(pagina.meta.limite).toBe(20)
    expect(pagina.itens).toHaveLength(4)
    expect(pagina.itens[0].id).toBe('00000000-0000-4000-8000-000000000201')
    expect(pagina.itens[0].responsavelId).toBe('hal-jordan')
  })

  it('403 vira ApiError com código SEM_PERMISSAO', async () => {
    servidor.setScenario('listarMinhaFila.403.SEM_PERMISSAO')
    await expect(listarMinhaFila(1)).rejects.toBeInstanceOf(ApiError)
    await expect(listarMinhaFila(1)).rejects.toMatchObject({
      status: 403,
      codigo: 'SEM_PERMISSAO',
    })
  })

  it('409 vira ApiError com código CONTA_SEM_LANTERNA', async () => {
    servidor.setScenario('listarMinhaFila.409.CONTA_SEM_LANTERNA')
    await expect(listarMinhaFila(1)).rejects.toBeInstanceOf(ApiError)
    await expect(listarMinhaFila(1)).rejects.toMatchObject({
      status: 409,
      codigo: 'CONTA_SEM_LANTERNA',
    })
  })
})
