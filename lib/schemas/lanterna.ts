import * as z from 'zod'

export const STATUS_LANTERNA = ['ativo', 'em_missao', 'afastado'] as const
export type StatusLanterna = (typeof STATUS_LANTERNA)[number]

export const rotuloStatusLanterna: Record<StatusLanterna, string> = {
  ativo: 'Ativo',
  em_missao: 'Em missão',
  afastado: 'Afastado',
}

/** Perfil público de um lanterna (sem e-mail nem senha: isso fica em usuarios). [API-04] */
export const lanternaSchema = z.object({
  id: z.coerce.string(),
  nome: z.string(),
  especie: z.string(),
  planetaNatal: z.string(),
  setorId: z.coerce.string(),
  status: z.enum(STATUS_LANTERNA),
})

export type Lanterna = z.infer<typeof lanternaSchema> // [FORM-03]

/** ?setor= da página /lanternas. Valor que não é número vira "sem filtro". [ROTA-11] */
export const filtroLanternasSchema = z.object({
  setor: z.string().regex(/^\d+$/).optional().catch(undefined),
})
