// @vitest-environment node
import { beforeEach, expect, test, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`NEXT_REDIRECT ${url}`) }),
}))
vi.mock('@/lib/dal', () => ({ verificarSessao: vi.fn(), apagarSessao: vi.fn() }))

import { redirect } from 'next/navigation'
import { apagarSessao, verificarSessao } from '@/lib/dal'
import { sair } from '@/app/(painel)/actions'

beforeEach(() => vi.clearAllMocks())

test('sem sessão não apaga cookie nem redireciona por conta própria', async () => {
  vi.mocked(verificarSessao).mockRejectedValueOnce(new Error('NEXT_REDIRECT /login'))
  await expect(sair()).rejects.toThrow('NEXT_REDIRECT /login')
  expect(apagarSessao).not.toHaveBeenCalled()
  expect(redirect).not.toHaveBeenCalled()
})

test('verifica sessão antes de apagar cookie e redirecionar', async () => {
  const ordem: string[] = []
  vi.mocked(verificarSessao).mockImplementationOnce(async () => { ordem.push('verificar'); return {} as Awaited<ReturnType<typeof verificarSessao>> })
  vi.mocked(apagarSessao).mockImplementationOnce(async () => { ordem.push('apagar') })
  vi.mocked(redirect).mockImplementationOnce((url) => { ordem.push('redirect'); throw new Error(`NEXT_REDIRECT ${url}`) })
  await expect(sair()).rejects.toThrow('NEXT_REDIRECT /login')
  expect(ordem).toEqual(['verificar', 'apagar', 'redirect'])
})
