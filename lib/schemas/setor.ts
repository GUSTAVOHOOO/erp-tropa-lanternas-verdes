import * as z from 'zod'

/** Id do Setor no contrato: inteiro 0..9999 (Setor 0 é válido). */
export const idSetorSchema = z.number().int().min(0).max(9999)

/** Setor como a API devolve em GET /setores (sem paginação). [API-04] */
export const setorSchema = z.object({
  id: idSetorSchema,
  nome: z.string().min(2).max(60),
  descricao: z.string().min(10).max(300),
}).strict()

export type Setor = z.infer<typeof setorSchema> // [FORM-03]
