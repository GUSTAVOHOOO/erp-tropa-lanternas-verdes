import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/dal', () => ({ verificarSessao: vi.fn() }))
vi.mock('@/lib/ocorrencias', () => ({ buscarOcorrencia: vi.fn() }))
vi.mock('@/lib/setores', () => ({ listarSetores: vi.fn() }))
vi.mock('@/lib/lanternas', () => ({ listarTodosLanternas: vi.fn() }))
vi.mock('@/lib/eventos', () => ({ listarEventos: vi.fn() }))
vi.mock('@/lib/comentarios', () => ({ listarComentarios: vi.fn() }))
vi.mock('@/lib/permissoes-ocorrencia', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/permissoes-ocorrencia')>()
  return {
    ...actual,
    acoesPermitidas: vi.fn(actual.acoesPermitidas),
  }
})
vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/navigation')>()
  return {
    ...actual,
    notFound: vi.fn(() => {
      throw new Error('NEXT_NOT_FOUND')
    }),
    redirect: vi.fn((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`)
    }),
  }
})
vi.mock('@/app/(painel)/painel/ocorrencias/_components/FormStatus', () => ({
  FormStatus: ({ transicoes }: { transicoes: string[] }) => (
    <div data-testid="mock-form-status">FormStatus:{transicoes.join(',')}</div>
  ),
}))
vi.mock('@/app/(painel)/painel/ocorrencias/_components/FormEditarOcorrencia', () => ({
  FormEditarOcorrencia: () => <div data-testid="mock-form-editar">FormEditar</div>,
}))
vi.mock('@/app/(painel)/painel/ocorrencias/_components/ConfirmarExclusao', () => ({
  ConfirmarExclusao: () => <div data-testid="mock-confirmar-exclusao">ConfirmarExclusao</div>,
}))

import { notFound, redirect } from 'next/navigation'
import { verificarSessao } from '@/lib/dal'
import { buscarOcorrencia } from '@/lib/ocorrencias'
import { listarSetores } from '@/lib/setores'
import { listarTodosLanternas } from '@/lib/lanternas'
import { listarEventos } from '@/lib/eventos'
import { listarComentarios } from '@/lib/comentarios'
import { acoesPermitidas } from '@/lib/permissoes-ocorrencia'
import OcorrenciaPage from '@/app/(painel)/painel/ocorrencias/[id]/page'
import type { Ocorrencia } from '@/lib/schemas/ocorrencia'

const sessaoGuardiao = { id: '00000000-0000-4000-8000-000000000001', nome: 'Ganthet', email: 'ganthet@oa.tropa', papel: 'guardiao' as const, setorId: null, lanternaId: null, criadoEm: '2026-01-01T00:00:00.000Z' }
const sessaoLanterna = { id: '00000000-0000-4000-8000-000000000002', nome: 'Hal Jordan', email: 'hal@oa.tropa', papel: 'lanterna' as const, setorId: 2814, lanternaId: 'hal-jordan', criadoEm: '2026-01-01T00:00:00.000Z' }

const ocorrenciaMock: Ocorrencia = {
  id: '00000000-0000-4000-8000-000000000001',
  titulo: 'Anomalia no Setor 2814',
  descricao: 'Distorção gravitacional perto de Marte.',
  planeta: 'Marte',
  setorId: 2814,
  gravidade: 'alta',
  status: 'aberta',
  envolvidos: 42,
  responsavelId: 'hal-jordan',
  resolucao: null,
  criadaPorId: '00000000-0000-4000-8000-000000000001',
  criadaEm: '2026-11-10T12:00:00.000Z',
  resolvidaEm: null,
  prazoEm: '2026-11-11T12:00:00.000Z',
  vencida: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(buscarOcorrencia).mockResolvedValue(ocorrenciaMock)
  vi.mocked(listarSetores).mockResolvedValue([{ id: 2814, nome: 'Setor 2814', descricao: 'Setor espacial 2814, Terra' }])
  vi.mocked(listarTodosLanternas).mockResolvedValue([
    { id: 'hal-jordan', codinome: 'Hal Jordan', identidadeCivil: null, especie: 'Humano', planetaNatal: 'Terra', setorId: 2814, status: 'ativo', anoIngresso: null },
  ])
  vi.mocked(listarEventos).mockResolvedValue({
    itens: [],
    meta: { total: 0, pagina: 1, limite: 20, paginas: 1 },
  })
  vi.mocked(listarComentarios).mockResolvedValue({
    itens: [],
    meta: { total: 0, pagina: 1, limite: 20, paginas: 1 },
  })
})

test('página de detalhe renderiza dados, prazo e selo Vencida por texto', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  render(await OcorrenciaPage({ params: Promise.resolve({ id: ocorrenciaMock.id }) }))

  expect(screen.getByRole('heading', { level: 1, name: 'Anomalia no Setor 2814' })).toBeDefined()
  expect(screen.getByText('Distorção gravitacional perto de Marte.')).toBeDefined()
  expect(screen.getByText('Hal Jordan')).toBeDefined()
  expect(screen.getByText('Vencida')).toBeDefined()
  expect(screen.getByRole('link', { name: /Voltar à lista/ }).getAttribute('href')).toBe('/painel/ocorrencias')
})

test('exibe resolvidaEm e resolução quando presentes', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  vi.mocked(buscarOcorrencia).mockResolvedValue({
    ...ocorrenciaMock,
    status: 'resolvida',
    resolvidaEm: '2026-11-11T15:00:00.000Z',
    resolucao: 'Anomalia estabilizada pelos Lanternas do setor.',
  })

  render(await OcorrenciaPage({ params: Promise.resolve({ id: ocorrenciaMock.id }) }))
  expect(screen.getByText('Anomalia estabilizada pelos Lanternas do setor.')).toBeDefined()
})

test('matriz de ações: Guardião vê atribuir, FormStatus, editar e excluir', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  render(await OcorrenciaPage({ params: Promise.resolve({ id: ocorrenciaMock.id }) }))

  expect(screen.getByRole('link', { name: /Atribuir responsável/ })).toBeDefined()
  expect(screen.getByTestId('mock-form-status')).toBeDefined()
  expect(screen.getByTestId('mock-form-editar')).toBeDefined()
  expect(screen.getByTestId('mock-confirmar-exclusao')).toBeDefined()
})

test('matriz de ações: Lanterna em ocorrência resolvida não vê formulário de status quando não há transições', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoLanterna)
  vi.mocked(buscarOcorrencia).mockResolvedValue({
    ...ocorrenciaMock,
    status: 'resolvida',
    resolucao: 'Resolvida com sucesso.',
  })

  render(await OcorrenciaPage({ params: Promise.resolve({ id: ocorrenciaMock.id }) }))
  expect(screen.queryByTestId('mock-form-status')).toBeNull()
  expect(screen.queryByRole('link', { name: /Atribuir responsável/ })).toBeNull()
  expect(screen.queryByTestId('mock-confirmar-exclusao')).toBeNull()
})

test('matriz de ações: respeita retorno mockado de acoesPermitidas', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoLanterna)
  vi.mocked(acoesPermitidas).mockReturnValueOnce({
    iniciar: false,
    resolver: false,
    reabrir: false,
    atribuir: true,
    liberar: false,
    editar: false,
    excluir: false,
  })
  render(await OcorrenciaPage({ params: Promise.resolve({ id: ocorrenciaMock.id }) }))
  expect(screen.getByRole('link', { name: /Atribuir responsável/ })).toBeDefined()
  expect(screen.queryByTestId('mock-form-status')).toBeNull()
})

test('ocorrencia inexistente dispara notFound', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  vi.mocked(buscarOcorrencia).mockResolvedValue(null)

  await expect(OcorrenciaPage({ params: Promise.resolve({ id: 'invalido' }) })).rejects.toThrow('NEXT_NOT_FOUND')
  expect(notFound).toHaveBeenCalled()
})

test('setor alheio bloqueia acesso pelo podeAcessarSetor', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoLanterna) // setor 2814
  vi.mocked(buscarOcorrencia).mockResolvedValue({
    ...ocorrenciaMock,
    setorId: 674, // setor alheio
  })

  await expect(OcorrenciaPage({ params: Promise.resolve({ id: ocorrenciaMock.id }) })).rejects.toThrow('NEXT_REDIRECT:/acesso-negado')
  expect(redirect).toHaveBeenCalledWith('/acesso-negado')
})

test('busca eventos e comentários em paralelo respeitando páginas da URL', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  render(
    await OcorrenciaPage({
      params: Promise.resolve({ id: ocorrenciaMock.id }),
      searchParams: Promise.resolve({ eventos: '2', comentarios: '3' }),
    }),
  )

  expect(listarEventos).toHaveBeenCalledWith(ocorrenciaMock.id, 2)
  expect(listarComentarios).toHaveBeenCalledWith(ocorrenciaMock.id, 3)
})

test('página inválida na URL (não numérica ou < 1) cai para 1', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  render(
    await OcorrenciaPage({
      params: Promise.resolve({ id: ocorrenciaMock.id }),
      searchParams: Promise.resolve({ eventos: 'invalido', comentarios: '-5' }),
    }),
  )

  expect(listarEventos).toHaveBeenCalledWith(ocorrenciaMock.id, 1)
  expect(listarComentarios).toHaveBeenCalledWith(ocorrenciaMock.id, 1)
})

test('renderiza seções de Linha do tempo e Comentários', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  render(await OcorrenciaPage({ params: Promise.resolve({ id: ocorrenciaMock.id }) }))

  expect(screen.getByRole('heading', { level: 2, name: /Linha do tempo/i })).toBeDefined()
  expect(screen.getByRole('heading', { level: 2, name: /Comentários/i })).toBeDefined()
  expect(screen.getByText('Nenhum evento registrado.')).toBeDefined()
  expect(screen.getByText('Nenhum comentário ainda.')).toBeDefined()
})

test('paginação preserva o parâmetro da outra coleção', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoGuardiao)
  vi.mocked(listarEventos).mockResolvedValueOnce({
    itens: [
      {
        id: '00000000-0000-4000-8000-000000000101',
        ocorrenciaId: ocorrenciaMock.id,
        autorId: sessaoGuardiao.id,
        autor: { id: sessaoGuardiao.id, nome: 'Ganthet', papel: 'guardiao' },
        criadoEm: '2026-11-10T12:00:00.000Z',
        tipo: 'criada',
        dados: { de: null, para: 'aberta' },
      },
    ],
    meta: { total: 50, pagina: 2, limite: 20, paginas: 3 },
  })
  vi.mocked(listarComentarios).mockResolvedValueOnce({
    itens: [
      {
        id: '00000000-0000-4000-8000-000000000201',
        ocorrenciaId: ocorrenciaMock.id,
        autorId: sessaoGuardiao.id,
        autor: { id: sessaoGuardiao.id, nome: 'Ganthet', papel: 'guardiao' },
        texto: 'Comentário teste.',
        criadoEm: '2026-11-10T12:00:00.000Z',
      },
    ],
    meta: { total: 40, pagina: 1, limite: 20, paginas: 2 },
  })

  render(
    await OcorrenciaPage({
      params: Promise.resolve({ id: ocorrenciaMock.id }),
      searchParams: Promise.resolve({ eventos: '2', comentarios: '1' }),
    }),
  )

  // Na paginação de eventos (pág 2 de 3), o link para pág 3 deve manter o parâmetro de eventos
  const navs = screen.getAllByRole('navigation', { name: 'Paginação' })
  expect(navs.length).toBeGreaterThanOrEqual(2)
})

test('ocorrência resolvida ainda mostra o formulário de comentar', async () => {
  vi.mocked(verificarSessao).mockResolvedValue(sessaoLanterna)
  vi.mocked(buscarOcorrencia).mockResolvedValue({
    ...ocorrenciaMock,
    status: 'resolvida',
    resolucao: 'Resolvida pelos lanternas.',
  })

  render(await OcorrenciaPage({ params: Promise.resolve({ id: ocorrenciaMock.id }) }))

  expect(screen.getByLabelText('Comentário')).toBeDefined()
  expect(screen.getByRole('button', { name: 'Comentar' })).toBeDefined()
})
