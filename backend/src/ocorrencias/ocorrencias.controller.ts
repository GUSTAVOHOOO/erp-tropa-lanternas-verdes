import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common'
import { Papeis } from '../comum/papeis.decorator.js'
import { UsuarioAtual } from '../comum/usuario-atual.decorator.js'
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js'
import { CriarOcorrenciaDto } from './dto/criar-ocorrencia.dto.js'
import { EditarOcorrenciaDto } from './dto/editar-ocorrencia.dto.js'
import { FiltroOcorrenciasDto } from './dto/filtro-ocorrencias.dto.js'
import { FiltroPaginacaoFilaDto } from './dto/filtro-paginacao-fila.dto.js'
import { IdOcorrenciaPipe } from './dto/id-ocorrencia.pipe.js'
import { EditarOcorrenciaPipe } from './editar-ocorrencia.pipe.js'
import { CicloVidaService } from './ciclo-vida.service.js'
import { StatusOcorrenciaDto } from './dto/status-ocorrencia.dto.js'
import { ResponsavelOcorrenciaDto } from './dto/responsavel-ocorrencia.dto.js'
import { OcorrenciasService } from './ocorrencias.service.js'

@Controller('ocorrencias')
export class OcorrenciasController {
  constructor(private readonly ocorrencias: OcorrenciasService, private readonly cicloVida: CicloVidaService) {}

  @Get()
  listar(@Query() filtros: FiltroOcorrenciasDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.ocorrencias.listar(filtros, usuario)
  }

  @Papeis('lanterna')
  @Get('minha-fila')
  listarMinhaFila(@Query() filtros: FiltroPaginacaoFilaDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.ocorrencias.listarMinhaFila(filtros.pagina, filtros.limite, usuario)
  }

  @Get(':id')
  buscarPorId(@Param('id', IdOcorrenciaPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.ocorrencias.buscarPorId(id, usuario)
  }

  @Post()
  criar(@Body() dados: CriarOcorrenciaDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.ocorrencias.criar(dados, usuario)
  }

  @Patch(':id')
  editar(
    @Param('id', IdOcorrenciaPipe) id: string,
    @Body(EditarOcorrenciaPipe) dados: EditarOcorrenciaDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.ocorrencias.editar(id, dados, usuario)
  }

  @Patch(':id/status')
  alterarStatus(
    @Param('id', IdOcorrenciaPipe) id: string,
    @Body() dados: StatusOcorrenciaDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.cicloVida.alterarStatus(id, dados, usuario)
  }

  @Papeis('guardiao')
  @Patch(':id/responsavel')
  alterarResponsavel(
    @Param('id', IdOcorrenciaPipe) id: string,
    @Body() dados: ResponsavelOcorrenciaDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.cicloVida.alterarResponsavel(id, dados, usuario)
  }

  @Papeis('guardiao')
  @Delete(':id')
  @HttpCode(204)
  excluir(@Param('id', IdOcorrenciaPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.ocorrencias.excluir(id, usuario)
  }
}
