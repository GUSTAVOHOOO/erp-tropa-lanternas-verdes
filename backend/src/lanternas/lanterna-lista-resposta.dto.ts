import type { Lanterna } from './lanterna.entity.js'

export class LanternaListaRespostaDto {
  id!: string
  codinome!: string
  identidadeCivil!: string | null
  especie!: string | null
  planetaNatal!: string | null
  setorId!: number | null
  status!: string
  anoIngresso!: number | null

  static de(lanterna: Lanterna): LanternaListaRespostaDto {
    const resposta = new LanternaListaRespostaDto()
    resposta.id = lanterna.id
    resposta.codinome = lanterna.codinome
    resposta.identidadeCivil = lanterna.identidadeCivil ?? null
    resposta.especie = lanterna.especie ?? null
    resposta.planetaNatal = lanterna.planetaNatal ?? null
    resposta.setorId = lanterna.setorId ?? null
    resposta.status = lanterna.status
    resposta.anoIngresso = lanterna.anoIngresso ?? null
    return resposta
  }
}
