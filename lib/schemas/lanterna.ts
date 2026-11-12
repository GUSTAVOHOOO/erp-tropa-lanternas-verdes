import * as z from 'zod'
import { idSetorSchema } from '@/lib/schemas/setor'

export const STATUS_LANTERNA = ['ativo', 'em_missao', 'afastado'] as const
export type StatusLanterna = (typeof STATUS_LANTERNA)[number]

export const rotuloStatusLanterna: Record<StatusLanterna, string> = {
  ativo: 'Ativo',
  em_missao: 'Em missão',
  afastado: 'Afastado',
}

/** Slug da Ficha (ex.: hal-jordan), como no OpenAPI. */
export const slugLanternaSchema = z.string().min(2).max(40).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)

/** Resumo sem recursão: mentor e aprendizes da Ficha. */
export const lanternaResumoSchema = z.object({
  id: slugLanternaSchema,
  codinome: z.string().min(2).max(60),
  setorId: idSetorSchema.nullable(),
  status: z.enum(STATUS_LANTERNA),
}).strict()

/** Item da lista pública: campos sempre presentes, desconhecidos como null. [API-04] */
export const lanternaListaSchema = z.object({
  id: slugLanternaSchema,
  codinome: z.string().min(2).max(60),
  identidadeCivil: z.string().min(2).max(80).nullable(),
  especie: z.string().min(2).max(50).nullable(),
  planetaNatal: z.string().min(2).max(60).nullable(),
  setorId: idSetorSchema.nullable(),
  status: z.enum(STATUS_LANTERNA),
  anoIngresso: z.number().int().min(1900).max(2100).nullable(),
}).strict()

export const CAMPOS_COM_FONTE = [
  'codinome', 'identidadeCivil', 'especie', 'planetaNatal', 'setorId', 'anoIngresso',
  'primeiraAparicao', 'habilidades', 'mentorId', 'citacao', 'biografia',
] as const
export type CampoComFonte = (typeof CAMPOS_COM_FONTE)[number]

/** Campo ausente em `fontes` equivale a nao_verificado. */
export const fonteCampoSchema = z.object({
  estado: z.enum(['verificado', 'nao_verificado']),
  url: z.url({ protocol: /^https?$/ }).optional(),
}).strict()

export const fontesLanternaSchema = z.object(
  Object.fromEntries(CAMPOS_COM_FONTE.map((campo) => [campo, fonteCampoSchema.optional()])) as Record<CampoComFonte, z.ZodOptional<typeof fonteCampoSchema>>,
).strict()

export const estatisticasLanternaSchema = z.object({
  resolvidas: z.number().int().min(0),
  emAndamento: z.number().int().min(0),
  tempoMedioResolucaoHoras: z.number().min(0).nullable(), // null sem resolvidas
  cargaAtual: z.number().int().min(0),
}).strict()

/** Ficha completa. Nada é inferido do desenho: campo nulo continua nulo. */
export const lanternaFichaSchema = lanternaListaSchema.extend({
  primeiraAparicao: z.string().max(300).nullable(),
  habilidades: z.array(z.string().min(2).max(60)).max(10),
  mentorId: slugLanternaSchema.nullable(),
  citacao: z.string().nullable(),
  biografia: z.string().max(1200).nullable(),
  fontes: fontesLanternaSchema,
  estatisticas: estatisticasLanternaSchema,
  mentor: lanternaResumoSchema.nullable(),
  aprendizes: z.array(lanternaResumoSchema),
}).strict()

export type LanternaResumo = z.infer<typeof lanternaResumoSchema>
export type LanternaLista = z.infer<typeof lanternaListaSchema>
export type LanternaFicha = z.infer<typeof lanternaFichaSchema>
export type FonteCampo = z.infer<typeof fonteCampoSchema>

export const ORDENACOES_LANTERNA = ['codinome', 'setor', 'anoIngresso'] as const

/**
 * Filtros de /lanternas pela URL (ROTA-10/11/14). Valor inválido vira o padrão, sem quebrar a página.
 * A busca vai como digitada (o servidor normaliza caixa e acento), só aparada e limitada a 100.
 */
export const filtroLanternasSchema = z.object({
  busca: z.string().trim().max(100).optional().catch(undefined).transform((v) => v || undefined),
  status: z.enum(STATUS_LANTERNA).optional().catch(undefined),
  setor: z.coerce.number().int().min(0).max(9999).optional().catch(undefined),
  ordenar: z.enum(ORDENACOES_LANTERNA).optional().catch(undefined),
  ordem: z.enum(['asc', 'desc']).optional().catch(undefined),
  pagina: z.coerce.number().int().min(1).optional().catch(undefined),
})

export type FiltroLanternas = z.infer<typeof filtroLanternasSchema>
