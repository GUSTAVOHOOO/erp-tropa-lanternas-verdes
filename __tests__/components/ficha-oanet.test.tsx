import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/lanternas', () => ({ buscarLanterna: vi.fn() }))
vi.mock('@/lib/setores', () => ({ listarSetores: vi.fn() }))

import { buscarLanterna } from '@/lib/lanternas'
import { listarSetores } from '@/lib/setores'
import LanternaPage from '@/app/(site)/lanternas/[id]/page'

const setores = [
  { id: '2814', numero: 2814, nome: 'Setor 2814', descricao: 'Terra e arredores' },
]

const hal = { id: '1', nome: 'Hal Jordan', especie: 'Humano', planetaNatal: 'Terra', setorId: '2814', status: 'em_missao' as const }
const desconhecido = { id: '2', nome: 'Recruta Sem Construto', especie: 'Desconhecida', planetaNatal: 'Desconhecido', setorId: '2814', status: 'ativo' as const }

async function renderizar(id: string) {
  return render(await LanternaPage({ params: Promise.resolve({ id }) }))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(listarSetores).mockResolvedValue(setores)
})

test('ficha renderiza dados na composição OANET com link de volta e moldura', async () => {
  vi.mocked(buscarLanterna).mockResolvedValue(hal)
  const { container } = await renderizar('1')
  expect(screen.getByRole('link', { name: /Voltar à lista/ }).getAttribute('href')).toBe('/lanternas')
  expect(screen.getByRole('heading', { level: 1, name: 'Hal Jordan' })).toBeDefined()
  expect(screen.getByText('Humano')).toBeDefined()
  expect(screen.getByText('Terra')).toBeDefined()
  expect(screen.getByRole('link', { name: 'Setor 2814' }).getAttribute('href')).toBe('/lanternas?setor=2814')
  expect(container.querySelector('.oa-badge')?.textContent).toContain('Em missão')
  expect(container.querySelector('.oa-panel')).not.toBeNull()
})

test('lanterna com construto artístico exibe a arte vetorial', async () => {
  vi.mocked(buscarLanterna).mockResolvedValue(hal)
  const { container } = await renderizar('1')
  expect(container.querySelector('.oa-profile-construct')).not.toBeNull()
})

test('lanterna sem construto específico renderiza perfeitamente sem erros', async () => {
  vi.mocked(buscarLanterna).mockResolvedValue(desconhecido)
  const { container } = await renderizar('2')
  expect(screen.getByRole('heading', { level: 1, name: 'Recruta Sem Construto' })).toBeDefined()
  expect(container.querySelector('.oa-badge')?.textContent).toContain('Ativo')
})
