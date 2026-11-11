import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/dal', () => ({ verificarSessao: vi.fn() }))
vi.mock('@/lib/ocorrencias', () => ({ listarOcorrencias: vi.fn() }))
vi.mock('@/lib/setores', () => ({ listarSetores: vi.fn() }))
vi.mock('@/lib/lanternas', () => ({ listarTodosLanternas: vi.fn() }))
vi.mock('@/app/(painel)/painel/ocorrencias/_components/FiltroOcorrencias', () => ({
  FiltroOcorrencias: () => <div data-testid="mock-filtro">Filtros</div>,
}))

import { verificarSessao } from '@/lib/dal'
import { listarOcorrencias } from '@/lib/ocorrencias'
import { listarSetores } from '@/lib/setores'
import { listarTodosLanternas } from '@/lib/lanternas'
import OcorrenciasPage from '@/app/(painel)/painel/ocorrencias/page'

const sessaoGuardiao = { id: '00000000-0000-4000-8000-000000000001', nome: 'Ganthet', email: 'ganthet@oa.tropa', papel: 'guardiao' as const, setorId: null, lanternaId: null, criadoEm: '2026-01-01T00:00:00.000Z' }
const sessaoLanterna = { id: '00000000-0000-4000-8000-000000000002', nome: 'Hal Jordan', email: 'hal@oa.tropa', papel: 'lanterna' as const, setorId: 2814, lanternaId: 'hal-jordan', criadoEm: '2026-01-01T00:00:00.000Z' }

const respostaVazia = {
  itens: [],
  meta: { total: 0, pagina: 1, limite: 20, paginas: 1 },
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(listarSetores).mockResolvedValue([
    { id: 0, nome: 'Setor 0 - Oa', descricao: 'Centro do Universo' },
    { id: 2814, nome: 'Setor 2814', descricao: 'Setor espacial 2814, Terra' },
  ])
  vi.mocked(listarTodosLanternas).mockResolvedValue([
    { id: 'hal-jordan', codinome: 'Hal Jordan', identidadeCivil: null, especie: 'Humano', planetaNatal: 'Terra', setorId: 2814, status: 'ativo', anoIngresso: null },
  ])
  vi.mocked(listarOcorrencias).mockResolvedValue(respostaVazia)
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

test('URL inválida usa padrões seguros sem quebrar', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  await OcorrenciasPage({
    searchParams: Promise.resolve({
      status: 'invalido',
      gravidade: 'desconhecida',
      setor: 'xyz',
      pagina: '-5',
    }),
  })

  expect(listarOcorrencias).toHaveBeenCalledWith(
    expect.objectContaining({
      limite: 20,
    }),
  )
})

test('Lanterna com ?setor=674 na URL NÃO envia setor para listarOcorrencias', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoLanterna)
  await OcorrenciasPage({ searchParams: Promise.resolve({ setor: '674' }) })

  expect(listarOcorrencias).toHaveBeenCalledWith(
    expect.not.objectContaining({ setor: 674 }),
  )
  expect(listarOcorrencias).toHaveBeenCalledWith(
    expect.objectContaining({ limite: 20 }),
  )
})

test('Guardião envia Setor 0 válido', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  await OcorrenciasPage({ searchParams: Promise.resolve({ setor: '0' }) })

  expect(listarOcorrencias).toHaveBeenCalledWith(
    expect.objectContaining({ setor: 0, limite: 20 }),
  )
})

test('filtros na URL são repassados ao listarOcorrencias', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  await OcorrenciasPage({
    searchParams: Promise.resolve({
      status: 'aberta',
      gravidade: 'alta',
      responsavel: 'hal-jordan',
      vencida: 'true',
      busca: 'Crise',
      ordenar: 'prazo',
      ordem: 'desc',
      pagina: '2',
    }),
  })

  expect(listarOcorrencias).toHaveBeenCalledWith(
    expect.objectContaining({
      status: 'aberta',
      gravidade: 'alta',
      responsavel: 'hal-jordan',
      vencida: true,
      busca: 'Crise',
      ordenar: 'prazo',
      ordem: 'desc',
      pagina: 2,
      limite: 20,
    }),
  )
})

test('vazio com filtro exibe mensagem própria e ação de limpar', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  render(await OcorrenciasPage({ searchParams: Promise.resolve({ status: 'aberta' }) }))

  expect(screen.getByText('Nenhuma ocorrência combina com esses filtros.')).toBeDefined()
  expect(screen.getByRole('link', { name: 'Limpar filtros' }).getAttribute('href')).toBe('/painel/ocorrencias')
})

test('vazio sem filtro exibe mensagem padrão sem ação de limpar', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  render(await OcorrenciasPage({ searchParams: Promise.resolve({}) }))

  expect(screen.getByText('Ainda não há ocorrências registradas.')).toBeDefined()
  expect(screen.queryByRole('link', { name: 'Limpar filtros' })).toBeNull()
})

test('renderiza tabela com selo de texto Vencida na lista quando vencida for true', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  vi.mocked(listarOcorrencias).mockResolvedValue({
    itens: [
      {
        id: '00000000-0000-4000-8000-000000000001',
        titulo: 'Ataque em Coast City',
        descricao: 'Distorção gravitacional perto de Marte.',
        planeta: 'Terra',
        setorId: 2814,
        gravidade: 'alta',
        status: 'aberta',
        envolvidos: 42,
        responsavelId: 'hal-jordan',
        resolucao: null,
        criadaPorId: '00000000-0000-4000-8000-000000000099',
        criadaEm: '2026-11-10T12:00:00.000Z',
        resolvidaEm: null,
        prazoEm: '2026-11-11T12:00:00.000Z',
        vencida: true,
      },
    ],
    meta: { total: 1, pagina: 1, limite: 20, paginas: 1 },
  })

  render(await OcorrenciasPage({ searchParams: Promise.resolve({}) }))
  expect(screen.getByText('Ataque em Coast City')).toBeDefined()
  expect(screen.getByText('Vencida')).toBeDefined()
})
