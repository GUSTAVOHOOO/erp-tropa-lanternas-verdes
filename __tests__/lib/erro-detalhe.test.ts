// @vitest-environment node
import { expect, test, vi } from 'vitest'
import { ApiError } from '@/lib/api-error'
import { tratarErroDetalhe } from '@/lib/erro-detalhe'

vi.mock('next/navigation', () => ({
  redirect: (destino: string) => { throw new Error(`REDIRECT:${destino}`) },
  notFound: () => { throw new Error('NOT_FOUND') },
}))

test('401 encaminha ao login', () => {
  expect(() => tratarErroDetalhe(new ApiError(401))).toThrow('REDIRECT:/login')
})
test('403 encaminha ao acesso negado', () => {
  expect(() => tratarErroDetalhe(new ApiError(403))).toThrow('REDIRECT:/acesso-negado')
})
test('404 apresenta não encontrado', () => {
  expect(() => tratarErroDetalhe(new ApiError(404))).toThrow('NOT_FOUND')
})
test('5xx e erros desconhecidos continuam para a fronteira de erro', () => {
  const servidor = new ApiError(503)
  const desconhecido = new Error('falha inesperada')
  expect(() => tratarErroDetalhe(servidor)).toThrow(servidor)
  expect(() => tratarErroDetalhe(desconhecido)).toThrow(desconhecido)
})
