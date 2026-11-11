import { Injectable } from '@nestjs/common'
import { DataSource, QueryFailedError } from 'typeorm'
import type { EntityManager } from 'typeorm'
import { ErroDominio } from '../comum/erro-dominio.js'
import { OcorrenciasRepository } from '../ocorrencias/ocorrencias.repository.js'
import { SetoresRepository } from '../setores/setores.repository.js'
import { UsuariosRepository } from '../usuarios/usuarios.repository.js'
import { FichaRespostaDto } from './ficha-resposta.dto.js'
import { LanternaListaRespostaDto } from './lanterna-lista-resposta.dto.js'
import { LanternasRepository, type CamposAtualizaveisLanterna } from './lanternas.repository.js'
import type { FontesLanternaDto } from './dto/fontes-lanterna.dto.js'
import type { CriarLanternaDto } from './dto/criar-lanterna.dto.js'
import type { EditarLanternaDto } from './dto/editar-lanterna.dto.js'
import type { FiltroLanternasDto } from './dto/filtro-lanternas.dto.js'
import type { StatusLanternaDto } from './dto/status-lanterna.dto.js'

@Injectable()
export class LanternasService {
  constructor(
    private readonly lanternas: LanternasRepository,
    private readonly setores: SetoresRepository,
    private readonly usuarios: UsuariosRepository,
    private readonly ocorrencias: OcorrenciasRepository,
    private readonly banco: DataSource,
  ) {}

  async listar(filtros: FiltroLanternasDto) {
    const { itens, total } = await this.lanternas.listar(filtros)
    return {
      itens: itens.map(LanternaListaRespostaDto.de),
      meta: {
        total,
        pagina: filtros.pagina,
        limite: filtros.limite,
        paginas: total === 0 ? 0 : Math.ceil(total / filtros.limite),
      },
    }
  }

  async buscarPorId(id: string): Promise<FichaRespostaDto> {
    return this.buscarFicha(id)
  }

  async criar(dados: CriarLanternaDto): Promise<FichaRespostaDto> {
    return this.banco.transaction(async (manager) => {
      await this.lanternas.adquirirBloqueio(dados.id, manager)
      if (await this.lanternas.buscarPorId(dados.id, manager)) throw this.jaCadastrada()
      await this.validarSetor(dados.setorId ?? null, manager)
      await this.validarMentor(dados.id, dados.mentorId ?? null, manager)

      try {
        await this.lanternas.salvar({
          id: dados.id,
          codinome: dados.codinome,
          identidadeCivil: dados.identidadeCivil ?? null,
          especie: dados.especie,
          planetaNatal: dados.planetaNatal,
          setorId: dados.setorId ?? null,
          status: 'ativo',
          anoIngresso: dados.anoIngresso ?? null,
          primeiraAparicao: dados.primeiraAparicao ?? null,
          habilidades: dados.habilidades ?? [],
          mentorId: dados.mentorId ?? null,
          citacao: dados.citacao ?? null,
          biografia: dados.biografia ?? null,
          fontes: this.fontesComoRegistro(dados.fontes) ?? {},
        }, manager)
      } catch (erro) {
        if (this.eChavePrimariaLanterna(erro)) throw this.jaCadastrada()
        if (this.eViolacaoDeFk(erro)) throw this.naoEncontrado('Setor ou mentor não encontrado')
        throw erro
      }
      return this.buscarFichaNoManager(dados.id, manager)
    })
  }

  async editar(id: string, dados: EditarLanternaDto): Promise<FichaRespostaDto> {
    return this.banco.transaction(async (manager) => {
      await this.lanternas.adquirirBloqueio(id, manager)
      const existente = await this.lanternas.buscarPorId(id, manager)
      if (!existente) throw this.naoEncontrado()

      if (dados.setorId !== undefined && dados.setorId !== existente.setorId) {
        await this.validarSetor(dados.setorId, manager)
        const [contasIncompativeis, ocorrenciasIncompativeis] = await Promise.all([
          this.usuarios.contarVinculosIncompativeis(id, dados.setorId, manager),
          this.ocorrencias.contarPorResponsavelForaDoSetor(id, dados.setorId, manager),
        ])
        if (contasIncompativeis > 0 || ocorrenciasIncompativeis > 0) throw this.emUso()
      }

      if (dados.mentorId !== undefined) {
        await this.validarMentor(id, dados.mentorId, manager)
      }

      const atualizado = await this.lanternas.atualizar(id, this.camposDeEdicao(dados), manager)
      if (!atualizado) throw this.naoEncontrado()
      return this.buscarFichaNoManager(id, manager)
    })
  }

  async alterarStatus(id: string, dados: StatusLanternaDto): Promise<FichaRespostaDto> {
    return this.banco.transaction(async (manager) => {
      await this.lanternas.adquirirBloqueio(id, manager)
      const lanterna = await this.lanternas.buscarPorId(id, manager)
      if (!lanterna) throw this.naoEncontrado()
      const carga = await this.ocorrencias.contarNaoResolvidasDoResponsavel(id, manager)
      if (carga > 0) throw this.emMissao()

      const atualizado = await this.lanternas.atualizar(id, { status: dados.status }, manager)
      if (!atualizado) throw this.naoEncontrado()
      return this.buscarFichaNoManager(id, manager)
    })
  }

  async recalcularStatus(id: string, manager: EntityManager): Promise<void> {
    await this.lanternas.adquirirBloqueio(id, manager)
    const lanterna = await this.lanternas.buscarPorId(id, manager)
    if (!lanterna || lanterna.status === 'afastado') return
    const carga = await this.ocorrencias.contarNaoResolvidasDoResponsavel(id, manager)
    const status = carga > 0 ? 'em_missao' : 'ativo'
    if (lanterna.status !== status) await this.lanternas.atualizar(id, { status }, manager)
  }

  private async buscarFicha(id: string): Promise<FichaRespostaDto> {
    const lanterna = await this.lanternas.buscarFicha(id)
    if (!lanterna) throw this.naoEncontrado()
    return FichaRespostaDto.de(lanterna, await this.ocorrencias.estatisticasDoResponsavel(id))
  }

  private async buscarFichaNoManager(id: string, manager: EntityManager): Promise<FichaRespostaDto> {
    const lanterna = await this.lanternas.buscarFicha(id, manager)
    if (!lanterna) throw this.naoEncontrado()
    return FichaRespostaDto.de(lanterna, await this.ocorrencias.estatisticasDoResponsavel(id, manager))
  }

  private async validarSetor(setorId: number | null, manager: EntityManager): Promise<void> {
    if (setorId === null) return
    if (!(await this.setores.buscarPorId(setorId, manager))) throw this.naoEncontrado('Setor não encontrado')
  }

  private async validarMentor(id: string, mentorId: string | null, manager: EntityManager): Promise<void> {
    if (mentorId === null) return
    if (mentorId === id) throw this.mentorInvalido()

    const vistos = new Set<string>()
    let atual: string | null = mentorId
    while (atual !== null) {
      if (atual === id || vistos.has(atual)) throw this.mentorInvalido()
      vistos.add(atual)
      const mentor = await this.lanternas.buscarPorId(atual, manager)
      if (!mentor) throw this.mentorInvalido()
      atual = mentor.mentorId
    }
  }

  private camposDeEdicao(dados: EditarLanternaDto): CamposAtualizaveisLanterna {
    const campos: CamposAtualizaveisLanterna = {}
    const chave = [
      'codinome', 'identidadeCivil', 'especie', 'planetaNatal', 'setorId', 'anoIngresso',
      'primeiraAparicao', 'habilidades', 'mentorId', 'citacao', 'biografia',
    ] as const
    for (const nome of chave) {
      const valor = dados[nome]
      if (valor !== undefined) Object.assign(campos, { [nome]: valor })
    }
    if (dados.fontes !== undefined) campos.fontes = this.fontesComoRegistro(dados.fontes) ?? {}
    return campos
  }

  private fontesComoRegistro(
    fontes: FontesLanternaDto | undefined,
  ): Record<string, { estado: 'verificado' | 'nao_verificado'; url?: string }> | undefined {
    if (!fontes) return undefined
    const resposta: Record<string, { estado: 'verificado' | 'nao_verificado'; url?: string }> = {}
    for (const nome of [
      'codinome', 'identidadeCivil', 'especie', 'planetaNatal', 'setorId', 'anoIngresso',
      'primeiraAparicao', 'habilidades', 'mentorId', 'citacao', 'biografia',
    ] as const) {
      const fonte = fontes[nome]
      if (fonte !== undefined) resposta[nome] = { estado: fonte.estado, ...(fonte.url ? { url: fonte.url } : {}) }
    }
    return resposta
  }

  private jaCadastrada(): ErroDominio {
    return new ErroDominio(409, 'LANTERNA_JA_CADASTRADA', 'Lanterna já cadastrada')
  }

  private naoEncontrado(mensagem = 'Lanterna não encontrada'): ErroDominio {
    return new ErroDominio(404, 'NAO_ENCONTRADO', mensagem)
  }

  private mentorInvalido(): ErroDominio {
    return new ErroDominio(422, 'MENTOR_INVALIDO', 'Mentor inexistente, próprio ou cíclico')
  }

  private emUso(): ErroDominio {
    return new ErroDominio(409, 'LANTERNA_EM_USO', 'Setor incompatível com vínculos ou histórico da Lanterna')
  }

  private emMissao(): ErroDominio {
    return new ErroDominio(409, 'LANTERNA_EM_MISSAO', 'Lanterna com Ocorrência não resolvida atribuída')
  }

  private eChavePrimariaLanterna(erro: unknown): boolean {
    if (!(erro instanceof QueryFailedError)) return false
    const detalhe = erro as QueryFailedError & { driverError?: { code?: string; message?: string } }
    return (
      ['SQLITE_CONSTRAINT_PRIMARYKEY', 'SQLITE_CONSTRAINT_UNIQUE'].includes(detalhe.driverError?.code ?? '') &&
      /lanterna\.id/i.test(detalhe.driverError?.message ?? '')
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
