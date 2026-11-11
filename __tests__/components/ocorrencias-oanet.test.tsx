import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/dal', () => ({ verificarSessao: vi.fn() }))
vi.mock('@/lib/ocorrencias', () => ({ listarOcorrencias: vi.fn() }))
vi.mock('@/lib/setores', () => ({ listarSetores: vi.fn() }))
vi.mock('@/lib/lanternas', () => ({ listarLanternas: vi.fn() }))
vi.mock('@/app/(painel)/painel/ocorrencias/_components/FiltroOcorrencias', () => ({
  FiltroOcorrencias: () => <div data-testid="mock-filtro">Filtros</div>,
}))

import { verificarSessao } from '@/lib/dal'
import { listarOcorrencias } from '@/lib/ocorrencias'
import { listarSetores } from '@/lib/setores'
import { listarLanternas } from '@/lib/lanternas'
import OcorrenciasPage from '@/app/(painel)/painel/ocorrencias/page'

const sessaoGuardiao = { id: '00000000-0000-4000-8000-000000000001', nome: 'Ganthet', email: 'ganthet@oa.tropa', papel: 'guardiao' as const, setorId: null, lanternaId: null, criadoEm: '2026-01-01T00:00:00.000Z' }
const sessaoLanterna = { id: '00000000-0000-4000-8000-000000000002', nome: 'Hal Jordan', email: 'hal@oa.tropa', papel: 'lanterna' as const, setorId: 2814, lanternaId: 'hal-jordan', criadoEm: '2026-01-01T00:00:00.000Z' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(listarSetores).mockResolvedValue([{ id: '2814', numero: 2814, nome: 'Setor 2814', descricao: 'Terra' }])
  vi.mocked(listarLanternas).mockResolvedValue([{ id: '1', nome: 'Hal Jordan', especie: 'Humano', planetaNatal: 'Terra', setorId: '2814', status: 'ativo' }])
  vi.mocked(listarOcorrencias).mockResolvedValue([])
})

test('página de ocorrências renderiza na casca OANET com link estilizado e molduras', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  const { container } = render(await OcorrenciasPage({ searchParams: Promise.resolve({}) }))

  expect(screen.getByRole('heading', { level: 1, name: 'Ocorrências' })).toBeDefined()
  expect(screen.getByText('Todas as ocorrências da Tropa.')).toBeDefined()

  const linkNova = screen.getByRole('link', { name: /Registrar ocorrência/ })
  expect(linkNova.getAttribute('href')).toBe('/painel/ocorrencias/nova')
  expect(linkNova.classList.contains('oa-button')).toBe(true)

  expect(container.querySelectorAll('.oa-panel').length).toBe(2)
})

test('lanterna vê descrição do próprio setor', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoLanterna)
  render(await OcorrenciasPage({ searchParams: Promise.resolve({}) }))

  expect(screen.getByText('Ocorrências do Setor 2814.')).toBeDefined()
  expect(listarOcorrencias).toHaveBeenCalledWith(expect.objectContaining({ setorId: '2814' }))
})
