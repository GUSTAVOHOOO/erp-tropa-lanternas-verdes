import { describe, expect, test } from 'vitest'
import { MOLAS, curvaMola, duracaoMola, posicaoMola } from '@/components/apresentacao/mola'
import { gerarEstrelasDobra, quadroDobra } from '@/components/apresentacao/dobra'

describe('molas em forma fechada', () => {
  test('saem do zero e assentam em 1 dentro da duração calculada', () => {
    for (const mola of Object.values(MOLAS)) {
      expect(posicaoMola(0, mola)).toBe(0)
      const fim = duracaoMola(mola)
      expect(Math.abs(1 - posicaoMola(fim, mola))).toBeLessThanOrEqual(0.001)
      expect(Math.abs(1 - posicaoMola(fim + 0.5, mola))).toBeLessThanOrEqual(0.001)
    }
  })

  test('a elástica passa do alvo e a de contagem nunca passa', () => {
    const amostras = (mola: typeof MOLAS.elastica) => Array.from({ length: 200 }, (_, i) => posicaoMola(i / 100, mola))
    expect(Math.max(...amostras(MOLAS.elastica))).toBeGreaterThan(1.05)
    expect(Math.max(...amostras(MOLAS.contagem))).toBeLessThanOrEqual(1)
  })

  test('a curva CSS é determinística e vai de 0 a 1', () => {
    const curva = curvaMola(MOLAS.firme)
    expect(curva).toBe(curvaMola(MOLAS.firme))
    expect(curva.startsWith('linear(0.0000, ')).toBe(true)
    expect(curva.endsWith(', 1.0000)')).toBe(true)
  })
})

describe('dobra espacial', () => {
  test('o mesmo t sempre produz o mesmo quadro', () => {
    expect(quadroDobra(0.42)).toEqual(quadroDobra(0.42))
    expect(gerarEstrelasDobra(50, 7)).toEqual(gerarEstrelasDobra(50, 7))
    expect(gerarEstrelasDobra(50, 7)).not.toEqual(gerarEstrelasDobra(50, 8))
  })

  test('começa e termina transparente, cobre a tela no meio', () => {
    expect(quadroDobra(0)).toMatchObject({ veu: 0, anelOpacidade: 0 })
    expect(quadroDobra(1)).toMatchObject({ veu: 0, anelOpacidade: 0 })
    expect(quadroDobra(0.4).veu).toBe(1)
    expect(quadroDobra(0.56).clarao).toBeCloseTo(1)
  })

  test('as estrelas aceleram até o salto', () => {
    const avancos = [0.1, 0.3, 0.5, 0.7].map((t) => quadroDobra(t).avanco)
    expect(avancos).toEqual([...avancos].sort((a, b) => a - b))
  })
})
