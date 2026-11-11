import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/dal', () => ({ verificarSessao: vi.fn() }))
vi.mock('@/lib/ocorrencias', () => ({ buscarOcorrencia: vi.fn() }))
vi.mock('@/lib/setores', () => ({ listarSetores: vi.fn() }))
vi.mock('@/lib/lanternas', () => ({ listarLanternas: vi.fn() }))
vi.mock('@/app/(painel)/painel/ocorrencias/_components/FormStatus', () => ({
  FormStatus: () => <div data-testid="mock-form-status">FormStatus</div>,
}))

import { verificarSessao } from '@/lib/dal'
import { buscarOcorrencia } from '@/lib/ocorrencias'
import { listarSetores } from '@/lib/setores'
import { listarLanternas } from '@/lib/lanternas'
import OcorrenciaPage from '@/app/(painel)/painel/ocorrencias/[id]/page'

const sessaoGuardiao = { id: '00000000-0000-4000-8000-000000000001', nome: 'Ganthet', email: 'ganthet@oa.tropa', papel: 'guardiao' as const, setorId: null, lanternaId: null, criadoEm: '2026-01-01T00:00:00.000Z' }
const sessaoLanterna = { id: '00000000-0000-4000-8000-000000000002', nome: 'Hal Jordan', email: 'hal@oa.tropa', papel: 'lanterna' as const, setorId: 2814, lanternaId: 'hal-jordan', criadoEm: '2026-01-01T00:00:00.000Z' }

const ocorrenciaMock = {
  id: 'o1',
  titulo: 'Anomalia no Setor 2814',
  descricao: 'Distorção gravitacional perto de Marte.',
  planeta: 'Marte',
  setorId: '2814',
  gravidade: 'alta' as const,
  status: 'aberta' as const,
  envolvidos: 42,
  responsavelId: null,
  criadaPor: 'g1',
  criadaEm: '2026-11-10T12:00:00.000Z',
  resolucao: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(buscarOcorrencia).mockResolvedValue(ocorrenciaMock)
  vi.mocked(listarSetores).mockResolvedValue([{ id: '2814', numero: 2814, nome: 'Setor 2814', descricao: 'Terra' }])
  vi.mocked(listarLanternas).mockResolvedValue([])
})

test('página de detalhe renderiza dados em molduras OANET com botão de atribuir para guardião', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  const { container } = render(await OcorrenciaPage({ params: Promise.resolve({ id: 'o1' }) }))

  expect(screen.getByRole('heading', { level: 1, name: 'Anomalia no Setor 2814' })).toBeDefined()
  expect(screen.getByText('Distorção gravitacional perto de Marte.')).toBeDefined()
  expect(screen.getByRole('link', { name: /Voltar à lista/ }).getAttribute('href')).toBe('/painel/ocorrencias')

  const linkAtribuir = screen.getByRole('link', { name: /Atribuir responsável/ })
  expect(linkAtribuir.getAttribute('href')).toBe('/painel/ocorrencias/o1/atribuir')
  expect(linkAtribuir.classList.contains('oa-button')).toBe(true)

  expect(container.querySelectorAll('.oa-panel').length).toBe(2)
})

test('lanterna não vê link de atribuir responsável', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoLanterna)
  render(await OcorrenciaPage({ params: Promise.resolve({ id: 'o1' }) }))

  expect(screen.queryByRole('link', { name: /Atribuir responsável/ })).toBeNull()
})
