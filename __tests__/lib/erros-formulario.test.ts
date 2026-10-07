import { expect, test, vi } from 'vitest'
import { aplicarErrosDoServidor } from '@/lib/erros-formulario'

test('leva erros de campo e erro geral para o formulário', () => {
  const setError = vi.fn()
  aplicarErrosDoServidor({ ok: false, erro: 'E-mail ou senha incorretos.', errors: { email: ['Informe um e-mail válido.'], senha: undefined } }, setError)
  expect(setError).toHaveBeenCalledWith('email', { type: 'server', message: 'Informe um e-mail válido.' }, { shouldFocus: true })
  expect(setError).toHaveBeenCalledWith('root', { type: 'server', message: 'E-mail ou senha incorretos.' })
  expect(setError).toHaveBeenCalledTimes(2)
})

test('resultado ok ou ausente não mexe no formulário', () => {
  const setError = vi.fn()
  aplicarErrosDoServidor({ ok: true }, setError)
  aplicarErrosDoServidor(undefined, setError)
  expect(setError).not.toHaveBeenCalled()
})
