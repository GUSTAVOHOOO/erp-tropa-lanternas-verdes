import { calcularPrazo, estaVencida } from './prazo.js'

describe('prazo de Ocorrência', () => {
  const criadaEm = new Date('2026-11-01T10:20:30.000Z')

  it.each([
    ['critica', '2026-11-02T10:20:30.000Z'],
    ['alta', '2026-11-04T10:20:30.000Z'],
    ['media', '2026-11-08T10:20:30.000Z'],
    ['baixa', '2026-11-15T10:20:30.000Z'],
  ] as const)('calcula a janela de gravidade %s', (gravidade, esperado) => {
    expect(calcularPrazo(criadaEm, gravidade).toISOString()).toBe(esperado)
  })

  it('considera igualdade ainda no prazo e ignora vencimento em ocorrência resolvida', () => {
    const prazo = calcularPrazo(criadaEm, 'critica')
    expect(estaVencida('aberta', prazo, prazo)).toBe(false)
    expect(estaVencida('aberta', prazo, new Date(prazo.getTime() + 1))).toBe(true)
    expect(estaVencida('resolvida', prazo, new Date(prazo.getTime() + 1))).toBe(false)
  })
})
