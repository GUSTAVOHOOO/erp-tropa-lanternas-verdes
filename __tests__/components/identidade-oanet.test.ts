import { expect, test } from 'vitest'
import { identidadeDaSessao } from '@/components/oanet/identidade'
import type { Sessao } from '@/lib/sessao'

const base = { id: 'u1', lanternaId: null, expiraEm: 0 } satisfies Partial<Sessao>

test('visitante sem sessão recebe a identidade pública', () => {
  expect(identidadeDaSessao(null)).toEqual({ titulo: 'Visitante', detalhe: 'Portal público' })
})

test('Lanterna mostra nome, papel e o próprio setor', () => {
  const sessao: Sessao = { ...base, nome: 'Hal Jordan', papel: 'lanterna', setorId: '2814' }
  expect(identidadeDaSessao(sessao)).toEqual({ titulo: 'Hal Jordan', detalhe: 'Lanterna · Setor 2814' })
})

test('Guardião mostra o escopo de todos os setores', () => {
  const sessao: Sessao = { ...base, nome: 'Ganthet', papel: 'guardiao', setorId: null }
  expect(identidadeDaSessao(sessao)).toEqual({ titulo: 'Ganthet', detalhe: 'Guardião · todos os setores' })
})
