import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { DeepPartial, EntityManager, Repository } from 'typeorm'
import { normalizarBusca } from '../comum/busca-normalizada.js'
import { Usuario } from './usuario.entity.js'

export interface FiltroUsuarios {
  busca?: string
  pagina: number
  limite: number
  ordenar: 'nome' | 'criadoEm'
  ordem: 'asc' | 'desc'
}

@Injectable()
export class UsuariosRepository {
  constructor(@InjectRepository(Usuario) private readonly base: Repository<Usuario>) {}

  async buscarPorId(id: string, manager?: EntityManager): Promise<Usuario | null> {
    return this.repositorio(manager).findOneBy({ id })
  }

  async buscarPorIdComHash(id: string, manager?: EntityManager): Promise<Usuario | null> {
    return this.repositorio(manager)
      .createQueryBuilder('usuario')
      .addSelect('usuario.senhaHash')
      .where('usuario.id = :id', { id })
      .getOne()
  }

  async buscarPorEmail(email: string, manager?: EntityManager): Promise<Usuario | null> {
    return this.repositorio(manager).findOneBy({ email: email.trim().toLocaleLowerCase('und') })
  }

  async buscarPorEmailComHash(email: string, manager?: EntityManager): Promise<Usuario | null> {
    return this.repositorio(manager)
      .createQueryBuilder('usuario')
      .addSelect('usuario.senhaHash')
      .where('usuario.email = :email', { email: email.trim().toLocaleLowerCase('und') })
      .getOne()
  }

  async buscarPorTermo(termo: string, manager?: EntityManager): Promise<Usuario[]> {
    const busca = normalizarBusca(termo.trim())
    if (!busca) return []
    return this.repositorio(manager)
      .createQueryBuilder('usuario')
      .where('instr(usuario.nomeBusca, :busca) > 0 OR instr(usuario.emailBusca, :busca) > 0', {
        busca,
      })
      .orderBy('usuario.nomeBusca', 'ASC')
      .addOrderBy('usuario.id', 'ASC')
      .getMany()
  }

  async listar(filtros: FiltroUsuarios, manager?: EntityManager): Promise<{ itens: Usuario[]; total: number }> {
    const consulta = this.repositorio(manager).createQueryBuilder('usuario')
    const busca = filtros.busca === undefined ? '' : normalizarBusca(filtros.busca.trim())
    if (busca) {
      consulta.andWhere('(instr(usuario.nomeBusca, :busca) > 0 OR instr(usuario.emailBusca, :busca) > 0)', { busca })
    }
    const coluna = filtros.ordenar === 'nome' ? 'usuario.nomeBusca' : 'usuario.criadoEm'
    consulta.orderBy(coluna, filtros.ordem.toUpperCase() as 'ASC' | 'DESC')
      .addOrderBy('usuario.id', 'ASC')
      .skip((filtros.pagina - 1) * filtros.limite)
      .take(filtros.limite)
    const [itens, total] = await consulta.getManyAndCount()
    return { itens, total }
  }

  async adquirirBloqueio(id: string, manager: EntityManager): Promise<void> {
    // A primeira escrita serializa validações concorrentes em SQLite.
    await manager.query('UPDATE "usuario" SET "id" = "id" WHERE "id" = ?', [id])
  }

  async contarGuardioes(manager?: EntityManager): Promise<number> {
    return this.repositorio(manager).countBy({ papel: 'guardiao' })
  }

  async buscarPorLanterna(lanternaId: string, manager?: EntityManager): Promise<Usuario | null> {
    return this.repositorio(manager).findOneBy({ lanternaId })
  }

  async atualizar(
    id: string,
    dados: Partial<Pick<Usuario, 'papel' | 'setorId' | 'lanternaId'>>,
    manager?: EntityManager,
  ): Promise<boolean> {
    const resultado = await this.repositorio(manager).update({ id }, dados)
    return resultado.affected === 1
  }

  async contarVinculosIncompativeis(
    lanternaId: string,
    setorId: number | null,
    manager?: EntityManager,
  ): Promise<number> {
    const consulta = this.repositorio(manager).createQueryBuilder('usuario')
      .where('usuario.lanternaId = :lanternaId', { lanternaId })
    if (setorId === null) consulta.andWhere('usuario.setorId IS NOT NULL')
    else consulta.andWhere('(usuario.setorId IS NULL OR usuario.setorId <> :setorId)', { setorId })
    return consulta.getCount()
  }

  async salvar(dados: DeepPartial<Usuario>, manager?: EntityManager): Promise<Usuario> {
    const repositorio = this.repositorio(manager)
    const usuario = repositorio.create(dados)
    if (usuario.nome !== undefined) usuario.nomeBusca = normalizarBusca(usuario.nome)
    if (usuario.email !== undefined) {
      usuario.email = usuario.email.trim().toLocaleLowerCase('und')
      usuario.emailBusca = normalizarBusca(usuario.email)
    }
    return repositorio.save(usuario)
  }

  private repositorio(manager?: EntityManager): Repository<Usuario> {
    return manager ? manager.getRepository(Usuario) : this.base
  }
}
