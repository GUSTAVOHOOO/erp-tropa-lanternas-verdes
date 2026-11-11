import { jest } from '@jest/globals'
import type { UsuarioAutenticado } from '../auth/usuario-autenticado.js'
import { DashboardService } from './dashboard.service.js'
import type { AgregadosDashboard, DashboardRepository } from './dashboard.repository.js'
import { FiltroDashboardDto } from './dto/filtro-dashboard.dto.js'

const agregadosVazios = {
  porStatus: [], porGravidade: [], vencidas: 0, tempoMedioResolucaoHoras: null,
  abertasPorDia: [], resolvidasPorDia: [], ranking: [],
}

const guardiao: UsuarioAutenticado = {
  id: 'g', nome: 'G', email: 'g@example.test', papel: 'guardiao', lanternaId: null, setorId: null,
  criadoEm: new Date('2026-01-01T00:00:00.000Z'),
}

const lanterna: UsuarioAutenticado = {
  id: 'l', nome: 'L', email: 'l@example.test', papel: 'lanterna', lanternaId: 'hal-jordan', setorId: 2814,
  criadoEm: new Date('2026-01-01T00:00:00.000Z'),
}

describe('DashboardService', () => {
  it('completa contagens e dias vazios e ancora a série em dias UTC', async () => {
    const agregar = jest.fn<(...argumentos: [number | null | undefined, Date, number]) => Promise<AgregadosDashboard>>().mockResolvedValue({
      ...agregadosVazios,
      porStatus: [{ chave: 'aberta', total: 2 }],
      porGravidade: [{ chave: 'critica', total: 1 }],
      abertasPorDia: [{ dia: '2026-11-09', total: 2 }],
    })
    const dashboard = { agregar }
    const servico = new DashboardService(dashboard as unknown as DashboardRepository)
    const agora = new Date('2026-11-10T01:00:00.000Z')
    const resposta = await servico.consultar(Object.assign(new FiltroDashboardDto(), { dias: 7 }), guardiao, agora)

    expect(agregar).toHaveBeenCalledWith(undefined, agora, 7)
    expect(resposta.porStatus).toEqual({ aberta: 2, em_andamento: 0, resolvida: 0 })
    expect(resposta.porGravidade).toEqual({ baixa: 0, media: 0, alta: 0, critica: 1 })
    expect(resposta.serie).toHaveLength(7)
    expect(resposta.serie.map(({ dia }) => dia)).toEqual([
      '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10',
    ])
    expect(resposta.serie[5]).toEqual({ dia: '2026-11-09', abertas: 2, resolvidas: 0 })
    expect(resposta.serie[6]).toEqual({ dia: '2026-11-10', abertas: 0, resolvidas: 0 })
  })

  it('força o setor da conta de Lanterna e representa conta sem Setor como escopo vazio', async () => {
    const agregar = jest.fn<(...argumentos: [number | null | undefined, Date, number]) => Promise<AgregadosDashboard>>()
      .mockResolvedValue(agregadosVazios)
    const dashboard = { agregar }
    const servico = new DashboardService(dashboard as unknown as DashboardRepository)
    const filtro = Object.assign(new FiltroDashboardDto(), { setor: 674, dias: 30 })

    await servico.consultar(filtro, lanterna, new Date('2026-11-10T00:00:00.000Z'))
    expect(agregar).toHaveBeenCalledWith(2814, expect.any(Date), 30)

    await servico.consultar(filtro, { ...lanterna, setorId: null }, new Date('2026-11-10T00:00:00.000Z'))
    expect(agregar).toHaveBeenLastCalledWith(null, expect.any(Date), 30)
  })
})
