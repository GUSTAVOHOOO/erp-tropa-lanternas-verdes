import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common'
import { Papeis } from '../comum/papeis.decorator.js'
import { Publica } from '../comum/publica.decorator.js'
import { CriarSetorDto } from './dto/criar-setor.dto.js'
import { EditarSetorDto } from './dto/editar-setor.dto.js'
import { EditarSetorPipe } from './dto/editar-setor.pipe.js'
import { IdSetorPipe } from './dto/id-setor.pipe.js'
import { SetoresService } from './setores.service.js'

@Controller('setores')
export class SetoresController {
  constructor(private readonly setores: SetoresService) {}

  @Publica()
  @Get()
  listar() {
    return this.setores.listar()
  }

  @Publica()
  @Get(':id')
  buscarPorId(@Param('id', IdSetorPipe) id: number) {
    return this.setores.buscarPorId(id)
  }

  @Papeis('guardiao')
  @Post()
  criar(@Body() dados: CriarSetorDto) {
    return this.setores.criar(dados)
  }

  @Papeis('guardiao')
  @Patch(':id')
  editar(@Param('id', IdSetorPipe) id: number, @Body(EditarSetorPipe) dados: EditarSetorDto) {
    return this.setores.editar(id, dados)
  }

  @Papeis('guardiao')
  @Delete(':id')
  @HttpCode(204)
  excluir(@Param('id', IdSetorPipe) id: number): Promise<void> {
    return this.setores.excluir(id)
  }
}
