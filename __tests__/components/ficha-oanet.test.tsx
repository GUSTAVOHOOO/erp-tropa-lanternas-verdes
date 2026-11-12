import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { obterCenario } from '../fixtures/contrato/cenarios'
import { ApiError } from '@/lib/api-error'

const mockNotFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND')
})

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>()
  return {
    ...actual,
    notFound: () => mockNotFound(),
  }
})

vi.mock('@/lib/lanternas', () => ({ buscarLanterna: vi.fn() }))
vi.mock('@/lib/setores', () => ({ listarSetores: vi.fn() }))

import { buscarLanterna } from '@/lib/lanternas'
import { listarSetores } from '@/lib/setores'
import LanternaPage from '@/app/(site)/lanternas/[id]/page'
import type { LanternaFicha } from '@/lib/schemas/lanterna'

const cenarioHal = obterCenario('consultarFichaLanterna.200')
const cenarioGuy = obterCenario('consultarFichaLanterna.200.mentor')
const cenarioSemSetor = obterCenario('consultarFichaLanterna.200.sem-setor')

const fichaHal = cenarioHal.esperado.corpo!.dados as LanternaFicha
const fichaGuy = cenarioGuy.esperado.corpo!.dados as LanternaFicha
const fichaSemSetor = cenarioSemSetor.esperado.corpo!.dados as LanternaFicha

const setores = [
  { id: 2814, nome: 'Setor 2814', descricao: 'Terra e arredores' },
  { id: 674, nome: 'Setor 674', descricao: 'Bolovax Vik' },
]

async function renderizar(id: string) {
  return render(await LanternaPage({ params: Promise.resolve({ id }) }))
}

beforeEach(() => {
  vi.clearAllMocks()
  mockNotFound.mockClear()
  vi.mocked(listarSetores).mockResolvedValue(setores)
})

describe('Ficha do Lanterna (/lanternas/[id])', () => {
  test('ficha completa com mentor, aprendizes, estatísticas e fontes', async () => {
    // Hal Jordan com uma fonte verificada contendo url para testar link externo
    const halComFonte: LanternaFicha = {
      ...fichaHal,
      biografia: 'Um dos maiores Lanternas Verdes da história.',
      citacao: 'No dia mais claro, na noite mais densa...',
      habilidades: ['Vontade indomável', 'Voo'],
      fontes: {
        ...fichaHal.fontes,
        biografia: {
          estado: 'verificado',
          url: 'https://fontes.tropa.invalid/hal-jordan',
        },
      },
    }
    vi.mocked(buscarLanterna).mockResolvedValue(halComFonte)

    const { container } = await renderizar('hal-jordan')

    expect(screen.getByRole('link', { name: /Voltar à lista/i }).getAttribute('href')).toBe('/lanternas')
    expect(screen.getByRole('heading', { level: 1, name: 'Hal Jordan' })).toBeDefined()
    expect(screen.getAllByText('Humano · Terra').length).toBeGreaterThan(0)

    // Construto artístico e nota
    expect(container.querySelector('.oa-profile-construct')).not.toBeNull()
    expect(screen.getByText('Interpretação artística; não é registro canônico.')).toBeDefined()

    // Citação e biografia
    expect(screen.getByText(/No dia mais claro/)).toBeDefined()
    expect(screen.getByText('Um dos maiores Lanternas Verdes da história.')).toBeDefined()

    // Campos no dl
    expect(screen.getByRole('link', { name: 'Setor 2814' }).getAttribute('href')).toBe('/lanternas?setor=2814')
    expect(screen.getByText('Terra e arredores')).toBeDefined()
    expect(screen.getAllByText('Em missão').length).toBeGreaterThan(0)
    expect(screen.getByText('2001')).toBeDefined()

    // Habilidades
    expect(screen.getByText('Vontade indomável')).toBeDefined()
    expect(screen.getByText('Voo')).toBeDefined()

    // Estatísticas
    expect(screen.getByText('Ocorrências resolvidas')).toBeDefined()
    expect(screen.getAllByText('1').length).toBe(2)
    expect(screen.getByText('48 horas')).toBeDefined()

    // Aprendizes
    const linkAprendiz = screen.getByRole('link', { name: 'Guy Gardner' })
    expect(linkAprendiz.getAttribute('href')).toBe('/lanternas/guy-gardner')

    // Fontes
    const linkFonte = screen.getByRole('link', { name: 'fonte' })
    expect(linkFonte.getAttribute('href')).toBe('https://fontes.tropa.invalid/hal-jordan')
    expect(linkFonte.getAttribute('rel')).toBe('noopener noreferrer')
    expect(linkFonte.getAttribute('target')).toBe('_blank')

    const selos = screen.getAllByText(/não verificado|verificado/)
    expect(selos.length).toBeGreaterThan(0)
  })

  test('campos nulos mostram "Não registrado" e setor nulo mostra "Sem setor"', async () => {
    vi.mocked(buscarLanterna).mockResolvedValue(fichaSemSetor)

    await renderizar('lanterna-sem-setor')

    expect(screen.getAllByText('Não registrado').length).toBeGreaterThanOrEqual(4)
    expect(screen.getByText('Sem setor')).toBeDefined()
    expect(screen.getAllByText('Origem não registrada').length).toBeGreaterThan(0)
    expect(screen.getByText('Nenhuma habilidade registrada')).toBeDefined()
    expect(screen.getByText('Nenhum aprendiz')).toBeDefined()
  })

  test('tempo médio nulo mostra "Sem resoluções" e mentor tem Link', async () => {
    vi.mocked(buscarLanterna).mockResolvedValue(fichaGuy)

    await renderizar('guy-gardner')

    expect(screen.getByText('Sem resoluções')).toBeDefined()
    const linkMentor = screen.getByRole('link', { name: 'Hal Jordan' })
    expect(linkMentor.getAttribute('href')).toBe('/lanternas/hal-jordan')
  })

  test('lanterna sem construto artístico não quebra e não exibe a nota artística', async () => {
    const semArte: LanternaFicha = {
      ...fichaSemSetor,
      codinome: 'Lanterna Sem Desenho Artístico',
    }
    vi.mocked(buscarLanterna).mockResolvedValue(semArte)

    const { container } = await renderizar('lanterna-sem-arte')

    expect(container.querySelector('.oa-profile-construct')).toBeNull()
    expect(screen.queryByText('Interpretação artística; não é registro canônico.')).toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'Lanterna Sem Desenho Artístico' })).toBeDefined()
  })

  test('slug inexistente chama notFound()', async () => {
    vi.mocked(buscarLanterna).mockResolvedValue(null)

    await expect(renderizar('inexistente')).rejects.toThrow('NEXT_NOT_FOUND')
    expect(mockNotFound).toHaveBeenCalled()
  })

  test('erro 500 da API é relançado para o error.tsx', async () => {
    const erroServidor = new ApiError(500, 'ERRO_INTERNO')
    vi.mocked(buscarLanterna).mockRejectedValue(erroServidor)

    await expect(renderizar('hal-jordan')).rejects.toThrow(erroServidor)
  })
})
