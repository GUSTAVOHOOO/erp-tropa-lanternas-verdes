import type { UsuarioAutenticado } from '../../auth/usuario-autenticado.js'
import type { ComentariosService } from '../../comentarios/comentarios.service.js'
import { IDS_SEED_COMENTARIOS, ID_EVENTO_COMENTARIO_SEED, IDS_SEED_OCORRENCIAS } from './ids.js'

type AutorSeed = 'guardiao' | 'hal' | 'kilowog'
type OcorrenciaSeed = keyof typeof IDS_SEED_OCORRENCIAS
type ComentarioSeed = {
  ocorrencia: OcorrenciaSeed
  autor: AutorSeed
  texto: string
  momento: 'criada' | 'resolvida'
  apagado?: boolean
}

export const COMENTARIOS_SEED: readonly ComentarioSeed[] = [
  { ocorrencia: 'o1', autor: 'hal', texto: 'A equipe local confirmou a contenção inicial em Coast City.', momento: 'criada' },
  { ocorrencia: 'o1', autor: 'guardiao', texto: 'O Conselho recebeu a atualização e mantém suporte disponível.', momento: 'criada' },
  { ocorrencia: 'o5', autor: 'kilowog', texto: 'Os recrutas foram retirados da área de treinamento.', momento: 'criada' },
  { ocorrencia: 'o5', autor: 'guardiao', texto: 'A unidade de reserva já está a caminho de Bolovax Vik.', momento: 'criada' },
  { ocorrencia: 'o3', autor: 'hal', texto: 'Os anéis falsificados foram encaminhados para análise.', momento: 'resolvida' },
  { ocorrencia: 'o3', autor: 'guardiao', texto: 'Registro interno de acompanhamento encerrado.', momento: 'resolvida', apagado: true },
] as const

export async function semearComentarios(
  service: ComentariosService,
  autores: Record<AutorSeed, UsuarioAutenticado>,
  datasCriadas: Record<OcorrenciaSeed, Date>,
  datasResolvidas: Partial<Record<OcorrenciaSeed, Date>>,
): Promise<void> {
  for (const [indice, comentario] of COMENTARIOS_SEED.entries()) {
    const base = comentario.momento === 'criada'
      ? datasCriadas[comentario.ocorrencia]
      : datasResolvidas[comentario.ocorrencia]
    if (!base) throw new Error(`Data de comentário seed ausente para ${comentario.ocorrencia}`)
    const criadoEm = new Date(base.getTime() + indice + 1)
    await service.criar(
      IDS_SEED_OCORRENCIAS[comentario.ocorrencia],
      { texto: comentario.texto },
      autores[comentario.autor],
      IDS_SEED_COMENTARIOS[indice],
      criadoEm,
    )
    if (comentario.apagado) {
      const quandoApagado = new Date(criadoEm.getTime() + 1)
      await service.excluir(
        IDS_SEED_COMENTARIOS[indice],
        autores.guardiao,
        ID_EVENTO_COMENTARIO_SEED,
        quandoApagado,
      )
    }
  }
}

export const IDS_COMENTARIOS_SEED_TODOS = IDS_SEED_COMENTARIOS
