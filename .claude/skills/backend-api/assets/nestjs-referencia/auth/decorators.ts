import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common'

export const CHAVE_PUBLICO = 'publico'
export const CHAVE_PAPEIS = 'papeis'
export const Publico = () => SetMetadata(CHAVE_PUBLICO, true)
export const Papeis = (...papeis: string[]) => SetMetadata(CHAVE_PAPEIS, papeis)

export interface UsuarioToken { sub: number; email: string; papel: string }

export const UsuarioAtual = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UsuarioToken => ctx.switchToHttp().getRequest().usuario,
)
