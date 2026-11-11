import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/dal', () => ({ verificarSessao: vi.fn() }))
vi.mock('@/lib/ocorrencias', () => ({ listarOcorrencias: vi.fn() }))
vi.mock('@/lib/setores', () => ({ listarSetores: vi.fn() }))
vi.mock('@/lib/lanternas', () => ({ listarLanternas: vi.fn() }))

import { verificarSessao } from '@/lib/dal'
import { listarOcorrencias } from '@/lib/ocorrencias'
import { listarSetores } from '@/lib/setores'
import { listarLanternas } from '@/lib/lanternas'
import PainelPage from '@/app/(painel)/painel/page'

const sessaoGuardiao = { id: 'g1', nome: 'Ganthet', papel: 'guardiao' as const, setorId: null, lanternaId: null, expiraEm: 1_900_000_000 }
const sessaoLanterna = { id: 'l1', nome: 'Hal Jordan', papel: 'lanterna' as const, setorId: '2814', lanternaId: '1', expiraEm: 1_900_000_000 }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(listarSetores).mockResolvedValue([{ id: '2814', numero: 2814, nome: 'Setor 2814', descricao: 'Terra' }])
  vi.mocked(listarLanternas).mockResolvedValue([{ id: '1', nome: 'Hal Jordan', especie: 'Humano', planetaNatal: 'Terra', setorId: '2814', status: 'ativo' }])
  vi.mocked(listarOcorrencias).mockResolvedValue([])
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

test('lanterna vê apenas seu setor autorizado', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoLanterna)
  render(await PainelPage())
  expect(screen.getByText('Ocorrências do Setor 2814.')).toBeDefined()
  expect(listarOcorrencias).toHaveBeenCalledWith({ setorId: '2814' })
})

test('sem ocorrências exibe EstadoVazio útil e molduras OANET', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  const { container } = render(await PainelPage())
  expect(screen.getByRole('status')).toBeDefined()
  expect(screen.getByText('Nenhuma ocorrência registrada')).toBeDefined()
  expect(container.querySelectorAll('.oa-panel').length).toBeGreaterThanOrEqual(1)
})
