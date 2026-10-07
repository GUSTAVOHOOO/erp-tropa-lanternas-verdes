import * as z from 'zod'
import { urlDaApi } from '@/lib/api'
import { ApiError } from '@/lib/api-error'
import { ocorrenciaSchema, type Gravidade, type Ocorrencia, type StatusOcorrencia } from '@/lib/schemas/ocorrencia'

export type FiltroOcorrencias = { setorId?: string; status?: StatusOcorrencia; gravidade?: Gravidade }
export type DadosNovaOcorrencia = Omit<Ocorrencia, 'id'>

/** Ocorrências da mais nova para a mais antiga. Sem cache: mudam o tempo todo e dependem do usuário. */
export async function listarOcorrencias(filtro: FiltroOcorrencias = {}): Promise<Ocorrencia[]> { // [API-01]
  const url = urlDaApi('/ocorrencias', {
    setorId: filtro.setorId,
    status: filtro.status,
    gravidade: filtro.gravidade,
    _sort: 'criadaEm',
    _order: 'desc',
  })
  const res = await fetch(url, { cache: 'no-store' }) // [API-06]
  if (!res.ok) throw new ApiError(res.status) // [API-02]
  return z.array(ocorrenciaSchema).parse(await res.json()) // [API-04]
}

/** Uma ocorrência pelo id, ou null se não existir. */
export async function buscarOcorrencia(id: string): Promise<Ocorrencia | null> {
  const res = await fetch(urlDaApi(`/ocorrencias/${encodeURIComponent(id)}`), { cache: 'no-store' })
  if (res.status === 404) return null
  if (!res.ok) throw new ApiError(res.status) // [API-02]
  return ocorrenciaSchema.parse(await res.json()) // [API-04]
}

/** Cria a ocorrência (POST) e devolve o registro com o id gerado pela API. */
export async function criarOcorrencia(dados: DadosNovaOcorrencia): Promise<Ocorrencia> {
  const res = await fetch(urlDaApi('/ocorrencias'), { // [API-14]
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
    cache: 'no-store',
  })
  if (!res.ok) throw new ApiError(res.status)
  return ocorrenciaSchema.parse(await res.json())
}

/** Altera só os campos enviados (PATCH). */
export async function atualizarOcorrencia(id: string, campos: Partial<DadosNovaOcorrencia>): Promise<Ocorrencia> {
  const res = await fetch(urlDaApi(`/ocorrencias/${encodeURIComponent(id)}`), { // [API-14]
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(campos),
    cache: 'no-store',
  })
  if (!res.ok) throw new ApiError(res.status)
  return ocorrenciaSchema.parse(await res.json())
}
