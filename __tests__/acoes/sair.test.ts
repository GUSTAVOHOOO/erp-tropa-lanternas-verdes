// @vitest-environment node
import { beforeEach, expect, test, vi } from 'vitest'
vi.mock('next/navigation', () => ({ redirect: vi.fn((url: string) => { throw new Error(`NEXT_REDIRECT ${url}`) }) }))
vi.mock('@/lib/dal', () => ({ verificarSessao: vi.fn() }))
vi.mock('@/lib/auth', () => ({ apagarCookieSessao: vi.fn() }))
import { redirect } from 'next/navigation'
import { verificarSessao } from '@/lib/dal'
import { apagarCookieSessao } from '@/lib/auth'
import { sair } from '@/app/(painel)/actions'

beforeEach(() => vi.clearAllMocks())

test('sem sessão não apaga cookie', async () => {
  vi.mocked(verificarSessao).mockRejectedValueOnce(new Error('NEXT_REDIRECT /login'))
  await expect(sair()).rejects.toThrow('NEXT_REDIRECT /login')
  expect(apagarCookieSessao).not.toHaveBeenCalled()
})

test('verifica a sessão antes de apagar cookie e redirecionar', async () => {
  const ordem: string[] = []
  vi.mocked(verificarSessao).mockImplementationOnce(async () => { ordem.push('verificar'); return {} as Awaited<ReturnType<typeof verificarSessao>> })
  vi.mocked(apagarCookieSessao).mockImplementationOnce(async () => { ordem.push('apagar') })
  vi.mocked(redirect).mockImplementationOnce((url) => { ordem.push('redirect'); throw new Error(`NEXT_REDIRECT ${url}`) })
  await expect(sair()).rejects.toThrow('NEXT_REDIRECT /login')
  expect(ordem).toEqual(['verificar', 'apagar', 'redirect'])
})
