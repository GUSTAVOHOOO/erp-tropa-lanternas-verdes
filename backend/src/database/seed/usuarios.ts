import type { EntityManager } from 'typeorm'
import { UsuariosRepository } from '../../usuarios/usuarios.repository.js'
import { SenhaService } from '../../auth/senha.service.js'
import { CONTA_GUARDIAO_SEED, CONTAS_LANTERNA_SEED } from './ids.js'
import { LanternasRepository } from '../../lanternas/lanternas.repository.js'
import { Usuario } from '../../usuarios/usuario.entity.js'

export async function semearGuardiao(
  repository: UsuariosRepository,
  senhas: SenhaService,
  manager: EntityManager,
  senha: string,
): Promise<void> {
  const porEmail = await repository.buscarPorEmail(CONTA_GUARDIAO_SEED.email, manager)
  const porId = await repository.buscarPorId(CONTA_GUARDIAO_SEED.id, manager)
  if (porEmail || porId) {
    const existente = porEmail ?? porId
    if (
      existente?.id !== CONTA_GUARDIAO_SEED.id ||
      existente.nome !== CONTA_GUARDIAO_SEED.nome ||
      existente.email !== CONTA_GUARDIAO_SEED.email ||
      existente.papel !== 'guardiao' ||
      existente.setorId !== null ||
      existente.lanternaId !== null
    ) {
      throw new Error('A identidade fixa do Guardião seed já está ocupada por outra conta')
    }
    return
  }

  await repository.salvar({
    ...CONTA_GUARDIAO_SEED,
    senhaHash: await senhas.hash(senha),
  }, manager)
}

export async function semearContasLanterna(
  repository: UsuariosRepository,
  senhas: SenhaService,
  manager: EntityManager,
  fichas: LanternasRepository,
  senhaOverride?: string,
): Promise<void> {
  for (const conta of CONTAS_LANTERNA_SEED) {
    const ficha = await fichas.buscarPorId(conta.lanternaId, manager)
    const contaVinculada = await manager.getRepository(Usuario).findOneBy({ lanternaId: conta.lanternaId })
    if (!ficha || ficha.setorId !== conta.setorId || (contaVinculada && contaVinculada.id !== conta.id)) {
      throw new Error(`Seed account link is invalid for ${conta.email}`)
    }
    const [porEmail, porId] = await Promise.all([
      repository.buscarPorEmail(conta.email, manager),
      repository.buscarPorId(conta.id, manager),
    ])
    const existente = porEmail ?? porId
    if (existente) {
      if (
        existente.id !== conta.id || existente.nome !== conta.nome || existente.email !== conta.email ||
        existente.papel !== 'lanterna' || existente.setorId !== conta.setorId ||
        existente.lanternaId !== conta.lanternaId
      ) {
        throw new Error(`Seed account identity conflict: ${conta.email}`)
      }
      continue
    }

    await repository.salvar({
      id: conta.id,
      nome: conta.nome,
      email: conta.email,
      papel: conta.papel,
      setorId: conta.setorId,
      lanternaId: conta.lanternaId,
      senhaHash: await senhas.hash(senhaOverride ?? conta.senha),
    }, manager)
  }
}
