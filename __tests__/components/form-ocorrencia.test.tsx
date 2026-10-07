import { beforeEach, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import db from '@/db.json'

vi.mock('@/app/(painel)/painel/ocorrencias/actions', () => ({ registrarOcorrencia: vi.fn() }))

import { registrarOcorrencia } from '@/app/(painel)/painel/ocorrencias/actions'
import { FormOcorrencia } from '@/app/(painel)/painel/ocorrencias/_components/FormOcorrencia'

beforeEach(() => vi.clearAllMocks())

test('valida no cliente e não chama a action com campos inválidos', async () => {
  render(<FormOcorrencia setores={[]} setorFixo="2814" />)
  fireEvent.click(screen.getByRole('button', { name: 'Registrar ocorrência' }))
  expect(await screen.findByText('O título precisa ter pelo menos 5 caracteres.')).toBeDefined()
  expect(screen.getByText('Descreva a ocorrência em pelo menos 10 caracteres.')).toBeDefined()
  expect(screen.getByText('Informe o planeta onde a ocorrência aconteceu.')).toBeDefined()
  expect(registrarOcorrencia).not.toHaveBeenCalled()
})

test('Lanterna não vê o campo setor e envia o setor da sessão', async () => {
  vi.mocked(registrarOcorrencia).mockResolvedValue({ ok: false, erro: 'Não foi possível falar com a Central de Oa.' })
  render(<FormOcorrencia setores={[]} setorFixo="2814" />)
  expect(screen.queryByLabelText('Setor')).toBeNull()
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Invasão em Oa' } })
  fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Muitos invasores na Bateria Central.' } })
  fireEvent.change(screen.getByLabelText('Planeta'), { target: { value: 'Oa' } })
  fireEvent.change(screen.getByLabelText('Seres envolvidos'), { target: { value: '3' } })
  fireEvent.click(screen.getByRole('button', { name: 'Registrar ocorrência' }))
  expect(await screen.findByText('Não foi possível falar com a Central de Oa.')).toBeDefined()
  await waitFor(() => expect(screen.getByRole('button', { name: 'Registrar ocorrência' }).hasAttribute('disabled')).toBe(false))
  expect(registrarOcorrencia).toHaveBeenCalledWith({
    titulo: 'Invasão em Oa', descricao: 'Muitos invasores na Bateria Central.', planeta: 'Oa', setorId: '2814', gravidade: 'media', envolvidos: 3,
  })
})

test('Guardião vê o campo setor', () => {
  render(<FormOcorrencia setores={db.setores} setorFixo={null} />)
  expect(screen.getByText('Setor')).toBeDefined()
  expect(screen.getByText('Escolha o setor')).toBeDefined()
})
