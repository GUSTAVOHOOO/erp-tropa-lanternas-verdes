import { Injectable } from '@nestjs/common'
import { DataSource, QueryFailedError } from 'typeorm'
import type { EntityManager } from 'typeorm'
import { ErroDominio } from '../comum/erro-dominio.js'
import { LanternasRepository } from '../lanternas/lanternas.repository.js'
import { SetoresRepository } from '../setores/setores.repository.js'
import { UsuarioRespostaDto } from './usuario-resposta.dto.js'
import { UsuariosRepository } from './usuarios.repository.js'
import type { PapelUsuarioDto } from './dto/papel-usuario.dto.js'
import type { FiltroUsuariosDto } from './dto/filtro-usuarios.dto.js'
import type { VinculoLanternaDto } from './dto/vinculo-lanterna.dto.js'

@Injectable()
export class UsuariosService {
  constructor(
    private readonly usuarios: UsuariosRepository,
    private readonly lanternas: LanternasRepository,
    private readonly setores: SetoresRepository,
    private readonly banco: DataSource,
  ) {}

  async listar(filtros: FiltroUsuariosDto) {
    const { itens, total } = await this.usuarios.listar(filtros)
    return {
      itens: itens.map(UsuarioRespostaDto.de),
      meta: {
        total,
        pagina: filtros.pagina,
        limite: filtros.limite,
        paginas: total === 0 ? 0 : Math.ceil(total / filtros.limite),
      },
    }
  }

  async alterarPapel(id: string, dados: PapelUsuarioDto): Promise<UsuarioRespostaDto> {
    return this.banco.transaction(async (manager) => {
      await this.usuarios.adquirirBloqueio(id, manager)
      const usuario = await this.usuarios.buscarPorId(id, manager)
      if (!usuario) throw this.naoEncontrado()

      if (usuario.papel === 'guardiao' && dados.papel === 'lanterna') {
        if (await this.usuarios.contarGuardioes(manager) <= 1) throw this.ultimoGuardiao()
      }

      if (dados.papel === 'guardiao') {
        return this.salvarAtualizacao(id, { papel: 'guardiao' }, manager)
      }

      const setorId = dados.setorId ?? usuario.setorId
      if (setorId === null) throw this.setorObrigatorio()
      if (!(await this.setores.buscarPorId(setorId, manager))) throw this.naoEncontrado('Setor não encontrado')

      if (usuario.lanternaId !== null) {
        const lanterna = await this.lanternas.buscarPorId(usuario.lanternaId, manager)
        if (!lanterna) throw this.naoEncontrado('Ficha de Lanterna não encontrada')
        if (lanterna.setorId === null || lanterna.setorId !== setorId) throw this.setorDiferente()
      }

      return this.salvarAtualizacao(id, { papel: 'lanterna', setorId }, manager)
    })
  }

  async vincularLanterna(id: string, dados: VinculoLanternaDto): Promise<UsuarioRespostaDto> {
    return this.banco.transaction(async (manager) => {
      await this.usuarios.adquirirBloqueio(id, manager)
      const usuario = await this.usuarios.buscarPorId(id, manager)
      if (!usuario) throw this.naoEncontrado()

      if (dados.lanternaId === null) {
        return this.salvarAtualizacao(id, { lanternaId: null }, manager)
      }

      const lanterna = await this.lanternas.buscarPorId(dados.lanternaId, manager)
      if (!lanterna) throw this.naoEncontrado('Ficha de Lanterna não encontrada')
      if (usuario.papel !== 'lanterna') throw this.vinculoNaoPermitido()
      if (usuario.setorId === null || lanterna.setorId === null || usuario.setorId !== lanterna.setorId) {
        throw this.setorDiferente()
      }

      const vinculada = await this.usuarios.buscarPorLanterna(lanterna.id, manager)
      if (vinculada && vinculada.id !== usuario.id) throw this.lanternaJaVinculada()

      try {
        return await this.salvarAtualizacao(id, { lanternaId: lanterna.id }, manager)
      } catch (erro) {
        if (this.eVinculoDuplicado(erro)) throw this.lanternaJaVinculada()
        throw erro
      }
    })
  }

  private async salvarAtualizacao(
    id: string,
    campos: { papel?: 'guardiao' | 'lanterna'; setorId?: number | null; lanternaId?: string | null },
    manager: EntityManager,
  ): Promise<UsuarioRespostaDto> {
    const atualizado = await this.usuarios.atualizar(id, campos, manager)
    if (!atualizado) throw this.naoEncontrado()
    const usuario = await this.usuarios.buscarPorId(id, manager)
    if (!usuario) throw this.naoEncontrado()
    return UsuarioRespostaDto.de(usuario)
  }

  private naoEncontrado(mensagem = 'Usuário não encontrado'): ErroDominio {
    return new ErroDominio(404, 'NAO_ENCONTRADO', mensagem)
  }

  private ultimoGuardiao(): ErroDominio {
    return new ErroDominio(409, 'ULTIMO_GUARDIAO', 'Não é possível rebaixar o último Guardião')
  }

  private setorObrigatorio(): ErroDominio {
    return new ErroDominio(422, 'SETOR_OBRIGATORIO', 'Lanterna precisa ter um Setor')
  }

  private setorDiferente(): ErroDominio {
    return new ErroDominio(422, 'SETOR_DIFERENTE', 'Conta e Ficha precisam ter o mesmo Setor')
  }

  private vinculoNaoPermitido(): ErroDominio {
    return new ErroDominio(422, 'VINCULO_NAO_PERMITIDO', 'Somente contas Lanterna podem ter uma Ficha vinculada')
  }

  private lanternaJaVinculada(): ErroDominio {
    return new ErroDominio(409, 'LANTERNA_JA_VINCULADA', 'Ficha já vinculada a outra conta')
  }

  private eVinculoDuplicado(erro: unknown): boolean {
    if (!(erro instanceof QueryFailedError)) return false
    const detalhe = erro as QueryFailedError & { driverError?: { code?: string; message?: string } }
    return (
      ['SQLITE_CONSTRAINT_UNIQUE', 'SQLITE_CONSTRAINT_PRIMARYKEY'].includes(detalhe.driverError?.code ?? '') &&
      /usuario\.lanternaId/i.test(detalhe.driverError?.message ?? '')
    )
  }
}
