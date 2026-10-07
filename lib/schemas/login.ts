import * as z from 'zod'

/** Mesmo schema no FormLogin (cliente) e na action entrar (servidor). */
export const loginSchema = z.object({ // [FORM-02]
  email: z.string().trim().toLowerCase().pipe(z.email('Informe um e-mail válido, como hal@oa.tropa.')), // [FORM-15]
  senha: z.string().min(1, 'Informe sua senha.'),
})

export type LoginData = z.infer<typeof loginSchema> // [FORM-03]
