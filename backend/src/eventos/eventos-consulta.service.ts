import { Injectable } from '@nestjs/common'
import { ErroDominio } from '../comum/erro-dominio.js'
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js'
import { OcorrenciasRepository } from '../ocorrencias/ocorrencias.repository.js'
import { EventoRespostaDto } from './evento-resposta.dto.js'
import { EventosRepository } from './eventos.repository.js'

@Injectable()
export class EventosConsultaService {
  constructor(private readonly eventos: EventosRepository, private readonly ocorrencias: OcorrenciasRepository) {}

  async listarDaOcorrencia(ocorrenciaId: string, pagina: number, limite: number, usuario: UsuarioAutenticado) {
    const ocorrencia = await this.ocorrencias.buscarPorId(ocorrenciaId)
    if (!ocorrencia || (usuario.papel === 'lanterna' && ocorrencia.setorId !== usuario.setorId)) {
      throw new ErroDominio(404, 'NAO_ENCONTRADO', 'Ocorrência não encontrada')
    }
    const { itens, total } = await this.eventos.listarPaginaDaOcorrencia(ocorrenciaId, pagina, limite)
    return {
      itens: itens.map(EventoRespostaDto.de),
      meta: { total, pagina, limite, paginas: total === 0 ? 0 : Math.ceil(total / limite) },
    }
  }
}
