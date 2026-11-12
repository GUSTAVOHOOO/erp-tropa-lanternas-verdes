import * as z from 'zod'

export const PAPEIS = ['guardiao', 'lanterna'] as const
export type Papel = (typeof PAPEIS)[number]

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

/** Usuário autenticado conforme o contrato público da API, sem credenciais. */
export const usuarioSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  email: z.email(),
  papel: z.enum(PAPEIS),
  lanternaId: slugSchema.nullable(),
  setorId: z.number().int().min(0).max(9999).nullable(),
  criadoEm: z.iso.datetime(),
}).strict()

export type Usuario = z.infer<typeof usuarioSchema>
export type Sessao = Usuario
