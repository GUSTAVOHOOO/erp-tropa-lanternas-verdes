// @vitest-environment node
import { beforeEach, expect, test, vi } from 'vitest'

const { cookiesSet, cookiesDelete, cookiesGet, requisitarApi } = vi.hoisted(() => ({ cookiesSet: vi.fn(), cookiesDelete: vi.fn(), cookiesGet: vi.fn(), requisitarApi: vi.fn() }))
vi.mock('next/headers', () => ({ cookies: async () => ({ set: cookiesSet, delete: cookiesDelete, get: cookiesGet }) }))
vi.mock('@/lib/api', () => ({ requisitarApi }))

import { buscarUsuarioAtual, entrarNaApi, gravarCookieSessao, apagarCookieSessao, lerToken } from '@/lib/auth'

const token = 'jwt.secret'
const usuario = { id: '00000000-0000-4000-8000-000000000001', nome: 'Hal Jordan', email: 'hal@oa.tropa', papel: 'lanterna', lanternaId: 'hal-jordan', setorId: 2814, criadoEm: '2026-01-01T00:00:00.000Z' }

beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('NODE_ENV', 'test') })

test('grava somente token com flags seguras e expiração do contrato', async () => {
  const antes = Date.now()
  await gravarCookieSessao(token, 28800)
  const [nome, valor, opcoes] = cookiesSet.mock.calls[0]
  expect(nome).toBe('sessao')
  expect(valor).toBe(token)
  expect(opcoes).toMatchObject({ httpOnly: true, secure: false, sameSite: 'lax', path: '/' })
  expect(opcoes.expires.getTime()).toBeGreaterThanOrEqual(antes + 28_800_000)
  expect(opcoes.expires.getTime()).toBeLessThanOrEqual(Date.now() + 28_800_000)
})

test('busca usuário atual com Bearer e sem cache', async () => {
  requisitarApi.mockResolvedValueOnce(usuario)
  await expect(buscarUsuarioAtual(token)).resolves.toEqual(usuario)
  expect(requisitarApi).toHaveBeenCalledWith('/auth/me', expect.anything(), { token, cache: { cache: 'no-store' } })
})

test('login valida a resposta LoginDados', async () => {
  requisitarApi.mockResolvedValueOnce({ token, expiresIn: 28800, usuario })
  await entrarNaApi({ email: 'hal@oa.tropa', senha: 'x' })
  expect(requisitarApi).toHaveBeenCalledWith('/auth/login', expect.anything(), { metodo: 'POST', corpo: { email: 'hal@oa.tropa', senha: 'x' }, cache: { cache: 'no-store' } })
  const schema = requisitarApi.mock.calls[0][1]
  expect(schema.safeParse({ token, expiresIn: 0, usuario }).success).toBe(false)
  expect(schema.safeParse({ token, expiresIn: 28800, usuario, senha: 'nao-deve-vir' }).success).toBe(false)
})

test('lê e apaga token do cookie', async () => {
  cookiesGet.mockReturnValueOnce({ value: token })
  await expect(lerToken()).resolves.toBe(token)
  await apagarCookieSessao()
  expect(cookiesDelete).toHaveBeenCalledWith('sessao')
})
