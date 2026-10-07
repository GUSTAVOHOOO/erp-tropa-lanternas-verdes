import * as z from 'zod'
import { urlDaApi } from '@/lib/api'
import { ApiError } from '@/lib/api-error'
import { setorSchema, type Setor } from '@/lib/schemas/setor'

/** Todos os setores, do menor número para o maior. */
export async function listarSetores(): Promise<Setor[]> { // [API-01]
  const res = await fetch(urlDaApi('/setores', { _sort: 'numero' }), { next: { revalidate: 60 } }) // [API-06]
  if (!res.ok) throw new ApiError(res.status) // [API-02][API-03]
  return z.array(setorSchema).parse(await res.json()) // [API-04]
}
