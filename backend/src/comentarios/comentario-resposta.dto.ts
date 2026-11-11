import type { Comentario } from './comentario.entity.js'
import type { Usuario } from '../usuarios/usuario.entity.js'
import { AutorResumoDto } from '../comum/autor-resumo.dto.js'

export class ComentarioRespostaDto {
  id!: string
  ocorrenciaId!: string
  autorId!: string
  autor!: AutorResumoDto
  texto!: string
  criadoEm!: Date

  static de(comentario: Comentario, autor: Pick<Usuario, 'id' | 'nome' | 'papel'> = comentario.autor): ComentarioRespostaDto {
    const resposta = new ComentarioRespostaDto()
    Object.assign(resposta, {
      id: comentario.id,
      ocorrenciaId: comentario.ocorrenciaId,
      autorId: comentario.autorId,
      autor: AutorResumoDto.de(autor),
      texto: comentario.texto,
      criadoEm: comentario.criadoEm,
    })
    return resposta
  }
}
