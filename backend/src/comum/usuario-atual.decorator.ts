import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { RequisicaoAutenticada, UsuarioAutenticado } from '../auth/usuario-autenticado.js'

export const UsuarioAtual = createParamDecorator(
  (_dado: unknown, contexto: ExecutionContext): UsuarioAutenticado | undefined =>
    contexto.switchToHttp().getRequest<RequisicaoAutenticada>().usuarioAtual,
)
