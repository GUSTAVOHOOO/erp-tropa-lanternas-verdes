import * as z from 'zod'

/** Formato de um setor como a API devolve. [API-04] */
export const setorSchema = z.object({
  id: z.coerce.string(),
  numero: z.number(),
  nome: z.string(),
  descricao: z.string(),
})

export type Setor = z.infer<typeof setorSchema> // [FORM-03]
