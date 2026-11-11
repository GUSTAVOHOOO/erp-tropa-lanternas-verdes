import { jest } from '@jest/globals'
import { QueryFailedError } from 'typeorm'
import { SetoresService } from './setores.service.js'

describe('SetoresService', () => {
  const setor = { id: 2814, nome: 'Setor 2814', descricao: 'Descrição do Setor 2814.' }
  let repository: {
    listar: jest.Mock<() => Promise<typeof setor[]>>
    buscarPorId: jest.Mock<(id: number, manager?: unknown) => Promise<typeof setor | null>>
    salvar: jest.Mock<(dados: Record<string, unknown>, manager?: unknown) => Promise<typeof setor>>
    atualizar: jest.Mock<(id: number, dados: Record<string, unknown>) => Promise<typeof setor | null>>
    contarUsos: jest.Mock<(id: number, manager?: unknown) => Promise<number>>
    excluirFisicamente: jest.Mock<(id: number, manager?: unknown) => Promise<boolean>>
  }
  let banco: { transaction: jest.Mock<(callback: (manager: unknown) => Promise<unknown>) => Promise<unknown>> }
  let service: SetoresService

  beforeEach(() => {
    repository = {
      listar: jest.fn<() => Promise<typeof setor[]>>().mockResolvedValue([setor]),
      buscarPorId: jest.fn<(id: number, manager?: unknown) => Promise<typeof setor | null>>().mockResolvedValue(setor),
      salvar: jest.fn<(dados: Record<string, unknown>, manager?: unknown) => Promise<typeof setor>>().mockResolvedValue(setor),
      atualizar: jest.fn<(id: number, dados: Record<string, unknown>) => Promise<typeof setor | null>>().mockResolvedValue(setor),
      contarUsos: jest.fn<(id: number, manager?: unknown) => Promise<number>>().mockResolvedValue(0),
      excluirFisicamente: jest.fn<(id: number, manager?: unknown) => Promise<boolean>>().mockResolvedValue(true),
    }
    banco = {
      transaction: jest.fn<(callback: (manager: unknown) => Promise<unknown>) => Promise<unknown>>()
        .mockImplementation((callback) => callback({})),
    }
    service = new SetoresService(repository as never, banco as never)
  })

  it('ordena e converte lista e detalhe em DTO explícito', async () => {
    expect(await service.listar()).toEqual([setor])
    expect(await service.buscarPorId(2814)).toEqual(setor)
  })

  it('traduz duplicidade de ID para 409 e ID ausente para 404', async () => {
    await expect(service.criar({ ...setor })).rejects.toMatchObject({ status: 409, codigo: 'SETOR_JA_CADASTRADO' })
    repository.buscarPorId.mockResolvedValue(null)
    await expect(service.buscarPorId(99)).rejects.toMatchObject({ status: 404, codigo: 'NAO_ENCONTRADO' })
    await expect(service.editar(99, { nome: 'Setor Novo' })).rejects.toMatchObject({ status: 404 })
  })

  it('recusa setor referenciado e traduz FK concorrente para 409', async () => {
    repository.contarUsos.mockResolvedValue(1)
    await expect(service.excluir(2814)).rejects.toMatchObject({ status: 409, codigo: 'SETOR_EM_USO' })
    expect(repository.excluirFisicamente).not.toHaveBeenCalled()

    repository.contarUsos.mockResolvedValue(0)
    const falhaFk = new QueryFailedError('DELETE FROM setor WHERE id = ?', [2814], {
      code: 'SQLITE_CONSTRAINT_FOREIGNKEY', message: 'FOREIGN KEY constraint failed',
    })
    repository.excluirFisicamente.mockRejectedValue(falhaFk)
    await expect(service.excluir(2814)).rejects.toMatchObject({ status: 409, codigo: 'SETOR_EM_USO' })
  })
})
