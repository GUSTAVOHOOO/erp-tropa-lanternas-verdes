import { jest } from '@jest/globals'
import { LanternasService } from './lanternas.service.js'

describe('LanternasService', () => {
  const manager = {} as never
  let lanternas: Record<string, jest.Mock>
  let setores: Record<string, jest.Mock>
  let usuarios: Record<string, jest.Mock>
  let ocorrencias: Record<string, jest.Mock>
  let banco: { transaction: jest.Mock<(callback: (manager: unknown) => Promise<unknown>) => Promise<unknown>> }
  let service: LanternasService

  beforeEach(() => {
    lanternas = {
      adquirirBloqueio: jest.fn().mockResolvedValue(undefined),
      buscarPorId: jest.fn().mockResolvedValue(null),
      buscarFicha: jest.fn().mockResolvedValue(null),
      salvar: jest.fn().mockResolvedValue(undefined),
      atualizar: jest.fn().mockResolvedValue(true),
    }
    setores = { buscarPorId: jest.fn().mockResolvedValue({ id: 2814 }) }
    usuarios = { contarVinculosIncompativeis: jest.fn().mockResolvedValue(0) }
    ocorrencias = {
      contarPorResponsavelForaDoSetor: jest.fn().mockResolvedValue(0),
      contarNaoResolvidasDoResponsavel: jest.fn().mockResolvedValue(0),
      estatisticasDoResponsavel: jest.fn().mockResolvedValue({ resolvidas: 0, emAndamento: 0, cargaAtual: 0, mediaCentimosHora: null }),
    }
    banco = {
      transaction: jest.fn<(callback: (manager: unknown) => Promise<unknown>) => Promise<unknown>>()
        .mockImplementation((callback) => callback(manager)),
    }
    service = new LanternasService(lanternas as never, setores as never, usuarios as never, ocorrencias as never, banco as never)
  })

  it('impede ciclos diretos antes de gravar', async () => {
    await expect(service.criar({
      id: 'hal-jordan', codinome: 'Hal Jordan', especie: 'Humano', planetaNatal: 'Terra', mentorId: 'hal-jordan',
    } as never)).rejects.toMatchObject({ status: 422, codigo: 'MENTOR_INVALIDO' })
    expect(lanternas.salvar).not.toHaveBeenCalled()
  })

  it('verifica relações incompatíveis antes de mudar o Setor, incluindo a contagem histórica', async () => {
    lanternas.buscarPorId.mockResolvedValue({ id: 'hal-jordan', setorId: 2814, mentorId: null })
    usuarios.contarVinculosIncompativeis.mockResolvedValue(1)
    await expect(service.editar('hal-jordan', { setorId: 674 } as never)).rejects.toMatchObject({
      status: 409, codigo: 'LANTERNA_EM_USO',
    })
    expect(ocorrencias.contarPorResponsavelForaDoSetor).toHaveBeenCalledWith('hal-jordan', 674, manager)
    expect(lanternas.atualizar).not.toHaveBeenCalled()
  })

  it('consulta carga atual antes de aceitar alteração de status', async () => {
    lanternas.buscarPorId.mockResolvedValue({ id: 'hal-jordan', status: 'ativo' })
    ocorrencias.contarNaoResolvidasDoResponsavel.mockResolvedValue(1)
    await expect(service.alterarStatus('hal-jordan', { status: 'afastado' })).rejects.toMatchObject({
      status: 409, codigo: 'LANTERNA_EM_MISSAO',
    })
    expect(lanternas.atualizar).not.toHaveBeenCalled()
  })
})
