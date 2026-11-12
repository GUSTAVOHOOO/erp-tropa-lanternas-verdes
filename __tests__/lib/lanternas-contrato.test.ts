// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const fakeEnv = vi.hoisted(() => ({ apiUrl: 'http://127.0.0.1:39600' }))
vi.mock('@/lib/env', () => ({ get env() { return { API_URL: fakeEnv.apiUrl } } }))

import { ApiError } from '@/lib/api-error'
import { listarSetores } from '@/lib/setores'
import { buscarLanterna, listarLanternas, listarTodosLanternas } from '@/lib/lanternas'

const item = (id: string) => ({ id, codinome: id, identidadeCivil: null, especie: null, planetaNatal: null, setorId: null, status: 'ativo' as const, anoIngresso: null })

describe('serviços de Setores e Lanternas contra o contrato', () => {
  let servidor: { url: string; setScenario: (id: string) => void; close: () => Promise<void> }
  beforeAll(async () => {
    const { createContractServer } = await import('../../scripts/contrato/servidor.mjs')
    servidor = await createContractServer({ port: 39600 + (process.pid % 300) })
    fakeEnv.apiUrl = servidor.url
  })
  afterAll(async () => { await servidor?.close() })

  it('valida a lista pública de setores', async () => {
    servidor.setScenario('listarSetores.200')
    const setores = await listarSetores()
    expect(setores.length).toBeGreaterThan(0)
    expect(setores[0]).toHaveProperty('descricao')
  })

  it('lista lanternas e envia somente parâmetros do contrato', async () => {
    servidor.setScenario('listarLanternas.200')
    const pagina = await listarLanternas({ busca: 'kilo', status: 'ativo', setor: 0, ordenar: 'setor', ordem: 'desc', pagina: 2 })
    expect(pagina).toHaveProperty('itens')
    expect(pagina.meta).toMatchObject({ pagina: 1, limite: 20 })
  })

  it('propaga erro 500 da listagem', async () => {
    servidor.setScenario('listarLanternas.500.ERRO_INTERNO')
    await expect(listarLanternas()).rejects.toMatchObject({ status: 500, codigo: 'ERRO_INTERNO' })
    await expect(listarLanternas()).rejects.toBeInstanceOf(ApiError)
  })

  it('valida ficha completa e relações', async () => {
    servidor.setScenario('consultarFichaLanterna.200')
    await expect(buscarLanterna('hal-jordan')).resolves.toMatchObject({ id: 'hal-jordan', fontes: expect.any(Object), estatisticas: expect.any(Object) })
    servidor.setScenario('consultarFichaLanterna.200.mentor')
    await expect(buscarLanterna('hal-jordan')).resolves.toMatchObject({ mentor: expect.any(Object), aprendizes: expect.any(Array) })
    servidor.setScenario('consultarFichaLanterna.200.sem-setor')
    await expect(buscarLanterna('hal-jordan')).resolves.toMatchObject({ setorId: null })
  })

  it('mapeia ficha inexistente e slug inválido para null; slug inválido não chama API', async () => {
    servidor.setScenario('consultarFichaLanterna.404.NAO_ENCONTRADO.inexistente')
    await expect(buscarLanterna('inexistente')).resolves.toBeNull()
    const fetch = vi.spyOn(globalThis, 'fetch')
    await expect(buscarLanterna('Hal Jordan!')).resolves.toBeNull()
    expect(fetch).not.toHaveBeenCalled()
    fetch.mockRestore()
  })

  it('concatena páginas em listarTodosLanternas e para com paginas zero', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input))
      const pagina = Number(url.searchParams.get('pagina'))
      return new Response(JSON.stringify({ sucesso: true, dados: { itens: pagina === 1 ? [item('alpha')] : [item('bravo')], meta: { total: 2, pagina, limite: 50, paginas: 2 } } }), { status: 200 })
    })
    await expect(listarTodosLanternas()).resolves.toEqual([item('alpha'), item('bravo')])
    expect(fetch).toHaveBeenCalledTimes(2)
    fetch.mockImplementation(async () => new Response(JSON.stringify({ sucesso: true, dados: { itens: [], meta: { total: 0, pagina: 1, limite: 50, paginas: 0 } } }), { status: 200 }))
    await expect(listarTodosLanternas()).resolves.toEqual([])
    expect(fetch).toHaveBeenCalledTimes(3)
    fetch.mockRestore()
  })
})

