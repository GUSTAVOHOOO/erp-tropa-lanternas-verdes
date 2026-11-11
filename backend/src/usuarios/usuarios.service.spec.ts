import { jest } from '@jest/globals'
import { UsuariosService } from './usuarios.service.js'

describe('UsuariosService', () => {
  const manager = {} as never
  let usuarios: Record<string, jest.Mock>
  let lanternas: Record<string, jest.Mock>
  let setores: Record<string, jest.Mock>
  let banco: { transaction: jest.Mock<(callback: (manager: unknown) => Promise<unknown>) => Promise<unknown>> }
  let service: UsuariosService

  beforeEach(() => {
    usuarios = {
      adquirirBloqueio: jest.fn().mockResolvedValue(undefined),
      buscarPorId: jest.fn().mockResolvedValue(null),
      buscarPorLanterna: jest.fn().mockResolvedValue(null),
      contarGuardioes: jest.fn().mockResolvedValue(2),
      atualizar: jest.fn().mockResolvedValue(true),
    }
    lanternas = { buscarPorId: jest.fn().mockResolvedValue(null) }
    setores = { buscarPorId: jest.fn().mockResolvedValue({ id: 2814 }) }
    banco = {
      transaction: jest.fn<(callback: (manager: unknown) => Promise<unknown>) => Promise<unknown>>()
        .mockImplementation((callback) => callback(manager)),
    }
    service = new UsuariosService(usuarios as never, lanternas as never, setores as never, banco as never)
  })

  it('acquire lock and checks another guardian before validating demotion sector', async () => {
    usuarios.buscarPorId.mockResolvedValue({ id: 'guardiao-1', papel: 'guardiao', setorId: null, lanternaId: null })
    usuarios.contarGuardioes.mockResolvedValue(1)
    await expect(service.alterarPapel('guardiao-1', { papel: 'lanterna' } as never)).rejects.toMatchObject({
      status: 409, codigo: 'ULTIMO_GUARDIAO',
    })
    expect(usuarios.adquirirBloqueio).toHaveBeenCalledWith('guardiao-1', manager)
    expect(setores.buscarPorId).not.toHaveBeenCalled()
  })

  it('preserves an account linked Ficha sector and rejects changing it', async () => {
    usuarios.buscarPorId.mockResolvedValue({ id: 'conta-1', papel: 'lanterna', setorId: 2814, lanternaId: 'ficha-1' })
    lanternas.buscarPorId.mockResolvedValue({ id: 'ficha-1', setorId: 2814 })
    await expect(service.alterarPapel('conta-1', { papel: 'lanterna', setorId: 674 } as never)).rejects.toMatchObject({
      status: 422, codigo: 'SETOR_DIFERENTE',
    })
    expect(usuarios.atualizar).not.toHaveBeenCalled()
  })

  it('does not let a Guardian bind a Ficha, even when it exists', async () => {
    usuarios.buscarPorId.mockResolvedValue({ id: 'guardiao-1', papel: 'guardiao', setorId: 2814, lanternaId: null })
    lanternas.buscarPorId.mockResolvedValue({ id: 'ficha-1', setorId: 2814 })
    await expect(service.vincularLanterna('guardiao-1', { lanternaId: 'ficha-1' })).rejects.toMatchObject({
      status: 422, codigo: 'VINCULO_NAO_PERMITIDO',
    })
    expect(usuarios.atualizar).not.toHaveBeenCalled()
  })
})
