// @vitest-environment node
import { beforeEach, expect, test, vi } from 'vitest'
const { redirect, lerToken, buscarUsuarioAtual } = vi.hoisted(() => ({
  redirect: vi.fn((destino: string) => { throw new Error(`NEXT_REDIRECT ${destino}`) }),
  lerToken: vi.fn(), buscarUsuarioAtual: vi.fn(),
}))
vi.mock('next/navigation', () => ({ redirect }))
vi.mock('@/lib/auth', () => ({ lerToken, buscarUsuarioAtual }))

import { ApiError } from '@/lib/api-error'
import { lerSessao, verificarSessao } from '@/lib/dal'

beforeEach(() => vi.clearAllMocks())

test('sem cookie redireciona para login sem consultar a API', async () => {
  lerToken.mockResolvedValueOnce(undefined)
  await expect(verificarSessao()).rejects.toThrow('NEXT_REDIRECT /login')
  expect(buscarUsuarioAtual).not.toHaveBeenCalled()
})

test('401 em página privada redireciona para encerrar sessão', async () => {
  lerToken.mockResolvedValueOnce('token')
  buscarUsuarioAtual.mockRejectedValueOnce(new ApiError(401, 'NAO_AUTENTICADO'))
  await expect(verificarSessao()).rejects.toThrow('NEXT_REDIRECT /sessao-expirada')
})

test('lerSessao devolve null se a API rejeitar o token', async () => {
  lerToken.mockResolvedValueOnce('token')
  buscarUsuarioAtual.mockRejectedValueOnce(new ApiError(401, 'NAO_AUTENTICADO'))
  await expect(lerSessao()).resolves.toBeNull()
})

test('lerSessao propaga erros diferentes de 401', async () => {
  const erro = new ApiError(500, 'ERRO_INTERNO')
  lerToken.mockResolvedValueOnce('token')
  buscarUsuarioAtual.mockRejectedValueOnce(erro)
  await expect(lerSessao()).rejects.toBe(erro)
})
