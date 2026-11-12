import * as z from 'zod'
import { slugLanternaSchema } from '@/lib/schemas/lanterna'
import { PAPEIS } from '@/lib/schemas/usuario'

export const ORDENACOES_USUARIO = ['nome', 'criadoEm'] as const
export type OrdenacaoUsuario = (typeof ORDENACOES_USUARIO)[number]

/**
 * Filtros de /usuarios pela URL. Valores inválidos viram o padrão, sem quebrar a página.
 * A busca vai como digitada (o servidor normaliza caixa e acento).
 */
export const filtroUsuariosSchema = z.object({
  busca: z.string().max(100).optional().catch(undefined).transform((v) => (v === '' ? undefined : v)),
  pagina: z.coerce.number().int().min(1).optional().catch(undefined),
  limite: z.coerce.number().int().min(1).max(50).optional().catch(undefined),
  ordenar: z.enum(ORDENACOES_USUARIO).optional().catch(undefined),
  ordem: z.enum(['asc', 'desc']).optional().catch(undefined),
})

export type FiltroUsuarios = z.infer<typeof filtroUsuariosSchema>

/**
 * Formulário para alteração de papel.
 * Setor 0 é válido; com papel 'guardiao', setorId é descartado antes do envio.
 */
export const papelFormularioSchema = z
  .object({
    papel: z.enum(PAPEIS, { message: 'Escolha um papel válido.' }),
    setorId: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : v),
      z.coerce
        .number({ message: 'Setor deve ser um número inteiro.' })
        .int('Setor deve ser um número inteiro.')
        .min(0, 'Setor inválido.')
        .max(9999, 'Setor inválido.')
        .optional(),
    ),
  })
  .transform((dados) => {
    if (dados.papel === 'guardiao') {
      return { papel: dados.papel }
    }
    return dados
  })

export type PapelFormularioInput = z.input<typeof papelFormularioSchema>
export type PapelFormularioOutput = z.output<typeof papelFormularioSchema>

/**
 * Formulário para vínculo da conta à Ficha de Lanterna.
 * String vazia ('') representa desvincular (enviado como null à API).
 */
export const vinculoFormularioSchema = z.object({
  lanternaId: z.union([slugLanternaSchema, z.literal('')], {
    message: 'Escolha uma opção válida.',
  }),
})

export type VinculoFormularioData = z.infer<typeof vinculoFormularioSchema>
