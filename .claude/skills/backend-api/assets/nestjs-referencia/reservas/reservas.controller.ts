import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common'
import { UsuarioAtual } from '../auth/decorators.js'
import type { UsuarioToken } from '../auth/decorators.js'
import { CriarReservaDto } from './dto/criar-reserva.dto.js'
import { ReservasService } from './reservas.service.js'

@Controller('reservas')
export class ReservasController {
  constructor(private readonly service: ReservasService) {}

  @Post()
  criar(@Body() dto: CriarReservaDto, @UsuarioAtual() usuario: UsuarioToken) {
    return this.service.criar(dto, usuario) // o dono vem do token, nunca do body
  }

  @Get('minhas')
  minhas(@UsuarioAtual() usuario: UsuarioToken) { return this.service.listarDoUsuario(usuario) }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number, @UsuarioAtual() usuario: UsuarioToken) {
    return this.service.buscarDoUsuario(id, usuario)
  }
}
