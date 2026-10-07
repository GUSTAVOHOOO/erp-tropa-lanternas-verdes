// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { codificarSessao, decodificarSessao, podeAcessarSetor, setorParaFiltro, type Sessao } from '@/lib/sessao'

const hal: Sessao = { id: 'u2', nome: 'Hal Jordan', papel: 'lanterna', setorId: '2814', lanternaId: 'hal-jordan', expiraEm: Date.now() + 60_000 }
const ganthet: Sessao = { id: 'u1', nome: 'Ganthet', papel: 'guardiao', setorId: null, lanternaId: null, expiraEm: Date.now() + 60_000 }

beforeEach(() => vi.stubEnv('SESSION_SECRET', 'segredo-de-teste'))
afterEach(() => vi.unstubAllEnvs())

describe('cookie assinado', () => {
  test('ida e volta devolve a mesma sessão', () => {
    expect(decodificarSessao(codificarSessao(hal))).toEqual(hal)
    expect(decodificarSessao(codificarSessao(ganthet))).toEqual(ganthet)
  })

  test('trocar o papel no cookie invalida a assinatura', () => {
    const [, assinatura] = codificarSessao(hal).split('.')
    const forjado = Buffer.from(JSON.stringify({ ...hal, papel: 'guardiao' })).toString('base64url')
    expect(decodificarSessao(`${forjado}.${assinatura}`)).toBeNull()
  })

  test('valores lixo viram "sem sessão" sem lançar erro', () => {
    for (const lixo of [undefined, '', 'abc', 'a.b', 'a.b.c', 'ção.ção', '%%%.%%%', '.']) {
      expect(decodificarSessao(lixo)).toBeNull()
    }
  })

  test('sessão expirada é recusada', () => {
    const valor = codificarSessao(hal)
    expect(decodificarSessao(valor, hal.expiraEm + 1)).toBeNull()
  })

  test('outro segredo não reconhece o cookie', () => {
    const valor = codificarSessao(hal)
    vi.stubEnv('SESSION_SECRET', 'outro-segredo')
    expect(decodificarSessao(valor)).toBeNull()
  })

  test('sem segredo, leitura de cookie existente vira ausência de sessão', () => {
    const valor = codificarSessao(hal)
    vi.stubEnv('SESSION_SECRET', '')
    expect(decodificarSessao(valor)).toBeNull()
  })

  test('sem SESSION_SECRET o erro diz o que fazer', () => {
    vi.stubEnv('SESSION_SECRET', '')
    expect(() => codificarSessao(hal)).toThrow('SESSION_SECRET não definido no .env.local')
  })

  test('Lanterna sem setor é recusado pelo schema', () => {
    expect(decodificarSessao(codificarSessao({ ...hal, setorId: null }))).toBeNull()
  })
})

describe('regras de setor', () => {
  test('Lanterna só acessa o próprio setor; Guardião acessa todos', () => {
    expect(podeAcessarSetor(hal, '2814')).toBe(true)
    expect(podeAcessarSetor(hal, '674')).toBe(false)
    expect(podeAcessarSetor(ganthet, '674')).toBe(true)
  })

  test('filtro do Lanterna vem da sessão, nunca da URL', () => {
    expect(setorParaFiltro(hal, '674')).toBe('2814')
    expect(setorParaFiltro(hal)).toBe('2814')
    expect(setorParaFiltro(ganthet, '674')).toBe('674')
    expect(setorParaFiltro(ganthet)).toBeUndefined()
  })
})
