import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull } from 'typeorm'
import type { DeepPartial, EntityManager, Repository, UpdateResult } from 'typeorm'
import { normalizarBusca } from '../comum/busca-normalizada.js'
import { Ocorrencia, type GravidadeOcorrencia, type StatusOcorrencia } from './ocorrencia.entity.js'
import { ordenarGravidadeSql, prazoSql } from './prazo.js'

export interface FiltroOcorrencias {
  status?: StatusOcorrencia
  gravidade?: GravidadeOcorrencia
  setorId?: number
  responsavelId?: string
  vencida?: boolean
  busca?: string
  pagina: number
  limite: number
  ordenar: 'prazo' | 'criadaEm' | 'gravidade'
  ordem: 'asc' | 'desc'
}

export interface EstatisticasLanterna {
  resolvidas: number
  emAndamento: number
  cargaAtual: number
  mediaCentimosHora: number | null
}

@Injectable()
export class OcorrenciasRepository {
  constructor(@InjectRepository(Ocorrencia) private readonly base: Repository<Ocorrencia>) {}

  async buscarPorId(id: string, manager?: EntityManager): Promise<Ocorrencia | null> {
    return this.repositorio(manager).findOneBy({ id })
  }

  async adquirirBloqueio(id: string, manager: EntityManager): Promise<void> {
    await manager.query('UPDATE "ocorrencia" SET "id" = "id" WHERE "id" = ?', [id])
  }

  async listar(filtros: FiltroOcorrencias, setorEscopoId: number | null, agora: Date): Promise<{ itens: Ocorrencia[]; total: number }> {
    const consulta = this.base.createQueryBuilder('ocorrencia')
    if (setorEscopoId !== null) consulta.andWhere('ocorrencia.setorId = :setorEscopoId', { setorEscopoId })
    if (filtros.setorId !== undefined) consulta.andWhere('ocorrencia.setorId = :setorId', { setorId: filtros.setorId })
    if (filtros.status !== undefined) consulta.andWhere('ocorrencia.status = :status', { status: filtros.status })
    if (filtros.gravidade !== undefined) consulta.andWhere('ocorrencia.gravidade = :gravidade', { gravidade: filtros.gravidade })
    if (filtros.responsavelId !== undefined) consulta.andWhere('ocorrencia.responsavelId = :responsavelId', { responsavelId: filtros.responsavelId })
    if (filtros.busca?.trim()) {
      consulta.andWhere('instr(ocorrencia.tituloBusca, :busca) > 0', { busca: normalizarBusca(filtros.busca.trim()) })
    }
    if (filtros.vencida !== undefined) {
      const exprPrazo = prazoSql('ocorrencia')
      consulta.andWhere(
        `(CASE WHEN ocorrencia.status <> 'resolvida' AND ${exprPrazo} < julianday(:agora) THEN 1 ELSE 0 END) = :vencida`,
        { agora: agora.toISOString(), vencida: filtros.vencida ? 1 : 0 },
      )
    }
    switch (filtros.ordenar) {
      case 'prazo': consulta.orderBy(prazoSql('ocorrencia'), filtros.ordem.toUpperCase() as 'ASC' | 'DESC'); break
      case 'gravidade': consulta.orderBy(ordenarGravidadeSql('ocorrencia'), filtros.ordem.toUpperCase() as 'ASC' | 'DESC'); break
      default: consulta.orderBy('ocorrencia.criadaEm', filtros.ordem.toUpperCase() as 'ASC' | 'DESC')
    }
    consulta.addOrderBy('ocorrencia.id', 'ASC')
    const [itens, total] = await consulta
      .skip((filtros.pagina - 1) * filtros.limite)
      .take(filtros.limite)
      .getManyAndCount()
    return { itens, total }
  }

  async listarMinhaFila(lanternaId: string, pagina: number, limite: number): Promise<{ itens: Ocorrencia[]; total: number }> {
    const consulta = this.base.createQueryBuilder('ocorrencia')
      .where('ocorrencia.responsavelId = :lanternaId', { lanternaId })
      .andWhere('ocorrencia.status IN (:...status)', { status: ['aberta', 'em_andamento'] })
      .orderBy(prazoSql('ocorrencia'), 'ASC')
      .addOrderBy(ordenarGravidadeSql('ocorrencia'), 'ASC')
      .addOrderBy('ocorrencia.id', 'ASC')
      .skip((pagina - 1) * limite)
      .take(limite)
    const [itens, total] = await consulta.getManyAndCount()
    return { itens, total }
  }

  async buscarPorTitulo(termo: string, manager?: EntityManager): Promise<Ocorrencia[]> {
    const busca = normalizarBusca(termo.trim())
    if (!busca) return []
    return this.repositorio(manager)
      .createQueryBuilder('ocorrencia')
      .where('instr(ocorrencia.tituloBusca, :busca) > 0', { busca })
      .orderBy('ocorrencia.tituloBusca', 'ASC')
      .addOrderBy('ocorrencia.id', 'ASC')
      .getMany()
  }

  async contarNaoResolvidasDoResponsavel(
    responsavelId: string,
    manager?: EntityManager,
  ): Promise<number> {
    return this.repositorio(manager)
      .createQueryBuilder('ocorrencia')
      .withDeleted()
      .where('ocorrencia.responsavelId = :responsavelId', { responsavelId })
      .andWhere('ocorrencia.excluidaEm IS NULL')
      .andWhere('ocorrencia.status IN (:...status)', { status: ['aberta', 'em_andamento'] })
      .getCount()
  }

  async contarPorResponsavelForaDoSetor(
    responsavelId: string,
    setorId: number | null,
    manager?: EntityManager,
  ): Promise<number> {
    const consulta = this.repositorio(manager).createQueryBuilder('ocorrencia')
      .withDeleted()
      .where('ocorrencia.responsavelId = :responsavelId', { responsavelId })
    if (setorId === null) consulta.andWhere('ocorrencia.setorId IS NOT NULL')
    else consulta.andWhere('ocorrencia.setorId <> :setorId', { setorId })
    return consulta.getCount()
  }

  async estatisticasDoResponsavel(
    responsavelId: string,
    manager?: EntityManager,
  ): Promise<EstatisticasLanterna> {
    const bruto = await this.repositorio(manager).createQueryBuilder('ocorrencia')
      .select("COUNT(CASE WHEN ocorrencia.status = 'resolvida' THEN 1 END)", 'resolvidas')
      .addSelect("COUNT(CASE WHEN ocorrencia.status = 'em_andamento' THEN 1 END)", 'emAndamento')
      .addSelect("COUNT(CASE WHEN ocorrencia.status IN ('aberta', 'em_andamento') THEN 1 END)", 'cargaAtual')
      .addSelect(
        "ROUND(AVG(CASE WHEN ocorrencia.status = 'resolvida' AND ocorrencia.resolvidaEm IS NOT NULL THEN (julianday(ocorrencia.resolvidaEm) - julianday(ocorrencia.criadaEm)) * 2400 END), 0)",
        'mediaCentimosHora',
      )
      .where('ocorrencia.responsavelId = :responsavelId', { responsavelId })
      .andWhere('ocorrencia.excluidaEm IS NULL')
      .getRawOne<{ resolvidas: string | number; emAndamento: string | number; cargaAtual: string | number; mediaCentimosHora: string | number | null }>()
    return {
      resolvidas: Number(bruto?.resolvidas ?? 0),
      emAndamento: Number(bruto?.emAndamento ?? 0),
      cargaAtual: Number(bruto?.cargaAtual ?? 0),
      mediaCentimosHora: bruto?.mediaCentimosHora === null || bruto?.mediaCentimosHora === undefined
        ? null
        : Number(bruto.mediaCentimosHora),
    }
  }

  async salvar(dados: DeepPartial<Ocorrencia>, manager?: EntityManager): Promise<Ocorrencia> {
    const repositorio = this.repositorio(manager)
    const ocorrencia = repositorio.create(dados)
    if (ocorrencia.titulo !== undefined) {
      ocorrencia.tituloBusca = normalizarBusca(ocorrencia.titulo)
    }
    return repositorio.save(ocorrencia)
  }

  async alterarEstadoCondicional(
    id: string,
    statusAnterior: StatusOcorrencia,
    dados: Partial<Pick<Ocorrencia, 'status' | 'resolucao' | 'resolvidaEm' | 'responsavelId'>>,
    manager: EntityManager,
  ): Promise<boolean> {
    const resultado = await this.repositorio(manager).update({ id, status: statusAnterior }, dados)
    return resultado.affected === 1
  }

  async alterarResponsavelCondicional(
    id: string,
    status: StatusOcorrencia,
    anteriorId: string | null,
    responsavelId: string | null,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return this.repositorio(manager).update(
      { id, status, responsavelId: anteriorId === null ? IsNull() : anteriorId },
      { responsavelId },
    )
  }

  async excluirSuavemente(id: string, manager?: EntityManager): Promise<boolean> {
    const resultado = await this.repositorio(manager).softDelete({ id })
    return resultado.affected === 1
  }

  private repositorio(manager?: EntityManager): Repository<Ocorrencia> {
    return manager ? manager.getRepository(Ocorrencia) : this.base
  }
}
