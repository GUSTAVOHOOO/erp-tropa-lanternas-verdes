import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { DeepPartial, EntityManager, Repository } from 'typeorm'
import { Evento } from './evento.entity.js'

@Injectable()
export class EventosRepository {
  constructor(@InjectRepository(Evento) private readonly base: Repository<Evento>) {}

  async salvar(dados: DeepPartial<Evento>, manager?: EntityManager): Promise<Evento> {
    const repositorio = manager ? manager.getRepository(Evento) : this.base
    return repositorio.save(repositorio.create(dados))
  }

  async listarDaOcorrencia(ocorrenciaId: string, manager?: EntityManager): Promise<Evento[]> {
    return (manager ? manager.getRepository(Evento) : this.base).find({
      where: { ocorrenciaId },
      order: { criadoEm: 'ASC', id: 'ASC' },
    })
  }

  async listarPaginaDaOcorrencia(
    ocorrenciaId: string,
    pagina: number,
    limite: number,
  ): Promise<{ itens: Evento[]; total: number }> {
    const consulta = this.base.createQueryBuilder('evento')
      .leftJoinAndSelect('evento.autor', 'autor')
      .where('evento.ocorrenciaId = :ocorrenciaId', { ocorrenciaId })
      .orderBy('evento.criadoEm', 'ASC')
      .addOrderBy('evento.id', 'ASC')
      .skip((pagina - 1) * limite)
      .take(limite)
    const [itens, total] = await consulta.getManyAndCount()
    return { itens, total }
  }
}
