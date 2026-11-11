import { Reflector } from '@nestjs/core'
import { Papeis } from '../comum/papeis.decorator.js'
import type { RequisicaoAutenticada } from './usuario-autenticado.js'
import { PapeisGuard } from './papeis.guard.js'

class RotaRestrita {
  @Papeis('guardiao')
  executar(): void {}
}

describe('PapeisGuard', () => {
  it('usa o papel atual da requisição para autorizar a rota', () => {
    const reflector = new Reflector()
    const guard = new PapeisGuard(reflector)
    const handler = RotaRestrita.prototype.executar
    const request = { usuarioAtual: { papel: 'lanterna' } } as RequisicaoAutenticada
    const contexto = {
      getHandler: () => handler,
      getClass: () => RotaRestrita,
      switchToHttp: () => ({ getRequest: () => request }),
    } as never

    expect(guard.canActivate(contexto)).toBe(false)
    request.usuarioAtual = { papel: 'guardiao' } as RequisicaoAutenticada['usuarioAtual']
    expect(guard.canActivate(contexto)).toBe(true)
  })
})
