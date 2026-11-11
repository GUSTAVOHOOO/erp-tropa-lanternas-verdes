// @vitest-environment node
import { expect, test, vi } from 'vitest'
const { apagarCookieSessao } = vi.hoisted(() => ({ apagarCookieSessao: vi.fn() }))
vi.mock('@/lib/auth', () => ({ apagarCookieSessao }))
import { GET } from '@/app/sessao-expirada/route'

test('apaga cookie e redireciona para login indicando expiração', async () => {
  apagarCookieSessao.mockClear()
  const resposta = await GET(new Request('http://localhost:3000/sessao-expirada'))
  expect(apagarCookieSessao).toHaveBeenCalledOnce()
  expect(resposta.status).toBe(307)
  expect(resposta.headers.get('location')).toBe('http://localhost:3000/login?expirou=1')
})
