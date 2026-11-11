import type { EntityManager } from 'typeorm'
import { SenhaService } from '../../auth/senha.service.js'
import { SetoresRepository } from '../../setores/setores.repository.js'
import { Setor } from '../../setores/setor.entity.js'
import { UsuariosRepository } from '../../usuarios/usuarios.repository.js'
import { Usuario } from '../../usuarios/usuario.entity.js'
import { CONTAS_FIXTURE_A, SETORES_FIXTURE_A } from './ids.js'

export async function montarEtapaA(
  manager: EntityManager,
  senha: string,
): Promise<void> {
  const setores = new SetoresRepository(manager.getRepository(Setor))
  const usuarios = new UsuariosRepository(manager.getRepository(Usuario))
  const senhas = new SenhaService()

  for (const setor of SETORES_FIXTURE_A) await setores.salvar(setor, manager)
  for (const conta of CONTAS_FIXTURE_A) {
    await usuarios.salvar({
      ...conta,
      lanternaId: null,
      senhaHash: await senhas.hash(senha),
    }, manager)
  }
}
