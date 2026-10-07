// proxy.ts: o "middleware" pedido no enunciado (no Next.js 16 o middleware.ts foi renomeado para proxy.ts)
import { NextResponse, type NextRequest } from 'next/server'
import { decodificarSessao, NOME_COOKIE } from '@/lib/sessao'

/** Checagem otimista: só lê o cookie. A checagem definitiva fica em cada página e action (lib/dal.ts). */
export function proxy(request: NextRequest) {
  const sessao = decodificarSessao(request.cookies.get(NOME_COOKIE)?.value)
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/painel') && !sessao) {
    return NextResponse.redirect(new URL('/login', request.url)) // [AUTH-01]
  }
  if (pathname === '/login' && sessao) {
    return NextResponse.redirect(new URL('/painel', request.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/painel/:path*', '/login'] }
