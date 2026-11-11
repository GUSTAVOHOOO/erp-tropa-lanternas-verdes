import { Injectable } from '@nestjs/common'
import { DataSource, QueryFailedError } from 'typeorm'
import { ErroDominio } from '../comum/erro-dominio.js'
import { SetorRespostaDto } from './setor-resposta.dto.js'
import { SetoresRepository } from './setores.repository.js'
import type { CriarSetorDto } from './dto/criar-setor.dto.js'
import type { EditarSetorDto } from './dto/editar-setor.dto.js'

@Injectable()
export class SetoresService {
  constructor(
    private readonly setores: SetoresRepository,
    private readonly banco: DataSource,
  ) {}

  async listar(): Promise<SetorRespostaDto[]> {
    return (await this.setores.listar()).map(SetorRespostaDto.de)
  }

  async buscarPorId(id: number): Promise<SetorRespostaDto> {
    const setor = await this.setores.buscarPorId(id)
    if (!setor) throw this.naoEncontrado()
    return SetorRespostaDto.de(setor)
  }

  async criar(dados: CriarSetorDto): Promise<SetorRespostaDto> {
    if (await this.setores.buscarPorId(dados.id)) throw this.jaCadastrado()
    try {
      return SetorRespostaDto.de(await this.setores.salvar(dados))
    } catch (erro) {
      if (this.eChavePrimariaSetor(erro)) throw this.jaCadastrado()
      throw erro
    }
  }

  async editar(id: number, dados: EditarSetorDto): Promise<SetorRespostaDto> {
    const existente = await this.setores.buscarPorId(id)
    if (!existente) throw this.naoEncontrado()
    const atualizado = await this.setores.atualizar(id, dados)
    if (!atualizado) throw this.naoEncontrado()
    return SetorRespostaDto.de(atualizado)
  }

  async excluir(id: number): Promise<void> {
    await this.banco.transaction(async (manager) => {
      const setor = await this.setores.buscarPorId(id, manager)
      if (!setor) throw this.naoEncontrado()
      if (await this.setores.contarUsos(id, manager) > 0) throw this.emUso()

      try {
        if (!(await this.setores.excluirFisicamente(id, manager))) throw this.naoEncontrado()
      } catch (erro) {
        if (this.eViolacaoDeFk(erro)) throw this.emUso()
        throw erro
      }
    })
  }

  private naoEncontrado(): ErroDominio {
    return new ErroDominio(404, 'NAO_ENCONTRADO', 'Setor não encontrado')
  }

  private jaCadastrado(): ErroDominio {
    return new ErroDominio(409, 'SETOR_JA_CADASTRADO', 'Setor já cadastrado')
  }

  private emUso(): ErroDominio {
    return new ErroDominio(409, 'SETOR_EM_USO', 'Setor ainda está em uso')
  }

  private eChavePrimariaSetor(erro: unknown): boolean {
    if (!(erro instanceof QueryFailedError)) return false
    const detalhe = erro as QueryFailedError & { driverError?: { code?: string; message?: string } }
    return (
      ['SQLITE_CONSTRAINT_PRIMARYKEY', 'SQLITE_CONSTRAINT_UNIQUE'].includes(detalhe.driverError?.code ?? '') &&
      /setor\.id/i.test(detalhe.driverError?.message ?? '')
    )
  }

  private eViolacaoDeFk(erro: unknown): boolean {
    if (!(erro instanceof QueryFailedError)) return false
    const detalhe = erro as QueryFailedError & { driverError?: { code?: string; message?: string } }
    return (
      detalhe.driverError?.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' ||
      /foreign key constraint failed/i.test(detalhe.driverError?.message ?? '')
    )
  }
}
