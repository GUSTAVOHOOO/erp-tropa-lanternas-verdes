// @vitest-environment node
import { expect, test } from 'vitest'
import { NextRequest } from 'next/server'
import { config, proxy } from '@/proxy'
import { NOME_COOKIE } from '@/lib/cookie'

function pedido(caminho: string, cookie?: string) {
  return new NextRequest(new URL(caminho, 'http://localhost:3000'), cookie ? { headers: { cookie: `${NOME_COOKIE}=${cookie}` } } : undefined)
}

test('sem cookie, painel redireciona para login', () => {
  expect(proxy(pedido('/painel')).headers.get('location')).toBe('http://localhost:3000/login')
})

test('presença do cookie libera painel e redireciona login e cadastro', () => {
  expect(proxy(pedido('/painel', 'token-opaco')).headers.get('location')).toBeNull()
  expect(proxy(pedido('/login', 'token-opaco')).headers.get('location')).toBe('http://localhost:3000/painel')
  expect(proxy(pedido('/cadastro', 'token-opaco')).headers.get('location')).toBe('http://localhost:3000/painel')
})

test('sessão expirada fica fora do matcher', () => {
  expect(config.matcher).toEqual(['/painel/:path*', '/login', '/cadastro'])
  expect(proxy(pedido('/sessao-expirada', 'token-opaco')).headers.get('location')).toBeNull()
})
