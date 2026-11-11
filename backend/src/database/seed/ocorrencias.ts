import { In, type DataSource } from 'typeorm'
import type { UsuarioAutenticado } from '../../auth/usuario-autenticado.js'
import { Comentario } from '../../comentarios/comentario.entity.js'
import { ComentariosRepository } from '../../comentarios/comentarios.repository.js'
import { ComentariosService } from '../../comentarios/comentarios.service.js'
import { Evento } from '../../eventos/evento.entity.js'
import { EventosRepository } from '../../eventos/eventos.repository.js'
import { EventosService } from '../../eventos/eventos.service.js'
import { Lanterna } from '../../lanternas/lanterna.entity.js'
import { LanternasRepository } from '../../lanternas/lanternas.repository.js'
import { LanternasService } from '../../lanternas/lanternas.service.js'
import { CicloVidaService } from '../../ocorrencias/ciclo-vida.service.js'
import { CriarOcorrenciaDto } from '../../ocorrencias/dto/criar-ocorrencia.dto.js'
import { Ocorrencia } from '../../ocorrencias/ocorrencia.entity.js'
import { OcorrenciasRepository } from '../../ocorrencias/ocorrencias.repository.js'
import { OcorrenciasService } from '../../ocorrencias/ocorrencias.service.js'
import { Setor } from '../../setores/setor.entity.js'
import { SetoresRepository } from '../../setores/setores.repository.js'
import { Usuario } from '../../usuarios/usuario.entity.js'
import { UsuariosRepository } from '../../usuarios/usuarios.repository.js'
import { semearComentarios, IDS_COMENTARIOS_SEED_TODOS } from './comentarios.js'
import { IDS_EVENTOS_SEED_TODOS, idEventoCriacaoSeed, idsEventoOcorrenciaSeed } from './eventos.js'
import { IDS_SEED_EVENTOS, IDS_SEED_MINIMO, IDS_SEED_OCORRENCIAS, ID_EVENTO_COMENTARIO_SEED } from './ids.js'

interface DadosOcorrenciaSeed extends CriarOcorrenciaDto {
  responsavelId: string | null
  statusFinal: 'aberta' | 'em_andamento' | 'resolvida'
  criadaHaDias: number
  resolvidaHaDias?: number
  criador: 'guardiao' | 'hal' | 'kilowog'
  resolucao?: string
}

const OCORRENCIAS_SEED: readonly DadosOcorrenciaSeed[] = [
  {
    titulo: 'Ataque de Parallax em Coast City',
    descricao: 'A entidade do medo tomou o centro da cidade e controla parte da população.',
    planeta: 'Terra', setorId: 2814, gravidade: 'critica', envolvidos: 3,
    responsavelId: 'hal-jordan', statusFinal: 'em_andamento', criadaHaDias: 20 / 24, criador: 'guardiao',
  },
  {
    titulo: 'Nave de Sinestro avistada perto de Marte',
    descricao: 'Sensores de Oa captaram assinatura de energia amarela na órbita de Marte.',
    planeta: 'Marte', gravidade: 'alta', envolvidos: 1,
    responsavelId: null, statusFinal: 'aberta', criadaHaDias: 4, criador: 'hal',
  },
  {
    titulo: 'Contrabando de anéis falsificados',
    descricao: 'Quadrilha vendia réplicas de anéis de poder em um mercado clandestino.',
    planeta: 'Terra', gravidade: 'media', envolvidos: 4,
    responsavelId: 'guy-gardner', statusFinal: 'resolvida', criadaHaDias: 10, resolvidaHaDias: 8,
    criador: 'hal', resolucao: 'Anéis apreendidos e levados a Oa para análise dos Guardiões.',
  },
  {
    titulo: 'Tempestade de energia amarela',
    descricao: 'Distúrbio de energia amarela no lado oculto da Lua, sem vítimas até agora.',
    planeta: 'Lua', setorId: 2814, gravidade: 'baixa', envolvidos: 2,
    responsavelId: null, statusFinal: 'aberta', criadaHaDias: 2, criador: 'guardiao',
  },
  {
    titulo: 'Treinamento de recrutas interrompido',
    descricao: 'Um ataque de Manhunters interrompeu o treinamento de doze recrutas.',
    planeta: 'Bolovax Vik', setorId: 674, gravidade: 'media', envolvidos: 12,
    responsavelId: 'kilowog', statusFinal: 'em_andamento', criadaHaDias: 8, criador: 'kilowog',
  },
  {
    titulo: 'Asteroide desviado de rota',
    descricao: 'Asteroide em rota de colisão com uma colônia agrícola do setor.',
    planeta: 'Bolovax Vik', setorId: 674, gravidade: 'alta', envolvidos: 1,
    responsavelId: 'kilowog', statusFinal: 'resolvida', criadaHaDias: 6, resolvidaHaDias: 5,
    criador: 'kilowog', resolucao: 'Asteroide redirecionado para órbita segura com uma construção do anel.',
  },
  {
    titulo: 'Sinal de socorro não identificado',
    descricao: 'Pedido de socorro em frequência desconhecida, repetido a cada hora.',
    planeta: 'Korugar', setorId: 674, gravidade: 'critica', envolvidos: 5,
    responsavelId: 'kilowog', statusFinal: 'resolvida', criadaHaDias: 3, resolvidaHaDias: 2.5,
    criador: 'guardiao', resolucao: 'sdgsbsfbsfdafn',
  },
  {
    titulo: 'Falha na Bateria Central de Oa',
    descricao: 'Oscilação de energia na Bateria Central durante a recarga dos anéis.',
    planeta: 'Oa', setorId: 0, gravidade: 'alta', envolvidos: 1,
    responsavelId: 'salaak', statusFinal: 'aberta', criadaHaDias: 1, criador: 'guardiao',
  },
  {
    titulo: 'dwefjjj', descricao: 'ksjbfljwebfwndfljndlkfbldfn', planeta: 'terra',
    gravidade: 'media', envolvidos: 1, responsavelId: null,
    statusFinal: 'aberta', criadaHaDias: 6, criador: 'hal',
  },
]

export async function semearOcorrencias(banco: DataSource, instanteReferencia: Date): Promise<void> {
  const ocorrencias = new OcorrenciasRepository(banco.getRepository(Ocorrencia))
  const lanternasRepository = new LanternasRepository(banco.getRepository(Lanterna))
  const usuariosRepository = new UsuariosRepository(banco.getRepository(Usuario))
  const setoresRepository = new SetoresRepository(banco.getRepository(Setor))
  const eventos = new EventosService(new EventosRepository(banco.getRepository(Evento)))
  const lanternas = new LanternasService(lanternasRepository, setoresRepository, usuariosRepository, ocorrencias, banco)
  const cicloVida = new CicloVidaService(ocorrencias, lanternasRepository, lanternas, eventos, banco)
  const criacao = new OcorrenciasService(ocorrencias, setoresRepository, eventos, lanternas, banco)
  const comentarios = new ComentariosService(
    new ComentariosRepository(banco.getRepository(Comentario)), ocorrencias, eventos, banco,
  )
  const autores = await carregarAutores(usuariosRepository)

  const existentes = await Promise.all(Object.values(IDS_SEED_OCORRENCIAS).map((id) => ocorrencias.buscarPorId(id)))
  if (existentes.some(Boolean)) {
    if (existentes.some((ocorrencia) => !ocorrencia)) {
      throw new Error('Seed de Ocorrências parcial: existem algumas, mas não todas as identidades fixas')
    }
    await validarHistoricoExistente(banco)
    await banco.transaction(async (manager) => {
      for (const lanterna of await lanternasRepository.listarIds(manager)) {
        await lanternas.recalcularStatus(lanterna.id, manager)
      }
    })
    return
  }

  const idsEvento = [...IDS_EVENTOS_SEED_TODOS, ID_EVENTO_COMENTARIO_SEED]
  const eventosOcupados = await banco.getRepository(Evento).findBy({ id: In(idsEvento) })
  const comentariosOcupados = await banco.getRepository(Comentario)
    .find({ where: { id: In(IDS_COMENTARIOS_SEED_TODOS) }, withDeleted: true })
  if (eventosOcupados.length || comentariosOcupados.length) {
    throw new Error('Seed de Ocorrências inconsistente: IDs fixos de Evento ou Comentário já estão ocupados')
  }

  const datasCriadas = {} as Record<keyof typeof IDS_SEED_OCORRENCIAS, Date>
  const datasResolvidas = {} as Partial<Record<keyof typeof IDS_SEED_OCORRENCIAS, Date>>
  for (const [indice, dado] of OCORRENCIAS_SEED.entries()) {
    const chave = `o${indice + 1}` as keyof typeof IDS_SEED_OCORRENCIAS
    const id = IDS_SEED_OCORRENCIAS[chave]
    const criadaEm = new Date(instanteReferencia.getTime() - dado.criadaHaDias * 24 * 60 * 60 * 1000)
    datasCriadas[chave] = criadaEm
    const autor = autores[dado.criador]
    const entrada: CriarOcorrenciaDto = {
      titulo: dado.titulo,
      descricao: dado.descricao,
      planeta: dado.planeta,
      gravidade: dado.gravidade,
      envolvidos: dado.envolvidos,
      ...(autor.papel === 'guardiao' ? { setorId: dado.setorId } : {}),
    }
    await criacao.criar(entrada, autor, id, idEventoCriacaoSeed(indice + 1), criadaEm)

    let passo = 1
    if (dado.responsavelId !== null) {
      const eventoId = IDS_SEED_EVENTOS.atribuida[chave as keyof typeof IDS_SEED_EVENTOS.atribuida]
      if (!eventoId) throw new Error(`ID de Evento atribuída ausente para ${chave}`)
      await cicloVida.alterarResponsavel(id, { responsavelId: dado.responsavelId }, autores.guardiao, eventoId,
        new Date(criadaEm.getTime() + passo++ * 1000))
    }
    if (dado.statusFinal === 'em_andamento' || dado.statusFinal === 'resolvida') {
      const eventoId = IDS_SEED_EVENTOS.status[chave as keyof typeof IDS_SEED_EVENTOS.status]
      if (!eventoId) throw new Error(`ID de Evento status_alterado ausente para ${chave}`)
      await cicloVida.alterarStatus(id, { status: 'em_andamento' }, autor, eventoId,
        new Date(criadaEm.getTime() + passo++ * 1000))
    }
    if (dado.statusFinal === 'resolvida') {
      if (!dado.resolucao || dado.resolvidaHaDias === undefined) throw new Error(`Dados de resolução ausentes para ${chave}`)
      const resolvidaEm = new Date(instanteReferencia.getTime() - dado.resolvidaHaDias * 24 * 60 * 60 * 1000)
      datasResolvidas[chave] = resolvidaEm
      const eventoId = IDS_SEED_EVENTOS.resolvida[chave as keyof typeof IDS_SEED_EVENTOS.resolvida]
      if (!eventoId) throw new Error(`ID de Evento resolvida ausente para ${chave}`)
      await cicloVida.alterarStatus(id, { status: 'resolvida', resolucao: dado.resolucao }, autor, eventoId, resolvidaEm)
    }
  }

  await semearComentarios(comentarios, autores, datasCriadas, datasResolvidas)
  await banco.transaction(async (manager) => {
    for (const lanterna of await lanternasRepository.listarIds(manager)) {
      await lanternas.recalcularStatus(lanterna.id, manager)
    }
  })
}

async function carregarAutores(repository: UsuariosRepository): Promise<Record<'guardiao' | 'hal' | 'kilowog', UsuarioAutenticado>> {
  const [guardiao, hal, kilowog] = await Promise.all([
    repository.buscarPorId(IDS_SEED_MINIMO.guardiao),
    repository.buscarPorId(IDS_SEED_MINIMO.hal),
    repository.buscarPorId(IDS_SEED_MINIMO.kilowog),
  ])
  if (!guardiao || !hal || !kilowog) throw new Error('Contas fixas do seed não foram criadas antes das Ocorrências')
  return { guardiao: paraAtor(guardiao), hal: paraAtor(hal), kilowog: paraAtor(kilowog) }
}

function paraAtor(usuario: Usuario): UsuarioAutenticado {
  return {
    id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel,
    setorId: usuario.setorId, lanternaId: usuario.lanternaId, criadoEm: usuario.criadoEm,
  }
}

async function validarHistoricoExistente(banco: DataSource): Promise<void> {
  const eventos = await banco.getRepository(Evento).findBy({ id: In([...IDS_EVENTOS_SEED_TODOS, ID_EVENTO_COMENTARIO_SEED]) })
  const comentarios = await banco.getRepository(Comentario)
    .find({ where: { id: In(IDS_COMENTARIOS_SEED_TODOS) }, withDeleted: true })
  if (eventos.length !== IDS_EVENTOS_SEED_TODOS.length + 1 || comentarios.length !== IDS_COMENTARIOS_SEED_TODOS.length) {
    throw new Error('Seed de Ocorrências parcial: faltam Eventos ou Comentários com IDs fixos')
  }
}
