import * as z from 'zod'
import { slugLanternaSchema } from '@/lib/schemas/lanterna'

const contagem = z.number().int().min(0)

/**
 * Métricas de GET /dashboard: só não excluídas, no escopo autorizado. `dias` limita apenas a série
 * (UTC, inclui hoje); totais, média e ranking consideram todo o histórico. [API-04]
 */
export const dashboardSchema = z.object({
  porStatus: z.object({ aberta: contagem, em_andamento: contagem, resolvida: contagem }).strict(),
  porGravidade: z.object({ baixa: contagem, media: contagem, alta: contagem, critica: contagem }).strict(),
  vencidas: contagem,
  tempoMedioResolucaoHoras: z.number().min(0).nullable(), // null sem resolvidas
  serie: z.array(z.object({ dia: z.iso.date(), abertas: contagem, resolvidas: contagem }).strict()).max(90),
  ranking: z.array(z.object({ lanternaId: slugLanternaSchema, codinome: z.string().min(2).max(60), resolvidas: contagem }).strict()).max(10),
}).strict()

export type Dashboard = z.infer<typeof dashboardSchema>

export const DIAS_PADRAO = 30

/** ?setor= (só Guardião) e ?dias= 7..90 pela URL; inválido vira padrão. [ROTA-11] */
export const filtroDashboardSchema = z.object({
  setor: z.coerce.number().int().min(0).max(9999).optional().catch(undefined),
  dias: z.coerce.number().int().min(7).max(90).optional().catch(undefined),
})
export type FiltroDashboard = z.infer<typeof filtroDashboardSchema>
