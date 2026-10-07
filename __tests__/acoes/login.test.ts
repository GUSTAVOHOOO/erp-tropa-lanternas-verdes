// @vitest-environment node
import { beforeEach, expect, test, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`)
  }),
  RedirectType: { replace: 'replace', push: 'push' },
}))
vi.mock('@/lib/usuarios', () => ({ buscarUsuarioPorEmail: vi.fn() }))
vi.mock('@/lib/dal', () => ({ criarSessao: vi.fn() }))

import { redirect } from 'next/navigation'
import { buscarUsuarioPorEmail } from '@/lib/usuarios'
import { criarSessao } from '@/lib/dal'
import { MENSAGEM_ERRO_API } from '@/lib/resultado-acao'
import { entrar } from '@/app/(site)/login/actions'

const hal = { id: 'u2', nome: 'Hal Jordan', email: 'hal@oa.tropa', senha: 'lanterna123', papel: 'lanterna' as const, setorId: '2814', lanternaId: 'hal-jordan' }

beforeEach(() => vi.clearAllMocks())

test('dados inválidos voltam como erros de campo, sem consultar a API', async () => {
  const resultado = await entrar({ email: 'hal', senha: '' })
  expect(resultado.ok).toBe(false)
  expect(resultado.errors?.email?.[0]).toBe('Informe um e-mail válido, como hal@oa.tropa.')
  expect(resultado.errors?.senha?.[0]).toBe('Informe sua senha.')
  expect(buscarUsuarioPorEmail).not.toHaveBeenCalled()
})

test('senha errada e e-mail desconhecido dão a mesma mensagem', async () => {
  vi.mocked(buscarUsuarioPorEmail).mockResolvedValueOnce(hal)
  expect(await entrar({ email: 'hal@oa.tropa', senha: 'errada' })).toEqual({ ok: false, erro: 'E-mail ou senha incorretos.' })
  vi.mocked(buscarUsuarioPorEmail).mockResolvedValueOnce(null)
  expect(await entrar({ email: 'x@oa.tropa', senha: 'qualquer' })).toEqual({ ok: false, erro: 'E-mail ou senha incorretos.' })
  expect(criarSessao).not.toHaveBeenCalled()
})

test('API fora do ar vira mensagem para humanos', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.mocked(buscarUsuarioPorEmail).mockRejectedValueOnce(new TypeError('fetch failed'))
  expect(await entrar({ email: 'hal@oa.tropa', senha: 'lanterna123' })).toEqual({ ok: false, erro: MENSAGEM_ERRO_API })
})

test('sucesso cria a sessão sem senha nem e-mail e substitui o histórico', async () => {
  vi.mocked(buscarUsuarioPorEmail).mockResolvedValueOnce(hal)
  await expect(entrar({ email: 'hal@oa.tropa', senha: 'lanterna123' })).rejects.toThrow('NEXT_REDIRECT /painel')
  expect(criarSessao).toHaveBeenCalledWith({ id: 'u2', nome: 'Hal Jordan', papel: 'lanterna', setorId: '2814', lanternaId: 'hal-jordan' })
  expect(redirect).toHaveBeenCalledWith('/painel', 'replace')
})

test('normaliza espaços e maiúsculas antes de consultar o usuário', async () => {
  vi.mocked(buscarUsuarioPorEmail).mockResolvedValueOnce(null)
  await entrar({ email: ' Hal@OA.tropa ', senha: 'lanterna123' })
  expect(buscarUsuarioPorEmail).toHaveBeenCalledWith('hal@oa.tropa')
})
