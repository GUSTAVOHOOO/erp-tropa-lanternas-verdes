'use server'

import * as z from 'zod'
import { redirect } from 'next/navigation'
import { ApiError, MENSAGENS_CODIGO, resultadoDeErroApi } from '@/lib/api-error'
import { cadastrarConta } from '@/lib/cadastro'
import type { ResultadoAcao } from '@/lib/resultado-acao'
import { cadastroSchema } from '@/lib/schemas/cadastro'

/**
 * Server Action para cadastrar uma nova conta.
 * Não cria sessão nem recebe papel; após o sucesso redireciona para o login.
 */
export async function cadastrar(dados: unknown): Promise<ResultadoAcao> {
  const parsed = cadastroSchema.safeParse(dados) // [FORM-17]
  if (!parsed.success) {
    return { ok: false, errors: z.flattenError(parsed.error).fieldErrors } // [FORM-18]
  }

  try {
    await cadastrarConta(parsed.data)
  } catch (erro) {
    if (erro instanceof ApiError) {
      if (erro.status === 409 && erro.codigo === 'EMAIL_JA_CADASTRADO') {
        return { ok: false, errors: { email: [MENSAGENS_CODIGO.EMAIL_JA_CADASTRADO] } }
      }
      if (erro.status === 404) {
        return { ok: false, errors: { setorId: ['Este setor não existe mais. Escolha outro.'] } }
      }
    }
    return resultadoDeErroApi(erro)
  }

  redirect('/login?cadastro=1') // [ROTA-20] fora do try
}
