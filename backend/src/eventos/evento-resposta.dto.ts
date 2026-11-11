import type { Evento } from './evento.entity.js'
import { AutorResumoDto } from '../comum/autor-resumo.dto.js'

export class EventoRespostaDto {
  id!: string
  ocorrenciaId!: string
  autorId!: string
  autor!: AutorResumoDto
  criadoEm!: Date
  tipo!: Evento['tipo']
  dados!: Record<string, unknown>

  static de(evento: Evento): EventoRespostaDto {
    const resposta = new EventoRespostaDto()
    Object.assign(resposta, {
      id: evento.id,
      ocorrenciaId: evento.ocorrenciaId,
      autorId: evento.autorId,
      autor: AutorResumoDto.de(evento.autor),
      criadoEm: evento.criadoEm,
      tipo: evento.tipo,
      dados: evento.dados,
    })
    return resposta
  }
}
