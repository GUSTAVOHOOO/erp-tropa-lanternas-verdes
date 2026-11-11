import type { EntityManager } from 'typeorm'
import { Lanterna } from '../../lanternas/lanterna.entity.js'
import { LanternasRepository } from '../../lanternas/lanternas.repository.js'
import { Setor } from '../../setores/setor.entity.js'
import { UsuariosRepository } from '../../usuarios/usuarios.repository.js'
import { Usuario } from '../../usuarios/usuario.entity.js'
import { IDS_FIXTURE_INTEGRACAO_A, IDS_FIXTURE_INTEGRACAO_B } from './ids.js'

export const FICHAS_FIXTURE_B = [
  {
    id: IDS_FIXTURE_INTEGRACAO_B.hal2814, codinome: 'Lanterna Fixture 2814', identidadeCivil: null,
    especie: 'Humana', planetaNatal: 'Terra', setorId: 2814, status: 'ativo' as const, anoIngresso: null,
    primeiraAparicao: null, habilidades: [], mentorId: null, citacao: null, biografia: null, fontes: {},
  },
  {
    id: IDS_FIXTURE_INTEGRACAO_B.kilowog674, codinome: 'Lanterna Fixture 674', identidadeCivil: null,
    especie: 'Alienígena', planetaNatal: 'Bolovax Vik', setorId: 674, status: 'ativo' as const, anoIngresso: null,
    primeiraAparicao: null, habilidades: [], mentorId: null, citacao: null, biografia: null, fontes: {},
  },
  {
    id: IDS_FIXTURE_INTEGRACAO_B.semSetor, codinome: 'Lanterna Fixture sem Setor', identidadeCivil: null,
    especie: 'Humana', planetaNatal: 'Terra', setorId: null, status: 'ativo' as const, anoIngresso: null,
    primeiraAparicao: null, habilidades: [], mentorId: null, citacao: null, biografia: null, fontes: {},
  },
]

const VINCULOS_FIXTURE_B = [
  { usuarioId: IDS_FIXTURE_INTEGRACAO_A.lanterna2814, lanternaId: IDS_FIXTURE_INTEGRACAO_B.hal2814 },
  { usuarioId: IDS_FIXTURE_INTEGRACAO_A.lanterna674, lanternaId: IDS_FIXTURE_INTEGRACAO_B.kilowog674 },
] as const

export async function montarEtapaB(manager: EntityManager): Promise<void> {
  const lanternas = new LanternasRepository(manager.getRepository(Lanterna))
  const usuarios = new UsuariosRepository(manager.getRepository(Usuario))

  for (const ficha of FICHAS_FIXTURE_B) {
    if (ficha.setorId !== null && !(await manager.getRepository(Setor).findOneBy({ id: ficha.setorId }))) {
      throw new Error(`Setor da Ficha fixture ${ficha.id} não existe`)
    }
    if (ficha.mentorId !== null && !(await lanternas.buscarPorId(ficha.mentorId, manager))) {
      throw new Error(`Mentor da Ficha fixture ${ficha.id} não existe`)
    }
    await lanternas.salvar(ficha, manager)
  }

  for (const vinculo of VINCULOS_FIXTURE_B) {
    const [usuario, lanterna, outraConta] = await Promise.all([
      usuarios.buscarPorId(vinculo.usuarioId, manager),
      lanternas.buscarPorId(vinculo.lanternaId, manager),
      manager.getRepository(Usuario).findOneBy({ lanternaId: vinculo.lanternaId }),
    ])
    if (!usuario || usuario.papel !== 'lanterna' || !lanterna || usuario.setorId === null || usuario.setorId !== lanterna.setorId) {
      throw new Error(`Vínculo fixture incompatível para ${vinculo.lanternaId}`)
    }
    if (outraConta && outraConta.id !== usuario.id) throw new Error(`Ficha fixture já vinculada: ${vinculo.lanternaId}`)
    if (usuario.lanternaId !== null && usuario.lanternaId !== lanterna.id) {
      throw new Error(`Conta fixture já possui outra Ficha: ${usuario.id}`)
    }
    await usuarios.salvar({ id: usuario.id, lanternaId: lanterna.id }, manager)
  }
}
