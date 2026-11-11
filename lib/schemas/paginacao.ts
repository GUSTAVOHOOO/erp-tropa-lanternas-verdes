import * as z from 'zod'

export const metaPaginacaoSchema = z.object({
  total: z.number().int().min(0),
  pagina: z.number().int().min(1),
  limite: z.number().int().min(1).max(50),
  paginas: z.number().int().min(0),
}).strict()

export function paginaDe<T extends z.ZodTypeAny>(item: T) {
  return z.object({ itens: z.array(item), meta: metaPaginacaoSchema }).strict()
}

export type Pagina<T> = { itens: T[]; meta: z.infer<typeof metaPaginacaoSchema> }
