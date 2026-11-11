// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const fakeEnv = vi.hoisted(() => ({ apiUrl: 'http://127.0.0.1:39500' }))
vi.mock('@/lib/env', () => ({
  get env() {
    return { API_URL: fakeEnv.apiUrl }
  },
}))

import { cadastrarConta } from '@/lib/cadastro'
import { listarSetores } from '@/lib/setores'

describe('lib/cadastro contra o servidor de contrato', () => {
  let servidor: { url: string; setScenario: (id: string) => void; close: () => Promise<void> }

  beforeAll(async () => {
    const { createContractServer } = await import('../../scripts/contrato/servidor.mjs')
    servidor = await createContractServer({ port: 39500 + (process.pid % 400) })
    fakeEnv.apiUrl = servidor.url
  })

  afterAll(async () => {
    await servidor?.close()
  })

  it('listarSetores.200 retorna lista de setores', async () => {
    servidor.setScenario('listarSetores.200')
    const setores = await listarSetores()
    expect(Array.isArray(setores)).toBe(true)
    expect(setores.length).toBeGreaterThan(0)
    expect(setores[0]).toHaveProperty('id')
    expect(setores[0]).toHaveProperty('nome')
    expect(setores[0]).toHaveProperty('descricao')
  })

  it('listarSetores.500.ERRO_INTERNO lança ApiError 500', async () => {
    servidor.setScenario('listarSetores.500.ERRO_INTERNO')
    await expect(listarSetores()).rejects.toMatchObject({
      status: 500,
      codigo: 'ERRO_INTERNO',
    })
  })

  it('cadastrarUsuario.201 conclui com sucesso', async () => {
    servidor.setScenario('cadastrarUsuario.201')
    await expect(
      cadastrarConta({
        nome: 'Conta nova de teste',
        email: 'nova@example.invalid',
        senha: 'SomenteTeste123!',
        setorId: 2814,
      }),
    ).resolves.toBeUndefined()
  })

  it('cadastrarUsuario.409.EMAIL_JA_CADASTRADO lança ApiError 409', async () => {
    servidor.setScenario('cadastrarUsuario.409.EMAIL_JA_CADASTRADO')
    await expect(
      cadastrarConta({
        nome: 'Conta nova de teste',
        email: 'L2814@EXAMPLE.INVALID',
        senha: 'SomenteTeste123!',
        setorId: 2814,
      }),
    ).rejects.toMatchObject({
      status: 409,
      codigo: 'EMAIL_JA_CADASTRADO',
    })
  })

  it('cadastrarUsuario.404.NAO_ENCONTRADO.setor-inexistente lança ApiError 404', async () => {
    servidor.setScenario('cadastrarUsuario.404.NAO_ENCONTRADO.setor-inexistente')
    await expect(
      cadastrarConta({
        nome: 'Conta nova de teste',
        email: 'nova@example.invalid',
        senha: 'SomenteTeste123!',
        setorId: 4999,
      }),
    ).rejects.toMatchObject({
      status: 404,
      codigo: 'NAO_ENCONTRADO',
    })
  })
})
