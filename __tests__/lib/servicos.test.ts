// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import db from '@/db.json'
import { ApiError } from '@/lib/api-error'
import { urlDaApi } from '@/lib/api'
import { listarSetores } from '@/lib/setores'
import { buscarLanterna, listarLanternas } from '@/lib/lanternas'
import { atualizarOcorrencia, buscarOcorrencia, criarOcorrencia, listarOcorrencias } from '@/lib/ocorrencias'
import { buscarUsuarioPorEmail } from '@/lib/usuarios'
import { ocorrenciaSchema } from '@/lib/schemas/ocorrencia'

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
    const url = urlDaApi('/ocorrencias', { setorId: '2814', status: undefined, vazio: '' })
    expect(url.toString()).toBe('http://localhost:3001/ocorrencias?setorId=2814')
  })

  test('sem API_URL explica o que falta', () => {
    vi.stubEnv('API_URL', '')
    expect(() => urlDaApi('/setores')).toThrow('API_URL não definido no .env.local')
  })
})

describe('leituras', () => {
  test('listarOcorrencias filtra, ordena da mais nova e não usa cache', async () => {
    fetchSimulado.mockResolvedValue(resposta(db.ocorrencias.slice(0, 2)))
    const lista = await listarOcorrencias({ setorId: '2814', status: 'aberta' })
    expect(lista).toHaveLength(2)
    const url = urlChamada()
    expect(url.pathname).toBe('/ocorrencias')
    expect(url.searchParams.get('setorId')).toBe('2814')
    expect(url.searchParams.get('status')).toBe('aberta')
    expect(url.searchParams.get('_sort')).toBe('criadaEm')
    expect(url.searchParams.get('_order')).toBe('desc')
    expect(opcoesChamada().cache).toBe('no-store')
  })

  test('sem filtro não manda setorId nem status', async () => {
    fetchSimulado.mockResolvedValue(resposta([]))
    await listarOcorrencias()
    expect(urlChamada().searchParams.has('setorId')).toBe(false)
    expect(urlChamada().searchParams.has('status')).toBe(false)
  })

  test('setores e lanternas usam revalidate de 60 segundos', async () => {
    fetchSimulado.mockResolvedValue(resposta(db.setores))
    await listarSetores()
    expect(opcoesChamada().next?.revalidate).toBe(60)
    fetchSimulado.mockReset()
    fetchSimulado.mockResolvedValue(resposta(db.lanternas))
    await listarLanternas({ setorId: '2814' })
    expect(urlChamada().searchParams.get('setorId')).toBe('2814')
    expect(opcoesChamada().next?.revalidate).toBe(60)
  })

  test('404 vira null; outros erros viram ApiError com o status', async () => {
    fetchSimulado.mockResolvedValue(resposta({}, 404))
    expect(await buscarOcorrencia('nao-existe')).toBeNull()
    fetchSimulado.mockResolvedValue(resposta({}, 500))
    await expect(buscarOcorrencia('o1')).rejects.toMatchObject({ status: 500 })
    await expect(buscarOcorrencia('o1')).rejects.toBeInstanceOf(ApiError)
    await expect(listarSetores()).rejects.toBeInstanceOf(ApiError)
  })

  test('id com caracteres especiais é codificado na URL', async () => {
    fetchSimulado.mockResolvedValue(resposta({}, 404))
    await buscarLanterna('a/b')
    expect(urlChamada().pathname).toBe('/lanternas/a%2Fb')
  })

  test('resposta fora do formato é recusada pelo Zod', async () => {
    fetchSimulado.mockResolvedValue(resposta([{ id: 'o1', titulo: 123 }]))
    await expect(listarOcorrencias()).rejects.toThrow()
  })

  test('falha de rede chega como erro (a tela mostra error.tsx)', async () => {
    fetchSimulado.mockRejectedValue(new TypeError('fetch failed'))
    await expect(listarLanternas()).rejects.toThrow('fetch failed')
  })
})

describe('escritas', () => {
  test('criarOcorrencia faz POST com JSON e devolve a criada', async () => {
    const { id, ...dados } = ocorrenciaSchema.parse(db.ocorrencias[1]) // o JSON vem com string genérica; o schema dá os tipos exatos
    fetchSimulado.mockResolvedValue(resposta({ id: 'novo123', ...dados }, 201))
    const criada = await criarOcorrencia(dados)
    expect(criada.id).toBe('novo123')
    expect(opcoesChamada().method).toBe('POST')
    expect(JSON.parse(String(opcoesChamada().body))).toEqual(dados)
    expect(id).toBe('o2')
  })

  test('atualizarOcorrencia faz PATCH só com os campos enviados', async () => {
    fetchSimulado.mockResolvedValue(resposta({ ...db.ocorrencias[1], status: 'resolvida' }))
    await atualizarOcorrencia('o2', { status: 'resolvida' })
    expect(urlChamada().pathname).toBe('/ocorrencias/o2')
    expect(opcoesChamada().method).toBe('PATCH')
    expect(JSON.parse(String(opcoesChamada().body))).toEqual({ status: 'resolvida' })
  })
})

describe('buscarUsuarioPorEmail', () => {
  test('normaliza espaços e maiúsculas antes de buscar', async () => {
    fetchSimulado.mockResolvedValue(resposta([db.usuarios[1]]))
    const usuario = await buscarUsuarioPorEmail('  Hal@OA.tropa ')
    expect(urlChamada().searchParams.get('email')).toBe('hal@oa.tropa')
    expect(usuario?.nome).toBe('Hal Jordan')
  })

  test('e-mail desconhecido devolve null', async () => {
    fetchSimulado.mockResolvedValue(resposta([]))
    expect(await buscarUsuarioPorEmail('ninguem@oa.tropa')).toBeNull()
  })
})
