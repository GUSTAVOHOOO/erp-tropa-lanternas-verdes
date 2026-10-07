import { beforeEach, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('@/app/(site)/login/actions', () => ({ entrar: vi.fn() }))

import { entrar } from '@/app/(site)/login/actions'
import { FormLogin } from '@/app/(site)/login/_components/FormLogin'
import { MENSAGEM_ERRO_API } from '@/lib/resultado-acao'

beforeEach(() => vi.clearAllMocks())

test('valida no cliente antes de chamar a action', async () => {
  render(<FormLogin />)
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByText('Informe um e-mail válido, como hal@oa.tropa.')).toBeDefined()
  expect(screen.getByText('Informe sua senha.')).toBeDefined()
  expect(entrar).not.toHaveBeenCalled()
})

test('mostra o erro geral que a action devolve', async () => {
  vi.mocked(entrar).mockResolvedValue({ ok: false, erro: 'E-mail ou senha incorretos.' })
  render(<FormLogin />)
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'hal@oa.tropa' } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'errada' } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByText('E-mail ou senha incorretos.')).toBeDefined()
  expect(entrar).toHaveBeenCalledWith({ email: 'hal@oa.tropa', senha: 'errada' })
})

test('campos de login têm type e autoComplete certos', () => {
  render(<FormLogin />)
  expect(screen.getByLabelText('E-mail').getAttribute('autocomplete')).toBe('email')
  expect(screen.getByLabelText('Senha').getAttribute('type')).toBe('password')
})

test('aceita e-mail com espaços e maiúsculas e envia a forma normalizada', async () => {
  vi.mocked(entrar).mockResolvedValue({ ok: false, erro: 'E-mail ou senha incorretos.' })
  render(<FormLogin />)
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: ' Hal@OA.tropa ' } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'lanterna123' } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  await waitFor(() => expect(entrar).toHaveBeenCalledWith({ email: 'hal@oa.tropa', senha: 'lanterna123' }))
})

test('falha de API aparece e botão destrava para nova tentativa', async () => {
  vi.mocked(entrar).mockResolvedValue({ ok: false, erro: MENSAGEM_ERRO_API })
  render(<FormLogin />)
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'hal@oa.tropa' } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'lanterna123' } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByText(MENSAGEM_ERRO_API)).toBeDefined()
  await waitFor(() => expect(screen.getByRole('button', { name: 'Entrar' }).hasAttribute('disabled')).toBe(false))
})
