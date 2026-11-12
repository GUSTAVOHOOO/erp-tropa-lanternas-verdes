// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const fakeEnv = vi.hoisted(() => ({ apiUrl: 'http://127.0.0.1:39842' }))
vi.mock('@/lib/env', () => ({ get env() { return { API_URL: fakeEnv.apiUrl } } }))
vi.mock('@/lib/dal', () => ({ lerTokenObrigatorio: vi.fn(async () => 'fake-token') }))

import { ApiError } from '@/lib/api-error'
import { consultarDashboard } from '@/lib/dashboard'
import { filtroDashboardSchema } from '@/lib/schemas/dashboard'

describe('serviço de dashboard contra o contrato', () => {
  let servidor: { url: string; setScenario: (id: string) => void; close: () => Promise<void> }

  beforeAll(async () => {
    const { createContractServer } = await import('../../scripts/contrato/servidor.mjs')
    servidor = await createContractServer({ port: 39800 + (process.pid % 80) })
    fakeEnv.apiUrl = servidor.url
  })

  afterAll(async () => {
    await servidor?.close()
  })

  it('200 valida métricas agregadas, série e ranking', async () => {
    servidor.setScenario('consultarDashboard.200')
    const dashboard = await consultarDashboard({ setor: 674, dias: 7 })
    expect(dashboard.porStatus).toEqual({ aberta: 4, em_andamento: 1, resolvida: 1 })
    expect(dashboard.porGravidade).toEqual({ baixa: 1, media: 1, alta: 2, critica: 2 })
    expect(dashboard.vencidas).toBe(1)
    expect(dashboard.tempoMedioResolucaoHoras).toBe(48)
    expect(dashboard.serie).toHaveLength(7)
    expect(dashboard.serie[0].dia).toBe('2026-11-03')
    expect(dashboard.ranking).toEqual([
      { lanternaId: 'hal-jordan', codinome: 'Hal Jordan', resolvidas: 1 },
    ])
  })

  it('guardiao-setor envia setor', async () => {
    servidor.setScenario('consultarDashboard.200.guardiao-setor')
    const dashboard = await consultarDashboard({ setor: 674, dias: 7 })
    expect(dashboard.porStatus.aberta).toBe(1)
    expect(dashboard.vencidas).toBe(0)
    expect(dashboard.tempoMedioResolucaoHoras).toBe(24)
    expect(dashboard.ranking).toEqual([
      { lanternaId: 'kilowog', codinome: 'Kilowog', resolvidas: 1 },
    ])
  })

  it('guardiao-todos traz ranking ordenado de todos os setores', async () => {
    servidor.setScenario('consultarDashboard.200.guardiao-todos')
    const dashboard = await consultarDashboard({ dias: 7 })
    expect(dashboard.porStatus.aberta).toBe(5)
    expect(dashboard.ranking).toHaveLength(2)
  })

  it('sem-resolvidas devolve tempo médio null e ranking vazio', async () => {
    servidor.setScenario('consultarDashboard.200.sem-resolvidas')
    const dashboard = await consultarDashboard({ setor: 3601, dias: 7 })
    expect(dashboard.tempoMedioResolucaoHoras).toBeNull()
    expect(dashboard.ranking).toEqual([])
    expect(dashboard.vencidas).toBe(0)
  })

  it('500 propaga ApiError com status 500 e código ERRO_INTERNO', async () => {
    servidor.setScenario('consultarDashboard.500.ERRO_INTERNO')
    await expect(consultarDashboard({ setor: 674, dias: 7 })).rejects.toBeInstanceOf(ApiError)
    await expect(consultarDashboard({ setor: 674, dias: 7 })).rejects.toMatchObject({
      status: 500,
      codigo: 'ERRO_INTERNO',
    })
  })

  it('dias fora do limite não chega à API porque filtroDashboardSchema já o descarta — teste o schema', () => {
    expect(filtroDashboardSchema.parse({ dias: 3 })).toEqual({ dias: undefined, setor: undefined })
    expect(filtroDashboardSchema.parse({ dias: 91 })).toEqual({ dias: undefined, setor: undefined })
    expect(filtroDashboardSchema.parse({ dias: 'abc' })).toEqual({ dias: undefined, setor: undefined })
    expect(filtroDashboardSchema.parse({ dias: 7 })).toEqual({ dias: 7, setor: undefined })
    expect(filtroDashboardSchema.parse({ dias: 90 })).toEqual({ dias: 90, setor: undefined })
    expect(filtroDashboardSchema.parse({ setor: 0 })).toEqual({ dias: undefined, setor: 0 })
    expect(filtroDashboardSchema.parse({ setor: 9999 })).toEqual({ dias: undefined, setor: 9999 })
    expect(filtroDashboardSchema.parse({ setor: -1 })).toEqual({ dias: undefined, setor: undefined })
    expect(filtroDashboardSchema.parse({ setor: 10000 })).toEqual({ dias: undefined, setor: undefined })
  })

  it('rejeição 400 do servidor se dias fora do contrato for enviado diretamente', async () => {
    servidor.setScenario('consultarDashboard.400.DADOS_INVALIDOS.dias-3')
    await expect(consultarDashboard({ dias: 3 } as never)).rejects.toMatchObject({
      status: 400,
      codigo: 'DADOS_INVALIDOS',
    })
  })
})
