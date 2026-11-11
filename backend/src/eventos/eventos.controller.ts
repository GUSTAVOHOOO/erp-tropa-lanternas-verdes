import { Controller, Get, Param, Query } from '@nestjs/common'
import { UsuarioAtual } from '../comum/usuario-atual.decorator.js'
import { FiltroPaginacaoDto } from '../comum/filtro-paginacao.dto.js'
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js'
import { IdOcorrenciaPipe } from '../ocorrencias/dto/id-ocorrencia.pipe.js'
import { EventosConsultaService } from './eventos-consulta.service.js'

@Controller('ocorrencias/:ocorrenciaId/eventos')
export class EventosController {
  constructor(private readonly eventos: EventosConsultaService) {}

  @Get()
  listar(
    @Param('ocorrenciaId', IdOcorrenciaPipe) ocorrenciaId: string,
    @Query() filtros: FiltroPaginacaoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.eventos.listarDaOcorrencia(ocorrenciaId, filtros.pagina, filtros.limite, usuario)
  }
}
