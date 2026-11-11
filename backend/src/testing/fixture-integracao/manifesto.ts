import { CONTAS_FIXTURE_A, SETORES_FIXTURE_A, IDS_FIXTURE_INTEGRACAO_B } from './ids.js'
import { FICHAS_FIXTURE_B } from './fichas.js'
import type { DataSource } from 'typeorm'
import { Evento } from '../../eventos/evento.entity.js'
import { Comentario } from '../../comentarios/comentario.entity.js'
import { Ocorrencia } from '../../ocorrencias/ocorrencia.entity.js'
import { calcularPrazo, estaVencida } from '../../ocorrencias/prazo.js'

export function criarManifestoEtapaA(instante: string) {
  return {
    versaoContrato: '1.0.0',
    etapa: 'a',
    instanteReferencia: instante,
    contas: CONTAS_FIXTURE_A.map(({ caso, id, email, papel, setorId }) => ({
      caso, id, email, papel, setorId, lanternaId: null,
    })),
    setores: SETORES_FIXTURE_A.map(({ id, nome }) => ({ id, nome })),
    fichas: [],
    vinculos: [],
    ocorrencias: [],
    eventos: [],
    comentarios: [],
    contagens: { setor: SETORES_FIXTURE_A.length, usuario: CONTAS_FIXTURE_A.length, lanterna: 0, ocorrencia: 0, evento: 0, comentario: 0 },
  }
}

export function criarManifestoEtapaB(instante: string) {
  return {
    versaoContrato: '1.0.0',
    etapa: 'b',
    instanteReferencia: instante,
    contas: CONTAS_FIXTURE_A.map(({ caso, id, email, papel, setorId }) => ({
      caso, id, email, papel, setorId,
      lanternaId: caso === 'L2814' ? IDS_FIXTURE_INTEGRACAO_B.hal2814
        : caso === 'L674' ? IDS_FIXTURE_INTEGRACAO_B.kilowog674 : null,
    })),
    setores: SETORES_FIXTURE_A.map(({ id, nome }) => ({ id, nome })),
    fichas: FICHAS_FIXTURE_B.map(({ id, codinome, setorId }) => ({ id, codinome, setorId })),
    vinculos: [
      { usuarioId: CONTAS_FIXTURE_A.find(({ caso }) => caso === 'L2814')!.id, lanternaId: IDS_FIXTURE_INTEGRACAO_B.hal2814 },
      { usuarioId: CONTAS_FIXTURE_A.find(({ caso }) => caso === 'L674')!.id, lanternaId: IDS_FIXTURE_INTEGRACAO_B.kilowog674 },
    ],
    ocorrencias: [], eventos: [], comentarios: [],
    contagens: { setor: SETORES_FIXTURE_A.length, usuario: CONTAS_FIXTURE_A.length, lanterna: FICHAS_FIXTURE_B.length, ocorrencia: 0, evento: 0, comentario: 0 },
  }
}

export async function criarManifestoEtapaC(banco: DataSource, instante: string) {
  const [ocorrencias, eventos] = await Promise.all([
    banco.getRepository(Ocorrencia).find({ withDeleted: true, order: { id: 'ASC' } }),
    banco.getRepository(Evento).find({ order: { id: 'ASC' } }),
  ])
  const referencia = new Date(instante)
  return {
    ...criarManifestoEtapaB(instante),
    etapa: 'c',
    ocorrencias: ocorrencias.map((ocorrencia) => ({
      id: ocorrencia.id,
      titulo: ocorrencia.titulo,
      descricao: ocorrencia.descricao,
      planeta: ocorrencia.planeta,
      setorId: ocorrencia.setorId,
      gravidade: ocorrencia.gravidade,
      status: ocorrencia.status,
      envolvidos: ocorrencia.envolvidos,
      responsavelId: ocorrencia.responsavelId,
      resolucao: ocorrencia.resolucao,
      criadaPorId: ocorrencia.criadaPorId,
      criadaEm: ocorrencia.criadaEm.toISOString(),
      resolvidaEm: ocorrencia.resolvidaEm?.toISOString() ?? null,
      prazoEm: calcularPrazo(ocorrencia.criadaEm, ocorrencia.gravidade).toISOString(),
      vencida: estaVencida(ocorrencia.status, calcularPrazo(ocorrencia.criadaEm, ocorrencia.gravidade), referencia),
      excluidaEm: ocorrencia.excluidaEm?.toISOString() ?? null,
    })),
    eventos: eventos.map((evento) => ({
      id: evento.id,
      ocorrenciaId: evento.ocorrenciaId,
      tipo: evento.tipo,
      autorId: evento.autorId,
      dados: evento.dados,
      criadoEm: evento.criadoEm.toISOString(),
    })),
    contagens: {
      setor: SETORES_FIXTURE_A.length,
      usuario: CONTAS_FIXTURE_A.length,
      lanterna: FICHAS_FIXTURE_B.length,
      ocorrencia: ocorrencias.length,
      evento: eventos.length,
      comentario: 0,
    },
  }
}

export async function criarManifestoEtapaD(banco: DataSource, instante: string) {
  return { ...(await criarManifestoEtapaC(banco, instante)), etapa: 'd' as const }
}

export async function criarManifestoEtapaE(banco: DataSource, instante: string) {
  const [base, comentarios] = await Promise.all([
    criarManifestoEtapaD(banco, instante),
    banco.getRepository(Comentario).find({ withDeleted: true, order: { criadoEm: 'ASC', id: 'ASC' } }),
  ])
  return {
    ...base,
    etapa: 'e' as const,
    comentarios: comentarios.map((comentario) => ({
      id: comentario.id,
      ocorrenciaId: comentario.ocorrenciaId,
      autorId: comentario.autorId,
      texto: comentario.texto,
      criadoEm: comentario.criadoEm.toISOString(),
      excluidoEm: comentario.excluidoEm?.toISOString() ?? null,
    })),
    contagens: { ...base.contagens, comentario: comentarios.length },
  }
}
