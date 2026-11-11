// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ApiError } from '@/lib/api-error'
import { verificarSessao } from '@/lib/dal'
import { criarOcorrencia } from '@/lib/ocorrencias'
import { MENSAGEM_ERRO_API } from '@/lib/resultado-acao'
import type { Ocorrencia } from '@/lib/schemas/ocorrencia'
import type { Sessao } from '@/lib/schemas/usuario'
import { registrarOcorrencia } from '@/app/(painel)/painel/ocorrencias/actions'

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

vi.mock('@/lib/ocorrencias', () => ({
  criarOcorrencia: vi.fn(),
  buscarOcorrencia: vi.fn(),
  alterarStatusOcorrencia: vi.fn(),
  definirResponsavel: vi.fn(),
  editarOcorrencia: vi.fn(),
  excluirOcorrencia: vi.fn(),
}))

const hal: Sessao = {
  id: '00000000-0000-4000-8000-000000000002',
  nome: 'Hal Jordan',
  email: 'hal@oa.tropa',
  papel: 'lanterna',
  setorId: 2814,
  lanternaId: 'hal-jordan',
  criadoEm: '2026-01-01T00:00:00.000Z',
}

const ganthet: Sessao = {
  id: '00000000-0000-4000-8000-000000000001',
  nome: 'Ganthet',
  email: 'ganthet@oa.tropa',
  papel: 'guardiao',
  setorId: null,
  lanternaId: null,
  criadoEm: '2026-01-01T00:00:00.000Z',
}

const ocorrenciaCriada: Ocorrencia = {
  id: '00000000-0000-4000-8000-000000000101',
  titulo: 'Invasão em Oa',
  descricao: 'Muitos invasores na Bateria Central de Oa.',
  planeta: 'Oa',
  setorId: 2814,
  gravidade: 'alta',
  status: 'aberta',
  envolvidos: 2,
  responsavelId: null,
  resolucao: null,
  criadaPorId: '00000000-0000-4000-8000-000000000002',
  criadaEm: '2026-01-01T00:00:00.000Z',
  resolvidaEm: null,
  prazoEm: '2026-01-03T00:00:00.000Z',
  vencida: false,
}

const dadosValidos = {
  titulo: 'Invasão em Oa',
  descricao: 'Muitos invasores na Bateria Central de Oa.',
  planeta: 'Oa',
  gravidade: 'alta',
  envolvidos: '2',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(criarOcorrencia).mockResolvedValue(ocorrenciaCriada)
})

describe('registrarOcorrencia', () => {
  test('sem sessão: lança redirect/erro do verificarSessao sem chamar criarOcorrencia', async () => {
    vi.mocked(verificarSessao).mockRejectedValue(new Error('NEXT_REDIRECT /login'))
    await expect(registrarOcorrencia(dadosValidos)).rejects.toThrow('NEXT_REDIRECT /login')
    expect(criarOcorrencia).not.toHaveBeenCalled()
  })

  test('dados inválidos (título curto, envolvidos 0): erro de validação sem chamar criarOcorrencia', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(hal)
    const resultado = await registrarOcorrencia({
      ...dadosValidos,
      titulo: 'abc',
      envolvidos: '0',
    })
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      expect(resultado.errors?.titulo?.[0]).toBe('O título precisa ter pelo menos 5 caracteres.')
      expect(resultado.errors?.envolvidos?.[0]).toBe('Informe quantos seres estão envolvidos (mínimo 1).')
    }
    expect(criarOcorrencia).not.toHaveBeenCalled()
  })

  test('Lanterna envia formulário COM setorId: corpo enviado a criarOcorrencia NÃO tem setorId', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(hal)
    await expect(registrarOcorrencia({ ...dadosValidos, setorId: '674' })).rejects.toThrow(
      'NEXT_REDIRECT /painel/ocorrencias/00000000-0000-4000-8000-000000000101',
    )
    expect(criarOcorrencia).toHaveBeenCalledWith({
      titulo: 'Invasão em Oa',
      descricao: 'Muitos invasores na Bateria Central de Oa.',
      planeta: 'Oa',
      gravidade: 'alta',
      envolvidos: 2,
    })
    expect(revalidatePath).toHaveBeenCalledWith('/painel', 'layout')
    expect(redirect).toHaveBeenCalledWith('/painel/ocorrencias/00000000-0000-4000-8000-000000000101')
  })

  test('Guardião envia SEM setorId: erro de validação em setorId sem chamar criarOcorrencia', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(ganthet)
    const resultado = await registrarOcorrencia({ ...dadosValidos, setorId: '' })
    expect(resultado).toEqual({
      ok: false,
      errors: { setorId: ['Escolha o setor da ocorrência.'] },
    })
    expect(criarOcorrencia).not.toHaveBeenCalled()
  })

  test('Guardião envia com setorId (inclusive 0): corpo enviado a criarOcorrencia tem setorId numérico', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(ganthet)
    await expect(registrarOcorrencia({ ...dadosValidos, setorId: '0' })).rejects.toThrow(
      'NEXT_REDIRECT /painel/ocorrencias/00000000-0000-4000-8000-000000000101',
    )
    expect(criarOcorrencia).toHaveBeenCalledWith({
      titulo: 'Invasão em Oa',
      descricao: 'Muitos invasores na Bateria Central de Oa.',
      planeta: 'Oa',
      gravidade: 'alta',
      envolvidos: 2,
      setorId: 0,
    })
  })

  test('sucesso: revalidatePath e redirect para o detalhe da ocorrência criada', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(ganthet)
    await expect(registrarOcorrencia({ ...dadosValidos, setorId: 2814 })).rejects.toThrow(
      'NEXT_REDIRECT /painel/ocorrencias/00000000-0000-4000-8000-000000000101',
    )
    expect(revalidatePath).toHaveBeenCalledWith('/painel', 'layout')
    expect(redirect).toHaveBeenCalledWith('/painel/ocorrencias/00000000-0000-4000-8000-000000000101')
  })

  test('ApiError 401 redireciona para /sessao-expirada', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(hal)
    vi.mocked(criarOcorrencia).mockRejectedValue(new ApiError(401, 'NAO_AUTENTICADO'))
    await expect(registrarOcorrencia(dadosValidos)).rejects.toThrow('NEXT_REDIRECT /sessao-expirada')
    expect(redirect).toHaveBeenCalledWith('/sessao-expirada')
  })

  test('ApiError 403 redireciona para /acesso-negado', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(hal)
    vi.mocked(criarOcorrencia).mockRejectedValue(new ApiError(403, 'SEM_PERMISSAO'))
    await expect(registrarOcorrencia(dadosValidos)).rejects.toThrow('NEXT_REDIRECT /acesso-negado')
    expect(redirect).toHaveBeenCalledWith('/acesso-negado')
  })

  test('ApiError 500 ou falha de rede vira erro amigável geral', async () => {
    vi.mocked(verificarSessao).mockResolvedValue(hal)
    vi.mocked(criarOcorrencia).mockRejectedValue(new ApiError(500, 'ERRO_INTERNO'))
    const resultado = await registrarOcorrencia(dadosValidos)
    expect(resultado).toEqual({ ok: false, erro: MENSAGEM_ERRO_API })
  })
})
