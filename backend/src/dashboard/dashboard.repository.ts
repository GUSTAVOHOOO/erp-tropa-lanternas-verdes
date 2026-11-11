import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import type { DataSource } from 'typeorm'
import type { GravidadeOcorrencia, StatusOcorrencia } from '../ocorrencias/ocorrencia.entity.js'

export interface ContagemChave {
  chave: string
  total: number
}

export interface ContagemDia {
  dia: string
  total: number
}

export interface ItemRanking {
  lanternaId: string
  codinome: string
  resolvidas: number
}

export interface AgregadosDashboard {
  porStatus: ContagemChave[]
  porGravidade: ContagemChave[]
  vencidas: number
  tempoMedioResolucaoHoras: number | null
  abertasPorDia: ContagemDia[]
  resolvidasPorDia: ContagemDia[]
  ranking: ItemRanking[]
}

@Injectable()
export class DashboardRepository {
  constructor(@InjectDataSource() private readonly banco: DataSource) {}

  async agregar(setorId: number | null | undefined, agora: Date, dias: number): Promise<AgregadosDashboard> {
    const parametrosEscopo: Array<number> = []
    const clausulaEscopo = this.clausulaEscopo(setorId, parametrosEscopo)
    const parametroBase = [...parametrosEscopo]

    const porStatus = await this.banco.query(
      `SELECT status AS chave, COUNT(*) AS total
       FROM ocorrencia
       WHERE excluidaEm IS NULL${clausulaEscopo}
       GROUP BY status`,
      parametroBase,
    ) as Array<{ chave: StatusOcorrencia; total: number | string }>

    const porGravidade = await this.banco.query(
      `SELECT gravidade AS chave, COUNT(*) AS total
       FROM ocorrencia
       WHERE excluidaEm IS NULL${clausulaEscopo}
       GROUP BY gravidade`,
      parametroBase,
    ) as Array<{ chave: GravidadeOcorrencia; total: number | string }>

    const vencidasRaw = await this.banco.query(
      `SELECT COUNT(*) AS total
       FROM ocorrencia
       WHERE excluidaEm IS NULL
         AND status <> 'resolvida'
         AND (julianday(criadaEm) + CASE gravidade
           WHEN 'critica' THEN 1 WHEN 'alta' THEN 3 WHEN 'media' THEN 7 ELSE 14 END) < julianday(?)${clausulaEscopo}`,
      [agora.toISOString(), ...parametrosEscopo],
    ) as Array<{ total: number | string }>

    const mediaRaw = await this.banco.query(
      `SELECT ROUND(AVG((julianday(resolvidaEm) - julianday(criadaEm)) * 24.0), 2) AS media
       FROM ocorrencia
       WHERE excluidaEm IS NULL
         AND status = 'resolvida'
         AND resolvidaEm IS NOT NULL${clausulaEscopo}`,
      parametroBase,
    ) as Array<{ media: number | string | null }>

    const fimUtc = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate() + 1))
    const inicioUtc = new Date(fimUtc.getTime() - dias * 24 * 60 * 60 * 1000)
    const inicioSqlite = this.dataHoraSqlite(inicioUtc)
    const fimSqlite = this.dataHoraSqlite(fimUtc)

    const abertasPorDia = await this.agruparPorDia(
      'criadaEm', inicioSqlite, fimSqlite, clausulaEscopo, parametroBase,
    )
    const resolvidasPorDia = await this.agruparPorDia(
      'resolvidaEm', inicioSqlite, fimSqlite, clausulaEscopo, parametroBase, true,
    )

    const ranking = await this.banco.query(
      `SELECT ocorrencia.responsavelId AS lanternaId,
              lanterna.codinome AS codinome,
              COUNT(*) AS resolvidas
       FROM ocorrencia
       INNER JOIN lanterna ON lanterna.id = ocorrencia.responsavelId
       WHERE ocorrencia.excluidaEm IS NULL
         AND ocorrencia.status = 'resolvida'${this.clausulaEscopo(setorId, [], 'ocorrencia.setorId')}
       GROUP BY ocorrencia.responsavelId, lanterna.codinome
       ORDER BY resolvidas DESC, ocorrencia.responsavelId ASC
       LIMIT 10`,
      parametroBase,
    ) as Array<{ lanternaId: string; codinome: string; resolvidas: number | string }>

    return {
      porStatus: porStatus.map(({ chave, total }) => ({ chave, total: Number(total) })),
      porGravidade: porGravidade.map(({ chave, total }) => ({ chave, total: Number(total) })),
      vencidas: Number(vencidasRaw[0]?.total ?? 0),
      tempoMedioResolucaoHoras: mediaRaw[0]?.media === null || mediaRaw[0]?.media === undefined
        ? null : Number(mediaRaw[0].media),
      abertasPorDia: abertasPorDia.map(({ dia, total }) => ({ dia, total: Number(total) })),
      resolvidasPorDia: resolvidasPorDia.map(({ dia, total }) => ({ dia, total: Number(total) })),
      ranking: ranking.map(({ lanternaId, codinome, resolvidas }) => ({
        lanternaId, codinome, resolvidas: Number(resolvidas),
      })),
    }
  }

  private async agruparPorDia(
    coluna: 'criadaEm' | 'resolvidaEm',
    inicio: string,
    fim: string,
    clausulaEscopo: string,
    parametrosEscopo: number[],
    somenteResolvidas = false,
  ): Promise<ContagemDia[]> {
    const status = somenteResolvidas ? " AND status = 'resolvida'" : ''
    const bruto = await this.banco.query(
      `SELECT strftime('%Y-%m-%d', ${coluna}) AS dia, COUNT(*) AS total
       FROM ocorrencia
       WHERE excluidaEm IS NULL
         AND ${coluna} IS NOT NULL
         AND ${coluna} >= ? AND ${coluna} < ?${status}${clausulaEscopo}
       GROUP BY strftime('%Y-%m-%d', ${coluna})`,
      [inicio, fim, ...parametrosEscopo],
    ) as Array<{ dia: string; total: number | string }>
    return bruto.map(({ dia, total }) => ({ dia, total: Number(total) }))
  }

  private clausulaEscopo(
    setorId: number | null | undefined,
    parametros: number[],
    coluna = 'setorId',
  ): string {
    if (setorId === undefined) return ''
    if (setorId === null) return ' AND 1 = 0'
    parametros.push(setorId)
    return ` AND ${coluna} = ?`
  }

  private dataHoraSqlite(data: Date): string {
    return data.toISOString().slice(0, -1).replace('T', ' ')
  }
}
