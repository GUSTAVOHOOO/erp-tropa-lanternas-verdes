import type { GravidadeOcorrencia, StatusOcorrencia } from './ocorrencia.entity.js'

const JANELAS_MS: Record<GravidadeOcorrencia, number> = {
  critica: 24 * 60 * 60 * 1000,
  alta: 3 * 24 * 60 * 60 * 1000,
  media: 7 * 24 * 60 * 60 * 1000,
  baixa: 14 * 24 * 60 * 60 * 1000,
}

export function calcularPrazo(criadaEm: Date, gravidade: GravidadeOcorrencia): Date {
  return new Date(criadaEm.getTime() + JANELAS_MS[gravidade])
}

export function estaVencida(status: StatusOcorrencia, prazoEm: Date, agora: Date): boolean {
  return status !== 'resolvida' && agora.getTime() > prazoEm.getTime()
}

export function ordenarGravidadeSql(alias: string): string {
  return `CASE ${alias}.gravidade WHEN 'critica' THEN 0 WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END`
}

export function prazoSql(alias: string): string {
  return `(julianday(${alias}.criadaEm) + CASE ${alias}.gravidade WHEN 'critica' THEN 1 WHEN 'alta' THEN 3 WHEN 'media' THEN 7 ELSE 14 END)`
}
