import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'
import { Publica } from '../comum/publica.decorator.js'
import { UsuarioAtual } from '../comum/usuario-atual.decorator.js'
import type { UsuarioAutenticado } from './usuario-autenticado.js'
import { AuthService } from './auth.service.js'
import { CadastroDto } from './dto/cadastro.dto.js'
import { LoginDto } from './dto/login.dto.js'

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Publica()
  @Post('cadastro')
  cadastrar(@Body() dados: CadastroDto) {
    return this.auth.cadastrar(dados)
  }

  @Publica()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(200)
  entrar(@Body() dados: LoginDto) {
    return this.auth.entrar(dados)
  }

  @Get('me')
  usuarioAtual(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.auth.usuarioAtual(usuario)
  }
}
