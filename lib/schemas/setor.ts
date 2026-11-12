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

/** Schema de validação para criação de setor no formulário. [FORM-02][FORM-17] */
export const setorFormularioSchema = z.object({
  id: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.coerce
      .number({ message: 'Informe o número do setor.' })
      .int('Informe o número do setor.')
      .min(0, 'Informe o número do setor.')
      .max(9999, 'Informe o número do setor.'),
  ),
  nome: z
    .string({ message: 'O nome deve ter pelo menos 2 caracteres.' })
    .trim()
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(60, 'O nome pode ter no máximo 60 caracteres.'),
  descricao: z
    .string({ message: 'A descrição deve ter pelo menos 10 caracteres.' })
    .trim()
    .min(10, 'A descrição deve ter pelo menos 10 caracteres.')
    .max(300, 'A descrição pode ter no máximo 300 caracteres.'),
})

export type SetorFormularioData = z.infer<typeof setorFormularioSchema>

/** Schema de validação para edição de setor (envia campos opcionais minProperties 1 na API). */
export const edicaoSetorSchema = z.object({
  nome: z
    .string({ message: 'O nome deve ter pelo menos 2 caracteres.' })
    .trim()
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(60, 'O nome pode ter no máximo 60 caracteres.')
    .optional(),
  descricao: z
    .string({ message: 'A descrição deve ter pelo menos 10 caracteres.' })
    .trim()
    .min(10, 'A descrição deve ter pelo menos 10 caracteres.')
    .max(300, 'A descrição pode ter no máximo 300 caracteres.')
    .optional(),
})

export type EdicaoSetorData = z.infer<typeof edicaoSetorSchema>
