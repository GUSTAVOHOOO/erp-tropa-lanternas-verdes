'use server'

import * as z from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ApiError, resultadoDeErroApi } from '@/lib/api-error'
import { verificarSessao } from '@/lib/dal'
import { criarComentario, excluirComentario } from '@/lib/comentarios'
import type { ResultadoAcao } from '@/lib/resultado-acao'
import { novoComentarioSchema } from '@/lib/schemas/comentario'

const uuidSchema = z.uuid()

const REGISTRO_INEXISTENTE: ResultadoAcao = {
  ok: false,
  erro: 'Este comentário ou ocorrência não existe mais.',
}

const APAGAR_SEM_PERMISSAO: ResultadoAcao = {
  ok: false,
  erro: 'Só o autor ou um Guardião pode apagar este comentário.',
}

function tratarErro(erro: unknown): { redirecionar?: string; resultado?: ResultadoAcao } {
  if (erro instanceof ApiError) {
    if (erro.status === 401) {
      return { redirecionar: '/sessao-expirada' }
    }
    if (erro.status === 403) {
      return { resultado: APAGAR_SEM_PERMISSAO }
    }
    if (erro.status === 404) {
      return { resultado: REGISTRO_INEXISTENTE }
    }
  }
  return { resultado: resultadoDeErroApi(erro) }
}

/**
 * Cria um comentário em uma ocorrência após validar a sessão e o corpo.
 * Em caso de sucesso, revalida o detalhe da ocorrência sem redirecionar para permitir limpeza do formulário.
 */
export async function comentar(ocorrenciaId: unknown, dados: unknown): Promise<ResultadoAcao> {
  await verificarSessao()

  const parsed = novoComentarioSchema.safeParse(dados)
  if (!parsed.success) {
    return { ok: false, errors: z.flattenError(parsed.error).fieldErrors }
  }

  if (typeof ocorrenciaId !== 'string' || !uuidSchema.safeParse(ocorrenciaId).success) {
    return REGISTRO_INEXISTENTE
  }

  let destinoRedirecionamento: string | null = null
  try {
    await criarComentario(ocorrenciaId, parsed.data.texto)
  } catch (erro) {
    const tratado = tratarErro(erro)
    if (tratado.redirecionar) {
      destinoRedirecionamento = tratado.redirecionar
    } else {
      return tratado.resultado ?? resultadoDeErroApi(erro)
    }
  }

  if (destinoRedirecionamento) {
    redirect(destinoRedirecionamento)
  }

  revalidatePath(`/painel/ocorrencias/${ocorrenciaId}`)
  return { ok: true }
}

/**
 * Exclui um comentário indicado e revalida a linha do tempo e os comentários do detalhe.
 */
export async function apagarComentario(ocorrenciaId: unknown, comentarioId: unknown): Promise<ResultadoAcao> {
  await verificarSessao()

  if (
    typeof ocorrenciaId !== 'string' ||
    !uuidSchema.safeParse(ocorrenciaId).success ||
    typeof comentarioId !== 'string' ||
    !uuidSchema.safeParse(comentarioId).success
  ) {
    return REGISTRO_INEXISTENTE
  }

  let destinoRedirecionamento: string | null = null
  try {
    await excluirComentario(comentarioId)
  } catch (erro) {
    const tratado = tratarErro(erro)
    if (tratado.redirecionar) {
      destinoRedirecionamento = tratado.redirecionar
    } else {
      return tratado.resultado ?? resultadoDeErroApi(erro)
    }
  }

  if (destinoRedirecionamento) {
    redirect(destinoRedirecionamento)
  }

  revalidatePath(`/painel/ocorrencias/${ocorrenciaId}`)
  return { ok: true }
}
