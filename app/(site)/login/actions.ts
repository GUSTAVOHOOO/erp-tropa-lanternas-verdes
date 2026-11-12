'use server'

import * as z from 'zod'
import { redirect, RedirectType } from 'next/navigation'
import { ApiError, resultadoDeErroApi } from '@/lib/api-error'
import { entrarNaApi, gravarCookieSessao } from '@/lib/auth'
import { loginSchema } from '@/lib/schemas/login'
import type { ResultadoAcao } from '@/lib/resultado-acao'

/** Valida credenciais, abre sessão no servidor e substitui o histórico de navegação. */
export async function entrar(dados: unknown): Promise<ResultadoAcao> {
  const parsed = loginSchema.safeParse(dados) // [FORM-17]
  if (!parsed.success) return { ok: false, errors: z.flattenError(parsed.error).fieldErrors } // [FORM-18]

  let resposta
  try {
    resposta = await entrarNaApi(parsed.data)
  } catch (erro) {
    if (erro instanceof ApiError && erro.status === 401) return { ok: false, erro: 'E-mail ou senha incorretos.' } // [AUTH-08]
    return resultadoDeErroApi(erro)
  }

  await gravarCookieSessao(resposta.token, resposta.expiresIn)
  redirect('/painel', RedirectType.replace) // [ROTA-19]
}
