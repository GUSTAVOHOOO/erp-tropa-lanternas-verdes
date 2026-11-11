// @vitest-environment node
import { beforeEach, expect, test, vi } from 'vitest'
const { redirect, entrarNaApi, gravarCookieSessao } = vi.hoisted(() => ({
  redirect: vi.fn((url: string, tipo?: string) => { throw new Error(`NEXT_REDIRECT ${url} ${tipo ?? ''}`) }),
  entrarNaApi: vi.fn(), gravarCookieSessao: vi.fn(),
}))
vi.mock('next/navigation', () => ({ redirect, RedirectType: { replace: 'replace' } }))
vi.mock('@/lib/auth', () => ({ entrarNaApi, gravarCookieSessao }))
import { ApiError } from '@/lib/api-error'
import { entrar } from '@/app/(site)/login/actions'

beforeEach(() => vi.clearAllMocks())

test('inválido devolve erros de campo sem chamar API', async () => {
  const resultado = await entrar({ email: 'hal', senha: '' })
  expect(resultado.ok).toBe(false)
  expect(resultado.errors?.email?.[0]).toBe('Informe um e-mail válido, como hal@oa.tropa.')
  expect(resultado.errors?.senha?.[0]).toBe('Informe sua senha.')
  expect(entrarNaApi).not.toHaveBeenCalled()
})

test('401 não distingue conta inexistente de senha errada e não grava cookie', async () => {
  entrarNaApi.mockRejectedValueOnce(new ApiError(401, 'CREDENCIAIS_INVALIDAS'))
  const resultado = await entrar({ email: 'hal@oa.tropa', senha: 'incorreta' })
  expect(resultado).toEqual({ ok: false, erro: 'E-mail ou senha incorretos.' })
  expect(gravarCookieSessao).not.toHaveBeenCalled()
})

test('429 orienta aguardar', async () => {
  entrarNaApi.mockRejectedValueOnce(new ApiError(429, 'MUITAS_TENTATIVAS'))
  expect(await entrar({ email: 'hal@oa.tropa', senha: 'x' })).toEqual({ ok: false, erro: expect.stringContaining('Aguarde') })
})

test('senha acima de 72 bytes falha no campo e não chama API', async () => {
  const resultado = await entrar({ email: 'hal@oa.tropa', senha: `${'a'.repeat(71)}é` })
  expect(resultado.ok).toBe(false)
  expect(resultado.errors?.senha).toBeDefined()
  expect(entrarNaApi).not.toHaveBeenCalled()
})

test('sucesso grava token e redireciona com replace sem retornar token', async () => {
  const payload = { token: 'secret.jwt.token', expiresIn: 28800, usuario: { id: 'id', nome: 'Hal' } }
  entrarNaApi.mockResolvedValueOnce(payload)
  await expect(entrar({ email: ' Hal@OA.tropa ', senha: 'x' })).rejects.toThrow('NEXT_REDIRECT /painel replace')
  expect(entrarNaApi).toHaveBeenCalledWith({ email: 'hal@oa.tropa', senha: 'x' })
  expect(gravarCookieSessao).toHaveBeenCalledWith(payload.token, payload.expiresIn)
  expect(redirect).toHaveBeenCalledWith('/painel', 'replace')
})

test('400 com detalhe de campo segue para errors', async () => {
  entrarNaApi.mockRejectedValueOnce(new ApiError(400, 'DADOS_INVALIDOS', [{ campo: 'senha', mensagens: ['inválida'] }]))
  expect(await entrar({ email: 'hal@oa.tropa', senha: 'x' })).toEqual({ ok: false, errors: { senha: ['inválida'] } })
})
