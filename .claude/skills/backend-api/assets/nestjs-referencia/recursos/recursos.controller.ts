import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common'
import { Papeis, Publico } from '../auth/decorators.js'
import { AtualizarRecursoDto } from './dto/atualizar-recurso.dto.js'
import { CriarRecursoDto } from './dto/criar-recurso.dto.js'
import { ListarRecursosDto } from './dto/listar-recursos.dto.js'
import { RecursosService } from './recursos.service.js'

@Controller('recursos')
export class RecursosController {
  constructor(private readonly service: RecursosService) {}

  @Publico() @Get()
  listar(@Query() filtros: ListarRecursosDto) { return this.service.listar(filtros) }

  @Publico() @Get('destaques') // rota fixa ANTES de :id
  destaques() { return { fixa: true } }

  @Publico() @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) { return this.service.buscar(id) }

  @Papeis('admin') @Post()
  criar(@Body() dto: CriarRecursoDto) { return this.service.criar(dto) }

  @Papeis('admin') @Patch(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: AtualizarRecursoDto) {
    return this.service.atualizar(id, dto)
  }

  @Papeis('admin') @Delete(':id') @HttpCode(204)
  async remover(@Param('id', ParseIntPipe) id: number) { await this.service.remover(id) }
}
