import type { Lanterna } from './lanterna.entity.js'

export class LanternaResumoDto {
  id!: string
  codinome!: string
  setorId!: number | null
  status!: string

  static de(lanterna: Lanterna): LanternaResumoDto {
    const resposta = new LanternaResumoDto()
    resposta.id = lanterna.id
    resposta.codinome = lanterna.codinome
    resposta.setorId = lanterna.setorId ?? null
    resposta.status = lanterna.status
    return resposta
  }
}
