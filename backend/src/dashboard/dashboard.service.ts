import { Injectable } from '@nestjs/common'
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js'
import type { FiltroDashboardDto } from './dto/filtro-dashboard.dto.js'
import type {
  ContagemDashboardDto, DashboardRespostaDto, GravidadeDashboardDto,
} from './dashboard-resposta.dto.js'
import { DashboardRepository } from './dashboard.repository.js'

const STATUS = ['aberta', 'em_andamento', 'resolvida'] as const
const GRAVIDADES = ['baixa', 'media', 'alta', 'critica'] as const
const DIA_MS = 24 * 60 * 60 * 1000

@Injectable()
export class DashboardService {
  constructor(private readonly dashboard: DashboardRepository) {}

  async consultar(
    filtros: FiltroDashboardDto,
    usuario: UsuarioAutenticado,
    agora = new Date(),
  ): Promise<DashboardRespostaDto> {
    const setorId = usuario.papel === 'lanterna' ? usuario.setorId : filtros.setor
    const agregados = await this.dashboard.agregar(setorId, agora, filtros.dias)
    const porStatus = this.completarContagem(STATUS, agregados.porStatus) as ContagemDashboardDto
    const porGravidade = this.completarContagem(GRAVIDADES, agregados.porGravidade) as GravidadeDashboardDto
    const abertasPorDia = new Map(agregados.abertasPorDia.map(({ dia, total }) => [dia, total]))
    const resolvidasPorDia = new Map(agregados.resolvidasPorDia.map(({ dia, total }) => [dia, total]))
    const hojeUtc = Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate())
    const serie = Array.from({ length: filtros.dias }, (_, indice) => {
      const data = new Date(hojeUtc - (filtros.dias - indice - 1) * DIA_MS)
      const dia = data.toISOString().slice(0, 10)
      return {
        dia,
        abertas: abertasPorDia.get(dia) ?? 0,
        resolvidas: resolvidasPorDia.get(dia) ?? 0,
      }
    })

    return {
      porStatus, porGravidade,
      vencidas: agregados.vencidas,
      tempoMedioResolucaoHoras: agregados.tempoMedioResolucaoHoras,
      serie,
      ranking: agregados.ranking,
    }
  }

  private completarContagem<T extends string>(
    chaves: readonly T[],
    contagens: Array<{ chave: string; total: number }>,
  ): Record<T, number> {
    const mapa = new Map(contagens.map(({ chave, total }) => [chave, total]))
    return Object.fromEntries(chaves.map((chave) => [chave, mapa.get(chave) ?? 0])) as Record<T, number>
  }
}
