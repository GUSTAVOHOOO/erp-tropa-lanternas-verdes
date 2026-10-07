// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from 'vitest'
import db from '@/db.json'

vi.mock('next/navigation', () => ({ redirect: vi.fn((url: string) => { throw new Error(`NEXT_REDIRECT ${url}`) }) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/dal', () => ({ verificarSessao: vi.fn(), exigirPapel: vi.fn() }))
vi.mock('@/lib/setores', () => ({ listarSetores: vi.fn() }))
vi.mock('@/lib/lanternas', () => ({ buscarLanterna: vi.fn() }))
vi.mock('@/lib/ocorrencias', () => ({ criarOcorrencia: vi.fn(), buscarOcorrencia: vi.fn(), atualizarOcorrencia: vi.fn() }))

import { exigirPapel, verificarSessao } from '@/lib/dal'
import { buscarLanterna } from '@/lib/lanternas'
import { atualizarOcorrencia, buscarOcorrencia } from '@/lib/ocorrencias'
import { MENSAGEM_ERRO_API } from '@/lib/resultado-acao'
import { lanternaSchema } from '@/lib/schemas/lanterna'
import { ocorrenciaSchema } from '@/lib/schemas/ocorrencia'
import type { Sessao } from '@/lib/sessao'
import { atribuirResponsavel, atualizarStatus } from '@/app/(painel)/painel/ocorrencias/actions'

const hal: Sessao = { id: 'u2', nome: 'Hal Jordan', papel: 'lanterna', setorId: '2814', lanternaId: 'hal-jordan', expiraEm: Date.now() + 60_000 }
const ganthet: Sessao = { id: 'u1', nome: 'Ganthet', papel: 'guardiao', setorId: null, lanternaId: null, expiraEm: Date.now() + 60_000 }
const o2 = ocorrenciaSchema.parse(db.ocorrencias[1])
const o7 = ocorrenciaSchema.parse(db.ocorrencias[6])
const lanterna = (id: string) => lanternaSchema.parse(db.lanternas.find((l) => l.id === id))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(atualizarOcorrencia).mockResolvedValue(o2)
})

describe('atualizarStatus', () => {
  test('Lanterna muda status no próprio setor; resolução só fica se resolvida', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(hal)
    vi.mocked(buscarOcorrencia).mockResolvedValue(o2)
    expect(await atualizarStatus('o2', { status: 'em_andamento', resolucao: 'texto esquecido no campo' })).toEqual({ ok: true })
    expect(atualizarOcorrencia).toHaveBeenCalledWith('o2', { status: 'em_andamento', resolucao: null })
  })
  test('Lanterna não altera ocorrência de outro setor', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(hal)
    vi.mocked(buscarOcorrencia).mockResolvedValue(o7)
    expect(await atualizarStatus('o7', { status: 'resolvida', resolucao: 'Resolvido por quem não devia.' })).toEqual({ ok: false, erro: 'Você não pode alterar ocorrências de outro setor.' })
    expect(atualizarOcorrencia).not.toHaveBeenCalled()
  })
  test('resolvida sem explicação volta como erro no campo', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(hal)
    const resultado = await atualizarStatus('o2', { status: 'resolvida', resolucao: '' })
    expect(resultado.errors?.resolucao?.[0]).toBe('Explique em pelo menos 10 caracteres como a ocorrência foi resolvida.')
  })
  test('id inválido ou ocorrência inexistente', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(ganthet)
    expect(await atualizarStatus(42, { status: 'aberta', resolucao: '' })).toEqual({ ok: false, erro: 'Ocorrência inválida.' })
    vi.mocked(buscarOcorrencia).mockResolvedValue(null)
    expect(await atualizarStatus('zzz', { status: 'aberta', resolucao: '' })).toEqual({ ok: false, erro: 'Ocorrência não encontrada.' })
  })
  test('API fora do ar vira mensagem para humanos', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(verificarSessao).mockResolvedValue(ganthet)
    vi.mocked(buscarOcorrencia).mockRejectedValue(new TypeError('fetch failed'))
    expect(await atualizarStatus('o2', { status: 'aberta', resolucao: '' })).toEqual({ ok: false, erro: MENSAGEM_ERRO_API })
  })
})

describe('atribuirResponsavel', () => {
  test('só Guardião: exigirPapel barra antes de tudo', async () => {
    vi.mocked(exigirPapel).mockRejectedValue(new Error('NEXT_REDIRECT /acesso-negado'))
    await expect(atribuirResponsavel('o2', { responsavelId: 'hal-jordan' })).rejects.toThrow('NEXT_REDIRECT /acesso-negado')
    expect(exigirPapel).toHaveBeenCalledWith('guardiao')
    expect(atualizarOcorrencia).not.toHaveBeenCalled()
  })
  test('lanterna de outro setor é recusado no campo', async () => {
    vi.mocked(exigirPapel).mockResolvedValue(ganthet)
    vi.mocked(buscarOcorrencia).mockResolvedValue(o2)
    vi.mocked(buscarLanterna).mockResolvedValue(lanterna('kilowog'))
    expect(await atribuirResponsavel('o2', { responsavelId: 'kilowog' })).toEqual({ ok: false, errors: { responsavelId: ['Escolha um lanterna do setor desta ocorrência.'] } })
  })
  test('atribui e volta para o detalhe', async () => {
    vi.mocked(exigirPapel).mockResolvedValue(ganthet)
    vi.mocked(buscarOcorrencia).mockResolvedValue(o2)
    vi.mocked(buscarLanterna).mockResolvedValue(lanterna('guy-gardner'))
    await expect(atribuirResponsavel('o2', { responsavelId: 'guy-gardner' })).rejects.toThrow('NEXT_REDIRECT /painel/ocorrencias/o2')
    expect(atualizarOcorrencia).toHaveBeenCalledWith('o2', { responsavelId: 'guy-gardner' })
  })
})
