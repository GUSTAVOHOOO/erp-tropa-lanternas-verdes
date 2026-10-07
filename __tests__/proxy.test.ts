// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { config, proxy } from '@/proxy'
import { codificarSessao, NOME_COOKIE } from '@/lib/sessao'

beforeEach(() => vi.stubEnv('SESSION_SECRET', 'segredo-de-teste'))
afterEach(() => vi.unstubAllEnvs())

function pedido(caminho: string, cookie?: string) {
  const headers = cookie ? { cookie: `${NOME_COOKIE}=${cookie}` } : undefined
  return new NextRequest(new URL(caminho, 'http://localhost:3000'), { headers })
}
function sessaoValida() {
  return codificarSessao({ id: 'u2', nome: 'Hal Jordan', papel: 'lanterna', setorId: '2814', lanternaId: 'hal-jordan', expiraEm: Date.now() + 60_000 })
}

test('sem sessão, /painel e subpáginas vão para /login', () => {
  for (const caminho of ['/painel', '/painel/ocorrencias/o1']) {
    const resposta = proxy(pedido(caminho))
    expect(resposta.status).toBe(307)
    expect(resposta.headers.get('location')).toBe('http://localhost:3000/login')
  }
})

test('cookie adulterado conta como sem sessão', () => {
  expect(proxy(pedido('/painel', 'lixo.lixo')).headers.get('location')).toBe('http://localhost:3000/login')
})

test('segredo ausente, cookie expirado e lixo redirecionam sem erro 500', () => {
  const expirado = codificarSessao({ id: 'u2', nome: 'Hal', papel: 'lanterna', setorId: '2814', lanternaId: null, expiraEm: Date.now() - 1 })
  expect(proxy(pedido('/painel', expirado)).headers.get('location')).toBe('http://localhost:3000/login')
  const valido = sessaoValida()
  vi.stubEnv('SESSION_SECRET', '')
  expect(proxy(pedido('/painel', valido)).headers.get('location')).toBe('http://localhost:3000/login')
  expect(proxy(pedido('/painel', 'a.b')).headers.get('location')).toBe('http://localhost:3000/login')
})

test('com sessão válida, /painel segue normalmente', () => {
  const resposta = proxy(pedido('/painel', sessaoValida()))
  expect(resposta.headers.get('location')).toBeNull()
  expect(resposta.headers.get('x-middleware-next')).toBe('1')
})

test('já logado, /login manda para /painel', () => {
  expect(proxy(pedido('/login', sessaoValida())).headers.get('location')).toBe('http://localhost:3000/painel')
})

test('sem sessão, /login abre normalmente', () => {
  expect(proxy(pedido('/login')).headers.get('location')).toBeNull()
})

test('o proxy só roda no painel e no login', () => {
  expect(config.matcher).toEqual(['/painel/:path*', '/login'])
})
