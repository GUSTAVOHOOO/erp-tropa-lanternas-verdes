import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common'
import { FiltroPaginacaoDto } from '../comum/filtro-paginacao.dto.js'
import { UsuarioAtual } from '../comum/usuario-atual.decorator.js'
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js'
import { IdOcorrenciaPipe } from '../ocorrencias/dto/id-ocorrencia.pipe.js'
import { CriarComentarioDto } from './dto/criar-comentario.dto.js'
import { ComentariosService } from './comentarios.service.js'

@Controller()
export class ComentariosController {
  constructor(private readonly comentarios: ComentariosService) {}

  @Get('ocorrencias/:ocorrenciaId/comentarios')
  listar(
    @Param('ocorrenciaId', IdOcorrenciaPipe) ocorrenciaId: string,
    @Query() filtros: FiltroPaginacaoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.comentarios.listarDaOcorrencia(ocorrenciaId, filtros.pagina, filtros.limite, usuario)
  }

  @Post('ocorrencias/:ocorrenciaId/comentarios')
  criar(
    @Param('ocorrenciaId', IdOcorrenciaPipe) ocorrenciaId: string,
    @Body() dados: CriarComentarioDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.comentarios.criar(ocorrenciaId, dados, usuario)
  }

  @Delete('comentarios/:id')
  @HttpCode(204)
  excluir(
    @Param('id', IdOcorrenciaPipe) id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ): Promise<void> {
    return this.comentarios.excluir(id, usuario)
  }
}
