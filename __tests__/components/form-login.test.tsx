import { beforeEach, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

vi.mock('@/app/(site)/login/actions', () => ({ entrar: vi.fn() }))

import { entrar } from '@/app/(site)/login/actions'
import { FormLogin } from '@/app/(site)/login/_components/FormLogin'

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
