import type { EstatisticasLanterna } from '../ocorrencias/ocorrencias.repository.js'
import type { Lanterna } from './lanterna.entity.js'
import { LanternaResumoDto } from './lanterna-resumo.dto.js'

export class FichaRespostaDto {
  id!: string
  codinome!: string
  identidadeCivil!: string | null
  especie!: string | null
  planetaNatal!: string | null
  setorId!: number | null
  status!: string
  anoIngresso!: number | null
  primeiraAparicao!: string | null
  habilidades!: string[]
  mentorId!: string | null
  citacao!: string | null
  biografia!: string | null
  fontes!: Record<string, { estado: 'verificado' | 'nao_verificado'; url?: string }>
  estatisticas!: {
    resolvidas: number
    emAndamento: number
    tempoMedioResolucaoHoras: number | null
    cargaAtual: number
  }
  mentor!: LanternaResumoDto | null
  aprendizes!: LanternaResumoDto[]

  static de(lanterna: Lanterna, metricas: EstatisticasLanterna): FichaRespostaDto {
    const resposta = new FichaRespostaDto()
    resposta.id = lanterna.id
    resposta.codinome = lanterna.codinome
    resposta.identidadeCivil = lanterna.identidadeCivil ?? null
    resposta.especie = lanterna.especie ?? null
    resposta.planetaNatal = lanterna.planetaNatal ?? null
    resposta.setorId = lanterna.setorId ?? null
    resposta.status = metricas.cargaAtual > 0
      ? 'em_missao'
      : lanterna.status === 'afastado' ? 'afastado' : 'ativo'
    resposta.anoIngresso = lanterna.anoIngresso ?? null
    resposta.primeiraAparicao = lanterna.primeiraAparicao ?? null
    resposta.habilidades = lanterna.habilidades ?? []
    resposta.mentorId = lanterna.mentorId ?? null
    resposta.citacao = lanterna.citacao ?? null
    resposta.biografia = lanterna.biografia ?? null
    resposta.fontes = lanterna.fontes ?? {}
    resposta.estatisticas = {
      resolvidas: metricas.resolvidas,
      emAndamento: metricas.emAndamento,
      tempoMedioResolucaoHoras: metricas.mediaCentimosHora === null
        ? null
        : metricas.mediaCentimosHora / 100,
      cargaAtual: metricas.cargaAtual,
    }
    resposta.mentor = lanterna.mentor ? LanternaResumoDto.de(lanterna.mentor) : null
    resposta.aprendizes = (lanterna.aprendizes ?? []).map(LanternaResumoDto.de)
    return resposta
  }
}
