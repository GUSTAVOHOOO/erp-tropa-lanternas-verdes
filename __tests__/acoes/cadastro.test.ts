// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api-error'
import { MENSAGEM_ERRO_API } from '@/lib/resultado-acao'

const { redirect, cadastrarConta } = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`)
  }),
  cadastrarConta: vi.fn(),
}))

vi.mock('next/navigation', () => ({ redirect }))
vi.mock('@/lib/cadastro', () => ({ cadastrarConta }))

import { cadastrar } from '@/app/(site)/cadastro/actions'

describe('cadastrar action', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inválido devolve errors sem chamar API', async () => {
    const resultado = await cadastrar({ nome: '', email: 'invalido', senha: '123', setorId: '' })
    expect(resultado.ok).toBe(false)
    expect(resultado.errors?.nome).toBeDefined()
    expect(resultado.errors?.email).toBeDefined()
    expect(resultado.errors?.senha).toBeDefined()
    expect(resultado.errors?.setorId).toBeDefined()
    expect(cadastrarConta).not.toHaveBeenCalled()
  })

  it('senha de 73 bytes dá erro no campo senha sem chamar API', async () => {
    const senha73Bytes = 'é'.repeat(37) // 37 * 2 = 74 bytes (> 72 bytes)
    const resultado = await cadastrar({
      nome: 'John Stewart',
      email: 'john@oa.tropa',
      senha: senha73Bytes,
      setorId: 2814,
    })
    expect(resultado.ok).toBe(false)
    expect(resultado.errors?.senha).toBeDefined()
    expect(cadastrarConta).not.toHaveBeenCalled()
  })

  it('setorId 0 é aceito e enviado como número 0', async () => {
    cadastrarConta.mockResolvedValueOnce(undefined)
    await expect(
      cadastrar({
        nome: 'Ganthet de Oa',
        email: 'ganthet@oa.tropa',
        senha: 'senhaForte123!',
        setorId: 0,
      }),
    ).rejects.toThrow('NEXT_REDIRECT /login?cadastro=1')

    expect(cadastrarConta).toHaveBeenCalledWith({
      nome: 'Ganthet de Oa',
      email: 'ganthet@oa.tropa',
      senha: 'senhaForte123!',
      setorId: 0,
    })
  })

  it('409 EMAIL_JA_CADASTRADO vira erro no campo email', async () => {
    cadastrarConta.mockRejectedValueOnce(new ApiError(409, 'EMAIL_JA_CADASTRADO'))
    const resultado = await cadastrar({
      nome: 'Hal Jordan',
      email: 'hal@oa.tropa',
      senha: 'senhaForte123!',
      setorId: 2814,
    })
    expect(resultado.ok).toBe(false)
    expect(resultado.errors?.email).toEqual(['Este e-mail já está cadastrado.'])
  })

  it('404 vira erro no campo setorId', async () => {
    cadastrarConta.mockRejectedValueOnce(new ApiError(404, 'NAO_ENCONTRADO'))
    const resultado = await cadastrar({
      nome: 'Hal Jordan',
      email: 'hal@oa.tropa',
      senha: 'senhaForte123!',
      setorId: 9999,
    })
    expect(resultado.ok).toBe(false)
    expect(resultado.errors?.setorId).toEqual(['Este setor não existe mais. Escolha outro.'])
  })

  it('400 com detalhes repassa aos campos', async () => {
    cadastrarConta.mockRejectedValueOnce(
      new ApiError(400, 'DADOS_INVALIDOS', [{ campo: 'nome', mensagens: ['Nome muito curto.'] }]),
    )
    const resultado = await cadastrar({
      nome: 'Hal',
      email: 'hal@oa.tropa',
      senha: 'senhaForte123!',
      setorId: 2814,
    })
    expect(resultado.ok).toBe(false)
    expect(resultado.errors?.nome).toEqual(['Nome muito curto.'])
  })

  it('500 resulta em erro geral', async () => {
    cadastrarConta.mockRejectedValueOnce(new ApiError(500, 'ERRO_INTERNO'))
    const resultado = await cadastrar({
      nome: 'Hal Jordan',
      email: 'hal@oa.tropa',
      senha: 'senhaForte123!',
      setorId: 2814,
    })
    expect(resultado.ok).toBe(false)
    expect(resultado.erro).toBe(MENSAGEM_ERRO_API)
  })

  it('sucesso chama redirect fora do try e o corpo enviado não tem papel nem lanternaId', async () => {
    cadastrarConta.mockResolvedValueOnce(undefined)
    await expect(
      cadastrar({
        nome: '  Hal Jordan  ',
        email: '  Hal@OA.tropa  ',
        senha: 'senhaForte123!',
        setorId: '2814',
      }),
    ).rejects.toThrow('NEXT_REDIRECT /login?cadastro=1')

    expect(cadastrarConta).toHaveBeenCalledTimes(1)
    const payload = cadastrarConta.mock.calls[0][0]
    expect(payload).toEqual({
      nome: 'Hal Jordan',
      email: 'hal@oa.tropa',
      senha: 'senhaForte123!',
      setorId: 2814,
    })
    expect(payload).not.toHaveProperty('papel')
    expect(payload).not.toHaveProperty('lanternaId')
    expect(redirect).toHaveBeenCalledWith('/login?cadastro=1')
  })
})
