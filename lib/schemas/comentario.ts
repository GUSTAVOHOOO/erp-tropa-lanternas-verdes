import * as z from 'zod'
import { autorResumoSchema } from '@/lib/schemas/evento'

/** Comentário não excluído, como a API devolve. Não há edição. [API-04] */
export const comentarioSchema = z.object({
  id: z.uuid(),
  ocorrenciaId: z.uuid(),
  autorId: z.uuid(),
  autor: autorResumoSchema,
  texto: z.string().min(1).max(1000),
  criadoEm: z.iso.datetime({ offset: true }),
}).strict()
export type Comentario = z.infer<typeof comentarioSchema>

/** Formulário "Comentar": mesmo schema no cliente e na Server Action. [FORM-02] */
export const novoComentarioSchema = z.object({
  texto: z.string().trim()
    .min(1, 'Escreva o comentário.')
    .max(1000, 'Use no máximo 1000 caracteres.'),
})
export type NovoComentarioData = z.infer<typeof novoComentarioSchema>
