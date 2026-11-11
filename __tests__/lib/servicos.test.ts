// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { ApiError } from '@/lib/api-error'
import { urlDaApi } from '@/lib/api'
import { listarSetores } from '@/lib/setores'
import { buscarLanterna, listarLanternas } from '@/lib/lanternas'

const fetchSimulado = vi.fn()

function resposta(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
}
function urlChamada(): URL {
  return new URL(String(fetchSimulado.mock.calls[0][0]))
}
function opcoesChamada(): RequestInit & { next?: { revalidate?: number } } {
  return fetchSimulado.mock.calls[0][1]
}

beforeEach(() => {
  vi.stubEnv('API_URL', 'http://localhost:3001')
  vi.stubGlobal('fetch', fetchSimulado)
  fetchSimulado.mockReset()
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('urlDaApi', () => {
  test('monta a URL a partir do API_URL e ignora filtros vazios', () => {
    const url = urlDaApi('/setores', { setor: '2814', status: undefined, vazio: '' })
    expect(url.toString()).toBe('http://localhost:3001/setores?setor=2814')
  })

  test('sem API_URL explica o que falta', () => {
    vi.stubEnv('API_URL', '')
    expect(() => urlDaApi('/setores')).toThrow('API_URL não definido no .env.local')
  })
})

describe('leituras', () => {
  test('setores e lanternas usam revalidate de 60 segundos', async () => {
    fetchSimulado.mockResolvedValue(resposta({ sucesso: true, dados: [{ id: 2814, nome: 'Setor 2814', descricao: 'Setor espacial para testes.' }] }))
    await listarSetores()
    expect(opcoesChamada().next?.revalidate).toBe(60)
    fetchSimulado.mockReset()
    fetchSimulado.mockResolvedValue(resposta({ sucesso: true, dados: { itens: [], meta: { total: 0, pagina: 1, limite: 20, paginas: 0 } } }))
    await listarLanternas({ setor: 2814 })
    expect(urlChamada().searchParams.get('setor')).toBe('2814')
    expect(opcoesChamada().next?.revalidate).toBe(60)
  })

  test('404 vira null; outros erros viram ApiError com o status', async () => {
    fetchSimulado.mockResolvedValue(resposta({}, 404))
    expect(await buscarLanterna('desconhecido')).toBeNull()
    fetchSimulado.mockResolvedValue(resposta({}, 500))
    await expect(listarSetores()).rejects.toMatchObject({ status: 500 })
    await expect(listarSetores()).rejects.toBeInstanceOf(ApiError)
  })

  test('slug inválido não chama a API', async () => {
    await expect(buscarLanterna('a/b')).resolves.toBeNull()
    expect(fetchSimulado).not.toHaveBeenCalled()
  })

  test('resposta fora do formato é recusada pelo Zod', async () => {
    fetchSimulado.mockResolvedValue(resposta({ sucesso: true, dados: [{ id: 'invalido' }] }))
    await expect(listarSetores()).rejects.toThrow()
  })

  test('falha de rede chega como erro (a tela mostra error.tsx)', async () => {
    fetchSimulado.mockRejectedValue(new TypeError('fetch failed'))
    await expect(listarLanternas()).rejects.toMatchObject({ status: 0, codigo: 'FALHA_REDE' })
  })
})
