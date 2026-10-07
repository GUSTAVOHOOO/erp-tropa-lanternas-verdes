// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'

const css = readFileSync('app/globals.css', 'utf8')
const layout = readFileSync('app/layout.tsx', 'utf8')

describe('fundação do design system', () => {
  test('tema único escuro: sem bloco .dark nem variante dark (DEC-13)', () => {
    expect(css).not.toMatch(/\.dark\b/)
    expect(css).not.toMatch(/@custom-variant dark/)
    expect(css).toMatch(/color-scheme: dark/)
  })

  test('escala de gravidade do espectro emocional existe como token (CSS-12)', () => {
    for (const nivel of ['baixa', 'media', 'alta', 'critica']) {
      expect(css).toContain(`--color-gravidade-${nivel}: var(--gravidade-${nivel})`)
    }
  })

  test('foco é o anel, inclusive em links (CSS-14)', () => {
    expect(css).toMatch(/--shadow-anel:/)
    expect(css).toMatch(/a:focus-visible/)
  })

  test('movimento respeita prefers-reduced-motion (CSS-15)', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
  })

  test('fontes da Tropa via next/font, sem Geist (CSS-13)', () => {
    expect(layout).toMatch(/Barlow, Barlow_Condensed, IBM_Plex_Mono/)
    expect(layout).not.toMatch(/Geist/)
  })
})
