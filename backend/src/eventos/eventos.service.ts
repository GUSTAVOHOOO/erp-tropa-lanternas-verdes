import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { EntityManager } from 'typeorm'
import type { TipoEvento } from './evento.entity.js'
import { EventosRepository } from './eventos.repository.js'

@Injectable()
export class EventosService {
  constructor(private readonly eventos: EventosRepository) {}

  gravarCriacao(
    ocorrenciaId: string,
    autorId: string,
    manager: EntityManager,
    id: string = randomUUID(),
    criadoEm?: Date,
  ): Promise<unknown> {
    return this.eventos.salvar({
      id,
      ocorrenciaId,
      autorId,
      tipo: 'criada',
      dados: { de: null, para: 'aberta' },
      ...(criadoEm ? { criadoEm } : {}),
    }, manager)
  }

  gravarAcao(
    ocorrenciaId: string,
    autorId: string,
    tipo: Exclude<TipoEvento, 'criada' | 'comentario_apagado'>,
    dados: Record<string, unknown>,
    manager: EntityManager,
    id: string = randomUUID(),
    criadoEm?: Date,
  ): Promise<unknown> {
    return this.eventos.salvar({ id, ocorrenciaId, autorId, tipo, dados, ...(criadoEm ? { criadoEm } : {}) }, manager)
  }

  gravarComentarioApagado(
    ocorrenciaId: string,
    autorId: string,
    comentarioId: string,
    manager: EntityManager,
    id: string = randomUUID(),
    criadoEm?: Date,
  ): Promise<unknown> {
    return this.eventos.salvar({
      id, ocorrenciaId, autorId, tipo: 'comentario_apagado', dados: { comentarioId },
      ...(criadoEm ? { criadoEm } : {}),
    }, manager)
  }
}
