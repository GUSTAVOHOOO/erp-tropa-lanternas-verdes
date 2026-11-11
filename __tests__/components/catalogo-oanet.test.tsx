import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

vi.mock('@/lib/lanternas', () => ({ listarLanternas: vi.fn() }))
vi.mock('@/lib/setores', () => ({ listarSetores: vi.fn() }))

import { listarLanternas } from '@/lib/lanternas'
import { listarSetores } from '@/lib/setores'
import LanternasPage from '@/app/(site)/lanternas/page'
import { CartaoLanterna } from '@/app/(site)/lanternas/_components/CartaoLanterna'

const setores = [
  { id: '2814', numero: 2814, nome: 'Setor 2814', descricao: 'Terra e arredores' },
  { id: '1417', numero: 1417, nome: 'Setor 1417', descricao: 'Daxam' },
]

const hal = { id: '1', nome: 'Hal Jordan', especie: 'Humano', planetaNatal: 'Terra', setorId: '2814', status: 'em_missao' as const }

async function renderizar(searchParams: { setor?: string } = {}) {
  return render(await LanternasPage({ searchParams: Promise.resolve(searchParams) }))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(listarSetores).mockResolvedValue(setores)
  vi.mocked(listarLanternas).mockResolvedValue([hal])
})

test('o filtro vem da URL, marca o setor escolhido e mantém Links reais', async () => {
  await renderizar({ setor: '2814' })
  expect(listarLanternas).toHaveBeenCalledWith({ setorId: '2814' })
  const filtro = screen.getByRole('navigation', { name: 'Filtrar por setor' })
  const escolhido = within(filtro).getByRole('link', { name: 'Setor 2814' })
  expect(escolhido.getAttribute('href')).toBe('/lanternas?setor=2814')
  expect(escolhido.getAttribute('aria-current')).toBe('page')
  expect(escolhido.classList.contains('oa-button')).toBe(true)
  const todos = within(filtro).getByRole('link', { name: 'Todos' })
  expect(todos.getAttribute('href')).toBe('/lanternas')
  expect(todos.getAttribute('aria-current')).toBeNull()
  expect(todos.classList.contains('oa-button')).toBe(true)
})

test('sem filtro, "Todos" fica marcado', async () => {
  await renderizar()
  expect(listarLanternas).toHaveBeenCalledWith({ setorId: undefined })
  const filtro = screen.getByRole('navigation', { name: 'Filtrar por setor' })
  expect(within(filtro).getByRole('link', { name: 'Todos' }).getAttribute('aria-current')).toBe('page')
})

test('a lista fica numa moldura OANET e cada lanterna leva à ficha por Link', async () => {
  const { container } = await renderizar()
  expect(screen.getByRole('heading', { level: 1, name: 'Lanternas da Tropa' })).toBeDefined()
  const link = screen.getByRole('link', { name: /Hal Jordan/ })
  expect(link.getAttribute('href')).toBe('/lanternas/1')
  expect(link.closest('.oa-panel')).not.toBeNull()
  expect(container.querySelector('[data-slot="card"], [data-slot="badge"]')).toBeNull()
})

test('o cartão mostra setor e status por texto, com selo OANET', () => {
  render(<CartaoLanterna lanterna={hal} nomeSetor="Setor 2814" />)
  expect(screen.getByText('Humano · Terra')).toBeDefined()
  expect(screen.getByText('Setor 2814')).toBeDefined()
  const selo = screen.getByText('Em missão').closest('.oa-badge')
  expect(selo).not.toBeNull()
  expect(selo?.querySelector('span')?.getAttribute('aria-hidden')).toBe('true')
})

test('conteúdo longo pode quebrar dentro do cartão', () => {
  const nomeLongo = 'Kilowog-de-Bolovax-Vik-Instrutor-Chefe-da-Tropa-dos-Lanternas-Verdes'
  render(<CartaoLanterna lanterna={{ ...hal, nome: nomeLongo }} nomeSetor="Setor 674" />)
  const link = screen.getByRole('link', { name: new RegExp(nomeLongo) })
  expect(link.className).toContain('min-w-0')
  expect(screen.getByText(nomeLongo).className).toContain('break-words')
})

test('filtro sem resultados mostra o vazio próprio com saída para todos', async () => {
  vi.mocked(listarLanternas).mockResolvedValue([])
  await renderizar({ setor: '1417' })
  const vazio = screen.getByRole('status')
  expect(within(vazio).getByText('Nenhum lanterna neste setor')).toBeDefined()
  expect(within(vazio).getByRole('link', { name: 'Ver todos' }).getAttribute('href')).toBe('/lanternas')
  expect(screen.getByRole('navigation', { name: 'Filtrar por setor' })).toBeDefined()
})
