// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import * as z from 'zod'
import { ApiError, FALHA_REDE, RESPOSTA_INVALIDA } from '@/lib/api-error'
import { requisitarApi, requisitarApiSemConteudo } from '@/lib/api'
import { paginaDe } from '@/lib/schemas/paginacao'

const fakeEnv = vi.hoisted(() => ({ apiUrl: 'http://127.0.0.1:39000' }))
vi.mock('@/lib/env', () => ({ get env() { return { API_URL: fakeEnv.apiUrl } } }))

const objetoSchema = z.object({ id: z.number(), nome: z.string() }).strict()
const setorSchema = z.object({ id: z.number().int().min(0).max(9999), nome: z.string().min(2).max(60), descricao: z.string().min(10).max(300) }).strict()
const listaSchema = z.array(objetoSchema)
const resposta = (dados: unknown, status = 200) => new Response(JSON.stringify({ sucesso: true, dados }), { status, headers: { 'content-type': 'application/json' } })
const erro = (status: number, codigo: string, detalhes?: unknown) => new Response(JSON.stringify({ sucesso: false, erro: { status, mensagem: 'falha', codigo, ...(detalhes === undefined ? {} : { detalhes }) }, caminho: '/recurso', timestamp: '2026-11-11T00:00:00Z' }), { status })

describe('requisitarApi', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

  it('desembrulha objeto, lista, lista vazia e página validada', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(resposta({ id: 1, nome: 'A' })).mockResolvedValueOnce(resposta([{ id: 1, nome: 'A' }])).mockResolvedValueOnce(resposta([])).mockResolvedValueOnce(resposta({ itens: [], meta: { total: 0, pagina: 1, limite: 20, paginas: 0 } }))
    vi.stubGlobal('fetch', fetch)
    await expect(requisitarApi('/x', objetoSchema, { cache: { cache: 'no-store' } })).resolves.toEqual({ id: 1, nome: 'A' })
    await expect(requisitarApi('/x', listaSchema, { cache: { cache: 'no-store' } })).resolves.toEqual([{ id: 1, nome: 'A' }])
    await expect(requisitarApi('/x', listaSchema, { cache: { cache: 'no-store' } })).resolves.toEqual([])
    await expect(requisitarApi('/x', paginaDe(objetoSchema), { cache: { cache: 'no-store' } })).resolves.toEqual({ itens: [], meta: { total: 0, pagina: 1, limite: 20, paginas: 0 } })
  })

  it('trata 204, corpo ilegível e envelopes/schemas incompatíveis como resposta inválida', async () => {
    const json = vi.fn()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, status: 204, json }).mockResolvedValueOnce({ ok: true, status: 204, json }).mockResolvedValueOnce({ ok: true, status: 200, json: vi.fn().mockRejectedValue(new SyntaxError()) }).mockResolvedValueOnce(new Response('{"dados":{}}')).mockResolvedValueOnce(resposta({ id: 'errado', nome: 'A' })))
    await expect(requisitarApiSemConteudo('/x', { metodo: 'DELETE', cache: { cache: 'no-store' } })).resolves.toBeUndefined()
    expect(json).not.toHaveBeenCalled()
    for (const status of [204, 200, 200, 200]) await expect(requisitarApi('/x', objetoSchema, { cache: { cache: 'no-store' } })).rejects.toMatchObject({ status, codigo: RESPOSTA_INVALIDA })
  })

  it('mapeia falha de rede e erros HTTP preservando código/detalhes quando contratuais', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('offline')))
    await expect(requisitarApi('/x', objetoSchema, { cache: { cache: 'no-store' } })).rejects.toMatchObject({ status: 0, codigo: FALHA_REDE })
    for (const status of [400, 401, 403, 404, 409, 422, 429, 500]) {
      const codigo = `CODIGO_${status}`
      const detalhes = status === 400 ? [{ campo: 'nome', mensagens: ['inválido'] }] : undefined
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(erro(status, codigo, detalhes)))
      await expect(requisitarApi('/x', objetoSchema, { cache: { cache: 'no-store' } })).rejects.toMatchObject({ status, codigo, detalhes: detalhes ?? [] })
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('bad gateway', { status: 502 })))
    await expect(requisitarApi('/x', objetoSchema, { cache: { cache: 'no-store' } })).rejects.toMatchObject({ status: 502, codigo: undefined })
  })

  it('serializa método, cabeçalhos, corpo, token, consulta e cache', async () => {
    const fetch = vi.fn().mockResolvedValue(resposta({ id: 1, nome: 'A' }))
    vi.stubGlobal('fetch', fetch)
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    await requisitarApi('/recurso', objetoSchema, { metodo: 'PATCH', corpo: { nome: 'segredo-corpo' }, token: 'jwt-secreto', consulta: { n: 4, ativo: false, vazio: '', nulo: null, ausente: undefined }, cache: { cache: 'no-store' } })
    const [url, init] = fetch.mock.calls[0] as [URL, RequestInit]
    expect(url.toString()).toBe('http://127.0.0.1:39000/recurso?n=4&ativo=false')
    expect(init).toMatchObject({ method: 'PATCH', cache: 'no-store', body: '{"nome":"segredo-corpo"}', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer jwt-secreto' } })
    fetch.mockResolvedValueOnce(resposta({ id: 1, nome: 'A' }))
    await requisitarApi('/recurso', objetoSchema, { cache: { revalidate: 60, tags: ['recurso'] } })
    expect(fetch.mock.calls[1]?.[1]).toMatchObject({ next: { revalidate: 60, tags: ['recurso'] } })
    fetch.mockResolvedValueOnce(erro(500, 'ERRO_INTERNO'))
    await expect(requisitarApi('/privado?token=jwt-secreto', objetoSchema, { token: 'jwt-secreto', cache: { cache: 'no-store' } })).rejects.toBeInstanceOf(ApiError)
    const logText = JSON.stringify(log.mock.calls)
    expect(logText).not.toContain('jwt-secreto')
    expect(logText).not.toContain('segredo-corpo')
    expect(logText).not.toContain('token=')
  })
})

describe('cliente contra o servidor de contrato', () => {
  let servidor: { url: string; setScenario: (id: string) => void; close: () => Promise<void> }
  beforeAll(async () => {
    const { createContractServer: iniciarFake } = await import('../../scripts/contrato/servidor.mjs')
    const createContractServer = iniciarFake as unknown as (opcoes: { port: number }) => Promise<{ url: string; setScenario: (id: string) => void; close: () => Promise<void> }>
    servidor = await createContractServer({ port: 39000 + (process.pid % 1000) })
    fakeEnv.apiUrl = servidor.url
  })
  afterAll(async () => { await servidor?.close() })

  it('consome cenários reais de lista, erros e 204 do contrato', async () => {
    await expect(requisitarApi('/setores', z.array(setorSchema), { cache: { cache: 'no-store' } })).resolves.toEqual(expect.any(Array))
    servidor.setScenario('listarSetores.500.ERRO_INTERNO')
    await expect(requisitarApi('/setores', z.array(setorSchema), { cache: { cache: 'no-store' } })).rejects.toMatchObject({ status: 500, codigo: 'ERRO_INTERNO' })
    servidor.setScenario('excluirOcorrencia.204')
    await expect(requisitarApiSemConteudo('/ocorrencias/00000000-0000-4000-8000-000000000001', { metodo: 'DELETE', cache: { cache: 'no-store' } })).resolves.toBeUndefined()
    servidor.setScenario('excluirOcorrencia.404.NAO_ENCONTRADO.inexistente')
    await expect(requisitarApiSemConteudo('/ocorrencias/00000000-0000-4000-8000-000000000001', { metodo: 'DELETE', cache: { cache: 'no-store' } })).rejects.toMatchObject({ status: 404, codigo: 'NAO_ENCONTRADO' })
    servidor.setScenario('listarSetores.200')
    await expect(requisitarApi('/setores', z.array(setorSchema), { consulta: { foo: 'x' }, cache: { cache: 'no-store' } })).rejects.toMatchObject({ status: 400, codigo: 'DADOS_INVALIDOS' })
  })
})
