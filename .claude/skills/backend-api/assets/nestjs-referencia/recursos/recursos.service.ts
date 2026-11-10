import { Injectable, NotFoundException } from '@nestjs/common'
import { GruposService } from '../grupos/grupos.service.js'
import { AtualizarRecursoDto } from './dto/atualizar-recurso.dto.js'
import { CriarRecursoDto } from './dto/criar-recurso.dto.js'
import { ListarRecursosDto } from './dto/listar-recursos.dto.js'
import { RecursosRepository } from './recursos.repository.js'
import { comMeta } from '../comum/paginacao.dto.js'

@Injectable()
export class RecursosService {
  constructor(
    private readonly repo: RecursosRepository,
    private readonly grupos: GruposService,
  ) {}

  async listar(f: ListarRecursosDto) {
    return comMeta(await this.repo.listar(f), f)
  }

  async buscar(id: number) {
    const r = await this.repo.buscarPorId(id)
    if (!r) throw new NotFoundException('Recurso não encontrado')
    return r
  }

  async criar(dto: CriarRecursoDto) {
    const { grupoId, valor, ...campos } = dto
    const grupo = await this.grupos.buscar(grupoId)
    return this.repo.salvar({ ...campos, valor: valor.toFixed(2), grupo })
  }

  async atualizar(id: number, dto: AtualizarRecursoDto) {
    const recurso = await this.buscar(id)
    const { grupoId, valor, ...campos } = dto
    if (grupoId !== undefined) recurso.grupo = await this.grupos.buscar(grupoId)
    if (valor !== undefined) recurso.valor = valor.toFixed(2)
    Object.assign(recurso, campos)
    return this.repo.salvar(recurso)
  }

  async remover(id: number) {
    await this.buscar(id)
    await this.repo.excluir(id)
  }
}
