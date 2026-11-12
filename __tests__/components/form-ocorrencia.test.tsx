import { beforeEach, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('@/app/(painel)/painel/ocorrencias/actions', () => ({ registrarOcorrencia: vi.fn() }))

import { registrarOcorrencia } from '@/app/(painel)/painel/ocorrencias/actions'
import { FormOcorrencia } from '@/app/(painel)/painel/ocorrencias/_components/FormOcorrencia'

beforeEach(() => vi.clearAllMocks())

test('valida no cliente e não chama a action com campos inválidos', async () => {
  render(<FormOcorrencia setores={[]} exigeSetor={false} />)
  fireEvent.click(screen.getByRole('button', { name: 'Registrar ocorrência' }))
  expect(await screen.findByText('O título precisa ter pelo menos 5 caracteres.')).toBeDefined()
  expect(screen.getByText('Descreva a ocorrência em pelo menos 10 caracteres.')).toBeDefined()
  expect(screen.getByText('Informe o planeta onde a ocorrência aconteceu.')).toBeDefined()
  expect(registrarOcorrencia).not.toHaveBeenCalled()
})

test('Lanterna não vê o campo setor e não envia setorId', async () => {
  vi.mocked(registrarOcorrencia).mockResolvedValue({ ok: false, erro: 'Não foi possível falar com a Central de Oa.' })
  render(<FormOcorrencia setores={[]} exigeSetor={false} />)
  expect(screen.queryByLabelText('Setor')).toBeNull()
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Invasão em Oa' } })
  fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Muitos invasores na Bateria Central.' } })
  fireEvent.change(screen.getByLabelText('Planeta'), { target: { value: 'Oa' } })
  fireEvent.change(screen.getByLabelText('Seres envolvidos'), { target: { value: '3' } })
  fireEvent.click(screen.getByRole('button', { name: 'Registrar ocorrência' }))
  expect(await screen.findByText('Não foi possível falar com a Central de Oa.')).toBeDefined()
  await waitFor(() => expect(screen.getByRole('button', { name: 'Registrar ocorrência' }).hasAttribute('disabled')).toBe(false))
  expect(registrarOcorrencia).toHaveBeenCalledWith({
    titulo: 'Invasão em Oa',
    descricao: 'Muitos invasores na Bateria Central.',
    planeta: 'Oa',
    gravidade: 'media',
    envolvidos: 3,
  })
  // Dados permanecem após erro do servidor
  expect((screen.getByLabelText('Título') as HTMLInputElement).value).toBe('Invasão em Oa')
  expect((screen.getByLabelText('Planeta') as HTMLInputElement).value).toBe('Oa')
})

test('Guardião vê o campo setor e exige setorId', async () => {
  render(
    <FormOcorrencia
      setores={[{ id: 2814, nome: 'Setor 2814', descricao: 'Setor de teste.' }]}
      exigeSetor={true}
    />,
  )
  expect(screen.getByText('Setor')).toBeDefined()
  expect(screen.getByText('Escolha o setor')).toBeDefined()

  fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Invasão em Oa' } })
  fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Muitos invasores na Bateria Central.' } })
  fireEvent.change(screen.getByLabelText('Planeta'), { target: { value: 'Oa' } })
  fireEvent.click(screen.getByRole('button', { name: 'Registrar ocorrência' }))

  expect(await screen.findByText('Escolha o setor da ocorrência.')).toBeDefined()
  expect(registrarOcorrencia).not.toHaveBeenCalled()
})

test('botão de envio usa BotaoOa', () => {
  render(<FormOcorrencia setores={[]} exigeSetor={false} />)
  const botao = screen.getByRole('button', { name: 'Registrar ocorrência' })
  expect(botao.classList.contains('oa-button')).toBe(true)
})
