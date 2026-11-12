import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/dal', () => ({ verificarSessao: vi.fn() }))
vi.mock('@/lib/ocorrencias', () => ({ listarOcorrencias: vi.fn(), contarOcorrencias: vi.fn() }))
vi.mock('@/lib/setores', () => ({ listarSetores: vi.fn() }))
vi.mock('@/lib/lanternas', () => ({ listarTodosLanternas: vi.fn() }))

import { verificarSessao } from '@/lib/dal'
import { listarOcorrencias, contarOcorrencias } from '@/lib/ocorrencias'
import { listarSetores } from '@/lib/setores'
import { listarTodosLanternas } from '@/lib/lanternas'
import PainelPage from '@/app/(painel)/painel/page'

const sessaoGuardiao = { id: '00000000-0000-4000-8000-000000000001', nome: 'Ganthet', email: 'ganthet@oa.tropa', papel: 'guardiao' as const, setorId: null, lanternaId: null, criadoEm: '2026-01-01T00:00:00.000Z' }
const sessaoLanterna = { id: '00000000-0000-4000-8000-000000000002', nome: 'Hal Jordan', email: 'hal@oa.tropa', papel: 'lanterna' as const, setorId: 2814, lanternaId: 'hal-jordan', criadoEm: '2026-01-01T00:00:00.000Z' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(listarSetores).mockResolvedValue([{ id: 2814, nome: 'Setor 2814', descricao: 'Setor espacial 2814, Terra' }])
  vi.mocked(listarTodosLanternas).mockResolvedValue([{ id: 'hal-jordan', codinome: 'Hal Jordan', identidadeCivil: null, especie: 'Humano', planetaNatal: 'Terra', setorId: 2814, status: 'ativo', anoIngresso: null }])
  vi.mocked(contarOcorrencias).mockResolvedValue(0)
  vi.mocked(listarOcorrencias).mockResolvedValue({
    itens: [],
    meta: { total: 0, pagina: 1, limite: 5, paginas: 1 },
  })
})

test('guardião vê visão geral e botão OANET para registrar', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  const { container } = render(await PainelPage())
  expect(screen.getByRole('heading', { level: 1, name: /Bem-vindo, Ganthet/ })).toBeDefined()
  expect(screen.getByText('Visão de todos os setores.')).toBeDefined()
  const linksNova = screen.getAllByRole('link', { name: /Registrar ocorrência/ })
  expect(linksNova[0].getAttribute('href')).toBe('/painel/ocorrencias/nova')
  expect(linksNova[0].classList.contains('oa-button')).toBe(true)
  expect(container.textContent).not.toMatch(/7\.200|3\.600|98,7%/)
})

test('lanterna vê apenas seu setor autorizado e resumo usa contagens do servidor', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoLanterna)
  vi.mocked(contarOcorrencias).mockImplementation(async (filtro) => {
    if (filtro?.status === 'aberta') return 5
    if (filtro?.status === 'em_andamento') return 2
    if (filtro?.status === 'resolvida') return 8
    return 0
  })

  render(await PainelPage())
  expect(screen.getByText('Ocorrências do Setor 2814.')).toBeDefined()
  expect(contarOcorrencias).toHaveBeenCalledWith({ status: 'aberta' })
  expect(contarOcorrencias).toHaveBeenCalledWith({ status: 'em_andamento' })
  expect(contarOcorrencias).toHaveBeenCalledWith({ status: 'resolvida' })
  expect(listarOcorrencias).toHaveBeenCalledWith({ limite: 5 })
})

test('sem ocorrências exibe EstadoVazio útil e molduras OANET', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  const { container } = render(await PainelPage())
  expect(screen.getByRole('status')).toBeDefined()
  expect(screen.getByText('Nenhuma ocorrência registrada')).toBeDefined()
  expect(container.querySelectorAll('.oa-panel').length).toBeGreaterThanOrEqual(1)
})
