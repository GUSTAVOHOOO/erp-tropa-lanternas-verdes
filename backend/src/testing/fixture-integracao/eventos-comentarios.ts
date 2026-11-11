import type { DataSource } from 'typeorm'
import { Comentario } from '../../comentarios/comentario.entity.js'
import { ComentariosRepository } from '../../comentarios/comentarios.repository.js'
import { ComentariosService } from '../../comentarios/comentarios.service.js'
import { Evento } from '../../eventos/evento.entity.js'
import { EventosRepository } from '../../eventos/eventos.repository.js'
import { EventosService } from '../../eventos/eventos.service.js'
import { Ocorrencia } from '../../ocorrencias/ocorrencia.entity.js'
import { OcorrenciasRepository } from '../../ocorrencias/ocorrencias.repository.js'
import { Usuario } from '../../usuarios/usuario.entity.js'
import { UsuariosRepository } from '../../usuarios/usuarios.repository.js'
import { IDS_FIXTURE_INTEGRACAO_A, IDS_FIXTURE_INTEGRACAO_E } from './ids.js'

export async function montarEtapaE(banco: DataSource, instanteReferencia: string): Promise<void> {
  const usuarios = new UsuariosRepository(banco.getRepository(Usuario))
  const guardiao = await usuarios.buscarPorId(IDS_FIXTURE_INTEGRACAO_A.guardiao)
  const lanterna2814 = await usuarios.buscarPorId(IDS_FIXTURE_INTEGRACAO_A.lanterna2814)
  const lanterna674 = await usuarios.buscarPorId(IDS_FIXTURE_INTEGRACAO_A.lanterna674)
  if (!guardiao || !lanterna2814 || !lanterna674) throw new Error('Autores da fixture não encontrados')
  const eventos = new EventosService(new EventosRepository(banco.getRepository(Evento)))
  const comentarios = new ComentariosService(
    new ComentariosRepository(banco.getRepository(Comentario)),
    new OcorrenciasRepository(banco.getRepository(Ocorrencia)),
    eventos,
    banco,
  )
  const referencia = new Date(instanteReferencia)
  const atorGuardiao = usuarioAutenticado(guardiao)
  const ator2814 = usuarioAutenticado(lanterna2814)
  const ator674 = usuarioAutenticado(lanterna674)

  await comentarios.criar(idOcorrencia(1), { texto: 'A Lanterna registrou o acompanhamento do Setor.' }, ator2814,
    IDS_FIXTURE_INTEGRACAO_E.comentarioLanterna, referencia)
  await comentarios.criar(idOcorrencia(1), { texto: 'O Guardião confirmou o recebimento do relato.' }, atorGuardiao,
    IDS_FIXTURE_INTEGRACAO_E.comentarioGuardiao, referencia)
  await comentarios.criar(idOcorrencia(4), { texto: 'Comentário histórico da ocorrência resolvida.' }, ator674,
    IDS_FIXTURE_INTEGRACAO_E.comentarioResolvido, referencia)
  await comentarios.excluir(IDS_FIXTURE_INTEGRACAO_E.comentarioResolvido, atorGuardiao,
    IDS_FIXTURE_INTEGRACAO_E.eventoComentarioApagado, referencia)
}

function usuarioAutenticado(usuario: Usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
    setorId: usuario.setorId,
    lanternaId: usuario.lanternaId,
    criadoEm: usuario.criadoEm,
  }
}

function idOcorrencia(indice: number): string {
  return `a0800000-0000-4000-8000-${indice.toString(16).padStart(12, '0')}`
}
