import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PAPEIS_KEY } from '../comum/papeis.decorator.js'
import type { PapelUsuario } from '../usuarios/usuario.entity.js'
import type { RequisicaoAutenticada } from './usuario-autenticado.js'

@Injectable()
export class PapeisGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const papeis = this.reflector.getAllAndOverride<PapelUsuario[]>(PAPEIS_KEY, [
      contexto.getHandler(),
      contexto.getClass(),
    ])
    if (!papeis?.length) return true
    const requisicao = contexto.switchToHttp().getRequest<RequisicaoAutenticada>()
    return Boolean(requisicao.usuarioAtual && papeis.includes(requisicao.usuarioAtual.papel))
  }
}
