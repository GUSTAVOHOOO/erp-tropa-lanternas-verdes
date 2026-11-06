import { Injectable, NotFoundException } from '@nestjs/common'
import { GruposRepository } from './grupos.repository.js'

@Injectable()
export class GruposService {
  constructor(private readonly repo: GruposRepository) {}
  async buscar(id: number) {
    const g = await this.repo.buscarPorId(id)
    if (!g) throw new NotFoundException('Grupo não encontrado')
    return g
  }
  criar(nome: string) { return this.repo.salvar({ nome }) }
}
