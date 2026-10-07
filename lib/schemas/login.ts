import * as z from 'zod'

/** Mesmo schema no FormLogin (cliente) e na action entrar (servidor). [FORM-02] */
export const loginSchema = z.object({
  email: z.email('Informe um e-mail válido, como hal@oa.tropa.'), // [FORM-15]
  senha: z.string().min(1, 'Informe sua senha.'),
})

export type LoginData = z.infer<typeof loginSchema> // [FORM-03]
