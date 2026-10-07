import * as z from 'zod'

/** Formato de um setor como a API devolve. */
export const setorSchema = z.object({ // [API-04]
  id: z.coerce.string(),
  numero: z.number(),
  nome: z.string(),
  descricao: z.string(),
})

export type Setor = z.infer<typeof setorSchema> // [FORM-03]
