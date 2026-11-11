import { jest } from '@jest/globals'
import type { DataSource, EntityManager } from 'typeorm'
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js'
import type { EventosService } from '../eventos/eventos.service.js'
import type { Ocorrencia } from '../ocorrencias/ocorrencia.entity.js'
import type { OcorrenciasRepository } from '../ocorrencias/ocorrencias.repository.js'
import type { Comentario } from './comentario.entity.js'
import type { ComentariosRepository } from './comentarios.repository.js'
import { ComentariosService } from './comentarios.service.js'

const lanterna: UsuarioAutenticado = {
  id: 'usuario-l', nome: 'Lanterna Teste', email: 'lanterna@teste.invalid', papel: 'lanterna',
  setorId: 2814, lanternaId: null, criadoEm: new Date('2026-01-01T00:00:00Z'),
}
const manager = {} as EntityManager

function ocorrencia(dados: Partial<Ocorrencia> = {}): Ocorrencia {
  return {
    id: '00000000-0000-4000-8000-000000000001', titulo: 'Caso', tituloBusca: 'caso',
    descricao: 'Descrição longa de teste.', planeta: 'Terra', setorId: 2814, gravidade: 'alta',
    status: 'resolvida', envolvidos: 1, responsavelId: null, resolucao: 'Resolvido no teste.',
    criadaPorId: 'usuario-g', criadaEm: new Date('2026-01-01T00:00:00Z'), resolvidaEm: new Date(),
    excluidaEm: null, setor: null as never, responsavel: null as never, criadaPor: null as never,
    eventos: [], comentarios: [], ...dados,
  }
}

describe('ComentariosService', () => {
  it('permite comentar em Ocorrência resolvida e não gera Evento na criação', async () => {
    const existente = ocorrencia()
    const ocorrencias = {
      adquirirBloqueio: jest.fn().mockResolvedValue(undefined),
      buscarPorId: jest.fn().mockResolvedValue(existente),
    }
    const comentario: Comentario = {
      id: '00000000-0000-4000-8000-000000000002', ocorrenciaId: existente.id,
      autorId: lanterna.id, autor: null as never, texto: 'Registro após resolução.',
      criadoEm: new Date('2026-01-02T00:00:00Z'), excluidoEm: null, ocorrencia: existente,
    }
    const comentarios = { salvar: jest.fn().mockResolvedValue(comentario) }
    const eventos = { gravarComentarioApagado: jest.fn() }
    const banco = {
      transaction: jest.fn(async (callback: (transacao: EntityManager) => unknown) => callback(manager)),
    }
    const service = new ComentariosService(
      comentarios as unknown as ComentariosRepository,
      ocorrencias as unknown as OcorrenciasRepository,
      eventos as unknown as EventosService,
      banco as unknown as DataSource,
    )

    const resposta = await service.criar(existente.id, { texto: comentario.texto }, lanterna, comentario.id)

    expect(resposta).toMatchObject({ id: comentario.id, texto: comentario.texto, autor: { id: lanterna.id, nome: lanterna.nome, papel: lanterna.papel } })
    expect(ocorrencias.adquirirBloqueio).toHaveBeenCalledWith(existente.id, manager)
    expect(comentarios.salvar).toHaveBeenCalledWith(expect.objectContaining({ autorId: lanterna.id }), manager)
    expect(eventos.gravarComentarioApagado).not.toHaveBeenCalled()
  })

  it('esconde Ocorrência de outro Setor antes de consultar Comentários', async () => {
    const ocorrencias = { buscarPorId: jest.fn().mockResolvedValue(ocorrencia({ setorId: 674 })) }
    const comentarios = { listarDaOcorrencia: jest.fn() }
    const service = new ComentariosService(
      comentarios as unknown as ComentariosRepository,
      ocorrencias as unknown as OcorrenciasRepository,
      {} as EventosService,
      {} as DataSource,
    )

    await expect(service.listarDaOcorrencia(ocorrencia().id, 1, 20, lanterna))
      .rejects.toMatchObject({ status: 404, codigo: 'NAO_ENCONTRADO' })
    expect(comentarios.listarDaOcorrencia).not.toHaveBeenCalled()
  })
})
