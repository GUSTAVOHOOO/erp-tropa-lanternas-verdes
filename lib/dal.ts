import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { ApiError } from '@/lib/api-error'
import { buscarUsuarioAtual, lerToken } from '@/lib/auth'
import type { Papel, Sessao } from '@/lib/schemas/usuario'

export const lerSessao = cache(async (): Promise<Sessao | null> => {
  const token = await lerToken()
  if (!token) return null
  try {
    return await buscarUsuarioAtual(token)
  } catch (erro) {
    if (erro instanceof ApiError && erro.status === 401) return null
    throw erro
  }
})

export const verificarSessao = cache(async (): Promise<Sessao> => {
  const token = await lerToken()
  if (!token) redirect('/login')
  let usuario: Sessao | undefined
  let expirou = false
  try {
    usuario = await buscarUsuarioAtual(token)
  } catch (erro) {
    if (erro instanceof ApiError && erro.status === 401) expirou = true
    else throw erro
  }
  if (expirou) redirect('/sessao-expirada')
  if (!usuario) throw new Error('Não foi possível validar a sessão.')
  return usuario
})

export async function exigirPapel(papel: Papel): Promise<Sessao> {
  const sessao = await verificarSessao()
  if (sessao.papel !== papel) redirect('/acesso-negado')
  return sessao
}

export async function lerTokenObrigatorio(): Promise<string> {
  const token = await lerToken()
  if (!token) redirect('/login')
  return token
}
