import { beforeEach, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('@/app/(painel)/painel/ocorrencias/actions', () => ({
  excluirOcorrencia: vi.fn(),
}))

import { excluirOcorrencia } from '@/app/(painel)/painel/ocorrencias/actions'
import { ConfirmarExclusao } from '@/app/(painel)/painel/ocorrencias/_components/ConfirmarExclusao'

beforeEach(() => {
  vi.clearAllMocks()
})

test('renderiza botão gatilho com tom perigo', () => {
  render(<ConfirmarExclusao ocorrenciaId="00000000-0000-4000-8000-000000000001" />)
  const gatilho = screen.getByRole('button', { name: 'Excluir ocorrência' })
  expect(gatilho.classList.contains('oa-button--perigo')).toBe(true)
  expect(screen.queryByRole('alertdialog')).toBeNull()
})

test('abre confirmação acessível com foco no botão Cancelar', async () => {
  render(<ConfirmarExclusao ocorrenciaId="00000000-0000-4000-8000-000000000001" />)
  const gatilho = screen.getByRole('button', { name: 'Excluir ocorrência' })
  fireEvent.click(gatilho)

  const dialog = screen.getByRole('alertdialog')
  expect(dialog).toBeDefined()
  expect(dialog.getAttribute('aria-modal')).toBe('true')
  expect(
    screen.getByText('A ocorrência sai das listas e métricas. Esta ação não pode ser desfeita pela tela.'),
  ).toBeDefined()

  const botaoCancelar = screen.getByRole('button', { name: 'Cancelar' })
  await waitFor(() => expect(document.activeElement).toBe(botaoCancelar))
})

test('Escape cancela e devolve o foco ao gatilho', async () => {
  render(<ConfirmarExclusao ocorrenciaId="00000000-0000-4000-8000-000000000001" />)
  const gatilho = screen.getByRole('button', { name: 'Excluir ocorrência' })
  fireEvent.click(gatilho)

  expect(screen.getByRole('alertdialog')).toBeDefined()
  fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })

  expect(screen.queryByRole('alertdialog')).toBeNull()
  await waitFor(() => expect(document.activeElement).toBe(gatilho))
})

test('clicar em Cancelar fecha e devolve o foco ao gatilho', async () => {
  render(<ConfirmarExclusao ocorrenciaId="00000000-0000-4000-8000-000000000001" />)
  const gatilho = screen.getByRole('button', { name: 'Excluir ocorrência' })
  fireEvent.click(gatilho)

  const botaoCancelar = screen.getByRole('button', { name: 'Cancelar' })
  fireEvent.click(botaoCancelar)

  expect(screen.queryByRole('alertdialog')).toBeNull()
  await waitFor(() => expect(document.activeElement).toBe(gatilho))
})

test('confirmar exclusão chama action excluirOcorrencia e exibe erro se falhar', async () => {
  vi.mocked(excluirOcorrencia).mockResolvedValue({ ok: false, erro: 'Falha ao excluir ocorrência.' })
  render(<ConfirmarExclusao ocorrenciaId="00000000-0000-4000-8000-000000000001" />)
  fireEvent.click(screen.getByRole('button', { name: 'Excluir ocorrência' }))

  const botaoExcluirConfirmar = screen.getAllByRole('button', { name: 'Excluir' })[0]
  fireEvent.click(botaoExcluirConfirmar)

  expect(excluirOcorrencia).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000001')
  expect(await screen.findByText('Falha ao excluir ocorrência.')).toBeDefined()
})
