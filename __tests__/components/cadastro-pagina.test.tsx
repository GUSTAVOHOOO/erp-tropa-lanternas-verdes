import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/cadastro', () => ({ listarSetoresParaCadastro: vi.fn(), cadastrarConta: vi.fn() }))
vi.mock('@/app/(site)/cadastro/actions', () => ({ cadastrar: vi.fn() }))

import { ApiError } from '@/lib/api-error'
import { listarSetoresParaCadastro } from '@/lib/cadastro'
import CadastroPage from '@/app/(site)/cadastro/page'

beforeEach(() => vi.clearAllMocks())

test('setores carregados no servidor alimentam o formulário', async () => {
  vi.mocked(listarSetoresParaCadastro).mockResolvedValue([{ id: 0, nome: 'Setor Zero', descricao: 'Oa e o núcleo do universo.' }])
  render(await CadastroPage())
  expect(screen.getByRole('button', { name: 'Criar conta' })).toBeDefined()
  expect(screen.getByRole('link', { name: 'Já tenho conta' }).getAttribute('href')).toBe('/login')
})

test('origem dos setores com erro: oferece tentar de novo e não mostra formulário enviável', async () => {
  vi.mocked(listarSetoresParaCadastro).mockRejectedValue(new ApiError(500, 'ERRO_INTERNO'))
  render(await CadastroPage())
  expect(screen.getByText('Não foi possível carregar os setores')).toBeDefined()
  expect(screen.queryByRole('button', { name: 'Criar conta' })).toBeNull()
  expect(screen.getByRole('link', { name: 'Tentar de novo' }).getAttribute('href')).toBe('/cadastro')
})

test('lista de setores vazia: mensagem própria e nenhum cadastro possível', async () => {
  vi.mocked(listarSetoresParaCadastro).mockResolvedValue([])
  render(await CadastroPage())
  expect(screen.getByText('Nenhum setor disponível para cadastro')).toBeDefined()
  expect(screen.queryByRole('button', { name: 'Criar conta' })).toBeNull()
})
