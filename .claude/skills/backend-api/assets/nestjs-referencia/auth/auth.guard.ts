import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { CHAVE_PUBLICO } from './decorators.js'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const publico = this.reflector.getAllAndOverride<boolean>(CHAVE_PUBLICO, [ctx.getHandler(), ctx.getClass()])
    if (publico) return true
    const req = ctx.switchToHttp().getRequest()
    const [tipo, token] = req.headers.authorization?.split(' ') ?? []
    if (tipo !== 'Bearer' || !token) throw new UnauthorizedException()
    try {
      req.usuario = await this.jwt.verifyAsync(token)
    } catch {
      throw new UnauthorizedException('Token inválido')
    }
    return true
  }
}
