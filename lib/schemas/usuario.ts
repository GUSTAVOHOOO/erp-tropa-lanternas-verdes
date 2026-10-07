import * as z from 'zod'

export const PAPEIS = ['guardiao', 'lanterna'] as const
export type Papel = (typeof PAPEIS)[number]

/** Usuário de login. Só o servidor lê este formato: tem senha. [AUTH-11] */
export const usuarioSchema = z.object({
  id: z.coerce.string(),
  nome: z.string(),
  email: z.string(),
  senha: z.string(),
  papel: z.enum(PAPEIS),
  setorId: z.coerce.string().nullable(), // null para o Guardião
  lanternaId: z.string().nullable(),
})

export type Usuario = z.infer<typeof usuarioSchema> // [FORM-03]
