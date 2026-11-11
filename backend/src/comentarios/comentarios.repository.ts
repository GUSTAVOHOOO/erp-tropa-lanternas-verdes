import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull } from 'typeorm'
import type { DeepPartial, EntityManager, Repository } from 'typeorm'
import { Comentario } from './comentario.entity.js'

@Injectable()
export class ComentariosRepository {
  constructor(@InjectRepository(Comentario) private readonly base: Repository<Comentario>) {}

  async buscarPorId(id: string, manager?: EntityManager): Promise<Comentario | null> {
    return this.repositorio(manager).findOneBy({ id })
  }

  async salvar(dados: DeepPartial<Comentario>, manager?: EntityManager): Promise<Comentario> {
    const repositorio = this.repositorio(manager)
    return repositorio.save(repositorio.create(dados))
  }

  async listarDaOcorrencia(ocorrenciaId: string, pagina: number, limite: number): Promise<{ itens: Comentario[]; total: number }> {
    const consulta = this.base.createQueryBuilder('comentario')
      .leftJoinAndSelect('comentario.autor', 'autor')
      .where('comentario.ocorrenciaId = :ocorrenciaId', { ocorrenciaId })
      .orderBy('comentario.criadoEm', 'ASC')
      .addOrderBy('comentario.id', 'ASC')
      .skip((pagina - 1) * limite)
      .take(limite)
    const [itens, total] = await consulta.getManyAndCount()
    return { itens, total }
  }

  async excluirSuavemente(id: string, manager: EntityManager): Promise<boolean> {
    const resultado = await this.repositorio(manager).softDelete({ id, excluidoEm: IsNull() })
    return resultado.affected === 1
  }

  private repositorio(manager?: EntityManager): Repository<Comentario> {
    return manager ? manager.getRepository(Comentario) : this.base
  }
}
