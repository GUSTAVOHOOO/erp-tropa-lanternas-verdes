import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service.js'
import { Publico, UsuarioAtual } from './decorators.js'
import type { UsuarioToken } from './decorators.js'
import { LoginDto, RegistroDto } from './dto.js'

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Publico() @Post('registro')
  registrar(@Body() dto: RegistroDto) { return this.service.registrar(dto) }

  @Publico() @Post('login') @HttpCode(200) // POST é 201 por padrão; login não cria recurso
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  entrar(@Body() dto: LoginDto) { return this.service.entrar(dto) }

  @Get('eu')
  eu(@UsuarioAtual() usuario: UsuarioToken) { return usuario }
}
