import { expect, test } from 'vitest'
import { identidadeDaSessao } from '@/components/oanet/identidade'
import type { Sessao } from '@/lib/schemas/usuario'

const base = { id: '00000000-0000-4000-8000-000000000001', email: 'user@oa.tropa', lanternaId: null, criadoEm: '2026-01-01T00:00:00.000Z' } satisfies Partial<Sessao>

test('visitante sem sessão recebe a identidade pública', () => {
  expect(identidadeDaSessao(null)).toEqual({ titulo: 'Visitante', detalhe: 'Portal público' })
})

test('Lanterna mostra nome, papel e o próprio setor', () => {
  const sessao: Sessao = { ...base, nome: 'Hal Jordan', papel: 'lanterna', setorId: 2814 }
  expect(identidadeDaSessao(sessao)).toEqual({ titulo: 'Hal Jordan', detalhe: 'Lanterna · Setor 2814' })
})

test('Guardião mostra o escopo de todos os setores', () => {
  const sessao: Sessao = { ...base, nome: 'Ganthet', papel: 'guardiao', setorId: null }
  expect(identidadeDaSessao(sessao)).toEqual({ titulo: 'Ganthet', detalhe: 'Guardião · todos os setores' })
})
