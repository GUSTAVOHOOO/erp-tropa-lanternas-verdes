import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/app/(painel)/painel/ocorrencias/actions', () => ({ atribuirResponsavel: vi.fn() }))
vi.mock('@/lib/dal', () => ({ exigirPapel: vi.fn() }))
vi.mock('@/lib/ocorrencias', () => ({ buscarOcorrencia: vi.fn() }))
vi.mock('@/lib/lanternas', () => ({ listarLanternas: vi.fn() }))

import { FormAtribuir } from '@/app/(painel)/painel/ocorrencias/_components/FormAtribuir'
import AtribuirPage from '@/app/(painel)/painel/ocorrencias/[id]/atribuir/page'
import type { Lanterna } from '@/lib/schemas/lanterna'

const lanternasMock: Lanterna[] = [
  { id: '1', nome: 'Hal Jordan', especie: 'Humano', planetaNatal: 'Terra', setorId: '2814', status: 'ativo' },
  { id: '2', nome: 'John Stewart', especie: 'Humano', planetaNatal: 'Terra', setorId: '2814', status: 'ativo' },
]

beforeEach(() => {
  vi.clearAllMocks()
})

test('FormAtribuir renderiza select e botão OANET', () => {
  render(<FormAtribuir ocorrenciaId="o1" lanternas={lanternasMock} responsavelAtual={null} />)

  expect(screen.getByText('Lanterna responsável')).toBeDefined()
  const botao = screen.getByRole('button', { name: 'Atribuir responsável' })
  expect(botao.classList.contains('oa-button')).toBe(true)
})

test('AtribuirPage renderiza casca OANET com link de volta e moldura', async () => {
  const { buscarOcorrencia } = await import('@/lib/ocorrencias')
  const { listarLanternas } = await import('@/lib/lanternas')
  vi.mocked(buscarOcorrencia).mockResolvedValue({
    id: 'o1',
    titulo: 'Incursão Sinestro',
    descricao: 'Tropa Amarela avistada.',
    planeta: 'Korugar',
    setorId: '2814',
    gravidade: 'critica',
    status: 'aberta',
    envolvidos: 5,
    responsavelId: null,
    criadaPor: 'g1',
    criadaEm: '2026-11-10T12:00:00.000Z',
    resolucao: null,
  })
  vi.mocked(listarLanternas).mockResolvedValue(lanternasMock)

  const { container } = render(await AtribuirPage({ params: Promise.resolve({ id: 'o1' }) }))

  expect(screen.getByRole('heading', { level: 1, name: 'Atribuir responsável' })).toBeDefined()
  expect(screen.getByText('Incursão Sinestro')).toBeDefined()
  expect(screen.getByRole('link', { name: /Voltar à ocorrência/ }).getAttribute('href')).toBe('/painel/ocorrencias/o1')
  expect(container.querySelector('.oa-panel')).not.toBeNull()
})
