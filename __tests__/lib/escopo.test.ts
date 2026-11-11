import { describe, expect, test } from 'vitest'
import type { Sessao } from '@/lib/schemas/usuario'
import { podeAcessarSetor, setorParaFiltro } from '@/lib/escopo'

const guardiao: Sessao = { id: '00000000-0000-4000-8000-000000000001', nome: 'Ganthet', email: 'g@oa.tropa', papel: 'guardiao', setorId: null, lanternaId: null, criadoEm: '2026-01-01T00:00:00.000Z' }
const lanterna: Sessao = { ...guardiao, id: '00000000-0000-4000-8000-000000000002', papel: 'lanterna', setorId: 2814, lanternaId: 'hal-jordan' }

describe('escopo de setor', () => {
  test('Guardião acessa qualquer setor', () => expect(podeAcessarSetor(guardiao, 674)).toBe(true))
  test('Lanterna acessa o próprio setor, não outro', () => {
    expect(podeAcessarSetor(lanterna, 2814)).toBe(true)
    expect(podeAcessarSetor(lanterna, 674)).toBe(false)
  })
  test('Setor zero é válido e sessão sem setor fica fora de todos', () => {
    expect(setorParaFiltro({ ...lanterna, setorId: 0 }, 674)).toBe(0)
    expect(setorParaFiltro({ ...lanterna, setorId: null }, 674)).toBe(-1)
  })
  test('Guardião usa o filtro da URL ou todos os setores', () => {
    expect(setorParaFiltro(guardiao, 674)).toBe(674)
    expect(setorParaFiltro(guardiao)).toBeUndefined()
  })
})
