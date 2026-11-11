import * as z from 'zod'
import { senhaSchema } from '@/lib/schemas/senha'

/** Mesmo schema no FormLogin (cliente) e na action entrar (servidor). */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254, 'O e-mail pode ter no máximo 254 caracteres.').pipe(z.email('Informe um e-mail válido, como hal@oa.tropa.')),
  senha: senhaSchema(1, 'Informe sua senha.'),
})

export type LoginData = z.infer<typeof loginSchema>
