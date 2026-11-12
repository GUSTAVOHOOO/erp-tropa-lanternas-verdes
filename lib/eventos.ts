import 'server-only'
import * as z from 'zod'
import { requisitarApi, type OpcoesApi } from '@/lib/api'
import { ApiError } from '@/lib/api-error'
import { lerTokenObrigatorio } from '@/lib/dal'
import { paginaDe, type Pagina } from '@/lib/schemas/paginacao'
import { eventoSchema, type Evento } from '@/lib/schemas/evento'

const uuidSchema = z.uuid()

/** Requisições autenticadas de eventos: sempre sem cache e com o token da sessão. [API-06] */
async function opcoes(extra: Omit<OpcoesApi, 'cache' | 'token'> = {}): Promise<OpcoesApi> {
  return { ...extra, token: await lerTokenObrigatorio(), cache: { cache: 'no-store' } }
}

/**
 * Lista eventos da linha do tempo da ocorrência.
 * UUID inválido lança ApiError(404) sem request, permitindo tratamento imediato com notFound.
 */
export async function listarEventos(ocorrenciaId: string, pagina?: number): Promise<Pagina<Evento>> {
  if (!uuidSchema.safeParse(ocorrenciaId).success) {
    throw new ApiError(404, 'NAO_ENCONTRADO')
  }
  const consulta: Record<string, number | undefined> = { limite: 20 }
  if (pagina !== undefined) {
    consulta.pagina = pagina
  }
  return requisitarApi(
    `/ocorrencias/${encodeURIComponent(ocorrenciaId)}/eventos`,
    paginaDe(eventoSchema),
    await opcoes({ consulta }),
  )
}
