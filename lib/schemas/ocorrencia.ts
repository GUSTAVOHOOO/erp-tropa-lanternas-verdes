import * as z from 'zod'

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

/** Formato de uma ocorrência como a API devolve. [API-04] */
export const ocorrenciaSchema = z.object({
  id: z.coerce.string(),
  titulo: z.string(),
  descricao: z.string(),
  planeta: z.string(),
  setorId: z.coerce.string(),
  gravidade: z.enum(GRAVIDADES),
  status: z.enum(STATUS_OCORRENCIA),
  envolvidos: z.number(),
  responsavelId: z.string().nullable(),
  resolucao: z.string().nullable(),
  criadaPor: z.string(),
  criadaEm: z.string(),
})
export type Ocorrencia = z.infer<typeof ocorrenciaSchema>

/** Formulário "Registrar ocorrência": mesmo schema no cliente e na Server Action. [FORM-02] */
export const novaOcorrenciaSchema = z.object({
  titulo: z.string().trim()
    .min(5, 'O título precisa ter pelo menos 5 caracteres.')
    .max(100, 'Use no máximo 100 caracteres no título.'), // [FORM-11]
  descricao: z.string().trim().min(10, 'Descreva a ocorrência em pelo menos 10 caracteres.'),
  planeta: z.string().trim().min(2, 'Informe o planeta onde a ocorrência aconteceu.'),
  setorId: z.string().min(1, 'Escolha o setor da ocorrência.'),
  gravidade: z.enum(GRAVIDADES, 'Escolha a gravidade.'),
  envolvidos: z.coerce.number('Informe um número.') // [FORM-13]
    .int('Use um número inteiro.')
    .min(1, 'Informe quantos seres estão envolvidos (mínimo 1).'),
})
export type NovaOcorrenciaData = z.infer<typeof novaOcorrenciaSchema> // [FORM-03]

/** Formulário de status: "resolvida" exige explicar como. */
export const atualizarStatusSchema = z.object({
  status: z.enum(STATUS_OCORRENCIA, 'Escolha o novo status.'),
  resolucao: z.string().trim(),
}).refine((d) => d.status !== 'resolvida' || d.resolucao.length >= 10, {
  message: 'Explique em pelo menos 10 caracteres como a ocorrência foi resolvida.',
  path: ['resolucao'], // [FORM-14]
})
export type AtualizarStatusData = z.infer<typeof atualizarStatusSchema>

export const atribuicaoSchema = z.object({
  responsavelId: z.string().min(1, 'Escolha o lanterna responsável.'),
})
export type AtribuicaoData = z.infer<typeof atribuicaoSchema>

/** ?status= e ?setor= da lista do painel. Valor desconhecido vira "sem filtro". [ROTA-11] */
export const filtroOcorrenciasSchema = z.object({
  status: z.enum(STATUS_OCORRENCIA).optional().catch(undefined),
  setor: z.string().regex(/^\d+$/).optional().catch(undefined),
})
