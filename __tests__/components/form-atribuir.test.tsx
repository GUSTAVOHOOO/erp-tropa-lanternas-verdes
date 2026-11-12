import { beforeEach, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('@/app/(painel)/painel/ocorrencias/actions', () => ({ atribuirResponsavel: vi.fn() }))
vi.mock('@/lib/dal', () => ({ exigirPapel: vi.fn() }))
vi.mock('@/lib/ocorrencias', () => ({ buscarOcorrencia: vi.fn() }))
vi.mock('@/lib/lanternas', () => ({ listarTodosLanternas: vi.fn() }))

vi.mock('@/components/CampoSelect', () => ({
  CampoSelect: ({ id, rotulo, itens, valor, aoMudar, erro }: {
    id: string
    rotulo: string
    itens: Record<string, string>
    valor: string | null | undefined
    aoMudar: (v: string | null) => void
    erro?: string
  }) => (
    <div data-testid={`campo-select-${id}`}>
      <label htmlFor={id}>{rotulo}</label>
      <select id={id} data-testid={id} value={valor ?? ''} onChange={(e) => aoMudar(e.target.value)}>
        {Object.entries(itens).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      {erro && <span role="alert">{erro}</span>}
    </div>
  ),
}))

import { atribuirResponsavel } from '@/app/(painel)/painel/ocorrencias/actions'
import { FormAtribuir } from '@/app/(painel)/painel/ocorrencias/_components/FormAtribuir'
import AtribuirPage from '@/app/(painel)/painel/ocorrencias/[id]/atribuir/page'
import { exigirPapel } from '@/lib/dal'
import type { LanternaLista } from '@/lib/schemas/lanterna'
import type { Sessao } from '@/lib/schemas/usuario'

const sessaoGuardiao: Sessao = {
  id: '00000000-0000-4000-8000-000000000001',
  nome: 'Ganthet',
  email: 'ganthet@oa.tropa',
  papel: 'guardiao',
  setorId: null,
  lanternaId: null,
  criadoEm: '2026-01-01T00:00:00.000Z',
}

const lanternasMock: LanternaLista[] = [
  { id: 'hal-jordan', codinome: 'Hal Jordan', identidadeCivil: null, especie: 'Humano', planetaNatal: 'Terra', setorId: 2814, status: 'ativo', anoIngresso: null },
  { id: 'john-stewart', codinome: 'John Stewart', identidadeCivil: null, especie: 'Humano', planetaNatal: 'Terra', setorId: 2814, status: 'ativo', anoIngresso: null },
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(exigirPapel).mockResolvedValue(sessaoGuardiao)
})

test('FormAtribuir renderiza select e botão OANET', () => {
  render(<FormAtribuir ocorrenciaId="00000000-0000-4000-8000-000000000001" lanternas={lanternasMock} responsavelAtual={null} podeLiberar={false} />)

  expect(screen.getByText('Lanterna responsável')).toBeDefined()
  const botao = screen.getByRole('button', { name: 'Atribuir responsável' })
  expect(botao.classList.contains('oa-button')).toBe(true)
  expect(screen.queryByRole('option', { name: 'Sem responsável (liberar)' })).toBeNull()
})

test('FormAtribuir inclui opção Sem responsável (liberar) quando podeLiberar for true', () => {
  render(<FormAtribuir ocorrenciaId="00000000-0000-4000-8000-000000000001" lanternas={lanternasMock} responsavelAtual="hal-jordan" podeLiberar={true} />)
  expect(screen.getByRole('option', { name: 'Sem responsável (liberar)' })).toBeDefined()
})

test('FormAtribuir exibe erro de responsavelId no campo e não fecha', async () => {
  vi.mocked(atribuirResponsavel).mockResolvedValue({
    ok: false,
    errors: { responsavelId: ['Lanterna está em missão.'] },
  })
  render(<FormAtribuir ocorrenciaId="00000000-0000-4000-8000-000000000001" lanternas={lanternasMock} responsavelAtual="hal-jordan" podeLiberar={false} />)

  fireEvent.click(screen.getByRole('button', { name: 'Atribuir responsável' }))
  await waitFor(() => {
    expect(atribuirResponsavel).toHaveBeenCalled()
  })
  expect(await screen.findByText('Lanterna está em missão.')).toBeDefined()
})

test('AtribuirPage renderiza casca OANET com link de volta e moldura', async () => {
  const { buscarOcorrencia } = await import('@/lib/ocorrencias')
  const { listarTodosLanternas } = await import('@/lib/lanternas')
  vi.mocked(buscarOcorrencia).mockResolvedValue({
    id: '00000000-0000-4000-8000-000000000001',
    titulo: 'Incursão Sinestro',
    descricao: 'Tropa Amarela avistada.',
    planeta: 'Korugar',
    setorId: 2814,
    gravidade: 'critica',
    status: 'aberta',
    envolvidos: 5,
    responsavelId: null,
    resolucao: null,
    criadaPorId: '00000000-0000-4000-8000-000000000099',
    criadaEm: '2026-11-10T12:00:00.000Z',
    resolvidaEm: null,
    prazoEm: '2026-11-11T12:00:00.000Z',
    vencida: false,
  })
  vi.mocked(listarTodosLanternas).mockResolvedValue(lanternasMock)

  const { container } = render(await AtribuirPage({ params: Promise.resolve({ id: '00000000-0000-4000-8000-000000000001' }) }))

  expect(screen.getByRole('heading', { level: 1, name: 'Atribuir responsável' })).toBeDefined()
  expect(screen.getByText('Incursão Sinestro')).toBeDefined()
  expect(screen.getByRole('link', { name: /Voltar à ocorrência/ }).getAttribute('href')).toBe('/painel/ocorrencias/00000000-0000-4000-8000-000000000001')
  expect(container.querySelector('.oa-panel')).not.toBeNull()
  // Seletor operacional: status e Setor das Fichas vêm sem cache. [API-14]
  expect(listarTodosLanternas).toHaveBeenCalledWith({ setor: 2814 }, { cache: 'no-store' })
})
