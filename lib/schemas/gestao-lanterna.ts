import * as z from 'zod'
import {
  CAMPOS_COM_FONTE,
  fontesLanternaSchema,
  slugLanternaSchema,
  STATUS_LANTERNA,
  type LanternaFicha,
} from '@/lib/schemas/lanterna'

export { CAMPOS_COM_FONTE, STATUS_LANTERNA }

export const lanternaStatusSchema = z.object({
  status: z.enum(['ativo', 'afastado']),
}).strict()

export type LanternaStatusEntrada = z.infer<typeof lanternaStatusSchema>

export const lanternaCriacaoSchema = z.object({
  id: slugLanternaSchema,
  codinome: z.string().trim().min(2).max(60),
  identidadeCivil: z.string().trim().min(2).max(80).nullable().optional(),
  especie: z.string().trim().min(2).max(50),
  planetaNatal: z.string().trim().min(2).max(60),
  setorId: z.number().int().min(0).max(9999).nullable().optional(),
  anoIngresso: z.number().int().min(1900).max(2100).nullable().optional(),
  primeiraAparicao: z.string().trim().max(300).nullable().optional(),
  habilidades: z.array(z.string().trim().min(2).max(60)).max(10).optional(),
  mentorId: slugLanternaSchema.nullable().optional(),
  citacao: z.string().trim().nullable().optional().refine((val) => {
    if (!val) return true
    const palavras = val.trim().split(/\s+/).filter(Boolean)
    return palavras.length <= 15
  }, { message: 'A citação deve ter no máximo 15 palavras.' }),
  biografia: z.string().trim().max(1200).nullable().optional(),
  fontes: fontesLanternaSchema.optional(),
}).strict()

export type LanternaCriacaoEntrada = z.infer<typeof lanternaCriacaoSchema>

export const lanternaEdicaoSchema = z.object({
  codinome: z.string().trim().min(2).max(60).optional(),
  identidadeCivil: z.string().trim().min(2).max(80).nullable().optional(),
  especie: z.string().trim().min(2).max(50).optional(),
  planetaNatal: z.string().trim().min(2).max(60).optional(),
  setorId: z.number().int().min(0).max(9999).nullable().optional(),
  anoIngresso: z.number().int().min(1900).max(2100).nullable().optional(),
  primeiraAparicao: z.string().trim().max(300).nullable().optional(),
  habilidades: z.array(z.string().trim().min(2).max(60)).max(10).optional(),
  mentorId: slugLanternaSchema.nullable().optional(),
  citacao: z.string().trim().nullable().optional().refine((val) => {
    if (!val) return true
    const palavras = val.trim().split(/\s+/).filter(Boolean)
    return palavras.length <= 15
  }, { message: 'A citação deve ter no máximo 15 palavras.' }),
  biografia: z.string().trim().max(1200).nullable().optional(),
  fontes: fontesLanternaSchema.optional(),
}).strict().refine((obj) => Object.keys(obj).length >= 1, {
  message: 'Pelo menos um campo deve ser alterado.',
})

export type LanternaEdicaoEntrada = z.infer<typeof lanternaEdicaoSchema>

function textoVazioParaNulo(valor: unknown): unknown {
  if (typeof valor === 'string' && valor.trim() === '') return null
  if (typeof valor === 'string') return valor.trim()
  return valor ?? null
}

function processarNumeroOuNulo(min: number, max: number, mensagemIntervalo: string) {
  return z.preprocess((v) => {
    if (v === '' || v === null || v === undefined) return null
    const num = Number(v)
    return Number.isNaN(num) ? v : num
  }, z.number().int('Deve ser um número inteiro.').min(min, mensagemIntervalo).max(max, mensagemIntervalo).nullable())
}

/**
 * Schema do formulário de gestão de Lanterna (RHF).
 * Converte strings vazias em null e processa habilidades como texto separado por vírgula ou linha. [FORM-01][FORM-02]
 */
export const lanternaFormularioSchema = z.object({
  id: z.preprocess((v) => {
    if (typeof v === 'string' && v.trim() === '') return undefined
    if (typeof v === 'string') return v.trim()
    return v
  }, slugLanternaSchema.optional()),
  codinome: z.string().trim().min(2, 'O codinome deve ter pelo menos 2 caracteres.').max(60, 'O codinome deve ter no máximo 60 caracteres.'),
  identidadeCivil: z.preprocess(
    textoVazioParaNulo,
    z.string().min(2, 'A identidade civil deve ter pelo menos 2 caracteres.').max(80, 'A identidade civil deve ter no máximo 80 caracteres.').nullable(),
  ),
  especie: z.string().trim().min(2, 'A espécie deve ter pelo menos 2 caracteres.').max(50, 'A espécie deve ter no máximo 50 caracteres.'),
  planetaNatal: z.string().trim().min(2, 'O planeta natal deve ter pelo menos 2 caracteres.').max(60, 'O planeta natal deve ter no máximo 60 caracteres.'),
  setorId: processarNumeroOuNulo(0, 9999, 'O setor deve ser entre 0 e 9999.'),
  anoIngresso: processarNumeroOuNulo(1900, 2100, 'O ano de ingresso deve ser entre 1900 e 2100.'),
  primeiraAparicao: z.preprocess(
    textoVazioParaNulo,
    z.string().max(300, 'A primeira aparição deve ter no máximo 300 caracteres.').nullable(),
  ),
  habilidades: z.preprocess((v) => {
    if (typeof v === 'string') {
      return v.split(/[,\n]/).map((item) => item.trim()).filter(Boolean)
    }
    if (Array.isArray(v)) {
      return v.map((item) => String(item).trim()).filter(Boolean)
    }
    return []
  }, z.array(z.string().min(2, 'Cada habilidade deve ter pelo menos 2 caracteres.').max(60, 'Cada habilidade deve ter no máximo 60 caracteres.')).max(10, 'No máximo 10 habilidades.')),
  mentorId: z.preprocess(
    textoVazioParaNulo,
    slugLanternaSchema.nullable(),
  ),
  citacao: z.preprocess(
    textoVazioParaNulo,
    z.string().nullable().refine((val) => {
      if (!val) return true
      const palavras = val.trim().split(/\s+/).filter(Boolean)
      return palavras.length <= 15
    }, { message: 'A citação deve ter no máximo 15 palavras.' }),
  ),
  biografia: z.preprocess(
    textoVazioParaNulo,
    z.string().max(1200, 'A biografia deve ter no máximo 1200 caracteres.').nullable(),
  ),
  fontes: fontesLanternaSchema.optional(),
})

export type LanternaFormularioEntrada = z.input<typeof lanternaFormularioSchema>
export type LanternaFormularioSaida = z.output<typeof lanternaFormularioSchema>

function arraysIguais(a: readonly string[] | undefined | null, b: readonly string[] | undefined | null): boolean {
  if (a === b) return true
  if (!a || !b || a.length !== b.length) return false
  return a.every((valor, indice) => valor === b[indice])
}

function fontesIguais(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return JSON.stringify(a) === JSON.stringify(b)
}

const CAMPOS_MUTAVEIS = [
  'codinome',
  'identidadeCivil',
  'especie',
  'planetaNatal',
  'setorId',
  'anoIngresso',
  'primeiraAparicao',
  'habilidades',
  'mentorId',
  'citacao',
  'biografia',
  'fontes',
] as const

export type CampoMutavel = (typeof CAMPOS_MUTAVEIS)[number]

/**
 * Compara a Ficha atual com o novo objeto e devolve apenas os campos alterados,
 * distinguindo campo omitido (undefined) de explicitamente nulo (null). [API-18]
 */
export function camposAlterados(
  atual: LanternaFicha,
  novo: Partial<Record<CampoMutavel, unknown>>,
): Partial<LanternaEdicaoEntrada> {
  const alterados: Partial<LanternaEdicaoEntrada> = {}

  for (const campo of CAMPOS_MUTAVEIS) {
    if (novo[campo] === undefined) continue

    if (campo === 'habilidades') {
      const novasHabilidades = novo.habilidades as string[] | undefined
      if (!arraysIguais(atual.habilidades, novasHabilidades)) {
        alterados.habilidades = novasHabilidades
      }
    } else if (campo === 'fontes') {
      if (!fontesIguais(atual.fontes, novo.fontes)) {
        alterados.fontes = novo.fontes as LanternaEdicaoEntrada['fontes']
      }
    } else {
      if (atual[campo] !== novo[campo]) {
        Object.assign(alterados, { [campo]: novo[campo] })
      }
    }
  }

  return alterados
}
