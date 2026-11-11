import * as z from 'zod'
import { senhaSchema } from '@/lib/schemas/senha'

/**
 * Schema de validação para cadastro de nova conta.
 * Utilizado tanto no formulário (cliente) quanto na Server Action (servidor). [FORM-17]
 */
export const cadastroSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(100, 'O nome pode ter no máximo 100 caracteres.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, 'O e-mail pode ter no máximo 254 caracteres.')
    .pipe(z.email('Informe um e-mail válido, como hal@oa.tropa.')),
  senha: senhaSchema(8, 'A senha precisa de pelo menos 8 caracteres.'),
  setorId: z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    z.coerce
      .number('Escolha o seu setor.')
      .int('Escolha o seu setor.')
      .min(0, 'Escolha o seu setor.')
      .max(9999, 'Escolha o seu setor.'),
  ),
})

export type CadastroData = z.infer<typeof cadastroSchema>
