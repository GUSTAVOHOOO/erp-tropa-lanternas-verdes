import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common'
import { Papeis } from '../comum/papeis.decorator.js'
import { FiltroUsuariosDto } from './dto/filtro-usuarios.dto.js'
import { IdUsuarioPipe } from './dto/id-usuario.pipe.js'
import { PapelUsuarioDto } from './dto/papel-usuario.dto.js'
import { VinculoLanternaDto } from './dto/vinculo-lanterna.dto.js'
import { UsuariosService } from './usuarios.service.js'

@Controller('usuarios')
@Papeis('guardiao')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  listar(@Query() filtros: FiltroUsuariosDto) {
    return this.usuarios.listar(filtros)
  }

  @Patch(':id/papel')
  alterarPapel(@Param('id', IdUsuarioPipe) id: string, @Body() dados: PapelUsuarioDto) {
    return this.usuarios.alterarPapel(id, dados)
  }

  @Patch(':id/lanterna')
  vincularLanterna(@Param('id', IdUsuarioPipe) id: string, @Body() dados: VinculoLanternaDto) {
    return this.usuarios.vincularLanterna(id, dados)
  }
}
