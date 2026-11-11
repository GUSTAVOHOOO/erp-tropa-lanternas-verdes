import type { DataSource } from 'typeorm'
import { EventosRepository } from '../../eventos/eventos.repository.js'
import { EventosService } from '../../eventos/eventos.service.js'
import { Evento } from '../../eventos/evento.entity.js'
import { Lanterna } from '../../lanternas/lanterna.entity.js'
import { LanternasRepository } from '../../lanternas/lanternas.repository.js'
import { LanternasService } from '../../lanternas/lanternas.service.js'
import { CicloVidaService } from '../../ocorrencias/ciclo-vida.service.js'
import { Ocorrencia } from '../../ocorrencias/ocorrencia.entity.js'
import { OcorrenciasRepository } from '../../ocorrencias/ocorrencias.repository.js'
import { Setor } from '../../setores/setor.entity.js'
import { SetoresRepository } from '../../setores/setores.repository.js'
import { Usuario } from '../../usuarios/usuario.entity.js'
import { UsuariosRepository } from '../../usuarios/usuarios.repository.js'
import { IDS_FIXTURE_INTEGRACAO_A } from './ids.js'

function idOcorrencia(indice: number): string {
  return `a0800000-0000-4000-8000-${indice.toString(16).padStart(12, '0')}`
}

function idEvento(indice: number, acao: number): string {
  return `a0820000-0000-4000-8000-${(indice * 10 + acao).toString(16).padStart(12, '0')}`
}

export async function montarEtapaD(banco: DataSource, instanteReferencia: string): Promise<void> {
  const ocorrencias = new OcorrenciasRepository(banco.getRepository(Ocorrencia))
  const lanternasRepository = new LanternasRepository(banco.getRepository(Lanterna))
  const usuarios = new UsuariosRepository(banco.getRepository(Usuario))
  const setores = new SetoresRepository(banco.getRepository(Setor))
  const eventos = new EventosService(new EventosRepository(banco.getRepository(Evento)))
  const lanternasService = new LanternasService(lanternasRepository, setores, usuarios, ocorrencias, banco)
  const ciclo = new CicloVidaService(ocorrencias, lanternasRepository, lanternasService, eventos, banco)
  const guardian = await usuarios.buscarPorId(IDS_FIXTURE_INTEGRACAO_A.guardiao)
  if (!guardian) throw new Error('Guardião da fixture não encontrado')
  const ator = {
    id: guardian.id, nome: guardian.nome, email: guardian.email, papel: guardian.papel,
    setorId: guardian.setorId, lanternaId: guardian.lanternaId, criadoEm: guardian.criadoEm,
  }
  const referencia = new Date(instanteReferencia)

  for (const [indice, lanternaId, resolver] of [
    [1, 'fixture-hal-2814', false],
    [2, 'fixture-hal-2814', false],
    [3, 'fixture-hal-2814', true],
    [4, 'fixture-kilowog-674', true],
  ] as const) {
    const id = idOcorrencia(indice)
    if (indice === 4) await banco.getRepository(Ocorrencia).update({ id }, { setorId: 674 })
    await ciclo.alterarResponsavel(id, { responsavelId: lanternaId }, ator, idEvento(indice, 1), referencia)
    await ciclo.alterarStatus(id, { status: 'em_andamento' }, ator, idEvento(indice, 2), referencia)
    if (resolver) {
      await ciclo.alterarStatus(id, {
        status: 'resolvida', resolucao: `Ocorrência ${indice} resolvida pela fixture de ciclo de vida.`,
      }, ator, idEvento(indice, 3), referencia)
    }
  }
}
