// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const fakeEnv = vi.hoisted(() => ({ apiUrl: 'http://127.0.0.1:43814' }))
vi.mock('@/lib/env', () => ({
  get env() {
    return { API_URL: fakeEnv.apiUrl }
  },
}))
vi.mock('@/lib/dal', () => ({
  lerTokenObrigatorio: vi.fn(async () => 'fake-token-guardiao'),
}))

import { buscarSetor, criarSetor, editarSetor, excluirSetor } from '@/lib/setores'

describe('gestão de setores contra o servidor de contrato', () => {
  let servidor: { url: string; setScenario: (id: string) => void; reset: () => void; close: () => Promise<void> }

  beforeAll(async () => {
    const { createContractServer } = await import('../../scripts/contrato/servidor.mjs')
    servidor = await createContractServer({ port: 43814 })
    fakeEnv.apiUrl = servidor.url
  })

  afterAll(async () => {
    await servidor?.close()
  })

  it('criarSetor.201 cria setor com sucesso', async () => {
    servidor.setScenario('criarSetor.201')
    const novo = await criarSetor({
      id: 4100,
      nome: 'Setor 4100 de teste',
      descricao: 'Descrição fictícia de Setor novo.',
    })
    expect(novo).toEqual({
      id: 4100,
      nome: 'Setor 4100 de teste',
      descricao: 'Descrição fictícia de Setor novo.',
    })
  })

  it('criarSetor.409.SETOR_JA_CADASTRADO lança ApiError 409', async () => {
    servidor.setScenario('criarSetor.409.SETOR_JA_CADASTRADO')
    await expect(
      criarSetor({
        id: 2814,
        nome: 'Setor 4100 de teste',
        descricao: 'Descrição fictícia de Setor novo.',
      }),
    ).rejects.toMatchObject({
      status: 409,
      codigo: 'SETOR_JA_CADASTRADO',
    })
  })

  it('editarSetor.200 altera somente campos enviados', async () => {
    servidor.setScenario('editarSetor.200')
    const alterado = await editarSetor(2814, {
      nome: 'Nome fictício atualizado',
    })
    expect(alterado).toMatchObject({
      id: 2814,
      nome: 'Nome fictício atualizado',
    })
  })

  it('excluirSetor.204 remove setor sem vínculos', async () => {
    servidor.setScenario('excluirSetor.204')
    await expect(excluirSetor(3601)).resolves.toBeUndefined()
  })

  it('excluirSetor.409.SETOR_EM_USO.lanternas-ocorrencias-usuarios rejeita exclusão de setor em uso', async () => {
    servidor.setScenario('excluirSetor.409.SETOR_EM_USO.lanternas-ocorrencias-usuarios')
    await expect(excluirSetor(2814)).rejects.toMatchObject({
      status: 409,
      codigo: 'SETOR_EM_USO',
    })
  })

  it('buscarSetor consulta setor por id contra o servidor de contrato', async () => {
    servidor.setScenario('consultarSetor.200')
    const setor = await buscarSetor(2814)
    expect(setor).toMatchObject({
      id: 2814,
    })
  })

  it('buscarSetor retorna null para setor inexistente (404)', async () => {
    servidor.setScenario('consultarSetor.404.NAO_ENCONTRADO.inexistente')
    const setor = await buscarSetor(9999)
    expect(setor).toBeNull()
  })

  it('buscarSetor com id inválido retorna null sem chamar o servidor', async () => {
    const setor = await buscarSetor(-1)
    expect(setor).toBeNull()
  })
})
