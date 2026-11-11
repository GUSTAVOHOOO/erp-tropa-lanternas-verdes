import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { ErroDominio } from '../comum/erro-dominio.js'
import { PUBLICA_KEY } from '../comum/publica.decorator.js'
import { UsuariosRepository } from '../usuarios/usuarios.repository.js'
import type { PapelUsuario } from '../usuarios/usuario.entity.js'
import type { RequisicaoAutenticada } from './usuario-autenticado.js'

interface TokenAutenticacao {
  sub: string
  email: string
  papel: PapelUsuario
  exp?: number
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly usuarios: UsuariosRepository,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const handler = contexto.getHandler()
    const controller = contexto.getClass()
    if (this.reflector.getAllAndOverride<boolean>(PUBLICA_KEY, [handler, controller])) {
      return true
    }

    const requisicao = contexto.switchToHttp().getRequest<RequisicaoAutenticada>()
    const correspondencia = requisicao.headers.authorization?.match(/^Bearer\s+([^\s]+)$/i)
    if (!correspondencia) throw this.naoAutenticado()

    let payload: TokenAutenticacao
    try {
      const verificado = await this.jwt.verifyAsync<TokenAutenticacao>(correspondencia[1], {
        algorithms: ['HS256'],
      })
      if (
        !verificado ||
        typeof verificado.sub !== 'string' ||
        typeof verificado.email !== 'string' ||
        // Todo token emitido pela API expira; token sem `exp` nunca é aceito.
        typeof verificado.exp !== 'number' ||
        !['guardiao', 'lanterna'].includes(verificado.papel)
      ) {
        throw new Error('Claims JWT inválidas')
      }
      payload = verificado
    } catch {
      throw this.naoAutenticado()
    }

    const usuario = await this.usuarios.buscarPorId(payload.sub)
    if (!usuario) throw this.naoAutenticado()
    requisicao.usuarioAtual = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      lanternaId: usuario.lanternaId,
      setorId: usuario.setorId,
      criadoEm: usuario.criadoEm,
    }
    return true
  }

  private naoAutenticado(): ErroDominio {
    return new ErroDominio(401, 'NAO_AUTENTICADO', 'Não autenticado')
  }
}
