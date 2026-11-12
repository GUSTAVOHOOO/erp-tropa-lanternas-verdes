import { NextResponse } from 'next/server'
import { apagarCookieSessao } from '@/lib/auth'

export async function GET(request: Request) {
  await apagarCookieSessao()
  return NextResponse.redirect(new URL('/login?expirou=1', request.url))
}
