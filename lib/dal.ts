import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Papel } from '@/lib/schemas/usuario'
import { codificarSessao, decodificarSessao, DURACAO_SESSAO_MS, NOME_COOKIE, type Sessao } from '@/lib/sessao'

/** Grava a sessão num cookie httpOnly. Só roda no servidor (Server Action). [AUTH-02] */
export async function criarSessao(dados: Omit<Sessao, 'expiraEm'>): Promise<void> {
  const expiraEm = Date.now() + DURACAO_SESSAO_MS
  const cookieStore = await cookies()
  cookieStore.set(NOME_COOKIE, codificarSessao({ ...dados, expiraEm }), { // [AUTH-02]
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiraEm),
  })
}

export async function apagarSessao(): Promise<void> {
  ;(await cookies()).delete(NOME_COOKIE) // [AUTH-09]
}

/** Lê a sessão sem redirecionar: o layout do painel usa só para mostrar o nome. [AUTH-10] */
export const lerSessao = cache(async (): Promise<Sessao | null> => {
  return decodificarSessao((await cookies()).get(NOME_COOKIE)?.value)
})

/** Primeira linha de toda página e action do painel. Sem sessão válida → /login. [AUTH-04] */
export const verificarSessao = cache(async (): Promise<Sessao> => {
  const sessao = await lerSessao()
  if (!sessao) redirect('/login') // [AUTH-04]
  return sessao
})

/** Logado mas sem o papel exigido → /acesso-negado (o "403" explicado). [AUTH-06] */
export async function exigirPapel(papel: Papel): Promise<Sessao> {
  const sessao = await verificarSessao()
  if (sessao.papel !== papel) redirect('/acesso-negado') // [AUTH-06]
  return sessao
}
