import * as z from 'zod'
import { requisitarApi } from '@/lib/api'
import { setorSchema, type Setor } from '@/lib/schemas/setor'

/** Lista os setores publicos do contrato. */
export async function listarSetores(): Promise<Setor[]> {
  return requisitarApi('/setores', z.array(setorSchema), { cache: { revalidate: 60 } })
}
