import type { DataSource } from 'typeorm'
import { EventosRepository } from '../../eventos/eventos.repository.js'
import { EventosService } from '../../eventos/eventos.service.js'
import { Evento } from '../../eventos/evento.entity.js'
import { Lanterna } from '../../lanternas/lanterna.entity.js'
import { LanternasRepository } from '../../lanternas/lanternas.repository.js'
import { LanternasService } from '../../lanternas/lanternas.service.js'
import { Ocorrencia, type GravidadeOcorrencia } from '../../ocorrencias/ocorrencia.entity.js'
import { OcorrenciasRepository } from '../../ocorrencias/ocorrencias.repository.js'
import { OcorrenciasService } from '../../ocorrencias/ocorrencias.service.js'
import { Setor } from '../../setores/setor.entity.js'
import { SetoresRepository } from '../../setores/setores.repository.js'
import { Usuario } from '../../usuarios/usuario.entity.js'
import { UsuariosRepository } from '../../usuarios/usuarios.repository.js'
import { IDS_FIXTURE_INTEGRACAO_A } from './ids.js'

const GRAVIDADES: GravidadeOcorrencia[] = ['critica', 'alta', 'media', 'baixa']

function idFixture(indice: number, evento = false): string {
  return `${evento ? 'a0810000' : 'a0800000'}-0000-4000-8000-${indice.toString(16).padStart(12, '0')}`
}

export async function montarEtapaC(banco: DataSource, instanteReferencia: string): Promise<void> {
  const ocorrencias = new OcorrenciasRepository(banco.getRepository(Ocorrencia))
  const eventosRepository = new EventosRepository(banco.getRepository(Evento))
  const setores = new SetoresRepository(banco.getRepository(Setor))
  const usuarios = new UsuariosRepository(banco.getRepository(Usuario))
  const lanternasRepository = new LanternasRepository(banco.getRepository(Lanterna))
  const eventos = new EventosService(eventosRepository)
  const lanternas = new LanternasService(lanternasRepository, setores, usuarios, ocorrencias, banco)
  const servico = new OcorrenciasService(ocorrencias, setores, eventos, lanternas, banco)
  const guardian = await usuarios.buscarPorId(IDS_FIXTURE_INTEGRACAO_A.guardiao)
  if (!guardian) throw new Error('Guardião da etapa a não encontrado')
  const ator = {
    id: guardian.id, nome: guardian.nome, email: guardian.email, papel: guardian.papel,
    setorId: guardian.setorId, lanternaId: guardian.lanternaId, criadoEm: guardian.criadoEm,
  }
  const referencia = new Date(instanteReferencia)

  for (let indice = 1; indice <= 22; indice += 1) {
    const gravidade = indice === 1 ? 'critica' : indice === 2 ? 'alta' : GRAVIDADES[(indice - 1) % GRAVIDADES.length]
    const criadaEm = indice === 1
      ? new Date(referencia.getTime() - 30 * 60 * 60 * 1000)
      : indice === 2
        ? new Date(referencia.getTime() - 60 * 60 * 1000)
        : new Date(referencia.getTime() - indice * 60 * 60 * 1000)
    const id = idFixture(indice)
    await servico.criar({
      titulo: `Ocorrência fixture ${indice.toString().padStart(2, '0')}`,
      descricao: 'Descrição fictícia para os testes de integração.',
      planeta: 'Terra', gravidade, envolvidos: indice, setorId: 2814,
    }, ator, id, idFixture(indice, true))
    await banco.transaction(async (manager) => {
      await manager.getRepository(Ocorrencia).update({ id }, { criadaEm })
      await manager.getRepository(Evento).update({ id: idFixture(indice, true) }, { criadoEm: criadaEm })
    })
  }

  await servico.excluir(idFixture(22), ator)
}
