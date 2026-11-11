import { jest } from '@jest/globals'
import type { DataSource, EntityManager } from 'typeorm'
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js'
import type { EventosService } from '../eventos/eventos.service.js'
import type { Lanterna } from '../lanternas/lanterna.entity.js'
import type { LanternasRepository } from '../lanternas/lanternas.repository.js'
import type { LanternasService } from '../lanternas/lanternas.service.js'
import type { Ocorrencia } from './ocorrencia.entity.js'
import type { OcorrenciasRepository } from './ocorrencias.repository.js'
import { CicloVidaService } from './ciclo-vida.service.js'

const ator: UsuarioAutenticado = {
  id: 'usuario-g', nome: 'G', email: 'g@teste.invalid', papel: 'guardiao',
  setorId: null, lanternaId: null, criadoEm: new Date('2026-01-01T00:00:00Z'),
}

function ocorrencia(dados: Partial<Ocorrencia> = {}): Ocorrencia {
  return {
    id: '00000000-0000-4000-8000-000000000001', titulo: 'Caso de teste', tituloBusca: 'caso de teste',
    descricao: 'Descrição válida de teste.', planeta: 'Terra', setorId: 2814, gravidade: 'alta',
    status: 'aberta', envolvidos: 1, responsavelId: null, resolucao: null,
    criadaPorId: 'usuario-l', criadaEm: new Date('2026-01-01T00:00:00Z'), resolvidaEm: null,
    excluidaEm: null, setor: null as never, responsavel: null as never, criadaPor: null as never,
    eventos: [], comentarios: [], ...dados,
  }
}

describe('CicloVidaService', () => {
  const manager = {} as EntityManager
  let service: CicloVidaService
  let dados: Ocorrencia
  let ocorrencias: jest.Mocked<Pick<OcorrenciasRepository,
    'adquirirBloqueio' | 'buscarPorId' | 'alterarEstadoCondicional' | 'alterarResponsavelCondicional'>>
  let lanternas: jest.Mocked<Pick<LanternasRepository, 'buscarPorId'>>
  let lanternasService: jest.Mocked<Pick<LanternasService, 'recalcularStatus'>>
  let eventos: jest.Mocked<Pick<EventosService, 'gravarAcao'>>

  beforeEach(() => {
    dados = ocorrencia()
    ocorrencias = {
      adquirirBloqueio: jest.fn().mockResolvedValue(undefined),
      buscarPorId: jest.fn().mockImplementation(async () => ({ ...dados })),
      alterarEstadoCondicional: jest.fn().mockImplementation(async (_id, _status, alteracao) => {
        Object.assign(dados, alteracao)
        return true
      }),
      alterarResponsavelCondicional: jest.fn().mockImplementation(async (_id, _status, _anterior, responsavelId) => {
        dados.responsavelId = responsavelId
        return { affected: 1 } as never
      }),
    }
    lanternas = { buscarPorId: jest.fn() }
    lanternasService = { recalcularStatus: jest.fn().mockResolvedValue(undefined) }
    eventos = { gravarAcao: jest.fn().mockResolvedValue(undefined) }
    const banco = { transaction: jest.fn(async (callback: (manager: EntityManager) => unknown) => callback(manager)) } as unknown as DataSource
    service = new CicloVidaService(
      ocorrencias as unknown as OcorrenciasRepository,
      lanternas as unknown as LanternasRepository,
      lanternasService as unknown as LanternasService,
      eventos as unknown as EventosService,
      banco,
    )
  })

  it('exige Responsável antes de iniciar e não grava Evento em rejeição', async () => {
    await expect(service.alterarStatus(dados.id, { status: 'em_andamento' }, ator)).rejects.toMatchObject({ status: 422, codigo: 'SEM_RESPONSAVEL' })
    expect(ocorrencias.alterarEstadoCondicional).not.toHaveBeenCalled()
    expect(eventos.gravarAcao).not.toHaveBeenCalled()
  })

  it('resolve, recalcula a carga na transação e grava um único Evento resolvida', async () => {
    dados.status = 'em_andamento'
    dados.responsavelId = 'hal-jordan'
    const resposta = await service.alterarStatus(dados.id, {
      status: 'resolvida', resolucao: 'Ameaça contida com relatório entregue.',
    }, ator)
    expect(resposta.status).toBe('resolvida')
    expect(resposta.resolucao).toBe('Ameaça contida com relatório entregue.')
    expect(lanternasService.recalcularStatus).toHaveBeenCalledWith('hal-jordan', manager)
    expect(eventos.gravarAcao).toHaveBeenCalledWith(dados.id, ator.id, 'resolvida', expect.objectContaining({ de: 'em_andamento', para: 'resolvida' }), manager, expect.any(String), expect.any(Date))
    expect(eventos.gravarAcao).toHaveBeenCalledTimes(1)
  })

  it('ao reabrir libera Responsável afastado e registra ambos os IDs no Evento', async () => {
    dados.status = 'resolvida'
    dados.responsavelId = 'hal-jordan'
    dados.resolucao = 'Caso encerrado anteriormente.'
    dados.resolvidaEm = new Date('2026-01-02T00:00:00Z')
    lanternas.buscarPorId.mockResolvedValue({ id: 'hal-jordan', status: 'afastado' } as Lanterna)
    const resposta = await service.alterarStatus(dados.id, {
      status: 'aberta', motivo: 'Novo indício requer nova análise.',
    }, ator)
    expect(resposta).toMatchObject({ status: 'aberta', responsavelId: null, resolucao: null, resolvidaEm: null })
    expect(lanternasService.recalcularStatus).not.toHaveBeenCalled()
    expect(eventos.gravarAcao).toHaveBeenCalledWith(dados.id, ator.id, 'reaberta', expect.objectContaining({
      responsavelAnteriorId: 'hal-jordan', responsavelId: null,
    }), manager, expect.any(String), expect.any(Date))
  })

  it('faz atribuição com checagem de Setor, atualiza a carga e salva Evento `atribuida`', async () => {
    lanternas.buscarPorId.mockResolvedValue({ id: 'hal-jordan', setorId: 2814, status: 'ativo' } as Lanterna)
    const resposta = await service.alterarResponsavel(dados.id, { responsavelId: 'hal-jordan' }, ator)
    expect(resposta.responsavelId).toBe('hal-jordan')
    expect(lanternasService.recalcularStatus).toHaveBeenCalledWith('hal-jordan', manager)
    expect(eventos.gravarAcao).toHaveBeenCalledWith(dados.id, ator.id, 'atribuida', { de: null, para: 'hal-jordan' }, manager, expect.any(String), expect.any(Date))
  })
})
