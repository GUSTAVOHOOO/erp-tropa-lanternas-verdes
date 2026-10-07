'use server'

import * as z from 'zod'
import { redirect, RedirectType } from 'next/navigation'
import { criarSessao } from '@/lib/dal'
import { MENSAGEM_ERRO_API, type ResultadoAcao } from '@/lib/resultado-acao'
import { loginSchema } from '@/lib/schemas/login'
import type { Usuario } from '@/lib/schemas/usuario'
import { buscarUsuarioPorEmail } from '@/lib/usuarios'

/** Login: revalida, confere a senha, grava a sessão e entra no painel. */
export async function entrar(dados: unknown): Promise<ResultadoAcao> {
  const entrada = dados && typeof dados === 'object' && 'email' in dados && typeof dados.email === 'string'
    ? { ...dados, email: dados.email.trim().toLowerCase() }
    : dados
  const parsed = loginSchema.safeParse(entrada) // [FORM-17]
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors } // [FORM-18]

  let usuario: Usuario | null
  try {
    usuario = await buscarUsuarioPorEmail(parsed.data.email)
  } catch (erro) {
    console.error(erro)
    return { ok: false, erro: MENSAGEM_ERRO_API } // [API-13]
  }

  if (!usuario || usuario.senha !== parsed.data.senha) {
    return { ok: false, erro: 'E-mail ou senha incorretos.' } // [AUTH-08] não diz qual dos dois errou
  }

  await criarSessao({
    id: usuario.id,
    nome: usuario.nome,
    papel: usuario.papel,
    setorId: usuario.setorId,
    lanternaId: usuario.lanternaId,
  })
  redirect('/painel', RedirectType.replace) // [ROTA-19] o "voltar" não retorna ao login
}
