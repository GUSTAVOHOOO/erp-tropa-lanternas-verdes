import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { DataSource, QueryFailedError } from 'typeorm'
import type { EntityManager } from 'typeorm'
import { ErroDominio } from '../comum/erro-dominio.js'
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js'
import { EventosService } from '../eventos/eventos.service.js'
import { LanternasService } from '../lanternas/lanternas.service.js'
import { SetoresRepository } from '../setores/setores.repository.js'
import { type CriarOcorrenciaDto } from './dto/criar-ocorrencia.dto.js'
import { type EditarOcorrenciaDto } from './dto/editar-ocorrencia.dto.js'
import type { FiltroOcorrenciasDto } from './dto/filtro-ocorrencias.dto.js'
import { OcorrenciaRespostaDto } from './ocorrencia-resposta.dto.js'
import { OcorrenciasRepository } from './ocorrencias.repository.js'

@Injectable()
export class OcorrenciasService {
  constructor(
    private readonly ocorrencias: OcorrenciasRepository,
    private readonly setores: SetoresRepository,
    private readonly eventos: EventosService,
    private readonly lanternas: LanternasService,
    private readonly banco: DataSource,
  ) {}

  async listar(filtros: FiltroOcorrenciasDto, usuario: UsuarioAutenticado) {
    const agora = new Date()
    if (usuario.papel === 'lanterna' && usuario.setorId === null) {
      return this.pagina([], 0, filtros.pagina, filtros.limite, agora)
    }
    const { itens, total } = await this.ocorrencias.listar({
      status: filtros.status,
      gravidade: filtros.gravidade,
      setorId: usuario.papel === 'guardiao' ? filtros.setor : undefined,
      responsavelId: filtros.responsavel,
      vencida: typeof filtros.vencida === 'boolean' ? filtros.vencida : undefined,
      busca: filtros.busca,
      pagina: filtros.pagina,
      limite: filtros.limite,
      ordenar: filtros.ordenar,
      ordem: filtros.ordem,
    }, usuario.papel === 'lanterna' ? usuario.setorId : null, agora)
    return this.pagina(itens, total, filtros.pagina, filtros.limite, agora)
  }

  async listarMinhaFila(pagina: number, limite: number, usuario: UsuarioAutenticado) {
    if (!usuario.lanternaId) throw new ErroDominio(409, 'CONTA_SEM_LANTERNA', 'Conta sem Ficha vinculada')
    const { itens, total } = await this.ocorrencias.listarMinhaFila(usuario.lanternaId, pagina, limite)
    return this.pagina(itens, total, pagina, limite)
  }

  async buscarPorId(id: string, usuario: UsuarioAutenticado): Promise<OcorrenciaRespostaDto> {
    const ocorrencia = await this.ocorrencias.buscarPorId(id)
    this.validarEscopo(ocorrencia, usuario)
    return OcorrenciaRespostaDto.de(ocorrencia!)
  }

  async criar(
    dados: CriarOcorrenciaDto,
    usuario: UsuarioAutenticado,
    id: string = randomUUID(),
    eventoId: string = randomUUID(),
    criadaEm?: Date,
  ): Promise<OcorrenciaRespostaDto> {
    let setorId: number
    if (usuario.papel === 'lanterna') {
      if (dados.setorId !== undefined) throw new BadRequestException(['setorId não é permitido para Lanterna'])
      if (usuario.setorId === null) throw new ErroDominio(422, 'SETOR_OBRIGATORIO', 'Lanterna sem Setor próprio')
      setorId = usuario.setorId
    } else {
      if (dados.setorId === undefined) throw new BadRequestException(['setorId é obrigatório para Guardião'])
      if (!(await this.setores.buscarPorId(dados.setorId))) throw this.naoEncontrado('Setor não encontrado')
      setorId = dados.setorId
    }

    return this.banco.transaction(async (manager) => {
      const criada = await this.ocorrencias.salvar({
        id,
        titulo: dados.titulo,
        descricao: dados.descricao,
        planeta: dados.planeta,
        setorId,
        gravidade: dados.gravidade,
        status: 'aberta',
        envolvidos: dados.envolvidos,
        responsavelId: null,
        resolucao: null,
        criadaPorId: usuario.id,
        resolvidaEm: null,
        ...(criadaEm ? { criadaEm } : {}),
      }, manager)
      await this.eventos.gravarCriacao(criada.id, usuario.id, manager, eventoId, criadaEm)
      return OcorrenciaRespostaDto.de(criada)
    }).catch((erro: unknown) => {
      if (this.eViolacaoDeFk(erro)) throw this.naoEncontrado('Setor não encontrado')
      throw erro
    })
  }

  async editar(id: string, dados: EditarOcorrenciaDto, usuario: UsuarioAutenticado): Promise<OcorrenciaRespostaDto> {
    return this.banco.transaction(async (manager) => {
      await this.ocorrencias.adquirirBloqueio(id, manager)
      const existente = await this.ocorrencias.buscarPorId(id, manager)
      this.validarEscopo(existente, usuario)
      if (usuario.papel === 'lanterna' && existente!.criadaPorId !== usuario.id) {
        throw new ForbiddenException('Lanterna só pode editar ocorrência que criou')
      }
      if (existente!.status === 'resolvida') throw this.resolvida()

      await this.ocorrencias.salvar({ id, ...dados }, manager)
      const atualizada = await this.ocorrencias.buscarPorId(id, manager)
      if (!atualizada) throw this.naoEncontrado()
      return OcorrenciaRespostaDto.de(atualizada)
    })
  }

  async excluir(id: string, usuario: UsuarioAutenticado): Promise<void> {
    await this.banco.transaction(async (manager) => {
      await this.ocorrencias.adquirirBloqueio(id, manager)
      const existente = await this.ocorrencias.buscarPorId(id, manager)
      this.validarEscopo(existente, usuario)
      const excluida = await this.ocorrencias.excluirSuavemente(id, manager)
      if (!excluida) throw this.naoEncontrado('Ocorrência não encontrada')
      if (existente!.responsavelId !== null) {
        await this.lanternas.recalcularStatus(existente!.responsavelId, manager)
      }
    })
  }

  private validarEscopo(ocorrencia: Awaited<ReturnType<OcorrenciasRepository['buscarPorId']>>, usuario: UsuarioAutenticado): void {
    if (!ocorrencia || (usuario.papel === 'lanterna' && ocorrencia.setorId !== usuario.setorId)) {
      throw this.naoEncontrado('Ocorrência não encontrada')
    }
  }

  private pagina(
    itens: Awaited<ReturnType<OcorrenciasRepository['listar']>>['itens'],
    total: number,
    pagina: number,
    limite: number,
    agora = new Date(),
  ) {
    return {
      itens: itens.map((ocorrencia) => OcorrenciaRespostaDto.de(ocorrencia, agora)),
      meta: { total, pagina, limite, paginas: total === 0 ? 0 : Math.ceil(total / limite) },
    }
  }

  private naoEncontrado(mensagem = 'Ocorrência não encontrada'): ErroDominio {
    return new ErroDominio(404, 'NAO_ENCONTRADO', mensagem)
  }

  private resolvida(): ErroDominio {
    return new ErroDominio(409, 'OCORRENCIA_RESOLVIDA', 'Ocorrência resolvida não pode ser editada')
  }

  private eViolacaoDeFk(erro: unknown): boolean {
    if (!(erro instanceof QueryFailedError)) return false
    const detalhe = erro as QueryFailedError & { driverError?: { code?: string; message?: string } }
    return detalhe.driverError?.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || /foreign key constraint failed/i.test(detalhe.driverError?.message ?? '')
  }
}
