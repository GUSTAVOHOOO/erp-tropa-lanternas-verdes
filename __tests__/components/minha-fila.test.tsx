import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((destino: string) => {
    throw new Error(`NEXT_REDIRECT ${destino}`)
  }),
}))

vi.mock('next/navigation', () => ({ redirect }))
vi.mock('@/lib/dal', () => ({ exigirPapel: vi.fn() }))
vi.mock('@/lib/ocorrencias', () => ({ listarMinhaFila: vi.fn() }))
vi.mock('@/lib/setores', () => ({ listarSetores: vi.fn() }))
vi.mock('@/lib/lanternas', () => ({ listarTodosLanternas: vi.fn() }))

import MinhaFilaPage from '@/app/(painel)/painel/minha-fila/page'
import { ApiError } from '@/lib/api-error'
import { exigirPapel } from '@/lib/dal'
import { listarTodosLanternas } from '@/lib/lanternas'
import { listarMinhaFila } from '@/lib/ocorrencias'
import type { Ocorrencia } from '@/lib/schemas/ocorrencia'
import { listarSetores } from '@/lib/setores'

const sessaoLanterna = {
  id: '00000000-0000-4000-8000-000000000002',
  nome: 'Hal Jordan',
  email: 'hal@oa.tropa',
  papel: 'lanterna' as const,
  setorId: 2814,
  lanternaId: 'hal-jordan',
  criadoEm: '2026-01-01T00:00:00.000Z',
}

const ocorrenciasExemplo: Ocorrencia[] = [
  {
    id: '00000000-0000-4000-8000-000000000201',
    titulo: 'Ocorrência O1 crítica',
    descricao: 'Descrição da ocorrência 1.',
    planeta: 'Terra',
    setorId: 2814,
    gravidade: 'critica',
    status: 'em_andamento',
    envolvidos: 2,
    responsavelId: 'hal-jordan',
    resolucao: null,
    criadaPorId: '00000000-0000-4000-8000-000000000102',
    criadaEm: '2026-11-08T14:00:00Z',
    resolvidaEm: null,
    prazoEm: '2026-11-09T14:00:00Z',
    vencida: false,
  },
  {
    id: '00000000-0000-4000-8000-000000000208',
    titulo: 'Ocorrência O8 alta',
    descricao: 'Descrição da ocorrência 8.',
    planeta: 'Terra',
    setorId: 2814,
    gravidade: 'alta',
    status: 'aberta',
    envolvidos: 2,
    responsavelId: 'hal-jordan',
    resolucao: null,
    criadaPorId: '00000000-0000-4000-8000-000000000102',
    criadaEm: '2026-11-06T14:00:00Z',
    resolvidaEm: null,
    prazoEm: '2026-11-09T14:00:00Z',
    vencida: true,
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(exigirPapel).mockResolvedValue(sessaoLanterna)
  vi.mocked(listarSetores).mockResolvedValue([
    { id: 2814, nome: 'Setor 2814', descricao: 'Terra' },
  ])
  vi.mocked(listarTodosLanternas).mockResolvedValue([
    {
      id: 'hal-jordan',
      codinome: 'Hal Jordan',
      identidadeCivil: 'Hal Jordan',
      especie: 'Humano',
      planetaNatal: 'Terra',
      setorId: 2814,
      status: 'ativo',
      anoIngresso: 1959,
    },
  ])
})

test('Lanterna com fila mostra itens na ordem recebida e paginação', async () => {
  vi.mocked(listarMinhaFila).mockResolvedValue({
    itens: ocorrenciasExemplo,
    meta: { total: 25, pagina: 1, limite: 20, paginas: 2 },
  })

  render(await MinhaFilaPage({ searchParams: Promise.resolve({}) }))

  expect(screen.getByRole('heading', { level: 1, name: 'Minha fila' })).toBeDefined()
  expect(screen.getByText('Ocorrências atribuídas a você, por prazo e gravidade.')).toBeDefined()
  expect(screen.getByText('25 ocorrências')).toBeDefined()

  const linksOcorrencias = screen.getAllByRole('link', { name: /Ocorrência O[18]/ })
  expect(linksOcorrencias).toHaveLength(2)
  expect(linksOcorrencias[0].textContent).toContain('Ocorrência O1 crítica')
  expect(linksOcorrencias[1].textContent).toContain('Ocorrência O8 alta')

  const paginacao = screen.getByRole('navigation', { name: 'Paginação' })
  expect(paginacao).toBeDefined()
  expect(screen.getByRole('link', { name: 'Próxima' })).toBeDefined()
})

test('fila vazia exibe mensagem própria com ação para /painel/ocorrencias', async () => {
  vi.mocked(listarMinhaFila).mockResolvedValue({
    itens: [],
    meta: { total: 0, pagina: 1, limite: 20, paginas: 0 },
  })

  render(await MinhaFilaPage({ searchParams: Promise.resolve({}) }))

  expect(screen.getByText('Nenhuma ocorrência na sua fila')).toBeDefined()
  expect(screen.getByText('Você não tem ocorrências pendentes atribuídas no momento.')).toBeDefined()
  const acao = screen.getByRole('link', { name: 'Ver ocorrências' })
  expect(acao.getAttribute('href')).toBe('/painel/ocorrencias')
  expect(screen.queryByText('Sua conta ainda não tem uma Ficha de Lanterna vinculada')).toBeNull()
})

test('409 CONTA_SEM_LANTERNA exibe mensagem de vínculo e NÃO "Nenhuma ocorrência na sua fila"', async () => {
  vi.mocked(listarMinhaFila).mockRejectedValue(new ApiError(409, 'CONTA_SEM_LANTERNA'))

  render(await MinhaFilaPage({ searchParams: Promise.resolve({}) }))

  expect(screen.getByText('Sua conta ainda não tem uma Ficha de Lanterna vinculada')).toBeDefined()
  expect(
    screen.getByText('Peça a um Guardião para vincular a sua Ficha; enquanto isso, você pode registrar e comentar ocorrências do seu setor.'),
  ).toBeDefined()
  const acao = screen.getByRole('link', { name: 'Ver ocorrências' })
  expect(acao.getAttribute('href')).toBe('/painel/ocorrencias')
  expect(screen.queryByText('Nenhuma ocorrência na sua fila')).toBeNull()
})

test('exigirPapel rejeitando não busca nada', async () => {
  vi.mocked(exigirPapel).mockRejectedValue(new Error('NEXT_REDIRECT /acesso-negado'))

  await expect(MinhaFilaPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('NEXT_REDIRECT /acesso-negado')

  expect(listarMinhaFila).not.toHaveBeenCalled()
  expect(listarSetores).not.toHaveBeenCalled()
  expect(listarTodosLanternas).not.toHaveBeenCalled()
})

test('500 do servidor sobe para o error boundary', async () => {
  const erro500 = new ApiError(500, 'ERRO_INTERNO')
  vi.mocked(listarMinhaFila).mockRejectedValue(erro500)

  await expect(MinhaFilaPage({ searchParams: Promise.resolve({}) })).rejects.toBe(erro500)
})

test('403 da API redireciona para /acesso-negado', async () => {
  vi.mocked(listarMinhaFila).mockRejectedValue(new ApiError(403, 'SEM_PERMISSAO'))

  await expect(MinhaFilaPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('NEXT_REDIRECT /acesso-negado')
  expect(redirect).toHaveBeenCalledWith('/acesso-negado')
})

test('parâmetro pagina da URL é repassado como inteiro ≥ 1 e inválido vira 1', async () => {
  vi.mocked(listarMinhaFila).mockResolvedValue({
    itens: [],
    meta: { total: 0, pagina: 1, limite: 20, paginas: 0 },
  })

  await MinhaFilaPage({ searchParams: Promise.resolve({ pagina: '3' }) })
  expect(listarMinhaFila).toHaveBeenCalledWith(3)

  await MinhaFilaPage({ searchParams: Promise.resolve({ pagina: 'invalido' }) })
  expect(listarMinhaFila).toHaveBeenCalledWith(1)

  await MinhaFilaPage({ searchParams: Promise.resolve({ pagina: '-5' }) })
  expect(listarMinhaFila).toHaveBeenCalledWith(1)
})
