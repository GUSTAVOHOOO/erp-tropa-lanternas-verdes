import * as z from 'zod'
import { urlDaApi } from '@/lib/api'
import { ApiError } from '@/lib/api-error'
import { lanternaSchema, type Lanterna } from '@/lib/schemas/lanterna'

/** Lanternas em ordem alfabética, opcionalmente de um setor. */
export async function listarLanternas(filtro: { setorId?: string } = {}): Promise<Lanterna[]> { // [API-01]
  const url = urlDaApi('/lanternas', { setorId: filtro.setorId, _sort: 'nome' })
  const res = await fetch(url, { next: { revalidate: 60 } }) // [API-06]
  if (!res.ok) throw new ApiError(res.status) // [API-02]
  return z.array(lanternaSchema).parse(await res.json()) // [API-04]
}

/** Um lanterna pelo id, ou null se não existir. */
export async function buscarLanterna(id: string): Promise<Lanterna | null> {
  const res = await fetch(urlDaApi(`/lanternas/${encodeURIComponent(id)}`), { next: { revalidate: 60 } })
  if (res.status === 404) return null
  if (!res.ok) throw new ApiError(res.status) // [API-02]
  return lanternaSchema.parse(await res.json()) // [API-04]
}
