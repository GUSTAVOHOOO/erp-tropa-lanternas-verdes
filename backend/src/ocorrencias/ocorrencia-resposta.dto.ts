import type { Ocorrencia } from './ocorrencia.entity.js'
import { calcularPrazo, estaVencida } from './prazo.js'

export class OcorrenciaRespostaDto {
  id!: string
  titulo!: string
  descricao!: string
  planeta!: string
  setorId!: number
  gravidade!: Ocorrencia['gravidade']
  status!: Ocorrencia['status']
  envolvidos!: number
  responsavelId!: string | null
  resolucao!: string | null
  criadaPorId!: string
  criadaEm!: Date
  resolvidaEm!: Date | null
  prazoEm!: Date
  vencida!: boolean

  static de(ocorrencia: Ocorrencia, agora = new Date()): OcorrenciaRespostaDto {
    const resposta = new OcorrenciaRespostaDto()
    Object.assign(resposta, {
      id: ocorrencia.id,
      titulo: ocorrencia.titulo,
      descricao: ocorrencia.descricao,
      planeta: ocorrencia.planeta,
      setorId: ocorrencia.setorId,
      gravidade: ocorrencia.gravidade,
      status: ocorrencia.status,
      envolvidos: ocorrencia.envolvidos,
      responsavelId: ocorrencia.responsavelId,
      resolucao: ocorrencia.resolucao,
      criadaPorId: ocorrencia.criadaPorId,
      criadaEm: ocorrencia.criadaEm,
      resolvidaEm: ocorrencia.resolvidaEm,
      prazoEm: calcularPrazo(ocorrencia.criadaEm, ocorrencia.gravidade),
      vencida: estaVencida(ocorrencia.status, calcularPrazo(ocorrencia.criadaEm, ocorrencia.gravidade), agora),
    })
    return resposta
  }
}
