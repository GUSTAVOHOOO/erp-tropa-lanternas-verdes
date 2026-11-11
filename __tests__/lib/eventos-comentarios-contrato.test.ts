// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const fakeEnv = vi.hoisted(() => ({ apiUrl: 'http://127.0.0.1:39850' }))
vi.mock('@/lib/env', () => ({
  get env() {
    return { API_URL: fakeEnv.apiUrl }
  },
}))
vi.mock('@/lib/dal', () => ({
  lerTokenObrigatorio: vi.fn(async () => 'fake-token'),
}))

import { ApiError } from '@/lib/api-error'
import { listarEventos } from '@/lib/eventos'
import { criarComentario, excluirComentario, listarComentarios } from '@/lib/comentarios'

const OCORRENCIA_ID = '00000000-0000-4000-8000-000000000201'
const COMENTARIO_ID = '00000000-0000-4000-8000-000000000401'

describe('serviços de Eventos e Comentários contra o contrato', () => {
  let servidor: { url: string; setScenario: (id: string) => void; reset: () => void; close: () => Promise<void> }

  beforeAll(async () => {
    const { createContractServer } = await import('../../scripts/contrato/servidor.mjs')
    servidor = await createContractServer({ port: 39850 + (process.pid % 100) })
    fakeEnv.apiUrl = servidor.url
  })

  afterAll(async () => {
    await servidor?.close()
  })

  beforeEach(() => {
    servidor.reset()
  })

  it('eventos da página validam com todos os tipos presentes no exemplo', async () => {
    servidor.setScenario('listarEventos.200')
    const pagina = await listarEventos(OCORRENCIA_ID)
    expect(pagina).toHaveProperty('itens')
    expect(pagina).toHaveProperty('meta')
    expect(pagina.itens.length).toBeGreaterThan(0)
    const tipos = pagina.itens.map((evento) => evento.tipo)
    expect(tipos).toEqual(expect.arrayContaining(['criada', 'atribuida', 'status_alterado', 'comentario_apagado']))
    for (const evento of pagina.itens) {
      expect(evento.id).toBeDefined()
      expect(evento.ocorrenciaId).toBe(OCORRENCIA_ID)
      expect(evento.autor).toHaveProperty('nome')
      expect(evento.dados).toBeDefined()
    }
  })

  it('comentários da página validam', async () => {
    servidor.setScenario('listarComentarios.200')
    const pagina = await listarComentarios(OCORRENCIA_ID)
    expect(pagina).toHaveProperty('itens')
    expect(pagina).toHaveProperty('meta')
    expect(pagina.itens.length).toBeGreaterThan(0)
    expect(pagina.itens[0]).toHaveProperty('texto')
    expect(pagina.itens[0].autor).toHaveProperty('papel')
  })

  it('criar comentário devolve 201 e dados validados', async () => {
    servidor.setScenario('criarComentario.201')
    const comentario = await criarComentario(OCORRENCIA_ID, 'Comentário fictício de contrato.')
    expect(comentario.id).toBeDefined()
    expect(comentario.ocorrenciaId).toBe(OCORRENCIA_ID)
    expect(comentario.texto).toBe('Comentário fictício de contrato.')
    expect(comentario.autor.nome).toBeDefined()
  })

  it('excluir comentário devolve 204 sem corpo', async () => {
    servidor.setScenario('excluirComentario.204.autor')
    await expect(excluirComentario(COMENTARIO_ID)).resolves.toBeUndefined()
  })

  it('outro autor tentando excluir comentário recebe 403 e lança ApiError 403', async () => {
    servidor.setScenario('excluirComentario.403.SEM_PERMISSAO.outro-autor')
    await expect(excluirComentario(COMENTARIO_ID)).rejects.toMatchObject({
      status: 403,
      codigo: 'SEM_PERMISSAO',
    })
    await expect(excluirComentario(COMENTARIO_ID)).rejects.toBeInstanceOf(ApiError)
  })

  it('comentário inexistente recebe 404 e lança ApiError 404', async () => {
    servidor.setScenario('excluirComentario.404.NAO_ENCONTRADO.inexistente')
    const inexistenteId = '00000000-0000-4000-8000-000000000990'
    await expect(excluirComentario(inexistenteId)).rejects.toMatchObject({
      status: 404,
      codigo: 'NAO_ENCONTRADO',
    })
    await expect(excluirComentario(inexistenteId)).rejects.toBeInstanceOf(ApiError)
  })

  it('ocorrência de outro setor recebe 404 e lança ApiError 404 ao listar eventos', async () => {
    servidor.setScenario('listarEventos.404.NAO_ENCONTRADO.outro-setor')
    await expect(listarEventos(OCORRENCIA_ID)).rejects.toMatchObject({
      status: 404,
      codigo: 'NAO_ENCONTRADO',
    })
  })

  it('UUID inválido não faz request e lança ApiError 404', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    await expect(listarEventos('uuid-invalido')).rejects.toMatchObject({
      status: 404,
      codigo: 'NAO_ENCONTRADO',
    })
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})
