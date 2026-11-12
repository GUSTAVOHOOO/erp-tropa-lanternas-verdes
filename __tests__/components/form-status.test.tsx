import { beforeEach, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('@/app/(painel)/painel/ocorrencias/actions', () => ({ atualizarStatus: vi.fn() }))

import { atualizarStatus } from '@/app/(painel)/painel/ocorrencias/actions'
import { FormStatus } from '@/app/(painel)/painel/ocorrencias/_components/FormStatus'

beforeEach(() => vi.clearAllMocks())

test('campo de resolução aparece só quando o status escolhido é resolvida', async () => {
  const { unmount } = render(
    <FormStatus ocorrenciaId="00000000-0000-4000-8000-000000000001" statusAtual="em_andamento" transicoes={['resolvida']} />,
  )
  expect(screen.getByLabelText('Como foi resolvida?')).toBeDefined()
  unmount()

  render(
    <FormStatus ocorrenciaId="00000000-0000-4000-8000-000000000001" statusAtual="aberta" transicoes={['em_andamento']} />,
  )
  expect(screen.queryByLabelText('Como foi resolvida?')).toBeNull()
})

test('motivo aparece ao reabrir vindo de resolvida', () => {
  render(
    <FormStatus ocorrenciaId="00000000-0000-4000-8000-000000000001" statusAtual="resolvida" transicoes={['aberta']} />,
  )
  expect(screen.getByLabelText('Motivo da reabertura')).toBeDefined()
})

test('submete com dados corretos e exibe confirmação role=status', async () => {
  vi.mocked(atualizarStatus).mockResolvedValue({ ok: true })
  render(
    <FormStatus ocorrenciaId="00000000-0000-4000-8000-000000000001" statusAtual="em_andamento" transicoes={['resolvida']} />,
  )
  fireEvent.change(screen.getByLabelText('Como foi resolvida?'), { target: { value: 'Invasores repelidos com sucesso.' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar status' }))

  await waitFor(() => expect(screen.getByRole('status')).toBeDefined())
  expect(screen.getByRole('status').textContent).toMatch(/Status atualizado/i)
  expect(atualizarStatus).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000001', {
    statusAtual: 'em_andamento',
    status: 'resolvida',
    resolucao: 'Invasores repelidos com sucesso.',
    motivo: '',
  })
})

test('exibe erro do servidor no campo correspondente', async () => {
  vi.mocked(atualizarStatus).mockResolvedValue({ ok: false, errors: { resolucao: ['Explique com mais detalhes.'] } })
  render(
    <FormStatus ocorrenciaId="00000000-0000-4000-8000-000000000001" statusAtual="em_andamento" transicoes={['resolvida']} />,
  )
  fireEvent.change(screen.getByLabelText('Como foi resolvida?'), { target: { value: 'Invasores repelidos.' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar status' }))

  expect(await screen.findByText('Explique com mais detalhes.')).toBeDefined()
})

test('botão de envio usa BotaoOa', () => {
  render(
    <FormStatus ocorrenciaId="00000000-0000-4000-8000-000000000001" statusAtual="aberta" transicoes={['em_andamento']} />,
  )
  const botao = screen.getByRole('button', { name: 'Salvar status' })
  expect(botao.classList.contains('oa-button')).toBe(true)
})
