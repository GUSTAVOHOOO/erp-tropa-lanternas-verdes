import { IDS_SEED_EVENTOS, IDS_SEED_OCORRENCIAS } from './ids.js'

export const IDS_EVENTOS_SEED_TODOS = [
  ...IDS_SEED_EVENTOS.criada,
  ...Object.values(IDS_SEED_EVENTOS.atribuida),
  ...Object.values(IDS_SEED_EVENTOS.status),
  ...Object.values(IDS_SEED_EVENTOS.resolvida),
] as const

export function idEventoCriacaoSeed(indice: number): string {
  return IDS_SEED_EVENTOS.criada[indice - 1]!
}

export function idsEventoOcorrenciaSeed(chave: keyof typeof IDS_SEED_OCORRENCIAS): string[] {
  const ids = [idEventoCriacaoSeed(Number(chave.slice(1)))]
  const atribuido = IDS_SEED_EVENTOS.atribuida[chave as keyof typeof IDS_SEED_EVENTOS.atribuida]
  const status = IDS_SEED_EVENTOS.status[chave as keyof typeof IDS_SEED_EVENTOS.status]
  const resolvida = IDS_SEED_EVENTOS.resolvida[chave as keyof typeof IDS_SEED_EVENTOS.resolvida]
  if (atribuido) ids.push(atribuido)
  if (status) ids.push(status)
  if (resolvida) ids.push(resolvida)
  return ids
}
