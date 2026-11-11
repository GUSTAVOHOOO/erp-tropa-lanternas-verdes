// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ApiError } from '@/lib/api-error'
import { verificarSessao } from '@/lib/dal'
import { criarComentario, excluirComentario } from '@/lib/comentarios'
import type { Comentario } from '@/lib/schemas/comentario'
import type { Sessao } from '@/lib/schemas/usuario'
import { apagarComentario, comentar } from '@/app/(painel)/painel/ocorrencias/comentarios-actions'

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`)
  }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/dal', () => ({
  verificarSessao: vi.fn(),
  exigirPapel: vi.fn(),
}))

vi.mock('@/lib/comentarios', () => ({
  criarComentario: vi.fn(),
  excluirComentario: vi.fn(),
}))

const OCORRENCIA_ID = '00000000-0000-4000-8000-000000000201'
const COMENTARIO_ID = '00000000-0000-4000-8000-000000000401'

const sessaoHal: Sessao = {
  id: '00000000-0000-4000-8000-000000000002',
  nome: 'Hal Jordan',
  email: 'hal@oa.tropa',
  papel: 'lanterna',
  setorId: 2814,
  lanternaId: 'hal-jordan',
  criadoEm: '2026-01-01T00:00:00.000Z',
}

const comentarioCriado: Comentario = {
  id: COMENTARIO_ID,
  ocorrenciaId: OCORRENCIA_ID,
  autorId: sessaoHal.id,
  texto: 'Relatório preliminar de patrulha.',
  criadoEm: '2026-11-10T10:00:00.000Z',
  autor: {
    id: sessaoHal.id,
    nome: sessaoHal.nome,
    papel: sessaoHal.papel,
  },
}

describe('Server Action comentar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(verificarSessao).mockResolvedValue(sessaoHal)
    vi.mocked(criarComentario).mockResolvedValue(comentarioCriado)
  })

  it('exige sessão antes de validar dados e escrever', async () => {
    vi.mocked(verificarSessao).mockRejectedValueOnce(new Error('NEXT_REDIRECT /login'))
    await expect(comentar(OCORRENCIA_ID, { texto: 'Texto válido' })).rejects.toThrow('NEXT_REDIRECT /login')
    expect(criarComentario).not.toHaveBeenCalled()
  })

  it('rejeita texto vazio ou apenas espaços devolvendo errors.texto', async () => {
    const resultado = await comentar(OCORRENCIA_ID, { texto: '   ' })
    expect(resultado).toEqual({
      ok: false,
      errors: {
        texto: expect.arrayContaining([expect.stringContaining('Escreva o comentário.')]),
      },
    })
    expect(criarComentario).not.toHaveBeenCalled()
  })

  it('rejeita texto longo com mais de 1000 caracteres devolvendo errors.texto', async () => {
    const resultado = await comentar(OCORRENCIA_ID, { texto: 'x'.repeat(1001) })
    expect(resultado).toEqual({
      ok: false,
      errors: {
        texto: expect.arrayContaining([expect.stringContaining('1000')]),
      },
    })
    expect(criarComentario).not.toHaveBeenCalled()
  })

  it('em caso de sucesso revalida a página da ocorrência e devolve ok sem redirect', async () => {
    const resultado = await comentar(OCORRENCIA_ID, { texto: 'Novo comentário de teste' })
    expect(resultado).toEqual({ ok: true })
    expect(revalidatePath).toHaveBeenCalledWith(`/painel/ocorrencias/${OCORRENCIA_ID}`)
    expect(redirect).not.toHaveBeenCalled()
  })

  it('redireciona para /sessao-expirada em caso de erro 401', async () => {
    vi.mocked(criarComentario).mockRejectedValueOnce(new ApiError(401, 'NAO_AUTENTICADO'))
    await expect(comentar(OCORRENCIA_ID, { texto: 'Comentário válido' })).rejects.toThrow('NEXT_REDIRECT /sessao-expirada')
    expect(redirect).toHaveBeenCalledWith('/sessao-expirada')
  })

  it('trata erro 404 informando que o comentário ou ocorrência não existe mais', async () => {
    vi.mocked(criarComentario).mockRejectedValueOnce(new ApiError(404, 'NAO_ENCONTRADO'))
    const resultado = await comentar(OCORRENCIA_ID, { texto: 'Comentário válido' })
    expect(resultado).toEqual({
      ok: false,
      erro: 'Este comentário ou ocorrência não existe mais.',
    })
  })

  it('trata ID inválido de ocorrência como 404 sem chamar a API', async () => {
    const resultado = await comentar('id-invalido', { texto: 'Comentário válido' })
    expect(resultado).toEqual({
      ok: false,
      erro: 'Este comentário ou ocorrência não existe mais.',
    })
    expect(criarComentario).not.toHaveBeenCalled()
  })

  it('nunca anuncia sucesso em erro inesperado ou de rede', async () => {
    vi.mocked(criarComentario).mockRejectedValueOnce(new ApiError(500, 'ERRO_INTERNO'))
    const resultado = await comentar(OCORRENCIA_ID, { texto: 'Comentário válido' })
    expect(resultado.ok).toBe(false)
  })
})

describe('Server Action apagarComentario', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(verificarSessao).mockResolvedValue(sessaoHal)
    vi.mocked(excluirComentario).mockResolvedValue(undefined)
  })

  it('exige sessão antes de apagar comentário', async () => {
    vi.mocked(verificarSessao).mockRejectedValueOnce(new Error('NEXT_REDIRECT /login'))
    await expect(apagarComentario(OCORRENCIA_ID, COMENTARIO_ID)).rejects.toThrow('NEXT_REDIRECT /login')
    expect(excluirComentario).not.toHaveBeenCalled()
  })

  it('em caso de sucesso revalida o detalhe e devolve ok', async () => {
    const resultado = await apagarComentario(OCORRENCIA_ID, COMENTARIO_ID)
    expect(resultado).toEqual({ ok: true })
    expect(revalidatePath).toHaveBeenCalledWith(`/painel/ocorrencias/${OCORRENCIA_ID}`)
    expect(redirect).not.toHaveBeenCalled()
  })

  it('redireciona para /sessao-expirada em caso de erro 401', async () => {
    vi.mocked(excluirComentario).mockRejectedValueOnce(new ApiError(401, 'NAO_AUTENTICADO'))
    await expect(apagarComentario(OCORRENCIA_ID, COMENTARIO_ID)).rejects.toThrow('NEXT_REDIRECT /sessao-expirada')
    expect(redirect).toHaveBeenCalledWith('/sessao-expirada')
  })

  it('trata erro 403 informando que só o autor ou um Guardião pode apagar', async () => {
    vi.mocked(excluirComentario).mockRejectedValueOnce(new ApiError(403, 'SEM_PERMISSAO'))
    const resultado = await apagarComentario(OCORRENCIA_ID, COMENTARIO_ID)
    expect(resultado).toEqual({
      ok: false,
      erro: 'Só o autor ou um Guardião pode apagar este comentário.',
    })
  })

  it('trata erro 404 informando que o comentário ou ocorrência não existe mais', async () => {
    vi.mocked(excluirComentario).mockRejectedValueOnce(new ApiError(404, 'NAO_ENCONTRADO'))
    const resultado = await apagarComentario(OCORRENCIA_ID, COMENTARIO_ID)
    expect(resultado).toEqual({
      ok: false,
      erro: 'Este comentário ou ocorrência não existe mais.',
    })
  })

  it('trata IDs inválidos como erro 404 sem chamar a API', async () => {
    const resOcorrenciaInvalida = await apagarComentario('id-invalido', COMENTARIO_ID)
    expect(resOcorrenciaInvalida).toEqual({
      ok: false,
      erro: 'Este comentário ou ocorrência não existe mais.',
    })
    const resComentarioInvalido = await apagarComentario(OCORRENCIA_ID, 'id-invalido')
    expect(resComentarioInvalido).toEqual({
      ok: false,
      erro: 'Este comentário ou ocorrência não existe mais.',
    })
    expect(excluirComentario).not.toHaveBeenCalled()
  })

  it('nunca anuncia sucesso em erro inesperado da API', async () => {
    vi.mocked(excluirComentario).mockRejectedValueOnce(new ApiError(500, 'ERRO_INTERNO'))
    const resultado = await apagarComentario(OCORRENCIA_ID, COMENTARIO_ID)
    expect(resultado.ok).toBe(false)
  })
})
