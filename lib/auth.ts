import 'server-only'
import * as z from 'zod'
import { cookies } from 'next/headers'
import { requisitarApi } from '@/lib/api'
import { NOME_COOKIE } from '@/lib/cookie'
import { loginSchema, type LoginData } from '@/lib/schemas/login'
import { usuarioSchema, type Usuario } from '@/lib/schemas/usuario'

const loginDadosSchema = z.object({
  token: z.string().min(1),
  expiresIn: z.number().int().positive(),
  usuario: usuarioSchema,
}).strict()
type LoginDados = z.infer<typeof loginDadosSchema>

export async function entrarNaApi(dados: LoginData): Promise<LoginDados> {
  return requisitarApi('/auth/login', loginDadosSchema, {
    metodo: 'POST', corpo: loginSchema.parse(dados), cache: { cache: 'no-store' },
  })
}

export async function buscarUsuarioAtual(token: string): Promise<Usuario> {
  return requisitarApi('/auth/me', usuarioSchema, { token, cache: { cache: 'no-store' } })
}

export async function gravarCookieSessao(token: string, expiresIn: number): Promise<void> {
  const expiraEm = new Date(Date.now() + expiresIn * 1000)
  ;(await cookies()).set(NOME_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiraEm,
  })
}

export async function apagarCookieSessao(): Promise<void> {
  ;(await cookies()).delete(NOME_COOKIE)
}

export async function lerToken(): Promise<string | undefined> {
  return (await cookies()).get(NOME_COOKIE)?.value
}
