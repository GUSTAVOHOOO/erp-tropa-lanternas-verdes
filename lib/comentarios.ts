import 'server-only'
import * as z from 'zod'
import { requisitarApi, requisitarApiSemConteudo, type OpcoesApi } from '@/lib/api'
import { ApiError } from '@/lib/api-error'
import { lerTokenObrigatorio } from '@/lib/dal'
import { paginaDe, type Pagina } from '@/lib/schemas/paginacao'
import { comentarioSchema, type Comentario } from '@/lib/schemas/comentario'

const uuidSchema = z.uuid()

/** Requisições autenticadas de comentários: sempre sem cache e com o token da sessão. [API-06] */
async function opcoes(extra: Omit<OpcoesApi, 'cache' | 'token'> = {}): Promise<OpcoesApi> {
  return { ...extra, token: await lerTokenObrigatorio(), cache: { cache: 'no-store' } }
}

/**
 * Lista comentários não excluídos vinculados à ocorrência.
 */
export async function listarComentarios(ocorrenciaId: string, pagina?: number): Promise<Pagina<Comentario>> {
  if (!uuidSchema.safeParse(ocorrenciaId).success) {
    throw new ApiError(404, 'NAO_ENCONTRADO')
  }
  const consulta: Record<string, number | undefined> = { limite: 20 }
  if (pagina !== undefined) {
    consulta.pagina = pagina
  }
  return requisitarApi(
    `/ocorrencias/${encodeURIComponent(ocorrenciaId)}/comentarios`,
    paginaDe(comentarioSchema),
    await opcoes({ consulta }),
  )
}

/**
 * Cria um novo comentário na ocorrência indicada.
 */
export async function criarComentario(ocorrenciaId: string, texto: string): Promise<Comentario> {
  if (!uuidSchema.safeParse(ocorrenciaId).success) {
    throw new ApiError(404, 'NAO_ENCONTRADO')
  }
  return requisitarApi(
    `/ocorrencias/${encodeURIComponent(ocorrenciaId)}/comentarios`,
    comentarioSchema,
    await opcoes({ metodo: 'POST', corpo: { texto } }),
  )
}

/**
 * Exclui um comentário por exclusão lógica (204 sem corpo).
 */
export async function excluirComentario(comentarioId: string): Promise<void> {
  await requisitarApiSemConteudo(
    `/comentarios/${encodeURIComponent(comentarioId)}`,
    await opcoes({ metodo: 'DELETE' }),
  )
}
