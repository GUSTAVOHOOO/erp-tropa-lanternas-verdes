// @vitest-environment node
import { describe, expect, test } from 'vitest'
import { formatarAtributoGalaxia, gerarParticulasGalaxia } from '@/components/oanet/galaxia'

describe('geometria procedural da galáxia', () => {
  test('serializa o atributo divergente de Node e Chromium de forma idêntica', () => {
    expect(formatarAtributoGalaxia(-0.05250148714991485)).toBe('-0.052501')
    expect(formatarAtributoGalaxia(-0.05250148714991486)).toBe('-0.052501')
  })

  test.each([0, -0.05250148714991485, 0.91472518, 0.003895123, 0.788123456])('suprime diferenças de precisão de 1e-15 no SVG: %s', (valor) => {
    expect(formatarAtributoGalaxia(valor + 1e-15)).toBe(formatarAtributoGalaxia(valor - 1e-15))
  })

  test('a mesma semente reconstrói exatamente os mesmos braços', () => {
    expect(gerarParticulasGalaxia(120, 2814)).toEqual(gerarParticulasGalaxia(120, 2814))
    expect(gerarParticulasGalaxia(120, 2814)).not.toEqual(gerarParticulasGalaxia(120, 7632))
  })

  test.each([0, 1, 128, 4200])('preserva a quantidade solicitada de %i partículas', (quantidade) => {
    expect(gerarParticulasGalaxia(quantidade)).toHaveLength(quantidade)
  })

  test('limita o custo de renderização e normaliza entradas inválidas', () => {
    expect(gerarParticulasGalaxia(9000)).toHaveLength(4500)
    expect(gerarParticulasGalaxia(-1)).toEqual([])
    expect(gerarParticulasGalaxia(Number.NaN)).toEqual([])
    expect(gerarParticulasGalaxia(2.9)).toHaveLength(2)
  })

  test('mantém todas as coordenadas e intensidades finitas e delimitadas', () => {
    for (const particula of gerarParticulasGalaxia(4500, -15)) {
      expect(Object.values(particula).every((valor) => typeof valor !== 'number' || Number.isFinite(valor))).toBe(true)
      expect(Math.hypot(particula.x, particula.y)).toBeLessThanOrEqual(1.1)
      expect(Math.abs(particula.z)).toBeLessThanOrEqual(0.12)
      expect(particula.brilho).toBeGreaterThan(0)
      expect(particula.brilho).toBeLessThanOrEqual(1)
      expect(particula.tamanho).toBeGreaterThan(0)
    }
  })
})
