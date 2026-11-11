import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { DeepPartial, EntityManager, Repository } from 'typeorm'
import { Lanterna } from '../lanternas/lanterna.entity.js'
import { Ocorrencia } from '../ocorrencias/ocorrencia.entity.js'
import { Usuario } from '../usuarios/usuario.entity.js'
import { Setor } from './setor.entity.js'

@Injectable()
export class SetoresRepository {
  constructor(@InjectRepository(Setor) private readonly base: Repository<Setor>) {}

  async buscarPorId(id: number, manager?: EntityManager): Promise<Setor | null> {
    return this.repositorio(manager).findOneBy({ id })
  }

  async listar(manager?: EntityManager): Promise<Setor[]> {
    return this.repositorio(manager).find({ order: { id: 'ASC' } })
  }

  async contarUsos(id: number, manager?: EntityManager): Promise<number> {
    const conexao = manager ?? this.base.manager
    const [lanternas, usuarios, ocorrencias] = await Promise.all([
      conexao.getRepository(Lanterna).countBy({ setorId: id }),
      conexao.getRepository(Usuario).countBy({ setorId: id }),
      conexao.getRepository(Ocorrencia)
        .createQueryBuilder('ocorrencia')
        .withDeleted()
        .where('ocorrencia.setorId = :id', { id })
        .getCount(),
    ])
    return lanternas + usuarios + ocorrencias
  }

  async salvar(dados: DeepPartial<Setor>, manager?: EntityManager): Promise<Setor> {
    const repositorio = this.repositorio(manager)
    return repositorio.save(repositorio.create(dados))
  }

  async atualizar(
    id: number,
    dados: Pick<DeepPartial<Setor>, 'nome' | 'descricao'>,
    manager?: EntityManager,
  ): Promise<Setor | null> {
    const repositorio = this.repositorio(manager)
    const resultado = await repositorio.update({ id }, dados)
    if (resultado.affected !== 1) return null
    return repositorio.findOneBy({ id })
  }

  async excluirFisicamente(id: number, manager?: EntityManager): Promise<boolean> {
    const resultado = await this.repositorio(manager).delete({ id })
    return resultado.affected === 1
  }

  private repositorio(manager?: EntityManager): Repository<Setor> {
    return manager ? manager.getRepository(Setor) : this.base
  }
}
