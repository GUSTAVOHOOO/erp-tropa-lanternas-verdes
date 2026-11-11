import { ForbiddenException, Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { DataSource } from 'typeorm'
import type { EntityManager } from 'typeorm'
import { ErroDominio } from '../comum/erro-dominio.js'
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js'
import { EventosService } from '../eventos/eventos.service.js'
import { Lanterna } from '../lanternas/lanterna.entity.js'
import { LanternasRepository } from '../lanternas/lanternas.repository.js'
import { LanternasService } from '../lanternas/lanternas.service.js'
import { Ocorrencia } from './ocorrencia.entity.js'
import { OcorrenciaRespostaDto } from './ocorrencia-resposta.dto.js'
import { OcorrenciasRepository } from './ocorrencias.repository.js'
import type { ResponsavelOcorrenciaDto } from './dto/responsavel-ocorrencia.dto.js'
import type { StatusOcorrenciaDto } from './dto/status-ocorrencia.dto.js'

@Injectable()
export class CicloVidaService {
  constructor(
    private readonly ocorrencias: OcorrenciasRepository,
    private readonly lanternas: LanternasRepository,
    private readonly lanternasService: LanternasService,
    private readonly eventos: EventosService,
    private readonly banco: DataSource,
  ) {}

  async alterarStatus(
    id: string,
    dados: StatusOcorrenciaDto,
    usuario: UsuarioAutenticado,
    eventoId: string = randomUUID(),
    agora: Date = new Date(),
  ): Promise<OcorrenciaRespostaDto> {
    return this.banco.transaction(async (manager) => {
      await this.ocorrencias.adquirirBloqueio(id, manager)
      const ocorrencia = await this.ocorrencias.buscarPorId(id, manager)
      this.validarVisibilidade(ocorrencia, usuario)

      if (dados.status === 'aberta') return this.reabrir(ocorrencia!, dados, usuario, manager, eventoId, agora)
      if (dados.status === 'em_andamento') return this.iniciar(ocorrencia!, usuario, manager, eventoId, agora)
      return this.resolver(ocorrencia!, dados, usuario, manager, eventoId, agora)
    })
  }

  async alterarResponsavel(
    id: string,
    dados: ResponsavelOcorrenciaDto,
    usuario: UsuarioAutenticado,
    eventoId: string = randomUUID(),
    agora: Date = new Date(),
  ): Promise<OcorrenciaRespostaDto> {
    return this.banco.transaction(async (manager) => {
      await this.ocorrencias.adquirirBloqueio(id, manager)
      const ocorrencia = await this.ocorrencias.buscarPorId(id, manager)
      this.validarVisibilidade(ocorrencia, usuario)
      if (ocorrencia!.status === 'resolvida') throw this.conflitoResolvida()

      const destinoId = dados.responsavelId
      if (destinoId === null && ocorrencia!.status === 'em_andamento') throw this.semResponsavel()

      let destino: Lanterna | null = null
      if (destinoId !== null) {
        destino = await this.lanternas.buscarPorId(destinoId, manager)
        if (!destino) throw this.naoEncontrado('Lanterna responsável não encontrada')
        if (destino.setorId === null || destino.setorId !== ocorrencia!.setorId) {
          throw new ErroDominio(422, 'RESPONSAVEL_DE_OUTRO_SETOR', 'Lanterna de Setor diferente ou sem Setor')
        }
        if (destino.status === 'afastado') throw this.lanternaAfastado()
      }

      const anteriorId = ocorrencia!.responsavelId
      if (anteriorId === destinoId) return OcorrenciaRespostaDto.de(ocorrencia!)

      const resultado = await this.ocorrencias.alterarResponsavelCondicional(
        id, ocorrencia!.status, anteriorId, destinoId, manager,
      )
      if (resultado.affected !== 1) throw this.transicaoInvalida()
      await this.recalcularLanternas([anteriorId, destinoId], manager)
      await this.eventos.gravarAcao(id, usuario.id, 'atribuida', { de: anteriorId, para: destinoId }, manager, eventoId, agora)
      const atualizada = await this.ocorrencias.buscarPorId(id, manager)
      if (!atualizada) throw this.naoEncontrado()
      return OcorrenciaRespostaDto.de(atualizada)
    })
  }

  private async iniciar(ocorrencia: Ocorrencia, usuario: UsuarioAutenticado, manager: EntityManager, eventoId: string, agora: Date): Promise<OcorrenciaRespostaDto> {
    if (ocorrencia.status !== 'aberta') throw this.transicaoInvalida()
    if (ocorrencia.responsavelId === null) throw this.semResponsavel()
    await this.atualizarStatus(ocorrencia, { status: 'em_andamento' }, manager)
    await this.eventos.gravarAcao(ocorrencia.id, usuario.id, 'status_alterado', { de: 'aberta', para: 'em_andamento' }, manager, eventoId, agora)
    return this.buscarResposta(ocorrencia.id, manager)
  }

  private async resolver(ocorrencia: Ocorrencia, dados: StatusOcorrenciaDto, usuario: UsuarioAutenticado, manager: EntityManager, eventoId: string, agora: Date): Promise<OcorrenciaRespostaDto> {
    if (ocorrencia.status !== 'em_andamento') throw this.transicaoInvalida()
    if (!dados.resolucao || dados.resolucao.trim().length < 10) throw this.resolucaoObrigatoria()
    const resolvidaEm = agora
    await this.atualizarStatus(ocorrencia, { status: 'resolvida', resolucao: dados.resolucao, resolvidaEm }, manager)
    if (ocorrencia.responsavelId !== null) await this.lanternasService.recalcularStatus(ocorrencia.responsavelId, manager)
    await this.eventos.gravarAcao(ocorrencia.id, usuario.id, 'resolvida', {
      de: 'em_andamento', para: 'resolvida', resolucao: dados.resolucao,
    }, manager, eventoId, agora)
    return this.buscarResposta(ocorrencia.id, manager)
  }

  private async reabrir(ocorrencia: Ocorrencia, dados: StatusOcorrenciaDto, usuario: UsuarioAutenticado, manager: EntityManager, eventoId: string, agora: Date): Promise<OcorrenciaRespostaDto> {
    if (ocorrencia.status !== 'resolvida') {
      if (usuario.papel === 'lanterna') throw this.transicaoInvalida()
      throw this.transicaoInvalida()
    }
    if (usuario.papel !== 'guardiao') throw new ForbiddenException('Somente Guardião pode reabrir Ocorrência')
    if (!dados.motivo || dados.motivo.trim().length < 10) throw this.motivoObrigatorio()

    const responsavelAnteriorId = ocorrencia.responsavelId
    let responsavelId = responsavelAnteriorId
    if (responsavelId !== null) {
      const responsavel = await this.lanternas.buscarPorId(responsavelId, manager)
      if (responsavel?.status === 'afastado') responsavelId = null
    }
    await this.atualizarStatus(ocorrencia, {
      status: 'aberta', resolucao: null, resolvidaEm: null, responsavelId,
    }, manager)
    if (responsavelId !== null) await this.lanternasService.recalcularStatus(responsavelId, manager)
    await this.eventos.gravarAcao(ocorrencia.id, usuario.id, 'reaberta', {
      de: 'resolvida', para: 'aberta', motivo: dados.motivo,
      responsavelAnteriorId, responsavelId,
    }, manager, eventoId, agora)
    return this.buscarResposta(ocorrencia.id, manager)
  }

  private async atualizarStatus(
    ocorrencia: Ocorrencia,
    dados: Partial<Pick<Ocorrencia, 'status' | 'resolucao' | 'resolvidaEm' | 'responsavelId'>>,
    manager: EntityManager,
  ): Promise<void> {
    const atualizado = await this.ocorrencias.alterarEstadoCondicional(ocorrencia.id, ocorrencia.status, dados, manager)
    if (!atualizado) throw this.transicaoInvalida()
  }

  private async recalcularLanternas(ids: (string | null)[], manager: EntityManager): Promise<void> {
    const unicos = [...new Set(ids.filter((id): id is string => id !== null))].sort()
    for (const id of unicos) await this.lanternasService.recalcularStatus(id, manager)
  }

  private async buscarResposta(id: string, manager: EntityManager): Promise<OcorrenciaRespostaDto> {
    const ocorrencia = await this.ocorrencias.buscarPorId(id, manager)
    if (!ocorrencia) throw this.naoEncontrado()
    return OcorrenciaRespostaDto.de(ocorrencia)
  }

  private validarVisibilidade(ocorrencia: Ocorrencia | null, usuario: UsuarioAutenticado): void {
    if (!ocorrencia || (usuario.papel === 'lanterna' && ocorrencia.setorId !== usuario.setorId)) throw this.naoEncontrado()
  }

  private transicaoInvalida(): ErroDominio { return new ErroDominio(422, 'TRANSICAO_INVALIDA', 'Transição de Status inválida') }
  private semResponsavel(): ErroDominio { return new ErroDominio(422, 'SEM_RESPONSAVEL', 'A Ocorrência precisa de Responsável') }
  private resolucaoObrigatoria(): ErroDominio { return new ErroDominio(422, 'RESOLUCAO_OBRIGATORIA', 'Informe uma resolução com ao menos 10 caracteres') }
  private motivoObrigatorio(): ErroDominio { return new ErroDominio(422, 'MOTIVO_OBRIGATORIO', 'Informe um motivo com ao menos 10 caracteres') }
  private conflitoResolvida(): ErroDominio { return new ErroDominio(409, 'OCORRENCIA_RESOLVIDA', 'Ocorrência resolvida não aceita atribuição') }
  private lanternaAfastado(): ErroDominio { return new ErroDominio(409, 'LANTERNA_AFASTADO', 'Lanterna está afastado') }
  private naoEncontrado(mensagem = 'Ocorrência não encontrada'): ErroDominio { return new ErroDominio(404, 'NAO_ENCONTRADO', mensagem) }
}
