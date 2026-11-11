import type { EntityManager } from 'typeorm'
import { SetoresRepository } from '../../setores/setores.repository.js'
import { SETORES_SEED_MINIMO } from './ids.js'

export async function semearSetores(repository: SetoresRepository, manager: EntityManager): Promise<void> {
  for (const setor of SETORES_SEED_MINIMO) {
    const existente = await repository.buscarPorId(setor.id, manager)
    if (!existente) {
      await repository.salvar(setor, manager)
      continue
    }
    if (existente.nome !== setor.nome || existente.descricao !== setor.descricao) {
      await repository.salvar(setor, manager)
    }
  }
}
