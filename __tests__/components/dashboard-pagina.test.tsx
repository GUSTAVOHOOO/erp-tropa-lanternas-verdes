import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/dal', () => ({ verificarSessao: vi.fn() }))
vi.mock('@/lib/dashboard', () => ({ consultarDashboard: vi.fn() }))
vi.mock('@/lib/ocorrencias', () => ({ listarOcorrencias: vi.fn() }))
vi.mock('@/lib/setores', () => ({ listarSetores: vi.fn() }))
vi.mock('@/lib/lanternas', () => ({ listarTodosLanternas: vi.fn() }))

vi.mock('next/navigation', () => ({
  usePathname: () => '/painel',
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
}))

import { verificarSessao } from '@/lib/dal'
import { consultarDashboard } from '@/lib/dashboard'
import { listarOcorrencias } from '@/lib/ocorrencias'
import { listarSetores } from '@/lib/setores'
import { listarTodosLanternas } from '@/lib/lanternas'
import PainelPage from '@/app/(painel)/painel/page'

const sessaoGuardiao = {
  id: '00000000-0000-4000-8000-000000000001',
  nome: 'Ganthet',
  email: 'ganthet@oa.tropa',
  papel: 'guardiao' as const,
  setorId: null,
  lanternaId: null,
  criadoEm: '2026-01-01T00:00:00.000Z',
}

const sessaoLanterna = {
  id: '00000000-0000-4000-8000-000000000002',
  nome: 'Hal Jordan',
  email: 'hal@oa.tropa',
  papel: 'lanterna' as const,
  setorId: 2814,
  lanternaId: 'hal-jordan',
  criadoEm: '2026-01-01T00:00:00.000Z',
}

const dashboardExemplo = {
  porStatus: { aberta: 4, em_andamento: 1, resolvida: 2 },
  porGravidade: { baixa: 1, media: 2, alta: 3, critica: 1 },
  vencidas: 1,
  tempoMedioResolucaoHoras: 36.5,
  serie: [
    { dia: '2026-11-03', abertas: 0, resolvidas: 0 },
    { dia: '2026-11-04', abertas: 0, resolvidas: 1 },
    { dia: '2026-11-05', abertas: 2, resolvidas: 0 },
  ],
  ranking: [
    { lanternaId: 'hal-jordan', codinome: 'Hal Jordan', resolvidas: 2 },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(consultarDashboard).mockResolvedValue(dashboardExemplo)
  vi.mocked(listarSetores).mockResolvedValue([{ id: 2814, nome: 'Setor 2814', descricao: 'Setor espacial 2814, Terra' }])
  vi.mocked(listarTodosLanternas).mockResolvedValue([{ id: 'hal-jordan', codinome: 'Hal Jordan', identidadeCivil: null, especie: 'Humano', planetaNatal: 'Terra', setorId: 2814, status: 'ativo', anoIngresso: null }])
  vi.mocked(listarOcorrencias).mockResolvedValue({
    itens: [],
    meta: { total: 0, pagina: 1, limite: 5, paginas: 1 },
  })
})

test('guardião vê visão geral, botão OANET para registrar e consulta dashboard sem setor', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  const { container } = render(await PainelPage())

  expect(screen.getByRole('heading', { level: 1, name: /Bem-vindo, Ganthet/ })).toBeDefined()
  expect(screen.getByText('Visão de todos os setores.')).toBeDefined()
  const linksNova = screen.getAllByRole('link', { name: /Registrar ocorrência/ })
  expect(linksNova[0].getAttribute('href')).toBe('/painel/ocorrencias/nova')
  expect(linksNova[0].classList.contains('oa-button')).toBe(true)
  expect(container.textContent).not.toMatch(/7\.200|3\.600|98,7%/)

  expect(consultarDashboard).toHaveBeenCalledWith({})
  expect(listarSetores).toHaveBeenCalled()
  expect(listarOcorrencias).toHaveBeenCalledWith({ limite: 5 })
})

test('guardião com ?setor=0 envia 0 e exibe descrição Setor 0.', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  render(await PainelPage({ searchParams: Promise.resolve({ setor: '0' }) }))

  expect(screen.getByText('Setor 0.')).toBeDefined()
  expect(consultarDashboard).toHaveBeenCalledWith({ setor: 0 })
})

test('lanterna com ?setor=674 não envia setor e exibe descrição do seu setor', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoLanterna)
  render(await PainelPage({ searchParams: Promise.resolve({ setor: '674' }) }))

  expect(screen.getByText('Ocorrências do Setor 2814.')).toBeDefined()
  // AUTH-07: Lanterna nunca envia setor mesmo forjado na URL
  expect(consultarDashboard).toHaveBeenCalledWith({})
  // Os nomes de setor servem à tabela; o seletor de setor do dashboard é só do Guardião
  expect(screen.queryByRole('combobox', { name: 'Setor' })).toBeNull()
  expect(listarOcorrencias).toHaveBeenCalledWith({ limite: 5 })
})

test('?dias=abc usa o padrão e não envia dias inválido para a consulta', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  render(await PainelPage({ searchParams: Promise.resolve({ dias: 'abc' }) }))

  expect(consultarDashboard).toHaveBeenCalledWith({})
})

test('mais recentes busca com limite 5 e renderiza itens da tabela', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  vi.mocked(listarOcorrencias).mockResolvedValue({
    itens: [
      {
        id: '00000000-0000-4000-8000-000000000001',
        titulo: 'Invasão em Coast City',
        descricao: 'Ataque alienígena em andamento.',
        planeta: 'Terra',
        setorId: 2814,
        gravidade: 'alta',
        status: 'aberta',
        envolvidos: 2,
        responsavelId: 'hal-jordan',
        resolucao: null,
        criadaPorId: '00000000-0000-4000-8000-000000000099',
        criadaEm: '2026-11-01T12:00:00.000Z',
        resolvidaEm: null,
        prazoEm: '2026-11-03T12:00:00.000Z',
        vencida: false,
      },
    ],
    meta: { total: 1, pagina: 1, limite: 5, paginas: 1 },
  })

  render(await PainelPage())
  expect(listarOcorrencias).toHaveBeenCalledWith({ limite: 5 })
  expect(screen.getByText('Invasão em Coast City')).toBeDefined()
})

test('erro do dashboard sobe para o boundary de erro', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  vi.mocked(consultarDashboard).mockRejectedValue(new Error('Falha na API de dashboard'))

  await expect(PainelPage()).rejects.toThrow('Falha na API de dashboard')
})

test('sem ocorrências exibe EstadoVazio útil e molduras OANET', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  const { container } = render(await PainelPage())
  expect(screen.getByRole('status')).toBeDefined()
  expect(screen.getByText('Nenhuma ocorrência registrada')).toBeDefined()
  expect(container.querySelectorAll('.oa-panel').length).toBeGreaterThanOrEqual(1)
})
