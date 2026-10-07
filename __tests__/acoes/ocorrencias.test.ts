// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from 'vitest'
import db from '@/db.json'

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`NEXT_REDIRECT ${url}`) }),
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/dal', () => ({ verificarSessao: vi.fn(), exigirPapel: vi.fn() }))
vi.mock('@/lib/setores', () => ({ listarSetores: vi.fn() }))
vi.mock('@/lib/lanternas', () => ({ buscarLanterna: vi.fn() }))
vi.mock('@/lib/ocorrencias', () => ({ criarOcorrencia: vi.fn(), buscarOcorrencia: vi.fn(), atualizarOcorrencia: vi.fn() }))

import { revalidatePath } from 'next/cache'
import { verificarSessao } from '@/lib/dal'
import { listarSetores } from '@/lib/setores'
import { criarOcorrencia } from '@/lib/ocorrencias'
import { MENSAGEM_ERRO_API } from '@/lib/resultado-acao'
import type { Sessao } from '@/lib/sessao'
import { registrarOcorrencia } from '@/app/(painel)/painel/ocorrencias/actions'

const hal: Sessao = { id: 'u2', nome: 'Hal Jordan', papel: 'lanterna', setorId: '2814', lanternaId: 'hal-jordan', expiraEm: Date.now() + 60_000 }
const ganthet: Sessao = { id: 'u1', nome: 'Ganthet', papel: 'guardiao', setorId: null, lanternaId: null, expiraEm: Date.now() + 60_000 }
const valida = { titulo: 'Invasão em Oa', descricao: 'Muitos invasores na Bateria Central.', planeta: 'Oa', setorId: '674', gravidade: 'alta', envolvidos: '2' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(listarSetores).mockResolvedValue(db.setores)
  vi.mocked(criarOcorrencia).mockImplementation(async (dados) => ({ id: 'nova1', ...dados }))
})

describe('registrarOcorrencia', () => {
  test('confere a sessão antes de tudo', async () => {
    vi.mocked(verificarSessao).mockRejectedValue(new Error('NEXT_REDIRECT /login'))
    await expect(registrarOcorrencia(valida)).rejects.toThrow('NEXT_REDIRECT /login')
    expect(criarOcorrencia).not.toHaveBeenCalled()
  })

  test('Lanterna não escolhe setor: o enviado é trocado pelo da sessão', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(hal)
    await expect(registrarOcorrencia(valida)).rejects.toThrow('NEXT_REDIRECT /painel/ocorrencias/nova1')
    expect(vi.mocked(criarOcorrencia).mock.calls[0][0]).toMatchObject({
      setorId: '2814', status: 'aberta', responsavelId: null, resolucao: null, criadaPor: 'u2', envolvidos: 2,
    })
    expect(revalidatePath).toHaveBeenCalledWith('/painel', 'layout')
  })

  test('Guardião registra no setor escolhido, se ele existir', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(ganthet)
    await expect(registrarOcorrencia(valida)).rejects.toThrow('NEXT_REDIRECT')
    expect(vi.mocked(criarOcorrencia).mock.calls[0][0].setorId).toBe('674')
    const resultado = await registrarOcorrencia({ ...valida, setorId: '9999' })
    expect(resultado).toEqual({ ok: false, errors: { setorId: ['Escolha um setor válido.'] } })
  })

  test('dados inválidos voltam como erros de campo', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(hal)
    const resultado = await registrarOcorrencia({ ...valida, titulo: 'abc', envolvidos: '0' })
    expect(resultado.errors?.titulo?.[0]).toBe('O título precisa ter pelo menos 5 caracteres.')
    expect(resultado.errors?.envolvidos?.[0]).toBe('Informe quantos seres estão envolvidos (mínimo 1).')
    expect(criarOcorrencia).not.toHaveBeenCalled()
  })

  test('API fora do ar vira mensagem para humanos', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(verificarSessao).mockResolvedValue(hal)
    vi.mocked(criarOcorrencia).mockRejectedValue(new TypeError('fetch failed'))
    expect(await registrarOcorrencia(valida)).toEqual({ ok: false, erro: MENSAGEM_ERRO_API })
  })
})
