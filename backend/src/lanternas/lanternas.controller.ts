import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { Papeis } from '../comum/papeis.decorator.js'
import { Publica } from '../comum/publica.decorator.js'
import { CriarLanternaDto } from './dto/criar-lanterna.dto.js'
import { EditarLanternaDto } from './dto/editar-lanterna.dto.js'
import { EditarLanternaPipe } from './dto/editar-lanterna.pipe.js'
import { FiltroLanternasDto } from './dto/filtro-lanternas.dto.js'
import { IdLanternaPipe } from './dto/id-lanterna.pipe.js'
import { StatusLanternaDto } from './dto/status-lanterna.dto.js'
import { LanternasService } from './lanternas.service.js'

@Controller('lanternas')
export class LanternasController {
  constructor(private readonly lanternas: LanternasService) {}

  @Publica()
  @Get()
  listar(@Query() filtros: FiltroLanternasDto) {
    return this.lanternas.listar(filtros)
  }

  @Publica()
  @Get(':id')
  buscarPorId(@Param('id', IdLanternaPipe) id: string) {
    return this.lanternas.buscarPorId(id)
  }

  @Papeis('guardiao')
  @Post()
  criar(@Body() dados: CriarLanternaDto) {
    return this.lanternas.criar(dados)
  }

  @Papeis('guardiao')
  @Patch(':id/status')
  alterarStatus(@Param('id', IdLanternaPipe) id: string, @Body() dados: StatusLanternaDto) {
    return this.lanternas.alterarStatus(id, dados)
  }

  @Papeis('guardiao')
  @Patch(':id')
  editar(@Param('id', IdLanternaPipe) id: string, @Body(EditarLanternaPipe) dados: EditarLanternaDto) {
    return this.lanternas.editar(id, dados)
  }
}
