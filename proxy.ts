import { NextResponse, type NextRequest } from 'next/server'
import { NOME_COOKIE } from '@/lib/cookie'

/** Checagem otimista: só verifica se o navegador enviou o cookie; a API valida o token. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const temCookie = request.cookies.has(NOME_COOKIE)
  if (pathname.startsWith('/painel') && !temCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if ((pathname === '/login' || pathname === '/cadastro') && temCookie) {
    return NextResponse.redirect(new URL('/painel', request.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/painel/:path*', '/login', '/cadastro'] }
