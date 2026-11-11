import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { DeepPartial, EntityManager, Repository } from 'typeorm'
import { normalizarBusca } from '../comum/busca-normalizada.js'
import { Lanterna, type StatusLanterna } from './lanterna.entity.js'

export interface FiltroLanternas {
  busca?: string
  setor?: number
  status?: StatusLanterna
  pagina: number
  limite: number
  ordenar: 'codinome' | 'setor' | 'anoIngresso'
  ordem: 'asc' | 'desc'
}

export type CamposAtualizaveisLanterna = Partial<Pick<
  Lanterna,
  | 'codinome'
  | 'identidadeCivil'
  | 'especie'
  | 'planetaNatal'
  | 'setorId'
  | 'status'
  | 'anoIngresso'
  | 'primeiraAparicao'
  | 'habilidades'
  | 'mentorId'
  | 'citacao'
  | 'biografia'
  | 'fontes'
  | 'codinomeBusca'
>>

@Injectable()
export class LanternasRepository {
  constructor(@InjectRepository(Lanterna) private readonly base: Repository<Lanterna>) {}

  async adquirirBloqueio(id: string, manager: EntityManager): Promise<void> {
    // Inicia a escrita SQLite antes das leituras de validação para serializar mutações da Ficha.
    await manager.query('UPDATE "lanterna" SET "id" = "id" WHERE "id" = ?', [id])
  }

  async buscarPorId(id: string, manager?: EntityManager): Promise<Lanterna | null> {
    return this.repositorio(manager).findOneBy({ id })
  }

  async listarIds(manager?: EntityManager): Promise<Array<Pick<Lanterna, 'id'>>> {
    return this.repositorio(manager).find({ select: { id: true }, order: { id: 'ASC' } })
  }

  async buscarFicha(id: string, manager?: EntityManager): Promise<Lanterna | null> {
    return this.repositorio(manager)
      .createQueryBuilder('lanterna')
      .leftJoinAndSelect('lanterna.mentor', 'mentor')
      .leftJoinAndSelect('lanterna.aprendizes', 'aprendizes')
      .where('lanterna.id = :id', { id })
      .orderBy('aprendizes.codinomeBusca', 'ASC')
      .addOrderBy('aprendizes.id', 'ASC')
      .getOne()
  }

  async listar(filtros: FiltroLanternas, manager?: EntityManager): Promise<{ itens: Lanterna[]; total: number }> {
    const consulta = this.repositorio(manager).createQueryBuilder('lanterna')
    if (filtros.setor !== undefined) consulta.andWhere('lanterna.setorId = :setor', { setor: filtros.setor })
    const statusCalculado = "CASE WHEN lanterna.status = 'afastado' THEN 'afastado' WHEN EXISTS (SELECT 1 FROM ocorrencia WHERE ocorrencia.responsavelId = lanterna.id AND ocorrencia.excluidaEm IS NULL AND ocorrencia.status IN ('aberta', 'em_andamento')) THEN 'em_missao' ELSE 'ativo' END"
    if (filtros.status !== undefined) consulta.andWhere(`${statusCalculado} = :status`, { status: filtros.status })
    const busca = filtros.busca === undefined ? '' : normalizarBusca(filtros.busca.trim())
    if (busca) consulta.andWhere('instr(lanterna.codinomeBusca, :busca) > 0', { busca })

    const coluna = {
      codinome: 'lanterna.codinomeBusca',
      setor: 'lanterna.setorId',
      anoIngresso: 'lanterna.anoIngresso',
    }[filtros.ordenar]
    if (filtros.ordenar !== 'codinome') {
      consulta.orderBy(`CASE WHEN ${coluna} IS NULL THEN 1 ELSE 0 END`, 'ASC')
    }
    consulta.addOrderBy(coluna, filtros.ordem.toUpperCase() as 'ASC' | 'DESC')
      .addOrderBy('lanterna.id', 'ASC')
      .skip((filtros.pagina - 1) * filtros.limite)
      .take(filtros.limite)
    consulta.addSelect(statusCalculado, 'statusCalculado')
    const [resultado, total] = await Promise.all([
      consulta.getRawAndEntities(),
      consulta.clone().getCount(),
    ])
    const itens = resultado.entities
    for (const [indice, item] of itens.entries()) {
      item.status = resultado.raw[indice]?.statusCalculado ?? item.status
    }
    return { itens, total }
  }

  async buscarPorCodinome(termo: string, manager?: EntityManager): Promise<Lanterna[]> {
    const busca = normalizarBusca(termo.trim())
    if (!busca) return []
    return this.repositorio(manager)
      .createQueryBuilder('lanterna')
      .where('instr(lanterna.codinomeBusca, :busca) > 0', { busca })
      .orderBy('lanterna.codinomeBusca', 'ASC')
      .addOrderBy('lanterna.id', 'ASC')
      .getMany()
  }

  async salvar(dados: DeepPartial<Lanterna>, manager?: EntityManager): Promise<Lanterna> {
    const repositorio = this.repositorio(manager)
    const lanterna = repositorio.create(dados)
    if (lanterna.codinome !== undefined) {
      lanterna.codinomeBusca = normalizarBusca(lanterna.codinome)
    }
    return repositorio.save(lanterna)
  }

  async atualizar(id: string, dados: CamposAtualizaveisLanterna, manager?: EntityManager): Promise<boolean> {
    const repositorio = this.repositorio(manager)
    const alteracoes = { ...dados }
    if (typeof alteracoes.codinome === 'string') {
      alteracoes.codinomeBusca = normalizarBusca(alteracoes.codinome)
    }
    const resultado = await repositorio.update({ id }, alteracoes)
    return resultado.affected === 1
  }

  private repositorio(manager?: EntityManager): Repository<Lanterna> {
    return manager ? manager.getRepository(Lanterna) : this.base
  }
}
