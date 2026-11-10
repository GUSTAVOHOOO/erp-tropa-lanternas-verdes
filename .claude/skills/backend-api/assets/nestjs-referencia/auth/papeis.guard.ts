import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { CHAVE_PAPEIS } from './decorators.js'

@Injectable()
export class PapeisGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext) {
    const exigidos = this.reflector.getAllAndOverride<string[]>(CHAVE_PAPEIS, [ctx.getHandler(), ctx.getClass()])
    if (!exigidos) return true
    const { usuario } = ctx.switchToHttp().getRequest()
    if (usuario && exigidos.includes(usuario.papel)) return true
    throw new ForbiddenException('Sem permissão')
  }
}
