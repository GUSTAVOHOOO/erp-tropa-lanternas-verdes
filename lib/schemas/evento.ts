import * as z from 'zod'
import { slugLanternaSchema } from '@/lib/schemas/lanterna'
import { PAPEIS } from '@/lib/schemas/usuario'

/** Autor exibível de Evento/Comentário: resumo da conta atual, sem e-mail. */
export const autorResumoSchema = z.object({
  id: z.uuid(),
  nome: z.string().min(2).max(100),
  papel: z.enum(PAPEIS),
}).strict()
export type AutorResumo = z.infer<typeof autorResumoSchema>

const base = {
  id: z.uuid(),
  ocorrenciaId: z.uuid(),
  autorId: z.uuid(),
  autor: autorResumoSchema,
  criadoEm: z.iso.datetime({ offset: true }),
}
const slugOuNulo = slugLanternaSchema.nullable()

/** Evento imutável da linha do tempo, discriminado por `tipo` como no OpenAPI. [API-04] */
export const eventoSchema = z.discriminatedUnion('tipo', [
  z.object({ ...base, tipo: z.literal('criada'), dados: z.object({ de: z.null(), para: z.literal('aberta') }).strict() }).strict(),
  z.object({ ...base, tipo: z.literal('atribuida'), dados: z.object({ de: slugOuNulo, para: slugOuNulo }).strict() }).strict(),
  z.object({ ...base, tipo: z.literal('status_alterado'), dados: z.object({ de: z.literal('aberta'), para: z.literal('em_andamento') }).strict() }).strict(),
  z.object({
    ...base,
    tipo: z.literal('resolvida'),
    dados: z.object({ de: z.literal('em_andamento'), para: z.literal('resolvida'), resolucao: z.string().min(10).max(2000) }).strict(),
  }).strict(),
  z.object({
    ...base,
    tipo: z.literal('reaberta'),
    dados: z.object({
      de: z.literal('resolvida'),
      para: z.literal('aberta'),
      motivo: z.string().min(10).max(500),
      responsavelAnteriorId: slugOuNulo,
      responsavelId: slugOuNulo,
    }).strict(),
  }).strict(),
  z.object({ ...base, tipo: z.literal('comentario_apagado'), dados: z.object({ comentarioId: z.uuid() }).strict() }).strict(),
])
export type Evento = z.infer<typeof eventoSchema>
