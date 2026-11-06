import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, ILike, Repository } from 'typeorm'
import { Recurso } from './recurso.entity.js'
import { ListarRecursosDto } from './dto/listar-recursos.dto.js'

@Injectable()
export class RecursosRepository {
  constructor(@InjectRepository(Recurso) private readonly orm: Repository<Recurso>) {}

  listar(f: ListarRecursosDto) {
    return this.orm.findAndCount({
      where: {
        ...(f.grupo !== undefined && { grupo: { id: f.grupo } }),
        ...(f.busca !== undefined && { nome: ILike(`%${f.busca}%`) }),
      },
      relations: { grupo: true },
      order: { nome: 'ASC', id: 'ASC' },
      skip: (f.pagina - 1) * f.limite,
      take: f.limite,
    })
  }

  buscarPorId(id: number) {
    return this.orm.findOne({ where: { id }, relations: { grupo: true } })
  }

  salvar(dados: Partial<Recurso>) {
    return this.orm.save(this.orm.create(dados))
  }

  async excluir(id: number) {
    await this.orm.softDelete(id)
  }

  /** Baixa atômica: o WHERE é quem garante que nunca fica negativo. */
  async baixarDisponivel(id: number, qtd: number, manager: EntityManager) {
    const r = await manager
      .createQueryBuilder()
      .update(Recurso)
      .set({ disponivel: () => 'disponivel - :qtd' })
      .where('id = :id AND disponivel >= :qtd', { id, qtd })
      .execute()
    return r.affected === 1
  }
}
