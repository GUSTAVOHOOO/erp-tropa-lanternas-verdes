import { beforeEach, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('@/app/(painel)/painel/ocorrencias/actions', () => ({
  editarOcorrencia: vi.fn(),
}))

import { editarOcorrencia } from '@/app/(painel)/painel/ocorrencias/actions'
import { FormEditarOcorrencia } from '@/app/(painel)/painel/ocorrencias/_components/FormEditarOcorrencia'
import type { Ocorrencia } from '@/lib/schemas/ocorrencia'

const ocorrenciaMock: Ocorrencia = {
  id: '00000000-0000-4000-8000-000000000001',
  titulo: 'Ataque em Coast City',
  descricao: 'Distorção de energia perto da costa.',
  planeta: 'Terra',
  setorId: 2814,
  gravidade: 'alta',
  status: 'aberta',
  envolvidos: 10,
  responsavelId: 'hal-jordan',
  resolucao: null,
  criadaPorId: '00000000-0000-4000-8000-000000000099',
  criadaEm: '2026-11-01T10:00:00.000Z',
  resolvidaEm: null,
  prazoEm: '2026-11-02T10:00:00.000Z',
  vencida: false,
}

beforeEach(() => {
  vi.clearAllMocks()
})

test('FormEditarOcorrencia preenche valores atuais da ocorrência', () => {
  render(<FormEditarOcorrencia ocorrencia={ocorrenciaMock} />)

  expect((screen.getByLabelText('Título') as HTMLInputElement).value).toBe('Ataque em Coast City')
  expect((screen.getByLabelText('Descrição') as HTMLTextAreaElement).value).toBe('Distorção de energia perto da costa.')
  expect((screen.getByLabelText('Planeta') as HTMLInputElement).value).toBe('Terra')
  expect((screen.getByLabelText('Seres envolvidos') as HTMLInputElement).value).toBe('10')
  expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeDefined()
})

test('chama editarOcorrencia ao submeter alterações e desabilita botão', async () => {
  vi.mocked(editarOcorrencia).mockResolvedValue({ ok: true })
  render(<FormEditarOcorrencia ocorrencia={ocorrenciaMock} />)

  fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Ataque maciço em Coast City' } })
  const botao = screen.getByRole('button', { name: 'Salvar alterações' })
  fireEvent.click(botao)

  await waitFor(() => {
    expect(editarOcorrencia).toHaveBeenCalledWith(
      ocorrenciaMock.id,
      expect.objectContaining({
        titulo: 'Ataque maciço em Coast City',
        planeta: 'Terra',
        gravidade: 'alta',
        envolvidos: 10,
      }),
    )
  })
})

test('exibe erro geral em root retornado pela Server Action', async () => {
  vi.mocked(editarOcorrencia).mockResolvedValue({ ok: false, erro: 'Falha ao salvar edição.' })
  render(<FormEditarOcorrencia ocorrencia={ocorrenciaMock} />)

  fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Ataque maciço em Coast City' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

  expect(await screen.findByText('Falha ao salvar edição.')).toBeDefined()
})
