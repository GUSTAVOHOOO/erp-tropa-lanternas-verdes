import * as z from 'zod'
import { idSetorSchema } from '@/lib/schemas/setor'
import { slugLanternaSchema } from '@/lib/schemas/lanterna'

export const GRAVIDADES = ['baixa', 'media', 'alta', 'critica'] as const
export type Gravidade = (typeof GRAVIDADES)[number]
export const rotuloGravidade: Record<Gravidade, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
}

export const STATUS_OCORRENCIA = ['aberta', 'em_andamento', 'resolvida'] as const
export type StatusOcorrencia = (typeof STATUS_OCORRENCIA)[number]
export const rotuloStatus: Record<StatusOcorrencia, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em andamento',
  resolvida: 'Resolvida',
}

/** Ocorrência como a API devolve: mesma forma em lista, detalhe e mutações; prazo e vencida calculados. [API-04] */
export const ocorrenciaSchema = z.object({
  id: z.uuid(),
  titulo: z.string().min(5).max(100),
  descricao: z.string().min(10).max(2000),
  planeta: z.string().min(2).max(100),
  setorId: idSetorSchema,
  gravidade: z.enum(GRAVIDADES),
  status: z.enum(STATUS_OCORRENCIA),
  envolvidos: z.number().int().min(1).max(1_000_000),
  responsavelId: slugLanternaSchema.nullable(), // slug da Ficha
  resolucao: z.string().min(10).max(2000).nullable(),
  criadaPorId: z.uuid(), // UUID da conta
  criadaEm: z.iso.datetime({ offset: true }),
  resolvidaEm: z.iso.datetime({ offset: true }).nullable(),
  prazoEm: z.iso.datetime({ offset: true }),
  vencida: z.boolean(),
}).strict()
export type Ocorrencia = z.infer<typeof ocorrenciaSchema>

/**
 * Formulário "Registrar ocorrência": mesmo schema no cliente e na Server Action. O `setorId` só é
 * enviado pelo Guardião (obrigatório para ele, conferido na Action); o Lanterna nunca o envia.
 */
export const novaOcorrenciaSchema = z.object({ // [FORM-02]
  titulo: z.string().trim()
    .min(5, 'O título precisa ter pelo menos 5 caracteres.')
    .max(100, 'Use no máximo 100 caracteres no título.'), // [FORM-11]
  descricao: z.string().trim()
    .min(10, 'Descreva a ocorrência em pelo menos 10 caracteres.')
    .max(2000, 'Use no máximo 2000 caracteres na descrição.'),
  planeta: z.string().trim()
    .min(2, 'Informe o planeta onde a ocorrência aconteceu.')
    .max(100, 'Use no máximo 100 caracteres no planeta.'),
  setorId: z.preprocess( // Setor 0 é válido: '' vira ausente, não zero
    (v) => (v === '' || v === null ? undefined : v),
    z.coerce.number('Escolha o setor da ocorrência.').int().min(0).max(9999).optional(),
  ),
  gravidade: z.enum(GRAVIDADES, 'Escolha a gravidade.'),
  envolvidos: z.coerce.number('Informe um número.') // [FORM-13]
    .int('Use um número inteiro.')
    .min(1, 'Informe quantos seres estão envolvidos (mínimo 1).')
    .max(1_000_000, 'Use no máximo 1.000.000.'),
})
export type NovaOcorrenciaData = z.infer<typeof novaOcorrenciaSchema> // [FORM-03]

/** Formulário de status: "resolvida" exige explicar como. */
export const atualizarStatusSchema = z.object({
  statusAtual: z.enum(STATUS_OCORRENCIA).optional(),
  status: z.enum(STATUS_OCORRENCIA, 'Escolha o novo status.'),
  resolucao: z.string().trim().max(2000).optional().default(''),
  motivo: z.string().trim().max(500).optional().default(''),
}).refine((d) => d.status !== 'resolvida' || d.resolucao.length >= 10, {
  message: 'Explique em pelo menos 10 caracteres como a ocorrência foi resolvida.',
  path: ['resolucao'], // [FORM-14]
}).refine((d) => !(d.statusAtual === 'resolvida' && d.status === 'aberta') || d.motivo.length >= 10, {
  message: 'Informe em pelo menos 10 caracteres o motivo da reabertura.',
  path: ['motivo'],
})
export type AtualizarStatusData = z.infer<typeof atualizarStatusSchema>

export const atribuicaoSchema = z.object({
  responsavelId: z.union([slugLanternaSchema, z.literal('')]),
})
export type AtribuicaoData = z.infer<typeof atribuicaoSchema>

export const edicaoOcorrenciaSchema = novaOcorrenciaSchema.omit({ setorId: true }).strict()
export type EdicaoOcorrenciaData = z.infer<typeof edicaoOcorrenciaSchema>

export const ORDENACOES_OCORRENCIA = ['prazo', 'criadaEm', 'gravidade'] as const

/**
 * Filtros da lista do painel pela URL (ROTA-11/14). Valor inválido vira "sem filtro". O setor é só
 * uma intenção: para o Lanterna, o servidor usa o setor da sessão (AUTH-07) e a API o ignora.
 */
export const filtroOcorrenciasSchema = z.object({
  status: z.enum(STATUS_OCORRENCIA).optional().catch(undefined),
  gravidade: z.enum(GRAVIDADES).optional().catch(undefined),
  setor: z.coerce.number().int().min(0).max(9999).optional().catch(undefined),
  responsavel: slugLanternaSchema.optional().catch(undefined),
  vencida: z.enum(['true']).transform(() => true as const).optional().catch(undefined),
  busca: z.string().trim().max(100).optional().catch(undefined).transform((v) => v || undefined),
  ordenar: z.enum(ORDENACOES_OCORRENCIA).optional().catch(undefined),
  ordem: z.enum(['asc', 'desc']).optional().catch(undefined),
  pagina: z.coerce.number().int().min(1).optional().catch(undefined),
})
export type FiltroOcorrencias = z.infer<typeof filtroOcorrenciasSchema>
