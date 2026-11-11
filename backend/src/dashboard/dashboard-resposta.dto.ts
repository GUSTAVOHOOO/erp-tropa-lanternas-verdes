export interface ContagemDashboardDto {
  aberta: number
  em_andamento: number
  resolvida: number
}

export interface GravidadeDashboardDto {
  baixa: number
  media: number
  alta: number
  critica: number
}

export interface PontoSerieDashboardDto {
  dia: string
  abertas: number
  resolvidas: number
}

export interface ItemRankingDashboardDto {
  lanternaId: string
  codinome: string
  resolvidas: number
}

export class DashboardRespostaDto {
  porStatus!: ContagemDashboardDto
  porGravidade!: GravidadeDashboardDto
  vencidas!: number
  tempoMedioResolucaoHoras!: number | null
  serie!: PontoSerieDashboardDto[]
  ranking!: ItemRankingDashboardDto[]
}
