import 'server-only'
import { requisitarApi } from '@/lib/api'
import { lerTokenObrigatorio } from '@/lib/dal'
import { dashboardSchema, type Dashboard } from '@/lib/schemas/dashboard'

export type FiltroConsultaDashboard = {
  setor?: number
  dias?: number
}

/**
 * Consulta métricas agregadas do painel no escopo autorizado da sessão. [API-04][API-06]
 * Totais, média e ranking consideram todo o histórico; dias limita apenas a série.
 */
export async function consultarDashboard(filtro: FiltroConsultaDashboard = {}): Promise<Dashboard> {
  const token = await lerTokenObrigatorio()
  return requisitarApi('/dashboard', dashboardSchema, {
    consulta: filtro,
    token,
    cache: { cache: 'no-store' },
  })
}
