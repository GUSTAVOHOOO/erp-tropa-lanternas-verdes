import { ForbiddenException, Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { DataSource } from 'typeorm'
import type { EntityManager } from 'typeorm'
import { ErroDominio } from '../comum/erro-dominio.js'
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js'
import { EventosService } from '../eventos/eventos.service.js'
import { OcorrenciasRepository } from '../ocorrencias/ocorrencias.repository.js'
import { type CriarComentarioDto } from './dto/criar-comentario.dto.js'
import { ComentarioRespostaDto } from './comentario-resposta.dto.js'
import { ComentariosRepository } from './comentarios.repository.js'

@Injectable()
export class ComentariosService {
  constructor(
    private readonly comentarios: ComentariosRepository,
    private readonly ocorrencias: OcorrenciasRepository,
    private readonly eventos: EventosService,
    private readonly banco: DataSource,
  ) {}

  async listarDaOcorrencia(
    ocorrenciaId: string,
    pagina: number,
    limite: number,
    usuario: UsuarioAutenticado,
  ) {
    const ocorrencia = await this.ocorrencias.buscarPorId(ocorrenciaId)
    this.validarEscopo(ocorrencia, usuario)
    const { itens, total } = await this.comentarios.listarDaOcorrencia(ocorrenciaId, pagina, limite)
    return {
      itens: itens.map((comentario) => ComentarioRespostaDto.de(comentario)),
      meta: { total, pagina, limite, paginas: total === 0 ? 0 : Math.ceil(total / limite) },
    }
  }

  async criar(
    ocorrenciaId: string,
    dados: CriarComentarioDto,
    usuario: UsuarioAutenticado,
    id: string = randomUUID(),
    criadoEm?: Date,
  ): Promise<ComentarioRespostaDto> {
    return this.banco.transaction(async (manager) => {
      await this.ocorrencias.adquirirBloqueio(ocorrenciaId, manager)
      const ocorrencia = await this.ocorrencias.buscarPorId(ocorrenciaId, manager)
      this.validarEscopo(ocorrencia, usuario)
      const comentario = await this.comentarios.salvar({
        id,
        ocorrenciaId,
        autorId: usuario.id,
        texto: dados.texto,
        ...(criadoEm ? { criadoEm } : {}),
      }, manager)
      return ComentarioRespostaDto.de(comentario, usuario)
    })
  }

  async excluir(id: string, usuario: UsuarioAutenticado, eventoId: string = randomUUID(), criadoEm?: Date): Promise<void> {
    const referencia = await this.comentarios.buscarPorId(id)
    if (!referencia) throw this.naoEncontrado('Comentário não encontrado')

    await this.banco.transaction(async (manager) => {
      await this.ocorrencias.adquirirBloqueio(referencia.ocorrenciaId, manager)
      const comentario = await this.comentarios.buscarPorId(id, manager)
      if (!comentario) throw this.naoEncontrado('Comentário não encontrado')
      const ocorrencia = await this.ocorrencias.buscarPorId(comentario.ocorrenciaId, manager)
      this.validarEscopo(ocorrencia, usuario)
      if (usuario.papel !== 'guardiao' && comentario.autorId !== usuario.id) {
        throw new ForbiddenException('Somente o autor ou Guardião pode excluir o comentário')
      }
      if (!(await this.comentarios.excluirSuavemente(id, manager))) {
        throw this.naoEncontrado('Comentário não encontrado')
      }
      await this.eventos.gravarComentarioApagado(
        comentario.ocorrenciaId,
        usuario.id,
        comentario.id,
        manager,
        eventoId,
        criadoEm,
      )
    })
  }

  private validarEscopo(
    ocorrencia: Awaited<ReturnType<OcorrenciasRepository['buscarPorId']>>,
    usuario: UsuarioAutenticado,
  ): void {
    if (!ocorrencia || (usuario.papel === 'lanterna' && ocorrencia.setorId !== usuario.setorId)) {
      throw this.naoEncontrado('Ocorrência não encontrada')
    }
  }

  private naoEncontrado(mensagem: string): ErroDominio {
    return new ErroDominio(404, 'NAO_ENCONTRADO', mensagem)
  }
}
