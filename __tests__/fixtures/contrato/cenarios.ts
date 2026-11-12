import pacote from '../../../docs/contratos/exemplos/cenarios.json'

export type CenarioContrato = (typeof pacote.cenarios)[number]
export const versaoContrato = pacote.versaoContrato
export const cenariosContrato: readonly CenarioContrato[] = pacote.cenarios

export function obterCenario(id: string): CenarioContrato {
  const cenario = cenariosContrato.find((item) => item.id === id)
  if (!cenario) throw new Error(`Cenário de contrato desconhecido: ${id}`)
  return cenario
}
